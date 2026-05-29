import type { Params, RouteKind } from "./types";
import { DEFAULT_PARAMS } from "./defaults";

// Flat, URL-friendly codec for Params so scenarios round-trip through the
// querystring. Only values that differ from the defaults are written.

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
  const x = `c${i}`;
  return [
    { k: `${x}rt`, kind: "route", get: (p) => c(p).route, set: (p, v) => void (c(p).route = v) },
    num(
      `${x}cpm`,
      (p) => c(p).funnel.cpm,
      (p, v) => void (c(p).funnel.cpm = v),
    ),
    num(
      `${x}f1`,
      (p) => c(p).funnel.impToInstall,
      (p, v) => void (c(p).funnel.impToInstall = v),
    ),
    num(
      `${x}f2`,
      (p) => c(p).funnel.installToTrial,
      (p, v) => void (c(p).funnel.installToTrial = v),
    ),
    num(
      `${x}f3`,
      (p) => c(p).funnel.trialToPaid,
      (p, v) => void (c(p).funnel.trialToPaid = v),
    ),
    num(
      `${x}mw`,
      (p) => c(p).mix.weekly,
      (p, v) => void (c(p).mix.weekly = v),
    ),
    num(
      `${x}mm`,
      (p) => c(p).mix.monthly,
      (p, v) => void (c(p).mix.monthly = v),
    ),
    num(
      `${x}ma`,
      (p) => c(p).mix.annual,
      (p, v) => void (c(p).mix.annual = v),
    ),
    num(
      `${x}pw`,
      (p) => c(p).prices.wPrice,
      (p, v) => void (c(p).prices.wPrice = v),
    ),
    num(
      `${x}pm`,
      (p) => c(p).prices.mPrice,
      (p, v) => void (c(p).prices.mPrice = v),
    ),
    num(
      `${x}pa`,
      (p) => c(p).prices.aPrice,
      (p, v) => void (c(p).prices.aPrice = v),
    ),
    num(
      `${x}w1`,
      (p) => c(p).retention.weekly.r1,
      (p, v) => void (c(p).retention.weekly.r1 = v),
    ),
    num(
      `${x}w2`,
      (p) => c(p).retention.weekly.r2,
      (p, v) => void (c(p).retention.weekly.r2 = v),
    ),
    num(
      `${x}wm`,
      (p) => c(p).retention.weekly.rMature,
      (p, v) => void (c(p).retention.weekly.rMature = v),
    ),
    num(
      `${x}o1`,
      (p) => c(p).retention.monthly.r1,
      (p, v) => void (c(p).retention.monthly.r1 = v),
    ),
    num(
      `${x}o2`,
      (p) => c(p).retention.monthly.r2,
      (p, v) => void (c(p).retention.monthly.r2 = v),
    ),
    num(
      `${x}om`,
      (p) => c(p).retention.monthly.rMature,
      (p, v) => void (c(p).retention.monthly.rMature = v),
    ),
    num(
      `${x}a1`,
      (p) => c(p).retention.annual.r1,
      (p, v) => void (c(p).retention.annual.r1 = v),
    ),
    num(
      `${x}a2`,
      (p) => c(p).retention.annual.r2,
      (p, v) => void (c(p).retention.annual.r2 = v),
    ),
    num(
      `${x}am`,
      (p) => c(p).retention.annual.rMature,
      (p, v) => void (c(p).retention.annual.rMature = v),
    ),
    num(
      `${x}tw`,
      (p) => c(p).trials.weekly,
      (p, v) => void (c(p).trials.weekly = v),
    ),
    num(
      `${x}tm`,
      (p) => c(p).trials.monthly,
      (p, v) => void (c(p).trials.monthly = v),
    ),
    num(
      `${x}ta`,
      (p) => c(p).trials.annual,
      (p, v) => void (c(p).trials.annual = v),
    ),
  ];
}

const ACC: Acc[] = [
  num(
    "fx",
    (p) => p.fx,
    (p, v) => void (p.fx = v),
  ),
  num(
    "goal",
    (p) => p.arrGoal,
    (p, v) => void (p.arrGoal = v),
  ),
  num(
    "wfee",
    (p) => p.routes.webFeePct,
    (p, v) => void (p.routes.webFeePct = v),
  ),
  num(
    "wfix",
    (p) => p.routes.webFixed,
    (p, v) => void (p.routes.webFixed = v),
  ),
  num(
    "wpay",
    (p) => p.routes.webPayoutDays,
    (p, v) => void (p.routes.webPayoutDays = v),
  ),
  num(
    "afl",
    (p) => p.routes.appFeeLow,
    (p, v) => void (p.routes.appFeeLow = v),
  ),
  num(
    "afh",
    (p) => p.routes.appFeeHigh,
    (p, v) => void (p.routes.appFeeHigh = v),
  ),
  num(
    "apay",
    (p) => p.routes.appPayoutDays,
    (p, v) => void (p.routes.appPayoutDays = v),
  ),
  num(
    "cash",
    (p) => p.capital.startCash,
    (p, v) => void (p.capital.startCash = v),
  ),
  num(
    "credit",
    (p) => p.capital.creditLimit,
    (p, v) => void (p.capital.creditLimit = v),
  ),
  num(
    "draw",
    (p) => p.capital.founderDraw,
    (p, v) => void (p.capital.founderDraw = v),
  ),
  num(
    "pb",
    (p) => p.marketing.paidBudget,
    (p, v) => void (p.marketing.paidBudget = v),
  ),
  num(
    "ob",
    (p) => p.marketing.organicBudget,
    (p, v) => void (p.marketing.organicBudget = v),
  ),
  num(
    "ramp",
    (p) => p.marketing.budgetRampPct,
    (p, v) => void (p.marketing.budgetRampPct = v),
  ),
  num(
    "infra",
    (p) => p.unit.infraPct,
    (p, v) => void (p.unit.infraPct = v),
  ),
  num(
    "rf",
    (p) => p.valuation.rfRate,
    (p, v) => void (p.valuation.rfRate = v),
  ),
  num(
    "erp",
    (p) => p.valuation.erp,
    (p, v) => void (p.valuation.erp = v),
  ),
  num(
    "beta",
    (p) => p.valuation.beta,
    (p, v) => void (p.valuation.beta = v),
  ),
  num(
    "tax",
    (p) => p.valuation.taxRate,
    (p, v) => void (p.valuation.taxRate = v),
  ),
  num(
    "term",
    (p) => p.valuation.termGrowth,
    (p, v) => void (p.valuation.termGrowth = v),
  ),
  ...channelAccessors(0),
  ...channelAccessors(1),
];

export function encodeParams(p: Params): string {
  const sp = new URLSearchParams();
  for (const a of ACC) {
    if (a.kind === "num") {
      const v = a.get(p);
      if (v !== a.get(DEFAULT_PARAMS) && Number.isFinite(v)) sp.set(a.k, String(v));
    } else {
      const v = a.get(p);
      if (v !== a.get(DEFAULT_PARAMS)) sp.set(a.k, v);
    }
  }
  return sp.toString();
}

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

// True if any numeric input is blank (NaN); the model pauses rather than
// computing on incomplete inputs.
export function hasBlankInputs(p: Params): boolean {
  return ACC.some((a) => a.kind === "num" && Number.isNaN(a.get(p)));
}
