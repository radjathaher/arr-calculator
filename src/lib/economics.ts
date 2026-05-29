import type { Channel, Routes } from "./types";
import { baseCAC } from "./saturation";
import { weeklyLifetime } from "./engine";

// Founder-facing per-channel economics: the cost ladder (CPI → cost/trial → CAC)
// and the LTV each plan is worth. A simplified contribution×lifetime LTV — the
// gauge a founder moves via better creatives (CVR) and a better product
// (retention). Prices are per channel.
export interface ChannelEcon {
  cpi: number; // cost per install
  costPerTrial: number;
  cac: number; // cost per paying customer
  gm: number; // gross margin for this channel's route (0..1)
  ltvW: number;
  ltvM: number;
  ltvA: number;
  blendedLtv: number;
  ltvCac: number;
}

export function channelEconomics(ch: Channel, routes: Routes, infraPct: number): ChannelEcon {
  const cac = baseCAC(ch);
  const cpi =
    ch.funnel.cpm > 0 && ch.funnel.impToInstall > 0
      ? ch.funnel.cpm / 1000 / (ch.funnel.impToInstall / 100)
      : 0;
  const costPerTrial = ch.funnel.installToTrial > 0 ? cpi / (ch.funnel.installToTrial / 100) : 0;

  const routeFee = (ch.route === "WEB" ? routes.webFeePct : routes.appFeeLow) / 100;
  const gm = Math.max(0, 1 - routeFee - infraPct / 100);

  const ltvW = weeklyLifetime(ch.retention.weekly) * ch.prices.wPrice * gm;
  const ltvM = weeklyLifetime(ch.retention.monthly) * ch.prices.mPrice * gm;
  const renew = Math.min(0.97, ch.retention.annualRenewal / 100);
  const annualYears = renew < 1 ? 1 / (1 - renew) : 2;
  const ltvA = annualYears * ch.prices.aPrice * gm;

  const mw = ch.mix.weekly / 100;
  const mm = ch.mix.monthly / 100;
  const ma = ch.mix.annual / 100;
  const blendedLtv = mw * ltvW + mm * ltvM + ma * ltvA;
  const ltvCac = cac > 0 ? blendedLtv / cac : 0;

  return { cpi, costPerTrial, cac, gm, ltvW, ltvM, ltvA, blendedLtv, ltvCac };
}
