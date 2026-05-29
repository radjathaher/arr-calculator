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

const PAID: Channel = {
  name: "Paid ads",
  route: "WEB",
  funnel: { cpm: 20, impToInstall: 0.8, installToTrial: 13.3, trialToPaid: 30 },
  mix: { weekly: 55, monthly: 0, annual: 45 },
  retention: {
    weekly: { r1: 55, r2: 78, r3: 84, rMature: 87 },
    monthly: { r1: 70, r2: 82, r3: 86, rMature: 90 },
    annualRenewal: 45,
  },
  satPoint: 3000,
  satSlope: 0.6,
  color: T.teal,
};

const ORGANIC: Channel = {
  name: "Organic / UGC",
  route: "APP",
  funnel: { cpm: 0.56, impToInstall: 0.27, installToTrial: 10.9, trialToPaid: 25.6 },
  mix: { weekly: 80, monthly: 0, annual: 20 },
  retention: {
    weekly: { r1: 45, r2: 72, r3: 80, rMature: 84 },
    monthly: { r1: 60, r2: 76, r3: 82, rMature: 86 },
    annualRenewal: 25,
  },
  satPoint: 300,
  satSlope: 0.75,
  color: T.green,
};

export const DEFAULT_PARAMS: Params = {
  fx: FX_DEFAULT,
  arrGoal: 1_000_000,
  plans: { wPrice: 9.99, mPrice: 19.99, aPrice: 69.99, trialDays: 3 },
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
    apDays: 30,
    reserve: 0,
    founderDraw: 0,
  },
  marketing: {
    paidBudget: 4800,
    organicBudget: 7200,
    budgetRampPct: 0,
  },
  unit: { infraPct: 10 },
  valuation: { rfRate: 5.03, erp: 4.23, beta: 1.69, taxRate: 21, termGrowth: 3 },
  channels: [PAID, ORGANIC],
};
