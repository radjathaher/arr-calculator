import type { CashFlowRow, Channel, Params, SeriesPoint, SimResult } from "../types";
import { dstr } from "../format";
import { DAYS, DAYS_IN_MONTH, NDAYS } from "./calendar";
import { baseCAC } from "./acquisition/baseCac";
import { tickRet } from "./retention/tickRet";
import { buildWebPayMap } from "./payout/webPayout";
import { buildIapPayMap } from "./payout/iapPayout";
import { wacc } from "./valuation/wacc";

const BUF = 400; // slack for forward-scheduled billings / payout lags
const z = (n: number): Float64Array => new Float64Array(n);

// ---- Core simulation ------------------------------------------------------
export function simulate(p: Params): SimResult {
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
  // Cash landing per route, kept separate so the cash-flow statement can show
  // the smooth web rolling payouts apart from the lumpy monthly IAP payouts.
  const inflowWeb = z(N + BUF);
  const inflowIap = z(N + BUF);
  const webPayIdx = buildWebPayMap(N + BUF, p.routes.webPayoutDays);
  const iapPayIdx = buildIapPayMap(N + BUF, p.routes.appPayoutDays);

  // Daily series used for charts and the DCF.
  const arr = z(N);
  const recRev = z(N);
  const adSpend = z(N);
  const infraPaidArr = z(N);
  const drawArr = z(N);
  const deferred = z(N);
  const processorAR = z(N);
  const netArr = z(N); // net cash balance (cash − credit drawn)

  const base = p.channels.map(baseCAC);
  const price = p.channels.map((c) => c.prices);

  // Schedule a cohort of `n` paid customers acquired by channel `ci` on `day`.
  const sched = (ch: Channel, ci: number, day: number, n: number): void => {
    if (n <= 1e-9) return;
    const isWeb = ch.route === "WEB";
    const bill = isWeb ? billW : billI;
    const tx = isWeb ? txW : txI;
    const pr = price[ci];
    const nW = (n * ch.mix.weekly) / 100;
    const nM = (n * ch.mix.monthly) / 100;
    const nA = (n * ch.mix.annual) / 100;

    // Each plan's first charge lands after that plan's own free-trial length.
    // The offset is clamped to ≥1 day: charges must land strictly after the
    // current day, since the daily loop accumulates active counts at the top of
    // the tick before `sched` runs at the bottom. A 0-day trial therefore bills
    // the next day (effectively immediate over a multi-year horizon).
    if (nW > 0) {
      const fc = day + Math.max(1, ch.trials.weekly);
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
      const fc = day + Math.max(1, ch.trials.monthly);
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
      const fc = day + Math.max(1, ch.trials.annual);
      for (let k = 0; ; k++) {
        const cd = fc + 365 * k;
        if (cd >= N) break;
        const ret = tickRet(ch.retention.annual, k);
        if (ret < 1e-6) break;
        const s = nA * ret;
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
  let wentNegative = false;
  let cashPositiveDay = -1;
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
    // Web: rolling, weekend-shifted. IAP: lumped onto its Apple fiscal payout day.
    const wIdx = webPayIdx[d];
    if (wIdx < inflowWeb.length) inflowWeb[wIdx] += Math.max(0, nW);
    const iIdx = iapPayIdx[d];
    if (iIdx >= 0 && iIdx < inflowIap.length) inflowIap[iIdx] += nI;
    billCum += billW[d] + billI[d];
    recCum += revD;
    deferred[d] = Math.max(0, billCum - recCum);

    // Cash in from payouts that land today.
    const cashIn = inflowWeb[d] + inflowIap[d];
    bal += cashIn;
    collCum += cashIn;
    processorAR[d] = Math.max(0, netBillCum - collCum);

    // Founder distribution on the first of each month — the only obligation that
    // can pull the balance below −creditLimit (true insolvency). Spending on ads
    // or infra never can, so we record the low-water mark and insolvency here, at
    // the one point in the day where the balance is allowed to dip past the floor.
    if (DAYS[d].first && p.capital.founderDraw > 0) {
      bal -= p.capital.founderDraw;
      drawArr[d] = p.capital.founderDraw;
    }
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
    infraPaidArr[d] = infraPaid;
    bal -= total + infraPaid;

    netArr[d] = bal;
    // Once the balance has dipped into the red, note the day it first claws back
    // to non-negative — "drowning in cash, no longer touching the credit line".
    if (bal < 0) wentNegative = true;
    else if (wentNegative && cashPositiveDay < 0) cashPositiveDay = d;
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
  const waccVal = wacc(p.valuation);
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
    pv += (nopat - dRecv + dDef) / Math.pow(1 + waccVal, d / 365);
  }
  const horizonARR = d1m >= 0 ? arr[d1m] : maxARR;
  const termFCF = horizonARR * gm * (1 - tax);
  const tv = waccVal > gTerm ? (termFCF * (1 + gTerm)) / (waccVal - gTerm) : termFCF * 40;
  const pvTV = tv / Math.pow(1 + waccVal, lastDay / 365);
  const EV = pv + pvTV;
  const endCash = netArr[lastDay];
  const equity = EV + endCash;
  const evMultiple = horizonARR > 0 ? EV / horizonARR : 0;

  // ---- Cash-flow statement (daily + calendar-monthly rollup) ----
  const daily: CashFlowRow[] = [];
  const monthly: CashFlowRow[] = [];
  let curMonth: CashFlowRow | null = null;
  let curKey = "";
  for (let d = 0; d <= lastDay; d++) {
    const date = DAYS[d].date;
    const wIn = inflowWeb[d];
    const iIn = inflowIap[d];
    const sp = adSpend[d];
    const inf = infraPaidArr[d];
    const dr = drawArr[d];
    daily.push({
      i: d,
      date,
      label: dstr(date),
      webIn: wIn,
      iapIn: iIn,
      adSpend: sp,
      infra: inf,
      draw: dr,
      netChange: wIn + iIn - sp - inf - dr,
      endBal: netArr[d],
    });
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (key !== curKey) {
      curMonth = {
        i: d,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        label: date.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        webIn: 0,
        iapIn: 0,
        adSpend: 0,
        infra: 0,
        draw: 0,
        netChange: 0,
        endBal: 0,
      };
      monthly.push(curMonth);
      curKey = key;
    }
    if (curMonth) {
      curMonth.webIn += wIn;
      curMonth.iapIn += iIn;
      curMonth.adSpend += sp;
      curMonth.infra += inf;
      curMonth.draw += dr;
      curMonth.endBal = netArr[d];
    }
  }
  for (const m of monthly) m.netChange = m.webIn + m.iapIn - m.adSpend - m.infra - m.draw;

  return {
    lastDay,
    series,
    cashflow: { monthly, daily },
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
      cashPositiveDate: cashPositiveDay >= 0 ? DAYS[cashPositiveDay].date : null,
      gm,
      EV,
      equity,
      evMultiple,
      wacc: waccVal * 100,
    },
  };
}
