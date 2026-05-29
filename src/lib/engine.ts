import type { Channel, DailyBlocks, Params, SeriesPoint, SimResult, StepDown } from "./types";
import { baseCAC, customersFromSpend } from "./saturation";

// ---- Calendar -------------------------------------------------------------
// Fixed horizon: day 0 = 1 June 2026 (launch) -> 31 December 2030.
export const START = new Date(2026, 5, 1);
export const HORIZON_END = new Date(2030, 11, 31);
const BUF = 400; // slack for forward-scheduled billings / payout lags

interface DayInfo {
  date: Date;
  mi: number; // month index since start (0 = Jun 2026)
  first: boolean;
}

export const DAYS: DayInfo[] = (() => {
  const out: DayInfo[] = [];
  const endMs = HORIZON_END.getTime();
  for (let i = 0; ; i++) {
    const d = new Date(START.getTime() + i * 864e5);
    if (d.getTime() > endMs) break;
    out.push({
      date: d,
      mi: (d.getFullYear() - 2026) * 12 + d.getMonth() - 5,
      first: d.getDate() === 1,
    });
  }
  return out;
})();

export const NDAYS = DAYS.length;
export const NMONTHS = DAYS[NDAYS - 1].mi + 1; // 55

// Calendar month labels, e.g. "Jun '26".
export const MONTH_LABELS: string[] = (() => {
  const out: string[] = [];
  for (let m = 0; m < NMONTHS; m++) {
    const d = new Date(2026, 5 + m, 1);
    out.push(
      d.toLocaleString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(2),
    );
  }
  return out;
})();

// Days per calendar month within the horizon.
export const DAYS_IN_MONTH: number[] = (() => {
  const out = Array.from({ length: NMONTHS }, () => 0);
  for (const d of DAYS) out[d.mi]++;
  return out;
})();

