import type { Channel, Params, SeriesPoint, SimResult, StepDown } from "./types";
import { baseCAC, customersFromSpend } from "./saturation";

// ---- Calendar -------------------------------------------------------------
// Day 0 = 1 June 2026. The model auto-extends day-by-day until ARR hits $1M
// or the 5-year safety cap.
export const START = new Date(2026, 5, 1);
export const MAXDAYS = 1826; // 5 years
const BUF = 400; // slack for forward-scheduled billings / payout lags

interface DayInfo {
  date: Date;
  mi: number; // months since start (0 = June 2026)
  first: boolean; // first calendar day of a month
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

// Cumulative survival fraction of a step-down curve at tick k.
// Retention values are stored as percentages (e.g. 55 = 55%).
export function tickRet(sd: StepDown, k: number): number {
  if (k <= 0) return 1;
  let f = sd.r1 / 100;
  if (k === 1) return f;
  f *= sd.r2 / 100;
  if (k === 2) return f;
  f *= sd.r3 / 100;
  if (k === 3) return f;
  return f * Math.pow(sd.rMature / 100, k - 3);
}

// Total weekly "billing weeks" a cohort pays over its life (lifetime in weeks).
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
  const { wPrice, mPrice, aPrice, trialDays } = p.plans;
  const webFee = p.routes.webFeePct / 100;
  const asLow = p.routes.appFeeLow / 100;
  const asHigh = p.routes.appFeeHigh / 100;
  const infra = p.unit.infraPct / 100;
  const g = p.marketing.budgetGrowthPct / 100;
  const N = MAXDAYS;

  // Forward-scheduled active counts (difference arrays), billings, txns, cash.
  const diffW = z(N + BUF);
  const diffM = z(N + BUF);
  const diffA = z(N + BUF);
  const billW = z(N + BUF);
  const billI = z(N + BUF);
  const txW = z(N + BUF);
  const txI = z(N + BUF);
  const inflow = z(N + BUF);

  const arr = z(N);
  const recRevA = z(N);
  const deferA = z(N);
  const recvA = z(N);
  const cashEnd = z(N);
  const cardEnd = z(N);
  const spendD = z(N);

  // Per-channel running tallies.
  const base = p.channels.map(baseCAC);
  const chSpend = [0, 0];
  const chCust = [0, 0];
  const chCustW = [0, 0];
  const chCustM = [0, 0];
  const chCustA = [0, 0];

  // Schedule one cohort of `n` paid customers acquired by channel `ch` on `day`.
  const sched = (ch: Channel, ci: number, day: number, n: number): void => {
    if (n <= 1e-9) return;
    const fc = day + trialDays; // first charge after trial
    const isWeb = ch.route === "WEB";
    const bill = isWeb ? billW : billI;
    const tx = isWeb ? txW : txI;
    // Plan mix is stored as percentages.
    const nW = (n * ch.mix.weekly) / 100;
    const nM = (n * ch.mix.monthly) / 100;
    const nA = (n * ch.mix.annual) / 100;
    chCustW[ci] += nW;
    chCustM[ci] += nM;
    chCustA[ci] += nA;

    if (nW > 0) {
      for (let k = 0; ; k++) {
        const cd = fc + 7 * k;
        if (cd >= N) break;
        const ret = tickRet(ch.retention.weekly, k);
        if (ret < 1e-6) break;
        const s = nW * ret;
        diffW[cd] += s;
        diffW[cd + 7] -= s;
        bill[cd] += s * wPrice;
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
        diffM[cd] += s;
        diffM[cd + 30] -= s;
        bill[cd] += s * mPrice;
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
        diffA[cd] += s;
        diffA[cd + 365] -= s;
        bill[cd] += s * aPrice;
        tx[cd] += s;
      }
    }
  };

