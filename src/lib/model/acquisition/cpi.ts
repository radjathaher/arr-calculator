import type { Funnel } from "../../types";

// Cost per install implied by a channel's funnel: CPM spread over the
// impression-to-install conversion. Funnel conversions are percentages.
export function cpi(funnel: Funnel): number {
  return funnel.cpm > 0 && funnel.impToInstall > 0
    ? funnel.cpm / 1000 / (funnel.impToInstall / 100)
    : 0;
}
