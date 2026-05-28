import type { SimResult } from "./types";
import { DAYS, MONTH_LABELS, NDAYS } from "./engine";

export type Grain = "D" | "W" | "M";

export interface ScheduleRow {
  label: string;
  recRev: number; // recognised revenue (flow)
  billings: number; // gross billings (flow)
  adSpend: number; // marketing spend (flow)
  fees: number; // payment/platform fees (flow)
  distribution: number; // founder draw (flow)
  cashEnd: number; // end-of-period balance
  cardEnd: number;
  deferredEnd: number;
  arEnd: number;
  arrEnd: number;
}

// Bucket the daily series into Day / Week / Month rows. Flows are summed within
// the bucket; balances are taken at the last day of the bucket. Sum-preserving:
// the total of any flow column equals the daily total regardless of grain.
export function buildSchedule(sim: SimResult, grain: Grain): ScheduleRow[] {
  const d = sim.daily;
  const bucketOf = (i: number): number =>
    grain === "M" ? DAYS[i].mi : grain === "W" ? Math.floor(i / 7) : i;
  const labelOf = (i: number): string => {
    if (grain === "M") return MONTH_LABELS[DAYS[i].mi];
    if (grain === "W")
      return "wk " + DAYS[i].date.toLocaleString("en-US", { month: "short", day: "numeric" });
    return DAYS[i].date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const rows: ScheduleRow[] = [];
  let cur = -1;
  let row: ScheduleRow | null = null;
  for (let i = 0; i < NDAYS; i++) {
    const b = bucketOf(i);
    if (b !== cur) {
      if (row) rows.push(row);
      cur = b;
      row = {
        label: labelOf(i),
        recRev: 0,
        billings: 0,
        adSpend: 0,
        fees: 0,
        distribution: 0,
        cashEnd: 0,
        cardEnd: 0,
        deferredEnd: 0,
        arEnd: 0,
        arrEnd: 0,
      };
    }
    if (!row) continue;
    row.recRev += d.recRev[i];
    row.billings += d.billings[i];
    row.adSpend += d.adSpend[i];
    row.fees += d.fees[i];
    row.distribution += d.distribution[i];
    // balances: overwrite each day so the last day of the bucket wins
    row.cashEnd = d.cash[i];
    row.cardEnd = d.cardDebt[i];
    row.deferredEnd = d.deferred[i];
    row.arEnd = d.processorAR[i];
    row.arrEnd = d.arr[i];
  }
  if (row) rows.push(row);
  return rows;
}