// Cumulative survival fraction of a step-down curve at tick k (percentages in).
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
  const { wPrice, mPrice, aPrice, trialDays } = p.plans;
  const webFee = p.routes.webFeePct / 100;
  const asLow = p.routes.appFeeLow / 100;
  const asHigh = p.routes.appFeeHigh / 100;
  const infra = p.unit.infraPct / 100;
  const N = NDAYS;

  const diffW = z(N + BUF);
  const diffM = z(N + BUF);
  const diffA = z(N + BUF);
  const billW = z(N + BUF);
  const billI = z(N + BUF);
  const txW = z(N + BUF);
  const txI = z(N + BUF);
  const inflow = z(N + BUF);

  // Daily building blocks (exposed for the statements layer).
  const arr = z(N);
  const recRev = z(N);
  const adSpend = z(N);
  const feesDay = z(N);
  const infraDay = z(N);
  const billingsDay = z(N);
  const deferred = z(N);
  const processorAR = z(N);
  const cardDebt = z(N);
  const cashArr = z(N);
  const distribution = z(N);

  const base = p.channels.map(baseCAC);
  const chSpend = [0, 0];
  const chCust = [0, 0];
  const chCustW = [0, 0];
  const chCustM = [0, 0];
  const chCustA = [0, 0];

  const sched = (ch: Channel, ci: number, day: number, n: number): void => {
    if (n <= 1e-9) return;
    const fc = day + trialDays;
    const isWeb = ch.route === "WEB";
    const bill = isWeb ? billW : billI;
    const tx = isWeb ? txW : txI;
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
  let d1m = -1;
  let peakCard = 0;

  const q: { amt: number; due: number }[] = [];
  let head = 0;

  const reserve = p.capital.reserve;
  const limit = p.capital.creditLimit;
  const apDays = p.capital.apDays;
  const budgets = [p.marketing.paidBudget, p.marketing.organicBudget];

  for (let d = 0; d < N; d++) {
    const mi = DAYS[d].mi;
    rW += diffW[d];
    rA += diffA[d];
    rM += diffM[d];
    arr[d] = rW * wPrice * 52 + rA * aPrice + rM * mPrice * 12;
    const rev = rW * (wPrice / 7) + rA * (aPrice / 365) + rM * (mPrice / 30);
    recRev[d] = rev;
    const infD = rev * infra;
    infraDay[d] = infD;
    const asFee = arr[d] >= 1e6 ? asHigh : asLow;

    const nW = billW[d] * (1 - webFee) - p.routes.webFixed * txW[d];
    const nI = billI[d] * (1 - asFee);
    const dayFees = billW[d] - Math.max(0, nW) + (billI[d] - nI);
    feesDay[d] = dayFees;
    feeW += billW[d] - Math.max(0, nW);
    feeI += billI[d] - nI;
    webVol += billW[d];
    iapVol += billI[d];
    billingsDay[d] = billW[d] + billI[d];
    netBillCum += Math.max(0, nW) + nI;
    if (d + p.routes.webPayoutDays < inflow.length)
      inflow[d + p.routes.webPayoutDays] += Math.max(0, nW);
    if (d + p.routes.appPayoutDays < inflow.length) inflow[d + p.routes.appPayoutDays] += nI;
    billCum += billW[d] + billI[d];
    recCum += rev;
    deferred[d] = Math.max(0, billCum - recCum);

    const inf = inflow[d];
    cash += inf;
    collCum += inf;
    processorAR[d] = Math.max(0, netBillCum - collCum);

    // Repay card charges due today.
    while (head < q.length && q[head].due <= d) {
      cash -= q[head].amt;
      card -= q[head].amt;
      head++;
    }

    // Founder distribution on the first of each month (flat).
    if (DAYS[d].first) {
      const draw = p.capital.founderDraw;
      if (draw > 0) {
        cash -= draw;
        distribution[d] = draw;
      }
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

    // Per-channel marketing spend: each channel's monthly budget (× ramp),
    // deployed evenly across the month's days.
    const dim = DAYS_IN_MONTH[mi];
    const rampF = Math.pow(1 + p.marketing.budgetRampPct / 100, mi);
    let total = 0;
    for (let i = 0; i < 2; i++) {
      const sp = dim > 0 ? (budgets[i] * rampF) / dim : 0;
      total += sp;
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
    adSpend[d] = total;

    // Charge spend + infra to the card; overflow beyond the limit hits cash
    // (cash may go negative — surfaced as insolvency, not auto-prevented).
    const charge = total + infD;
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

    cashArr[d] = cash;
    cardDebt[d] = card;
    if (card > peakCard) peakCard = card;
    if (cash < minCash) minCash = cash;
    if (cash < -1e-6 && insolventDay < 0) insolventDay = d;
    if (arr[d] >= 1e6 && d1m < 0) d1m = d;
  }

  // ---- Blended unit economics ----
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

  let maxARR = 0;
  for (let d = 0; d < N; d++) if (arr[d] > maxARR) maxARR = arr[d];

  const series: SeriesPoint[] = [];
  for (let d = 0; d < N; d++)
    series.push({ i: d, cash: cashArr[d], card: -cardDebt[d], arr: arr[d] });

  const daily: DailyBlocks = {
    arr,
    recRev,
    adSpend,
    fees: feesDay,
    infra: infraDay,
    billings: billingsDay,
    deferred,
    processorAR,
    cardDebt,
    cash: cashArr,
    distribution,
  };

  return {
    days: N,
    daily,
    series,
    sum: {
      d1m,
      d1mDate: d1m >= 0 ? DAYS[d1m].date : null,
      endARR: arr[N - 1],
      maxARR,
      endCash: cashArr[N - 1],
      minCash,
      peakFunding: Math.max(0, -minCash),
      insolventDay,
      insolventDate: insolventDay >= 0 ? DAYS[insolventDay].date : null,
      peakCard,
      blendedCAC,
      ltv,
      ltvCac,
      gm,
      totSpend,
      paybackWk,
      effAR,
      blW,
      blA,
      Lwbl,
      totVol,
      feeW,
      feeI,
      webVol,
      iapVol,
      billCum,
      blendedFeeRate,
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
