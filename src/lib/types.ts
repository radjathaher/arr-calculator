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
  annualRenewal: number; // per-year renewal fraction (percentage)
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
  retention: ChannelRetention;
  color: string;
}

export interface Plans {
  trialDays: number; // global trial length
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
  paidBudget: number; // paid-ads spend $/month (initial)
  organicBudget: number; // organic/UGC spend $/month (initial)
  budgetRampPct: number; // monthly growth applied to both channels
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
  plans: Plans;
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
}
