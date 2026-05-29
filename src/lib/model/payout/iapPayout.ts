import { START } from "../calendar";

const DAYMS = 864e5;

// Apple pays the App Store / IAP balance as one monthly LUMP, not a daily
// trickle: earnings accrue across a whole Apple fiscal month and are paid
// `lagAfterClose` days after that month closes (Apple's legal max is "within 45
// days of the fiscal month end"; ~33 days is the observed norm). Apple's fiscal
// calendar: the year starts the last Sunday of September, every fiscal month
// ends on a Saturday, and quarters follow a 5-4-4 week pattern (anchor verified
// against Apple's published 2026 dates: FY2026 began Sun 28 Sep 2025). The rare
// 53-week fiscal year is not modelled — it drifts late-horizon dates by ≤1 week.
// Returns, for every earning day, the index its lump is collected (−1 if outside
// any generated fiscal month).
export function buildIapPayMap(len: number, lagAfterClose: number): Int32Array {
  const map = new Int32Array(len).fill(-1);
  const weeks = [5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4]; // weeks per fiscal month
  const lag = Math.round(lagAfterClose);
  let cursor = new Date(2025, 8, 28).getTime(); // last Sunday of Sep 2025 = FY26 anchor
  for (let m = 0; m < 12 * 9; m++) {
    const w = weeks[m % 12];
    const startIdx = Math.round((cursor - START.getTime()) / DAYMS);
    const closeIdx = startIdx + w * 7 - 1; // Saturday close
    const payIdx = closeIdx + lag;
    const lo = Math.max(0, startIdx);
    const hi = Math.min(len - 1, closeIdx);
    for (let d = lo; d <= hi; d++) map[d] = payIdx;
    cursor += w * 7 * DAYMS;
    if (startIdx > len) break;
  }
  return map;
}
