import type { StepDown } from "../../types";
import { tickRet } from "./tickRet";

// Present-value analogue of weeklyLifetime: the sum of survival fractions over a
// cohort's life, each charge discounted at WACC by its timing. periodDays is the
// gap between charges (7 weekly, 30 monthly, 365 annual). Multiplying by
// price × gross-margin gives the discounted lifetime contribution per customer.
export function discountedLifetime(
  sd: StepDown,
  periodDays: number,
  wacc: number,
  cap = 520,
): number {
  let sum = 0;
  for (let k = 0; k < cap; k++) {
    const r = tickRet(sd, k);
    if (r < 1e-6) break;
    sum += r / (1 + wacc) ** ((k * periodDays) / 365);
  }
  return sum;
}
