import type { CashFlowRow } from "../../types";
import { dstr } from "../../format";

export type Grain = "week" | "month" | "year";

function keyOf(r: CashFlowRow, grain: Grain): string {
  if (grain === "week") return String(Math.floor(r.i / 7));
  if (grain === "month") return `${r.date.getFullYear()}-${r.date.getMonth()}`;
  return String(r.date.getFullYear());
}

function labelOf(r: CashFlowRow, grain: Grain): string {
  if (grain === "week") return `wk ${dstr(r.date)}`;
  if (grain === "month") return r.date.toLocaleString("en-US", { month: "short", year: "2-digit" });
  return String(r.date.getFullYear());
}

// Roll daily cash-flow rows up to a coarser grain: flows are summed, the ending
// balance is the last day's balance in the bucket (a point-in-time, not a sum).
export function rollupCashFlow(daily: CashFlowRow[], grain: Grain): CashFlowRow[] {
  const out: CashFlowRow[] = [];
  let cur: CashFlowRow | null = null;
  let key = "";
  for (const r of daily) {
    const k = keyOf(r, grain);
    if (k !== key) {
      cur = {
        i: r.i,
        date: r.date,
        label: labelOf(r, grain),
        webIn: 0,
        iapIn: 0,
        adSpend: 0,
        infra: 0,
        draw: 0,
        netChange: 0,
        endBal: 0,
      };
      out.push(cur);
      key = k;
    }
    if (cur) {
      cur.webIn += r.webIn;
      cur.iapIn += r.iapIn;
      cur.adSpend += r.adSpend;
      cur.infra += r.infra;
      cur.draw += r.draw;
      cur.netChange += r.netChange;
      cur.endBal = r.endBal;
    }
  }
  return out;
}