  let cash = p.capital.startCash;
  let card = 0;
  let rW = 0;
  let rA = 0;
  let rM = 0;
  let minCash = Infinity;
  let insolventDay = -1;
  let feeW = 0;
  let feeI = 0;
  let billCum = 0;
  let recCum = 0;
  let webVol = 0;
  let iapVol = 0;
  let netBillCum = 0;
  let collCum = 0;
  let D1M = -1;
  let lastDay = N - 1;

  // Card-repayment queue (FIFO by due date). card == sum of outstanding amts.
  const q: { amt: number; due: number }[] = [];
  let head = 0;

  const draw = p.capital.founderDraw;
  const drawStart = p.capital.drawStartMonth;
  const reserve = p.capital.reserve;
  const limit = p.capital.creditLimit;
  const apDays = p.capital.apDays;
  const share = [p.marketing.paidShare / 100, 1 - p.marketing.paidShare / 100];

  for (let d = 0; d < N; d++) {
    rW += diffW[d];
    rA += diffA[d];
    rM += diffM[d];
    arr[d] = rW * wPrice * 52 + rA * aPrice + rM * mPrice * 12;
    const recRev = rW * (wPrice / 7) + rA * (aPrice / 365) + rM * (mPrice / 30);
    recRevA[d] = recRev;
    const infraD = recRev * infra;
    const asFee = arr[d] >= 1e6 ? asHigh : asLow;

    const nW = billW[d] * (1 - webFee) - p.routes.webFixed * txW[d];
    const nI = billI[d] * (1 - asFee);
    feeW += billW[d] - Math.max(0, nW);
    feeI += billI[d] - nI;
    webVol += billW[d];
    iapVol += billI[d];
    netBillCum += Math.max(0, nW) + nI;
    if (d + p.routes.webPayoutDays < inflow.length)
      inflow[d + p.routes.webPayoutDays] += Math.max(0, nW);
    if (d + p.routes.appPayoutDays < inflow.length) inflow[d + p.routes.appPayoutDays] += nI;
    billCum += billW[d] + billI[d];
    recCum += recRev;
    deferA[d] = Math.max(0, billCum - recCum);

    const inf = inflow[d];
    cash += inf;
    collCum += inf;
    recvA[d] = Math.max(0, netBillCum - collCum);

    // Repay card charges due today.
    while (head < q.length && q[head].due <= d) {
      cash -= q[head].amt;
      card -= q[head].amt;
      head++;
    }

    // Founder draw on the first of each month once draws have started.
    if (DAYS[d].first && d > 0 && draw > 0 && DAYS[d].mi >= drawStart) {
      cash -= draw;
    }

    // Auto-paydown: clear the card toward zero whenever cash sits above reserve.
    if (cash > reserve && card > 1e-9) {
      let pay = Math.min(card, cash - reserve);
      cash -= pay;
      card -= pay;
      let h = head;
      while (pay > 1e-9 && h < q.length) {
        if (q[h].amt <= pay) {
          pay -= q[h].amt;
          q[h].amt = 0;
          h++;
        } else {
          q[h].amt -= pay;
          pay = 0;
        }
      }
      head = h;
    }

    // Spend: today's marketing budget, financed on the card, capped by headroom.
    const target = (p.marketing.monthlyBudget / 30.44) * Math.pow(1 + g, DAYS[d].mi);
    const headroom = Math.max(0, limit - card);
    const total = Math.min(target, headroom);
    for (let i = 0; i < 2; i++) {
      const sp = total * share[i];
      if (sp > 0) {
        const cust = customersFromSpend(
          sp,
          base[i],
          p.channels[i].satPoint,
          p.channels[i].satSlope,
        );
        chSpend[i] += sp;
        chCust[i] += cust;
        sched(p.channels[i], i, d, cust);
      }
    }
    spendD[d] = total;

    // Charge spend + infra to the card; overflow beyond the limit hits cash.
    const charge = total + infraD;
    let toCard = charge;
    if (card + toCard > limit) {
      const over = card + toCard - limit;
      cash -= over;
      toCard -= over;
    }
    if (toCard > 0) {
      q.push({ amt: toCard, due: d + apDays });
      card += toCard;
    }

    cashEnd[d] = cash;
    cardEnd[d] = card;
    if (cash < minCash) minCash = cash;
    if (cash < -1e-6 && insolventDay < 0) insolventDay = d;
    if (arr[d] >= 1e6 && D1M < 0) {
      D1M = d;
      lastDay = d;
      break;
    }
  }

