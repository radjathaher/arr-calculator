import type { MonthSchedule, Params, RouteKind } from "./types";
import { DEFAULT_PARAMS } from "./defaults";

// Flat, URL-friendly codec for Params so scenarios round-trip through the
// querystring (shareable links). Only values that differ from the defaults are
// written, keeping URLs short. Month schedules encode as a base value plus a
// compact sparse-override string ("mi:val;mi:val").

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
      `${x}w3`,
      (p) => c(p).retention.weekly.r3,
      (p, v) => void (c(p).retention.weekly.r3 = v),
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
      `${x}o3`,
      (p) => c(p).retention.monthly.r3,
      (p, v) => void (c(p).retention.monthly.r3 = v),
    ),
    num(
      `${x}om`,
      (p) => c(p).retention.monthly.rMature,
      (p, v) => void (c(p).retention.monthly.rMature = v),
    ),
    num(
      `${x}ar`,
      (p) => c(p).retention.annualRenewal,
      (p, v) => void (c(p).retention.annualRenewal = v),
    ),
    num(
      `${x}sat`,
      (p) => c(p).satPoint,
      (p, v) => void (c(p).satPoint = v),
    ),
    num(
      `${x}slp`,
      (p) => c(p).satSlope,
      (p, v) => void (c(p).satSlope = v),
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
    "pw",
    (p) => p.plans.wPrice,
    (p, v) => void (p.plans.wPrice = v),
  ),
  num(
    "pm",
    (p) => p.plans.mPrice,
    (p, v) => void (p.plans.mPrice = v),
  ),
  num(
    "pa",
    (p) => p.plans.aPrice,
    (p, v) => void (p.plans.aPrice = v),
  ),
  num(
    "trial",
    (p) => p.plans.trialDays,
    (p, v) => void (p.plans.trialDays = v),
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
    "ap",
    (p) => p.capital.apDays,
    (p, v) => void (p.capital.apDays = v),
  ),
  num(
    "res",
    (p) => p.capital.reserve,
    (p, v) => void (p.capital.reserve = v),
  ),
  num(
    "paid",
    (p) => p.marketing.paidShare,
    (p, v) => void (p.marketing.paidShare = v),
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

function encodeOverrides(ov: Record<number, number>): string {
  return Object.keys(ov)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((k) => `${k}:${ov[k]}`)
    .join(";");
}

function decodeOverrides(raw: string): Record<number, number> {
  const out: Record<number, number> = {};
  for (const pair of raw.split(";")) {
    if (!pair) continue;
    const [k, v] = pair.split(":");
    const ki = Number.parseInt(k);
    const vf = Number.parseFloat(v);
    if (Number.isInteger(ki) && Number.isFinite(vf)) out[ki] = vf;
  }
  return out;
}

function encodeSched(
  sp: URLSearchParams,
  baseKey: string,
  ovKey: string,
  s: MonthSchedule,
  def: MonthSchedule,
): void {
  if (s.base !== def.base) sp.set(baseKey, String(s.base));
  const ov = encodeOverrides(s.overrides);
  if (ov) sp.set(ovKey, ov);
}

function decodeSched(
  sp: URLSearchParams,
  baseKey: string,
  ovKey: string,
  target: MonthSchedule,
): void {
  const b = sp.get(baseKey);
  if (b != null) {
    const v = Number.parseFloat(b);
    if (Number.isFinite(v)) target.base = v;
  }
  const ov = sp.get(ovKey);
  if (ov != null) target.overrides = decodeOverrides(ov);
}

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
  encodeSched(sp, "bud", "budo", p.marketing.budget, DEFAULT_PARAMS.marketing.budget);
  encodeSched(sp, "draw", "drawo", p.capital.draw, DEFAULT_PARAMS.capital.draw);
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
  decodeSched(sp, "bud", "budo", p.marketing.budget);
  decodeSched(sp, "draw", "drawo", p.capital.draw);
  return p;
}
