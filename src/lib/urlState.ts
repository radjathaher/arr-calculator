import type { Params, RouteKind } from "./types";
import { DEFAULT_PARAMS } from "./defaults";

// A flat, URL-friendly view of Params. Each accessor reads/writes one scalar so
// scenarios can round-trip through the querystring (shareable links). Only keys
// that differ from the defaults are written, keeping URLs short.

interface NumAcc {
  k: string;
  kind: "num";
  get: (p: Params) => number;
  set: (p: Params, v: number) => void;
}
interface RouteAcc {
  k: string;
  kind: "route";
  get: (p: Params) => RouteKind;
  set: (p: Params, v: RouteKind) => void;
}
type Acc = NumAcc | RouteAcc;

const num = (
  k: string,
  get: (p: Params) => number,
  set: (p: Params, v: number) => void,
): NumAcc => ({ k, kind: "num", get, set });

function channelAccessors(i: 0 | 1): Acc[] {
  const c = (p: Params) => p.channels[i];
  const pfx = `c${i}`;
  return [
    {
      k: `${pfx}rt`,
      kind: "route",
      get: (p) => c(p).route,
      set: (p, v) => {
        c(p).route = v;
      },
    },
    num(
      `${pfx}cpm`,
      (p) => c(p).funnel.cpm,
      (p, v) => (c(p).funnel.cpm = v),
    ),
    num(
      `${pfx}f1`,
      (p) => c(p).funnel.impToInstall,
      (p, v) => (c(p).funnel.impToInstall = v),
    ),
    num(
      `${pfx}f2`,
      (p) => c(p).funnel.installToTrial,
      (p, v) => (c(p).funnel.installToTrial = v),
    ),
    num(
      `${pfx}f3`,
      (p) => c(p).funnel.trialToPaid,
      (p, v) => (c(p).funnel.trialToPaid = v),
    ),
    num(
      `${pfx}mw`,
      (p) => c(p).mix.weekly,
      (p, v) => (c(p).mix.weekly = v),
    ),
    num(
      `${pfx}mm`,
      (p) => c(p).mix.monthly,
      (p, v) => (c(p).mix.monthly = v),
    ),
    num(
      `${pfx}ma`,
      (p) => c(p).mix.annual,
      (p, v) => (c(p).mix.annual = v),
    ),
    num(
      `${pfx}w1`,
      (p) => c(p).retention.weekly.r1,
      (p, v) => (c(p).retention.weekly.r1 = v),
    ),
    num(
      `${pfx}w2`,
      (p) => c(p).retention.weekly.r2,
      (p, v) => (c(p).retention.weekly.r2 = v),
    ),
    num(
      `${pfx}w3`,
      (p) => c(p).retention.weekly.r3,
      (p, v) => (c(p).retention.weekly.r3 = v),
    ),
    num(
      `${pfx}wm`,
      (p) => c(p).retention.weekly.rMature,
      (p, v) => (c(p).retention.weekly.rMature = v),
    ),
    num(
      `${pfx}o1`,
      (p) => c(p).retention.monthly.r1,
      (p, v) => (c(p).retention.monthly.r1 = v),
    ),
    num(
      `${pfx}o2`,
      (p) => c(p).retention.monthly.r2,
      (p, v) => (c(p).retention.monthly.r2 = v),
    ),
    num(
      `${pfx}o3`,
      (p) => c(p).retention.monthly.r3,
      (p, v) => (c(p).retention.monthly.r3 = v),
    ),
    num(
      `${pfx}om`,
      (p) => c(p).retention.monthly.rMature,
      (p, v) => (c(p).retention.monthly.rMature = v),
    ),
    num(
      `${pfx}ar`,
      (p) => c(p).retention.annualRenewal,
      (p, v) => (c(p).retention.annualRenewal = v),
    ),
    num(
      `${pfx}sat`,
      (p) => c(p).satPoint,
      (p, v) => (c(p).satPoint = v),
    ),
    num(
      `${pfx}slp`,
      (p) => c(p).satSlope,
      (p, v) => (c(p).satSlope = v),
    ),
  ];
}

