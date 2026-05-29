import type { Channel, Params, Routes } from "./types";
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
  paybackWeeks: number; // weeks of net margin to repay CAC
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
  // Annual lifetime is the sum of yearly survival on the same 3-point curve.
  const ltvA = weeklyLifetime(ch.retention.annual) * ch.prices.aPrice * gm;

  const mw = ch.mix.weekly / 100;
  const mm = ch.mix.monthly / 100;
  const ma = ch.mix.annual / 100;
  const blendedLtv = mw * ltvW + mm * ltvM + ma * ltvA;
  const ltvCac = cac > 0 ? blendedLtv / cac : 0;

  // Average weekly revenue per customer across the plan mix, then net of margin:
  // how many weeks of contribution it takes to earn the CAC back.
  const weeklyRev = mw * ch.prices.wPrice + mm * ((ch.prices.mPrice * 12) / 52) + ma * (ch.prices.aPrice / 52);
  const weeklyContribution = weeklyRev * gm;
  const paybackWeeks = weeklyContribution > 0 ? cac / weeklyContribution : 0;

  return { cpi, costPerTrial, cac, gm, ltvW, ltvM, ltvA, blendedLtv, ltvCac, paybackWeeks };
}

export interface BlendedEcon {
  cac: number;
  ltv: number;
  ltvCac: number;
  paybackWeeks: number;
}

// Spend-weighted economics across both channels — the headline "is the engine
// healthy" numbers. Weighted by how many customers each budget actually buys
// (true blend = total spend ÷ total customers), not a naive average of rates.
export function blendedEconomics(p: Params): BlendedEcon {
  const e0 = channelEconomics(p.channels[0], p.routes, p.unit.infraPct);
  const e1 = channelEconomics(p.channels[1], p.routes, p.unit.infraPct);
  const sp0 = Math.max(0, p.marketing.paidBudget) || 0;
  const sp1 = Math.max(0, p.marketing.organicBudget) || 0;
  const c0 = e0.cac > 0 ? sp0 / e0.cac : 0; // customers from each channel
  const c1 = e1.cac > 0 ? sp1 / e1.cac : 0;
  const cust = c0 + c1;
  if (cust <= 0) return { cac: 0, ltv: 0, ltvCac: 0, paybackWeeks: 0 };
  const cac = (sp0 + sp1) / cust;
  const ltv = (c0 * e0.blendedLtv + c1 * e1.blendedLtv) / cust;
  const paybackWeeks = (c0 * e0.paybackWeeks + c1 * e1.paybackWeeks) / cust;
  return { cac, ltv, ltvCac: cac > 0 ? ltv / cac : 0, paybackWeeks };
}
