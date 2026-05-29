import type { Channel, Params, SeriesPoint, SimResult, StepDown } from "./types";
import { baseCAC } from "./saturation";

// ---- Calendar -------------------------------------------------------------
// Day 0 = 1 June 2026 (launch). The model runs until the ARR target is hit,
// with a 5-year safety cap.
export const START = new Date(2026, 5, 1);
export const MAXDAYS = 1826; // 5-year cap
const BUF = 400; // slack for forward-scheduled billings / payout lags

interface DayInfo {
  date: Date;
  mi: number; // month index since start (0 = Jun 2026)
  first: boolean;
}

export const DAYS: DayInfo[] = (() => {
  const out: DayInfo[] = [];
  for (let i = 0; i < MAXDAYS; i++) {
    const d = new Date(START.getTime() + i * 864e5);
    out.push({
      date: d,
      mi: (d.getFullYear() - 2026) * 12 + d.getMonth() - 5,
      first: d.getDate() === 1,
    });
  }
  return out;
})();

export const NDAYS = DAYS.length;
const NMONTHS = DAYS[NDAYS - 1].mi + 1;

// Days per calendar month within the horizon (used by the budget ramp).
export const DAYS_IN_MONTH: number[] = (() => {
  const out = Array.from({ length: NMONTHS }, () => 0);
  for (const d of DAYS) out[d.mi]++;
  return out;
})();

// Cumulative survival at tick k for a 3-point curve (percentages in): 1st
// renewal, 2nd renewal, then a flat mature rate from the 3rd renewal onward.
export function tickRet(sd: StepDown, k: number): number {
  if (k <= 0) return 1;
  let f = sd.r1 / 100;
  if (k === 1) return f;
  f *= sd.r2 / 100;
  if (k === 2) return f;
  return f * Math.pow(sd.rMature / 100, k - 2);
}

// Total "billing ticks" a cohort pays over its life (lifetime in weeks/months).
export function weeklyLifetime(sd: StepDown, cap = 520): number {
  let sum = 0;
  for (let k = 0; k < cap; k++) {
    const r = tickRet(sd, k);
    if (r < 1e-6) break;
    sum += r;
  }
  return sum;
}

const z = (n: number): Float64Array => new Float64Array(n);

