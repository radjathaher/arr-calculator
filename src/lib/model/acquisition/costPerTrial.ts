import type { Funnel } from "../../types";
import { cpi } from "./cpi";

// Cost per trial: the cost per install carried through the install-to-trial
// conversion. Funnel conversions are percentages.
export function costPerTrial(funnel: Funnel): number {
  return funnel.installToTrial > 0 ? cpi(funnel) / (funnel.installToTrial / 100) : 0;
}
