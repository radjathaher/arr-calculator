import type { StepDown } from "../../types";
import { tickRet } from "./tickRet";

// Total "billing ticks" a cohort pays over its life (lifetime in weeks/months).
export function weeklyLifetime(sd: StepDown, cap = 520): number {
  let sum = 0;
  for (let k = 0; k < cap; k++) {
    const r = tickRet(sd, k);
    if (r < 1e-6) break;
    sum += r;
  }
  return sum;
}