  const reached = D1M >= 0;

  // ---- Margins & blended unit economics ----
  const totFees = feeW + feeI;
  const blendedFeeRate = billCum > 0 ? totFees / billCum : 0;
  const gm = Math.max(0, 1 - blendedFeeRate - infra);
  const totSpend = chSpend[0] + chSpend[1];
  const totCust = chCust[0] + chCust[1];
  const blendedCAC = totCust > 0 ? totSpend / totCust : 0;

  const gW = chCustW[0] + chCustW[1];
  const gM = chCustM[0] + chCustM[1];
  const gA = chCustA[0] + chCustA[1];
  const mixDen = gW + gM + gA || 1;
  const blW = gW / mixDen;
  const blA = gA / mixDen;
  const blM = gM / mixDen;

  const lwArr = p.channels.map((c) => weeklyLifetime(c.retention.weekly));
  const lmArr = p.channels.map((c) => weeklyLifetime(c.retention.monthly));
  const Lwbl = gW > 0 ? (lwArr[0] * chCustW[0] + lwArr[1] * chCustW[1]) / gW : 0;
  const Lmbl = gM > 0 ? (lmArr[0] * chCustM[0] + lmArr[1] * chCustM[1]) / gM : 0;
  const blendedRenewal =
    gA > 0
      ? (p.channels[0].retention.annualRenewal / 100) * (chCustA[0] / gA) +
        (p.channels[1].retention.annualRenewal / 100) * (chCustA[1] / gA)
      : 0;
  const annualLifeYears = blendedRenewal < 1 ? 1 / (1 - blendedRenewal) : 2;

  const ltv = (blW * Lwbl * wPrice + blM * Lmbl * mPrice + blA * annualLifeYears * aPrice) * gm;
  const ltvCac = blendedCAC > 0 ? ltv / blendedCAC : 0;
  const wkContrib = (blW * wPrice + blA * (aPrice / 52)) * gm;
  const paybackWk = wkContrib > 0 ? blendedCAC / wkContrib : 0;
  const totVol = webVol + iapVol;
  const effAR =
    totVol > 0 ? (webVol * p.routes.webPayoutDays + iapVol * p.routes.appPayoutDays) / totVol : 0;

  // ---- DCF / enterprise value ----
  const wacc = (p.valuation.rfRate + p.valuation.beta * p.valuation.erp) / 100;
  const gTerm = p.valuation.termGrowth / 100;
  const tax = p.valuation.taxRate / 100;
  let pv = 0;
  let prevRecv = 0;
  let prevDef = 0;
  let maxARR = 0;
  for (let d = 0; d <= lastDay; d++) {
    if (arr[d] > maxARR) maxARR = arr[d];
    const ebit = recRevA[d] * gm - spendD[d];
    const nopat = ebit - (ebit > 0 ? tax * ebit : 0);
    const dRecv = recvA[d] - prevRecv;
    const dDef = deferA[d] - prevDef;
    prevRecv = recvA[d];
    prevDef = deferA[d];
    pv += (nopat - dRecv + dDef) / Math.pow(1 + wacc, d / 365);
  }
  const horizonARR = reached ? arr[D1M] : maxARR;
  const termFCF = horizonARR * gm * (1 - tax);
  const tv = wacc > gTerm ? (termFCF * (1 + gTerm)) / (wacc - gTerm) : termFCF * 40;
  const pvTV = tv / Math.pow(1 + wacc, lastDay / 365);
  const EV = pv + pvTV;
  const evMultiple = horizonARR > 0 ? EV / horizonARR : 0;

