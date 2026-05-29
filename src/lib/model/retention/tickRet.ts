import type { StepDown } from "../../types";

// Cumulative survival at tick k for a 3-point curve (percentages in): 1st
// renewal, 2nd renewal, then a flat mature rate from the 3rd renewal onward.
export function tickRet(sd: StepDown, k: number): number {
  if (k <= 0) return 1;
  let f = sd.r1 / 100;
  if (k === 1) return f;
  f *= sd.r2 / 100;
  if (k === 2) return f;
  return f * Math.pow(sd.rMature / 100, k - 2);
}
