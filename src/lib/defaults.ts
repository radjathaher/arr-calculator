import type { Channel, Params } from "./types";

// IDR per USD (BI JISDOR reference, editable in-app).
export const FX_DEFAULT = 17789;

// Theme tokens shared by the model + explainer (warm editorial paper).
export const T = {
  bg: "#f4f1ea",
  panel: "#fffdf9",
  ink: "#1a1712",
  muted: "#857b6c",
  line: "#e7dfce",
  teal: "#0f766e",
  green: "#3f8f4f",
  orange: "#c2570c",
  danger: "#b4232a",
  gold: "#a98300",
} as const;

// Funnel conversions are percentages. Defaults seeded from public benchmarks
// (RevenueCat / Adapty 2026, and the Sideshift UGC case study).

// Benchmark retention used as the default for both channels (1st · 2nd · mature
// renewal, per plan). Founders tune these per channel from here.
const RETENTION = {
  weekly: { r1: 54.2, r2: 74.6, rMature: 81.2 },
  monthly: { r1: 57.3, r2: 72.2, rMature: 77.5 },
  annual: { r1: 24.6, r2: 47.4, rMature: 60.3 },
} as const;

const MIX = { weekly: 70, monthly: 0, annual: 30 } as const;

const PAID: Channel = {
  name: "Paid ads",
  route: "WEB",
  funnel: { cpm: 20, impToInstall: 0.8, installToTrial: 13.3, trialToPaid: 30 },
  mix: { ...MIX },
  prices: { wPrice: 9.99, mPrice: 19.99, aPrice: 69.99 },
  trials: { weekly: 3, monthly: 0, annual: 0 },
  retention: {
    weekly: { ...RETENTION.weekly },
    monthly: { ...RETENTION.monthly },
    annual: { ...RETENTION.annual },
  },
  color: T.teal,
};

const ORGANIC: Channel = {
  name: "Organic / UGC",
  route: "APP",
  funnel: { cpm: 0.56, impToInstall: 0.27, installToTrial: 10.9, trialToPaid: 25.6 },
  mix: { ...MIX },
  prices: { wPrice: 9.99, mPrice: 19.99, aPrice: 69.99 },
  trials: { weekly: 3, monthly: 0, annual: 0 },
  retention: {
    weekly: { ...RETENTION.weekly },
    monthly: { ...RETENTION.monthly },
    annual: { ...RETENTION.annual },
  },
  color: T.green,
};

export const DEFAULT_PARAMS: Params = {
  fx: FX_DEFAULT,
  arrGoal: 1_000_000,
  routes: {
    webFeePct: 6,
    webFixed: 0.4,
    webPayoutDays: 10,
    appFeeLow: 15,
    appFeeHigh: 30,
    appPayoutDays: 60,
  },
  capital: {
    startCash: 20000,
    creditLimit: 20000,
    founderDraw: 0,
  },
  marketing: {
    paidDaily: 160,
    organicDaily: 240,
    budgetRampPct: 0,
  },
  unit: { infraPct: 10 },
  valuation: { rfRate: 5.03, erp: 4.23, beta: 1.69, taxRate: 21, termGrowth: 3 },
  channels: [PAID, ORGANIC],
};
