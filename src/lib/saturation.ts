import type { Channel } from "./types";

// Base customer-acquisition cost implied by a channel's funnel. Funnel
// conversions are stored as percentages (e.g. 0.8 means 0.8%):
//   CAC = CPM / (1000 * imp->install% * install->trial% * trial->paid%).
export function baseCAC(ch: Channel): number {
  const { cpm, impToInstall, installToTrial, trialToPaid } = ch.funnel;
  const paidPerImpression = (impToInstall / 100) * (installToTrial / 100) * (trialToPaid / 100);
  if (cpm <= 0 || paidPerImpression <= 0) return 0;
  return cpm / (1000 * paidPerImpression);
}