const ACC: Acc[] = [
  num(
    "fx",
    (p) => p.fx,
    (p, v) => (p.fx = v),
  ),
  num(
    "pw",
    (p) => p.plans.wPrice,
    (p, v) => (p.plans.wPrice = v),
  ),
  num(
    "pm",
    (p) => p.plans.mPrice,
    (p, v) => (p.plans.mPrice = v),
  ),
  num(
    "pa",
    (p) => p.plans.aPrice,
    (p, v) => (p.plans.aPrice = v),
  ),
  num(
    "trial",
    (p) => p.plans.trialDays,
    (p, v) => (p.plans.trialDays = v),
  ),
  num(
    "wfee",
    (p) => p.routes.webFeePct,
    (p, v) => (p.routes.webFeePct = v),
  ),
  num(
    "wfix",
    (p) => p.routes.webFixed,
    (p, v) => (p.routes.webFixed = v),
  ),
  num(
    "wpay",
    (p) => p.routes.webPayoutDays,
    (p, v) => (p.routes.webPayoutDays = v),
  ),
  num(
    "afl",
    (p) => p.routes.appFeeLow,
    (p, v) => (p.routes.appFeeLow = v),
  ),
  num(
    "afh",
    (p) => p.routes.appFeeHigh,
    (p, v) => (p.routes.appFeeHigh = v),
  ),
  num(
    "apay",
    (p) => p.routes.appPayoutDays,
    (p, v) => (p.routes.appPayoutDays = v),
  ),
  num(
    "cash",
    (p) => p.capital.startCash,
    (p, v) => (p.capital.startCash = v),
  ),
  num(
    "credit",
    (p) => p.capital.creditLimit,
    (p, v) => (p.capital.creditLimit = v),
  ),
  num(
    "ap",
    (p) => p.capital.apDays,
    (p, v) => (p.capital.apDays = v),
  ),
  num(
    "res",
    (p) => p.capital.reserve,
    (p, v) => (p.capital.reserve = v),
  ),
  num(
    "draw",
    (p) => p.capital.founderDraw,
    (p, v) => (p.capital.founderDraw = v),
  ),
  num(
    "draws",
    (p) => p.capital.drawStartMonth,
    (p, v) => (p.capital.drawStartMonth = v),
  ),
  num(
    "bud",
    (p) => p.marketing.monthlyBudget,
    (p, v) => (p.marketing.monthlyBudget = v),
  ),
  num(
    "grow",
    (p) => p.marketing.budgetGrowthPct,
    (p, v) => (p.marketing.budgetGrowthPct = v),
  ),
  num(
    "paid",
    (p) => p.marketing.paidShare,
    (p, v) => (p.marketing.paidShare = v),
  ),
  num(
    "infra",
    (p) => p.unit.infraPct,
    (p, v) => (p.unit.infraPct = v),
  ),
  num(
    "rf",
    (p) => p.valuation.rfRate,
    (p, v) => (p.valuation.rfRate = v),
  ),
  num(
    "erp",
    (p) => p.valuation.erp,
    (p, v) => (p.valuation.erp = v),
  ),
  num(
    "beta",
    (p) => p.valuation.beta,
    (p, v) => (p.valuation.beta = v),
  ),
  num(
    "tax",
    (p) => p.valuation.taxRate,
    (p, v) => (p.valuation.taxRate = v),
  ),
  num(
    "term",
    (p) => p.valuation.termGrowth,
    (p, v) => (p.valuation.termGrowth = v),
  ),
  ...channelAccessors(0),
  ...channelAccessors(1),
];

// Encode only the values that differ from defaults.
export function encodeParams(p: Params): string {
  const sp = new URLSearchParams();
  for (const a of ACC) {
    if (a.kind === "num") {
      const v = a.get(p);
      if (v !== a.get(DEFAULT_PARAMS)) sp.set(a.k, String(v));
    } else {
      const v = a.get(p);
      if (v !== a.get(DEFAULT_PARAMS)) sp.set(a.k, v);
    }
  }
  return sp.toString();
}

// Decode a querystring onto a fresh copy of the defaults.
export function decodeParams(qs: string): Params {
  const p = structuredClone(DEFAULT_PARAMS);
  const sp = new URLSearchParams(qs);
  for (const a of ACC) {
    const raw = sp.get(a.k);
    if (raw == null) continue;
    if (a.kind === "num") {
      const v = Number.parseFloat(raw);
      if (Number.isFinite(v)) a.set(p, v);
    } else if (raw === "WEB" || raw === "APP") {
      a.set(p, raw);
    }
  }
  return p;
}
