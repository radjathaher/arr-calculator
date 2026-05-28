import type { Channel } from "./types";

// Base customer-acquisition cost implied by a channel's funnel, before any
// saturation effect. Funnel conversions are stored as percentages (e.g. 0.8
// means 0.8%), matching the in-app inputs:
//   CAC = CPM / (1000 * imp->install% * install->trial% * trial->paid%).
export function baseCAC(ch: Channel): number {
  const { cpm, impToInstall, installToTrial, trialToPaid } = ch.funnel;
  const paidPerImpression = (impToInstall / 100) * (installToTrial / 100) * (trialToPaid / 100);
  if (cpm <= 0 || paidPerImpression <= 0) return 0;
  return cpm / (1000 * paidPerImpression);
}

// Customers acquired for a given daily spend, with diminishing returns.
//
// Marginal CAC is flat (= base) up to satPoint, then climbs as a power law:
//   CAC(s) = base * (s / satPoint)^slope   for s > satPoint
// Customers = integral of ds / CAC(s) from 0 to spend. The flat region
// contributes spend/base linearly; the climbing region is integrated in
// closed form. This makes the *effective* CAC rise smoothly once a channel
// is pushed past its saturation point — finite attention, finite creators.
export function customersFromSpend(
  spend: number,
  base: number,
  satPoint: number,
  slope: number,
): number {
  if (spend <= 0 || base <= 0) return 0;
  if (satPoint <= 0 || slope <= 0 || spend <= satPoint) return spend / base;

  const flat = satPoint / base;
  let climb: number;
  if (Math.abs(slope - 1) < 1e-9) {
    climb = (satPoint / base) * Math.log(spend / satPoint);
  } else {
    const p = 1 - slope;
    climb = ((Math.pow(satPoint, slope) / base) * (Math.pow(spend, p) - Math.pow(satPoint, p))) / p;
  }
  return flat + climb;
}

// Effective (blended) CAC actually paid at a given daily spend level.
export function effectiveCAC(ch: Channel, dailySpend: number): number {
  const base = baseCAC(ch);
  const cust = customersFromSpend(dailySpend, base, ch.satPoint, ch.satSlope);
  return cust > 0 ? dailySpend / cust : base;
}
