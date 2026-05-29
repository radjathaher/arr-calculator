// Domain types for the Cash & ARR Studio engine.
// A daily cohort simulation of a cash-constrained consumer subscription app,
// run over a fixed horizon (Jun 2026 -> Dec 2030) and rolled up into a full
// monthly three-statement financial model + DCF.

export type RouteKind = "WEB" | "APP";
export type PlanKind = "weekly" | "monthly" | "annual";

// Per-tick survival fractions (percentages, e.g. 55 = 55%). Three benchmark
// points: the 1st renewal (brutal), the 2nd, then a flat mature rate from the
// 3rd renewal onward.
export interface StepDown {
  r1: number;
  r2: number;
  rMature: number;
}

export interface ChannelPrices {
  wPrice: number;
  mPrice: number;
  aPrice: number;
}

export interface ChannelRetention {
  weekly: StepDown;
  monthly: StepDown;
  annual: StepDown; // per-year step-down: 1st renewal, 2nd, then flat mature
}

// Free-trial length in days per plan (0 = charge immediately on conversion).
export interface PlanTrials {
  weekly: number;
  monthly: number;
  annual: number;
}

export interface Funnel {
  cpm: number; // cost per 1,000 impressions, USD
  impToInstall: number; // percentages
  installToTrial: number;
  trialToPaid: number;
}

export interface PlanMix {
  weekly: number; // percentages, ~sum to 100
  monthly: number;
  annual: number;
}

export interface Channel {
  name: string;
  route: RouteKind;
  funnel: Funnel;
  mix: PlanMix;
  prices: ChannelPrices; // per-channel pricing (paid vs organic may differ)
  trials: PlanTrials; // per-plan free-trial length, days
  retention: ChannelRetention;
  color: string;
}

export interface Routes {
  webFeePct: number;
  webFixed: number;
  webPayoutDays: number;
  appFeeLow: number;
  appFeeHigh: number;
  appPayoutDays: number;
}

export interface Capital {
  startCash: number; // initial paid-in equity
  creditLimit: number; // net balance can draw down to −creditLimit before insolvent
  founderDraw: number; // founder monthly distribution (flat, from month 0)
}

export interface Marketing {
  paidDaily: number; // paid-ads spend $/day (initial daily rate)
  organicDaily: number; // organic/UGC spend $/day (initial daily rate)
  budgetRampPct: number; // monthly growth applied to both channels' daily rate
}

export interface UnitEcon {
  infraPct: number; // infra/COGS as % of recognised revenue
}

export interface Valuation {
  rfRate: number;
  erp: number;
  beta: number;
  taxRate: number;
  termGrowth: number;
}

export interface Params {
  fx: number; // IDR per USD
  arrGoal: number; // target ARR the model races to (default $1M)
  routes: Routes;
  capital: Capital;
  marketing: Marketing;
  unit: UnitEcon;
  valuation: Valuation;
  channels: [Channel, Channel]; // [paid, organic]
}

// ---- Simulation outputs ----

export interface SeriesPoint {
  i: number;
  net: number; // net cash = cash − credit drawn (negative = on credit)
  arr: number;
}

// One row of the cash-flow statement. Inflows are split by collection route so
// the lumpy IAP payouts read distinctly from the smooth web rolling payouts.
export interface CashFlowRow {
  i: number; // day index (daily rows) or first-day index (monthly rows)
  date: Date;
  label: string; // "Jun 26" (month) or "Jun 7, 26" (day)
  webIn: number; // web rolling payouts landed this period
  iapIn: number; // app-store / IAP lump payouts landed this period
  adSpend: number;
  infra: number;
  draw: number; // founder distribution
  netChange: number; // webIn + iapIn − adSpend − infra − draw
  endBal: number; // net cash balance at period end
}

export interface CashFlow {
  daily: CashFlowRow[];
  weekly: CashFlowRow[];
  monthly: CashFlowRow[];
  annual: CashFlowRow[];
}

// One row of the accrual income statement (P&L). Expenses are positive numbers.
export interface IncomeRow {
  i: number; // first day index of the period
  date: Date;
  label: string; // "Jun 26" (month) or "2026" (year)
  revenue: number; // recognised subscription revenue (gross)
  platformFees: number; // Apple/web cut, recognised with revenue
  infra: number; // infra/COGS recognised with revenue
  grossProfit: number; // revenue − platformFees − infra (= revenue · gm)
  marketing: number; // ad spend (expensed as incurred)
  ebit: number; // grossProfit − marketing
  tax: number; // taxRate · max(0, ebit)
  netIncome: number; // ebit − tax
}

// One point-in-time row of the balance sheet. Ties: totalAssets ≈ totalLiabilities + totalEquity.
export interface BalanceRow {
  i: number;
  date: Date;
  label: string;
  cash: number; // max(0, net balance)
  receivable: number; // cash in transit (billed-net, not yet collected)
  totalAssets: number;
  deferredRevenue: number; // billed but not yet recognised
  creditDrawn: number; // max(0, −net balance)
  accruedCosts: number; // fee-timing + infra payable + tax payable (sign-aware)
  totalLiabilities: number;
  paidInCapital: number; // starting cash
  retainedEarnings: number; // Σ net income − Σ founder draws
  totalEquity: number;
  check: number; // totalAssets − totalLiabilities − totalEquity (≈ 0)
}

export interface IncomeStatement {
  monthly: IncomeRow[];
  annual: IncomeRow[];
}

export interface BalanceSheet {
  monthly: BalanceRow[];
  annual: BalanceRow[];
}

export interface SimSummary {
  d1m: number; // first day index ARR >= target (-1 if never)
  d1mDate: Date | null;
  endARR: number;
  maxARR: number;
  endCash: number; // net balance at the stop day
  minCash: number; // lowest net balance over the run
  peakFunding: number; // external cash needed beyond credit = max(0, −minBal − creditLimit)
  insolventDay: number; // first day net balance < −creditLimit
  insolventDate: Date | null;
  cashPositiveDate: Date | null; // first day net ≥ 0 after dipping negative (null if never)
  gm: number; // blended gross margin (0..1)
  EV: number; // enterprise value (DCF to today)
  equity: number; // EV + net cash balance
  evMultiple: number; // EV / horizon ARR
  wacc: number; // % discount rate
}

export interface SimResult {
  lastDay: number; // index of the day the run stopped (target hit, or cap)
  series: SeriesPoint[];
  sum: SimSummary;
  cashflow: CashFlow;
  statements: {
    income: IncomeStatement;
    balance: BalanceSheet;
  };
}
