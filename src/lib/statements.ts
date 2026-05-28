import type { Params, SimResult } from "./types";
import { DAYS, MONTH_LABELS, NDAYS, NMONTHS } from "./engine";

// Monthly three-statement financial model derived from the daily cohort sim.
// The statements ARTICULATE: the balance sheet balances (accrued liabilities is
// the reconciling plug) and the cash-flow statement ties to the sim's actual
// cash. The DCF is a separate valuation lens (assumes cash taxes paid).

export interface MonthIS {
  revenue: number;
  cogs: number;
  grossProfit: number;
  sm: number; // sales & marketing (ad spend)
  ebitda: number;
  ebit: number;
  tax: number;
  netIncome: number;
}

export interface MonthBS {
  cash: number;
  ar: number; // processor receivables
  prepaid: number;
  totalAssets: number;
  card: number; // credit/card debt
  deferred: number;
  accrued: number; // accrued fees & tax timing (balancing plug)
  taxPayable: number;
  totalLiab: number;
  paidIn: number;
  retained: number;
  totalEquity: number;
}

export interface MonthCFS {
  netIncome: number;
  dDeferred: number;
  dAR: number;
  dPrepaid: number;
  dAccrued: number;
  dTaxPayable: number;
  cfo: number;
  cfi: number;
  dCard: number;
  distribution: number;
  cff: number;
  netChange: number;
  endCash: number;
}

export interface MonthDCF {
  ebit: number;
  nopat: number;
  dNwc: number;
  ufcf: number;
  pv: number;
}

export interface Kpis {
  grossMargin: number;
  ebitdaMargin: number;
  netMargin: number;
  fcfMargin: number;
  ev: number;
  equityValue: number;
  impliedMultiple: number;
  wacc: number;
  cac: number;
  ltv: number;
  ltvCac: number;
  paybackMonths: number;
  dso: number;
  dpo: number;
  deferredBal: number;
  burn: number;
  runwayMonths: number;
  peakFunding: number;
  endARR: number;
  mrr: number;
  momGrowth: number;
  ruleOf40: number;
  monthsTo1M: number;
}

export interface Statements {
  months: number;
  labels: string[];
  is: MonthIS[];
  bs: MonthBS[];
  cfs: MonthCFS[];
  dcf: MonthDCF[];
  ev: number;
  pvExplicit: number;
  pvTV: number;
  tv: number;
  equityValue: number;
  impliedMultiple: number;
  wacc: number;
  kpis: Kpis;
  balanced: boolean; // BS balances & CFS ties to sim cash, all months
}

// Index of the last simulated day in each month.
const LAST_DAY_OF_MONTH: number[] = (() => {
  const out = Array.from({ length: NMONTHS }, () => 0);
  for (let i = 0; i < NDAYS; i++) out[DAYS[i].mi] = i;
  return out;
})();

