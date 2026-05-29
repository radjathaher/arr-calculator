// Domain types for the Cash & ARR Studio engine.
// A daily cohort simulation of a cash-constrained consumer subscription app,
// run over a fixed horizon (Jun 2026 -> Dec 2030) and rolled up into a full
// monthly three-statement financial model + DCF.

export type RouteKind = "WEB" | "APP";
export type PlanKind = "weekly" | "monthly" | "annual";

// Per-tick survival fractions (percentages, e.g. 55 = 55%). The brutal first
// renewal, then it stabilises. A property of the channel x plan cell: it proxies
// the unobservable customer quality revealed by both how a user was acquired and
// which plan they self-selected into.
export interface StepDown {
  r1: number;
  r2: number;
  r3: number;
  rMature: number;
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
  retention: ChannelRetention;
  satPoint: number; // daily spend ($/day) where CAC begins to climb
  satSlope: number; // steepness exponent
  color: string;
}

export interface Plans {
  wPrice: number;
  mPrice: number;
  aPrice: number;
  trialDays: number;
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
  creditLimit: number;
  apDays: number; // vendor terms / card float
  reserve: number; // cash kept before auto-paying down the card
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
  cash: number;
  card: number; // negative for charting
  arr: number;
}

export interface ChannelResult {
  name: string;
  color: string;
  route: RouteKind;
  spend: number;
  cust: number;
  cac: number;
}

export interface SimSummary {
  d1m: number; // first day index ARR >= $1M (-1 if never)
  d1mDate: Date | null;
  endARR: number;
  maxARR: number;
  endCash: number;
  minCash: number;
  peakFunding: number; // max external cash needed = max(0, -minCash)
  insolventDay: number;
  insolventDate: Date | null;
  peakCard: number;
  blendedCAC: number;
  ltv: number;
  ltvCac: number;
  gm: number;
  totSpend: number;
  paybackWk: number;
  effAR: number;
  blW: number;
  blA: number;
  Lwbl: number;
  totVol: number;
  feeW: number;
  feeI: number;
  webVol: number;
  iapVol: number;
  billCum: number;
  blendedFeeRate: number;
  EV: number; // enterprise value (DCF to today)
  equity: number; // EV − card debt + cash
  evMultiple: number; // EV / horizon ARR
  wacc: number; // % discount rate
  perCh: ChannelResult[];
}

export interface SimResult {
  lastDay: number; // index of the day the run stopped (target hit, or cap)
  series: SeriesPoint[];
  sum: SimSummary;
}
