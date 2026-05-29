import { useState } from "react";
import type { CohortRow, SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { intf, money } from "../../lib/format";
import { Sec } from "../atoms";

// Acquisition cohorts: customers grouped by time-slice × channel × plan, with
// the customer-based valuation (CBCV) of each cohort — the discounted present
// value of its future contribution. Its own grain toggle (day/week/month/year)
// re-slices the same simulation. Rows are grouped visually by time-slice: the
// time label shows only on the first row of each slice and is blank thereafter,
// the way a grouped financial table reads.

type Grain = "day" | "week" | "month" | "year";

const GRAINS: { key: Grain; label: string }[] = [
  { key: "day", label: "day" },
  { key: "week", label: "week" },
  { key: "month", label: "month" },
  { key: "year", label: "year" },
];

function pick(sim: SimResult, grain: Grain): CohortRow[] {
  switch (grain) {
    case "day":
      return sim.cohorts.daily;
    case "week":
      return sim.cohorts.weekly;
    case "month":
      return sim.cohorts.monthly;
    case "year":
      return sim.cohorts.annual;
  }
}

export function Cohorts({ sim, cur, fx }: { sim: SimResult; cur: Currency; fx: number }) {
  const [open, setOpen] = useState(false);
  const [grain, setGrain] = useState<Grain>("month");

  const C = (n: number) => money(n, cur, fx);
  const rows = pick(sim, grain);

  return (
    <Sec
      title="Cohorts — acquisition × channel × plan"
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      <div className="seg st-grain">
        {GRAINS.map((g) => (
          <button
            key={g.key}
            className={grain === g.key ? "on" : ""}
            onClick={() => setGrain(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <CohortTable rows={rows} C={C} />
    </Sec>
  );
}

// One row per channel×plan within a time-slice. The slice label is rendered on
// the first row of the slice only; continuation rows leave the cell blank so the
// eye reads grouped slices. A footer sums CBCV across every displayed row.
function CohortTable({ rows, C }: { rows: CohortRow[]; C: (n: number) => string }) {
  if (rows.length === 0) return <div className="cf-empty">No cohorts yet.</div>;

  const totalCbcv = rows.reduce((s, r) => s + r.cbcv, 0);

  return (
    <div className="cf-scroll">
      <table className="cf-table">
        <thead>
          <tr>
            <th className="col-month">Time</th>
            <th className="col-month">channel</th>
            <th className="col-month">plan</th>
            <th>customers</th>
            <th>CAC</th>
            <th>infra</th>
            <th>LTV</th>
            <th>CBCV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const firstOfSlice = idx === 0 || rows[idx - 1].label !== r.label;
            return (
              <tr key={`${r.i}-${r.channel}-${r.plan}`} className="cf-row">
                <td className={`col-month${firstOfSlice ? " coh-slice" : ""}`}>
                  {firstOfSlice ? r.label : ""}
                </td>
                <td className="col-month">{r.channel}</td>
                <td className="col-month">{r.plan}</td>
                <td className="num">{intf(r.customers)}</td>
                <td className="num">{C(r.cac)}</td>
                <td className="num neg">{C(-r.infra)}</td>
                <td className="num">{C(r.ltv)}</td>
                <td className="num strong">{C(r.cbcv)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="coh-total">
            <td className="col-month" colSpan={7}>
              Σ CBCV — customer-based valuation
            </td>
            <td className="num strong">{C(totalCbcv)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
