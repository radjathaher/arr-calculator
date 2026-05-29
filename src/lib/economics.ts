import type { Channel, Plans, Routes } from "./types";
import { baseCAC } from "./saturation";
import { weeklyLifetime } from "./engine";

// Founder-facing per-channel economics: what an install costs, what a customer
// is worth on each plan, and whether it pays back. A simplified
// contribution×lifetime LTV (not the full cohort-discounted figure) — the gauge
// a founder moves indirectly via better creatives (CVR) and a better product
// (retention).
export interface ChannelEcon {
  cpi: number; // cost per install
  cac: number; // cost per paying customer (funnel-derived)
  gm: number; // gross margin for this channel's route (0..1)
  ltvW: number;
  ltvM: number;
  ltvA: number;
  blendedLtv: number; // mix-weighted
  ltvCac: number;
}

export function channelEconomics(
  ch: Channel,
  plans: Plans,
  routes: Routes,
  infraPct: number,
): ChannelEcon {
  const cac = baseCAC(ch);
  const cpi =
    ch.funnel.cpm > 0 && ch.funnel.impToInstall > 0
      ? ch.funnel.cpm / 1000 / (ch.funnel.impToInstall / 100)
      : 0;

  const routeFee = (ch.route === "WEB" ? routes.webFeePct : routes.appFeeLow) / 100;
  const gm = Math.max(0, 1 - routeFee - infraPct / 100);

  const ltvW = weeklyLifetime(ch.retention.weekly) * plans.wPrice * gm;
  const ltvM = weeklyLifetime(ch.retention.monthly) * plans.mPrice * gm;
  const renew = Math.min(0.97, ch.retention.annualRenewal / 100);
  const annualYears = renew < 1 ? 1 / (1 - renew) : 2;
  const ltvA = annualYears * plans.aPrice * gm;

  const mw = ch.mix.weekly / 100;
  const mm = ch.mix.monthly / 100;
  const ma = ch.mix.annual / 100;
  const blendedLtv = mw * ltvW + mm * ltvM + ma * ltvA;
  const ltvCac = cac > 0 ? blendedLtv / cac : 0;

  return { cpi, cac, gm, ltvW, ltvM, ltvA, blendedLtv, ltvCac };
}