  let peakCard = 0;
  for (let d = 0; d <= lastDay; d++) if (cardEnd[d] > peakCard) peakCard = cardEnd[d];

  const series: SeriesPoint[] = [];
  for (let d = 0; d <= lastDay; d++)
    series.push({ i: d, cash: cashEnd[d], card: -cardEnd[d], arr: arr[d] });

  return {
    series,
    lastDay,
    sum: {
      reached,
      D1M: reached ? D1M : lastDay,
      D1Mdate: reached ? DAYS[D1M].date : null,
      monthsElapsed: (reached ? D1M : lastDay) / 30.44,
      horizonARR,
      maxARR,
      endCash: cashEnd[lastDay],
      minCash,
      peakCard,
      insolventDay,
      insolventDate: insolventDay >= 0 ? DAYS[insolventDay].date : null,
      blendedCAC,
      ltv,
      ltvCac,
      gm,
      totSpend,
      paybackWk,
      EV,
      evMultiple,
      wacc: wacc * 100,
      effAR,
      blW,
      blA,
      Lwbl,
      totVol,
      feeW,
      feeI,
      webVol,
      iapVol,
      perCh: p.channels.map((c, i) => ({
        name: c.name,
        color: c.color,
        route: c.route,
        spend: chSpend[i],
        cust: chCust[i],
        cac: chCust[i] > 0 ? chSpend[i] / chCust[i] : base[i],
      })),
    },
  };
}

// A run is feasible if cash never goes negative across the whole timeline.
export function feasible(r: SimResult): boolean {
  return r.sum.insolventDay < 0;
}

export interface Solved {
  result: SimResult;
  throttled: boolean; // true if the nominal budget was reduced for solvency
  safeBudget: number; // the monthly budget actually deployed
}

// The render path: deploy the nominal marketing budget if it stays solvent,
// otherwise throttle down to the maximum budget the working capital can safely
// sustain. The engine never shows an insolvent state from ad spend — only a
// founder draw that is too large can break solvency.
export function solve(p: Params): Solved {
  const full = simulate(p);
  if (feasible(full)) {
    return { result: full, throttled: false, safeBudget: p.marketing.monthlyBudget };
  }
  const sb = maxBudget(p);
  const result = simulate({
    ...p,
    marketing: { ...p.marketing, monthlyBudget: sb },
  });
  return { result, throttled: true, safeBudget: sb };
}

// Largest monthly marketing budget that stays solvent (binary search).
export function maxBudget(p: Params): number {
  let lo = 0;
  let hi = 5_000_000;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const r = simulate({ ...p, marketing: { ...p.marketing, monthlyBudget: mid } });
    if (feasible(r)) lo = mid;
    else hi = mid;
  }
  return lo;
}

// Largest sustainable monthly founder draw (binary search).
export function maxDraw(p: Params): number {
  let lo = 0;
  let hi = 200_000;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const r = simulate({ ...p, capital: { ...p.capital, founderDraw: mid } });
    if (feasible(r)) lo = mid;
    else hi = mid;
  }
  return lo;
}

// Goal-seek: push budget to the safe maximum and search the paid/organic split
// for the allocation that maximises enterprise value. Returns inputs to apply.
export function optimize(p: Params): { paidShare: number; monthlyBudget: number } {
  let best: { paidShare: number; monthlyBudget: number; ev: number } | null = null;
  for (let s = 0; s <= 100; s += 5) {
    const withShare: Params = {
      ...p,
      marketing: { ...p.marketing, paidShare: s },
    };
    const budget = maxBudget(withShare);
    const r = simulate({
      ...withShare,
      marketing: { ...withShare.marketing, monthlyBudget: budget },
    });
    if (feasible(r) && (!best || r.sum.EV > best.ev)) {
      best = { paidShare: s, monthlyBudget: budget, ev: r.sum.EV };
    }
  }
  if (!best) return { paidShare: p.marketing.paidShare, monthlyBudget: 0 };
  return { paidShare: best.paidShare, monthlyBudget: best.monthlyBudget };
}
