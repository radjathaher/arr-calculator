import type { MonthSchedule } from "../../lib/types";
import { NMONTHS } from "../../lib/engine";
import { NI } from "../atoms";

// month index (0 = Jun 2026) -> { year, short month label }
function monthMeta(mi: number): { year: number; label: string } {
  const d = new Date(2026, 5 + mi, 1);
  return { year: d.getFullYear(), label: d.toLocaleString("en-US", { month: "short" }) };
}

const YEARS = (() => {
  const map = new Map<number, number[]>();
  for (let mi = 0; mi < NMONTHS; mi++) {
    const { year } = monthMeta(mi);
    const arr = map.get(year) ?? [];
    arr.push(mi);
    map.set(year, arr);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
})();

// Base value applied to every month + sparse per-month override cells.
// A blank cell falls back to the base; a filled cell overrides that month.
export function MonthGrid({
  label,
  schedule,
  onChange,
  step = 500,
}: {
  label: string;
  schedule: MonthSchedule;
  onChange: (s: MonthSchedule) => void;
  step?: number;
}) {
  const setCell = (mi: number, raw: string) => {
    const overrides = { ...schedule.overrides };
    if (raw === "") delete overrides[mi];
    else {
      const v = Number.parseFloat(raw);
      if (Number.isFinite(v)) overrides[mi] = v;
    }
    onChange({ ...schedule, overrides });
  };

  return (
    <div className="mgrid">
      <div className="mgrid-base">
        <NI
          label={`${label} — base $/mo`}
          value={schedule.base}
          step={step}
          width={90}
          onChange={(v) => onChange({ ...schedule, base: v })}
        />
        <span className="lblmono">blank cell → base · filled cell overrides that month</span>
      </div>
      {YEARS.map(([year, mis]) => (
        <div className="mgrid-year" key={year}>
          <span className="mgrid-year-label">{year}</span>
          <div className="mgrid-cells">
            {mis.map((mi) => {
              const has = schedule.overrides[mi] !== undefined;
              return (
                <label className="mgrid-cell" key={mi}>
                  <span>{monthMeta(mi).label}</span>
                  <input
                    className={`nospin${has ? " overridden" : ""}`}
                    type="number"
                    inputMode="decimal"
                    placeholder={String(schedule.base)}
                    value={has ? String(schedule.overrides[mi]) : ""}
                    onChange={(e) => setCell(mi, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
