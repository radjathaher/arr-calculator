import type { Channel, Routes } from "../../types";
import { baseCAC } from "../acquisition/baseCac";
import { cpi } from "../acquisition/cpi";
import { costPerTrial } from "../acquisition/costPerTrial";
import { weeklyLifetime } from "../retention/weeklyLifetime";

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
  const cpiVal = cpi(ch.funnel);
  const costPerTrialVal = costPerTrial(ch.funnel);

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
  const weeklyRev =
    mw * ch.prices.wPrice + mm * ((ch.prices.mPrice * 12) / 52) + ma * (ch.prices.aPrice / 52);
  const weeklyContribution = weeklyRev * gm;
  const paybackWeeks = weeklyContribution > 0 ? cac / weeklyContribution : 0;

  return {
    cpi: cpiVal,
    costPerTrial: costPerTrialVal,
    cac,
    gm,
    ltvW,
    ltvM,
    ltvA,
    blendedLtv,
    ltvCac,
    paybackWeeks,
  };
}