export function buildStatements(sim: SimResult, p: Params): Statements {
  const M = NMONTHS;
  const dly = sim.daily;
  const feeRate = sim.sum.blendedFeeRate;
  const infraPct = p.unit.infraPct / 100;
  const taxRate = p.valuation.taxRate / 100;
  const wacc = (p.valuation.rfRate + p.valuation.beta * p.valuation.erp) / 100;
  const gTerm = p.valuation.termGrowth / 100;

  // Monthly flow sums.
  const rev = Array.from({ length: M }, () => 0);
  const sm = Array.from({ length: M }, () => 0);
  const dist = Array.from({ length: M }, () => 0);
  const billings = Array.from({ length: M }, () => 0);
  for (let i = 0; i < NDAYS; i++) {
    const m = DAYS[i].mi;
    rev[m] += dly.recRev[i];
    sm[m] += dly.adSpend[i];
    dist[m] += dly.distribution[i];
    billings[m] += dly.billings[i];
  }

  // End-of-month balances.
  const cashEom = Array.from({ length: M }, () => 0);
  const arEom = Array.from({ length: M }, () => 0);
  const cardEom = Array.from({ length: M }, () => 0);
  const defEom = Array.from({ length: M }, () => 0);
  const arrEom = Array.from({ length: M }, () => 0);
  for (let m = 0; m < M; m++) {
    const d = LAST_DAY_OF_MONTH[m];
    cashEom[m] = dly.cash[d];
    arEom[m] = dly.processorAR[d];
    cardEom[m] = dly.cardDebt[d];
    defEom[m] = dly.deferred[d];
    arrEom[m] = dly.arr[d];
  }

  const is: MonthIS[] = [];
  const bs: MonthBS[] = [];
  const cfs: MonthCFS[] = [];
  const dcf: MonthDCF[] = [];

  let cumNI = 0;
  let cumDist = 0;
  let cumTax = 0;
  const paidIn = p.capital.startCash;

  let prevAR = 0;
  let prevPrepaid = 0;
  let prevDef = 0;
  let prevAccrued = 0;
  let prevTaxPay = 0;
  let prevCard = 0;
  let prevCash = paidIn;
  let prevNwc = 0;

  let balanced = true;

  for (let m = 0; m < M; m++) {
    // ---- Income statement (accrual; COGS smoothed onto recognised revenue) ----
    const revenue = rev[m];
    const cogs = revenue * (feeRate + infraPct);
    const grossProfit = revenue - cogs;
    const smm = sm[m];
    const ebitda = grossProfit - smm;
    const ebit = ebitda; // D&A = 0
    const tax = Math.max(0, ebit) * taxRate;
    const netIncome = ebit - tax;
    is.push({ revenue, cogs, grossProfit, sm: smm, ebitda, ebit, tax, netIncome });

    cumNI += netIncome;
    cumDist += dist[m];
    cumTax += tax; // accrued, not paid in cash within the model

    // ---- Balance sheet (cash/AR/card/deferred are sim actuals) ----
    const cash = cashEom[m];
    const ar = arEom[m];
    const prepaid = 0;
    const totalAssets = cash + ar + prepaid;
    const card = cardEom[m];
    const deferred = defEom[m];
    const taxPayable = cumTax;
    const retained = cumNI - cumDist;
    // Plug accrued liabilities so Assets = Liabilities + Equity exactly.
    const accrued = totalAssets - card - deferred - taxPayable - paidIn - retained;
    const totalLiab = card + deferred + accrued + taxPayable;
    const totalEquity = paidIn + retained;
    bs.push({
      cash,
      ar,
      prepaid,
      totalAssets,
      card,
      deferred,
      accrued,
      taxPayable,
      totalLiab,
      paidIn,
      retained,
      totalEquity,
    });

    if (Math.abs(totalAssets - (totalLiab + totalEquity)) > 1) balanced = false;

    // ---- Cash flow statement (indirect; ties to sim cash by construction) ----
    const dDeferred = deferred - prevDef;
    const dAR = ar - prevAR;
    const dPrepaid = prepaid - prevPrepaid;
    const dAccrued = accrued - prevAccrued;
    const dTaxPayable = taxPayable - prevTaxPay;
    const cfo = netIncome + dDeferred - dAR - dPrepaid + dAccrued + dTaxPayable;
    const cfi = 0;
    const dCard = card - prevCard;
    const distribution = dist[m];
    const cff = dCard - distribution;
    const netChange = cfo + cfi + cff;
    const endCash = cash;
    cfs.push({
      netIncome,
      dDeferred,
      dAR,
      dPrepaid,
      dAccrued,
      dTaxPayable,
      cfo,
      cfi,
      dCard,
      distribution,
      cff,
      netChange,
      endCash,
    });
    if (Math.abs(prevCash + netChange - endCash) > 1) balanced = false;

    // ---- DCF (unlevered; assumes cash taxes; ex-financing, ex-cash) ----
    const nopat = ebit * (1 - taxRate);
    const nwc = ar + prepaid - deferred - accrued; // operating, ex card/cash/tax
    const dNwc = nwc - prevNwc;
    const ufcf = nopat - dNwc;
    const pv = ufcf / Math.pow(1 + wacc, (m + 1) / 12);
    dcf.push({ ebit, nopat, dNwc, ufcf, pv });

    prevAR = ar;
    prevPrepaid = prepaid;
    prevDef = deferred;
    prevAccrued = accrued;
    prevTaxPay = taxPayable;
    prevCard = card;
    prevCash = endCash;
    prevNwc = nwc;
  }

  // ---- Valuation ----
  const pvExplicit = dcf.reduce((a, d) => a + d.pv, 0);
  const ttmUfcf = dcf.slice(Math.max(0, M - 12)).reduce((a, d) => a + d.ufcf, 0);
  const tv = wacc > gTerm ? (ttmUfcf * (1 + gTerm)) / (wacc - gTerm) : ttmUfcf * 40;
  const pvTV = tv / Math.pow(1 + wacc, M / 12);
  const ev = pvExplicit + pvTV;
  const endCash = cashEom[M - 1];
  const endCard = cardEom[M - 1];
  const equityValue = ev - endCard + endCash;
  const endARR = arrEom[M - 1];
  const impliedMultiple = endARR > 0 ? ev / endARR : 0;

  // ---- KPIs ----
  const totRev = rev.reduce((a, b) => a + b, 0);
  const totEbitda = is.reduce((a, x) => a + x.ebitda, 0);
  const totNI = cumNI;
  const totUfcf = dcf.reduce((a, d) => a + d.ufcf, 0);
  let burn = 0;
  for (const c of cfs) if (-c.netChange > burn) burn = -c.netChange;
  const momGrowth = M >= 2 && rev[M - 2] > 0 ? rev[M - 1] / rev[M - 2] - 1 : 0;
  const arrGrowthYoY = M >= 13 && arrEom[M - 13] > 0 ? arrEom[M - 1] / arrEom[M - 13] - 1 : 0;
  const fcfMargin = totRev > 0 ? totUfcf / totRev : 0;
  const kpis: Kpis = {
    grossMargin: sim.sum.gm,
    ebitdaMargin: totRev > 0 ? totEbitda / totRev : 0,
    netMargin: totRev > 0 ? totNI / totRev : 0,
    fcfMargin,
    ev,
    equityValue,
    impliedMultiple,
    wacc,
    cac: sim.sum.blendedCAC,
    ltv: sim.sum.ltv,
    ltvCac: sim.sum.ltvCac,
    paybackMonths: sim.sum.paybackWk / 4.33,
    dso: sim.sum.effAR,
    dpo: p.capital.apDays,
    deferredBal: defEom[M - 1],
    burn,
    runwayMonths: burn > 0 ? Math.max(0, endCash) / burn : Infinity,
    peakFunding: sim.sum.peakFunding,
    endARR,
    mrr: endARR / 12,
    momGrowth,
    ruleOf40: (arrGrowthYoY + fcfMargin) * 100,
    monthsTo1M: sim.sum.d1m >= 0 ? sim.sum.d1m / 30.44 : -1,
  };

  return {
    months: M,
    labels: MONTH_LABELS,
    is,
    bs,
    cfs,
    dcf,
    ev,
    pvExplicit,
    pvTV,
    tv,
    equityValue,
    impliedMultiple,
    wacc,
    kpis,
    balanced,
  };
}
