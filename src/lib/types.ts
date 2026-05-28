// Domain types for the Cash & ARR Studio simulation engine.
// The model is a daily cohort simulation of a cash-constrained consumer
// subscription app, run until it reaches $1M ARR (or a 5-year cap).

export type RouteKind = "WEB" | "APP";
export type PlanKind = "weekly" | "monthly" | "annual";

// A step-down retention curve for a recurring (weekly/monthly) plan.
// Values are per-tick survival fractions (0..1). The brutal first renewal,
// then it stabilises into a mature rate. This curve is a property of the
// channel x plan cell: it proxies the unobservable customer quality revealed
// by both how a user was acquired and which plan they self-selected into.
export interface StepDown {
  r1: number;
  r2: number;
  r3: number;
  rMature: number;
}

// Retention for every plan a single channel can sell.
export interface ChannelRetention {
  weekly: StepDown;
  monthly: StepDown;
  annualRenewal: number; // per-year renewal fraction (0..1)
}

// Acquisition funnel for one channel. Conversions are fractions (0..1).
export interface Funnel {
  cpm: number; // cost per 1,000 impressions, USD
  impToInstall: number;
  installToTrial: number;
  trialToPaid: number;
}

export interface PlanMix {
  weekly: number; // fractions, should sum to ~1
  monthly: number;
  annual: number;
}

export interface Channel {
  name: string;
  route: RouteKind;
  funnel: Funnel;
  mix: PlanMix;
  retention: ChannelRetention;
  // Saturation: below satPoint daily spend, CAC is flat; above it, marginal
  // CAC climbs as (spend/satPoint)^satSlope. Kills the "infinite cheap
  // organic" exploit.
  satPoint: number; // daily spend ($/day) where CAC begins to climb
  satSlope: number; // steepness exponent (0 = no climb)
  color: string;
}

export interface Plans {
  wPrice: number;
  mPrice: number;
  aPrice: number;
  trialDays: number;
}

export interface Routes {
  webFeePct: number; // %
  webFixed: number; // $ per transaction
  webPayoutDays: number;
  appFeeLow: number; // % while ARR < $1M
  appFeeHigh: number; // % once ARR >= $1M
  appPayoutDays: number;
}

export interface Capital {
  startCash: number;
  creditLimit: number;
  apDays: number; // vendor payment terms — card float in days
  reserve: number; // minimum cash floor to keep
  founderDraw: number; // monthly founder withdrawal
  drawStartMonth: number; // month index (0 = first month) draws begin
}

export interface Marketing {
  monthlyBudget: number; // base marketing $/month
  budgetGrowthPct: number; // % ramp per month
  paidShare: number; // % of budget to the paid channel (rest to organic)
}

export interface UnitEcon {
  infraPct: number; // infra/COGS as % of recognised revenue
}

export interface Valuation {
  rfRate: number; // risk-free %
  erp: number; // equity risk premium %
  beta: number;
  taxRate: number; // %
  termGrowth: number; // terminal growth %
}

export interface Params {
  fx: number; // IDR per USD
  plans: Plans;
  routes: Routes;
  capital: Capital;
  marketing: Marketing;
  unit: UnitEcon;
  valuation: Valuation;
  channels: [Channel, Channel]; // [paid, organic]
}

export interface SeriesPoint {
  i: number; // day index
  cash: number;
  card: number; // negative (drawn below zero on charts)
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
  reached: boolean;
  D1M: number; // day index ARR hit $1M (or lastDay if unreached)
  D1Mdate: Date | null;
  monthsElapsed: number;
  horizonARR: number;
  maxARR: number;
  endCash: number;
  minCash: number;
  peakCard: number;
  insolventDay: number;
  insolventDate: Date | null;
  blendedCAC: number;
  ltv: number;
  ltvCac: number;
  gm: number; // gross margin (0..1)
  totSpend: number;
  paybackWk: number;
  EV: number;
  evMultiple: number; // implied ARR multiple (DCF cross-check)
  wacc: number; // %
  effAR: number; // blended effective AR (payout) days
  blW: number; // blended weekly plan share (0..1)
  blA: number; // blended annual plan share (0..1)
  Lwbl: number; // blended weekly lifetime (weeks)
  totVol: number;
  feeW: number; // total web fees
  feeI: number; // total in-app fees
  webVol: number;
  iapVol: number;
  perCh: ChannelResult[];
}

export interface SimResult {
  series: SeriesPoint[];
  lastDay: number;
  sum: SimSummary;
}
