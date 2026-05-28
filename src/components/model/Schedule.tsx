import { useMemo, useState } from "react";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import type { Grain, ScheduleRow } from "../../lib/schedule";
import { buildSchedule } from "../../lib/schedule";
import type { SimResult } from "../../lib/types";
import { Sec } from "../atoms";

// Read-only operating schedule. A Day/Week/Month grain toggle rebuckets the
// daily sim; daily grain produces 1600+ rows so the table body scrolls.

const GRAINS: ReadonlyArray<{ key: Grain; label: string }> = [
  { key: "D", label: "D" },
  { key: "W", label: "W" },
  { key: "M", label: "M" },
];

const COLS: ReadonlyArray<{ label: string; pick: (r: ScheduleRow) => number }> = [
  { label: "Recognised rev", pick: (r) => r.recRev },
  { label: "Billings", pick: (r) => r.billings },
  { label: "Ad spend", pick: (r) => r.adSpend },
  { label: "Fees", pick: (r) => r.fees },
  { label: "Distribution", pick: (r) => r.distribution },
  { label: "Cash", pick: (r) => r.cashEnd },
  { label: "Card", pick: (r) => r.cardEnd },
  { label: "Deferred", pick: (r) => r.deferredEnd },
  { label: "AR", pick: (r) => r.arEnd },
];

export function Schedule({ sim, cur, fx }: { sim: SimResult; cur: Currency; fx: number }) {
  const [open, setOpen] = useState(false);
  const [grain, setGrain] = useState<Grain>("M");
  const rows = useMemo(() => buildSchedule(sim, grain), [sim, grain]);

  return (
    <Sec title="Schedule" open={open} onToggle={() => setOpen((o) => !o)}>
      <div className="grain">
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
      <div className="stmt-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
        <table className="stmt">
          <thead>
            <tr>
              <th className="rowlabel">Period</th>
              {COLS.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                <td className="rowlabel">{r.label}</td>
                {COLS.map((c) => {
                  const v = c.pick(r);
                  return (
                    <td key={c.label} className={v < 0 ? "neg" : ""}>
                      {money(v, cur, fx)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sec>
  );
}