// ---- Core simulation ------------------------------------------------------
export function simulate(p: Params): SimResult {
  const trialDays = p.plans.trialDays;
  const webFee = p.routes.webFeePct / 100;
  const asLow = p.routes.appFeeLow / 100;
  const asHigh = p.routes.appFeeHigh / 100;
  const infra = p.unit.infraPct / 100;
  const N = NDAYS;

  // Per-channel active-count difference arrays (prices differ per channel).
  const diffW = [z(N + BUF), z(N + BUF)];
  const diffM = [z(N + BUF), z(N + BUF)];
  const diffA = [z(N + BUF), z(N + BUF)];
  // Billings by route (price baked in at schedule time) + txn counts + cash in.
  const billW = z(N + BUF);
  const billI = z(N + BUF);
  const txW = z(N + BUF);
  const txI = z(N + BUF);
  const inflow = z(N + BUF);

  // Daily series used for charts and the DCF.
  const arr = z(N);
  const recRev = z(N);
  const adSpend = z(N);
  const deferred = z(N);
  const processorAR = z(N);
  const netArr = z(N); // net cash balance (cash − credit drawn)

  const base = p.channels.map(baseCAC);
  const price = p.channels.map((c) => c.prices);

  // Schedule a cohort of `n` paid customers acquired by channel `ci` on `day`.
  const sched = (ch: Channel, ci: number, day: number, n: number): void => {
    if (n <= 1e-9) return;
    const fc = day + trialDays;
    const isWeb = ch.route === "WEB";
    const bill = isWeb ? billW : billI;
    const tx = isWeb ? txW : txI;
    const pr = price[ci];
    const nW = (n * ch.mix.weekly) / 100;
    const nM = (n * ch.mix.monthly) / 100;
    const nA = (n * ch.mix.annual) / 100;

    if (nW > 0) {
      for (let k = 0; ; k++) {
        const cd = fc + 7 * k;
        if (cd >= N) break;
        const ret = tickRet(ch.retention.weekly, k);
        if (ret < 1e-6) break;
        const s = nW * ret;
        diffW[ci][cd] += s;
        diffW[ci][cd + 7] -= s;
        bill[cd] += s * pr.wPrice;
        tx[cd] += s;
      }
    }
    if (nM > 0) {
      for (let k = 0; ; k++) {
        const cd = fc + 30 * k;
        if (cd >= N) break;
        const ret = tickRet(ch.retention.monthly, k);
        if (ret < 1e-6) break;
        const s = nM * ret;
        diffM[ci][cd] += s;
        diffM[ci][cd + 30] -= s;
        bill[cd] += s * pr.mPrice;
        tx[cd] += s;
      }
    }
    if (nA > 0) {
      const renew = ch.retention.annualRenewal / 100;
      for (let k = 0; ; k++) {
        const cd = fc + 365 * k;
        if (cd >= N) break;
        const s = nA * Math.pow(renew, k);
        if (s < 1e-4) break;
        diffA[ci][cd] += s;
        diffA[ci][cd + 365] -= s;
        bill[cd] += s * pr.aPrice;
        tx[cd] += s;
      }
    }
  };

  let bal = p.capital.startCash;
  const rW = [0, 0];
  const rA = [0, 0];
  const rM = [0, 0];
  let minBal = Infinity;
  let insolventDay = -1;
  let feeW = 0;
  let feeI = 0;
  let billCum = 0;
  let recCum = 0;
  let netBillCum = 0;
  let collCum = 0;
  let d1m = -1;

  const limit = p.capital.creditLimit;
  const budgets = [p.marketing.paidBudget, p.marketing.organicBudget];
  const insolventFloor = -limit - 1e-6;

  for (let d = 0; d < N; d++) {
    const mi = DAYS[d].mi;
    let arrD = 0;
    let revD = 0;
    for (let c = 0; c < 2; c++) {
      rW[c] += diffW[c][d];
      rA[c] += diffA[c][d];
      rM[c] += diffM[c][d];
      const pr = price[c];
      arrD += rW[c] * pr.wPrice * 52 + rA[c] * pr.aPrice + rM[c] * pr.mPrice * 12;
      revD += rW[c] * (pr.wPrice / 7) + rA[c] * (pr.aPrice / 365) + rM[c] * (pr.mPrice / 30);
    }
    arr[d] = arrD;
    recRev[d] = revD;
    const infD = revD * infra;
    const asFee = arrD >= 1e6 ? asHigh : asLow;

    const nW = billW[d] * (1 - webFee) - p.routes.webFixed * txW[d];
    const nI = billI[d] * (1 - asFee);
    feeW += billW[d] - Math.max(0, nW);
    feeI += billI[d] - nI;
    netBillCum += Math.max(0, nW) + nI;
    if (d + p.routes.webPayoutDays < inflow.length)
      inflow[d + p.routes.webPayoutDays] += Math.max(0, nW);
    if (d + p.routes.appPayoutDays < inflow.length) inflow[d + p.routes.appPayoutDays] += nI;
    billCum += billW[d] + billI[d];
    recCum += revD;
    deferred[d] = Math.max(0, billCum - recCum);

    // Cash in from payouts.
    bal += inflow[d];
    collCum += inflow[d];
    processorAR[d] = Math.max(0, netBillCum - collCum);

    // Founder distribution on the first of each month — the only obligation that
    // can pull the balance below −creditLimit (true insolvency). Spending on ads
    // or infra never can, so we record the low-water mark and insolvency here, at
    // the one point in the day where the balance is allowed to dip past the floor.
    if (DAYS[d].first && p.capital.founderDraw > 0) bal -= p.capital.founderDraw;
    if (bal < minBal) minBal = bal;
    if (bal < insolventFloor && insolventDay < 0) insolventDay = d;

    // Operations — marketing spend and infra ride the credit line but can never
    // breach it: both are funded only out of the remaining credit headroom. Infra
    // is paid first (non-discretionary), then ad spend takes what's left; any infra
    // that can't be covered while pinned at the limit is deferred rather than
    // pushing the balance below the floor and faking insolvency.
    const room = Math.max(0, bal + limit);
    const infraPaid = Math.min(infD, room);
    const spendRoom = room - infraPaid;
    const dim = DAYS_IN_MONTH[mi];
    const rampF = Math.pow(1 + p.marketing.budgetRampPct / 100, mi);
    const desired0 = dim > 0 ? (budgets[0] * rampF) / dim : 0;
    const desired1 = dim > 0 ? (budgets[1] * rampF) / dim : 0;
    const desiredTotal = desired0 + desired1;
    const factor = desiredTotal > spendRoom && desiredTotal > 0 ? spendRoom / desiredTotal : 1;
    const sp = [desired0 * factor, desired1 * factor];
    let total = 0;
    for (let c = 0; c < 2; c++) {
      if (sp[c] > 0 && base[c] > 0) {
        total += sp[c];
        sched(p.channels[c], c, d, sp[c] / base[c]);
      }
    }
    adSpend[d] = total;
    bal -= total + infraPaid;

    netArr[d] = bal;
    if (arrD >= p.arrGoal) {
      d1m = d;
      break; // reached the target — stop the clock here
    }
  }
  const lastDay = d1m >= 0 ? d1m : N - 1;

  // ---- Margins ----
  const totFees = feeW + feeI;
  const blendedFeeRate = billCum > 0 ? totFees / billCum : 0;
  const gm = Math.max(0, 1 - blendedFeeRate - infra);

  let maxARR = 0;
  for (let d = 0; d <= lastDay; d++) if (arr[d] > maxARR) maxARR = arr[d];

  const series: SeriesPoint[] = [];
  for (let d = 0; d <= lastDay; d++) series.push({ i: d, net: netArr[d], arr: arr[d] });

  // ---- DCF / enterprise value ----
  const wacc = (p.valuation.rfRate + p.valuation.beta * p.valuation.erp) / 100;
  const gTerm = p.valuation.termGrowth / 100;
  const tax = p.valuation.taxRate / 100;
  let pv = 0;
  let prevRecv = 0;
  let prevDef = 0;
  for (let d = 0; d <= lastDay; d++) {
    const ebit = recRev[d] * gm - adSpend[d];
    const nopat = ebit - (ebit > 0 ? tax * ebit : 0);
    const dRecv = processorAR[d] - prevRecv;
    const dDef = deferred[d] - prevDef;
    prevRecv = processorAR[d];
    prevDef = deferred[d];
    pv += (nopat - dRecv + dDef) / Math.pow(1 + wacc, d / 365);
  }
  const horizonARR = d1m >= 0 ? arr[d1m] : maxARR;
  const termFCF = horizonARR * gm * (1 - tax);
  const tv = wacc > gTerm ? (termFCF * (1 + gTerm)) / (wacc - gTerm) : termFCF * 40;
  const pvTV = tv / Math.pow(1 + wacc, lastDay / 365);
  const EV = pv + pvTV;
  const endCash = netArr[lastDay];
  const equity = EV + endCash;
  const evMultiple = horizonARR > 0 ? EV / horizonARR : 0;

  return {
    lastDay,
    series,
    sum: {
      d1m,
      d1mDate: d1m >= 0 ? DAYS[d1m].date : null,
      endARR: arr[lastDay],
      maxARR,
      endCash,
      minCash: minBal,
      peakFunding: Math.max(0, -minBal - limit),
      insolventDay,
      insolventDate: insolventDay >= 0 ? DAYS[insolventDay].date : null,
      gm,
      EV,
      equity,
      evMultiple,
      wacc: wacc * 100,
    },
  };
}
