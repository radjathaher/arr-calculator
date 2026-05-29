import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { DAYS, NDAYS } from "../../lib/model";

// Round a value up to a clean axis bound: 1, 2, 2.5, or 5 times a power of ten.
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = 10 ** exp;
  const frac = v / base;
  const step = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return step * base;
}

// The single headline chart for the minimal cockpit view: ARR climbing toward $1M.
export function ArrChart({
  sim,
  goal,
  cur,
  fx,
}: {
  sim: SimResult;
  goal: number;
  cur: Currency;
  fx: number;
}) {
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < NDAYS; i++) {
      const d = DAYS[i];
      if (d.first && d.date.getMonth() % 6 === 0) out.push(i);
    }
    return out;
  }, []);

  // Round the axis up to "nice" evenly-spaced values so the ticks read
  // cleanly (e.g. 0 · 250k · 500k · ...) instead of recharts' raw data maxima.
  const { yMax, yTicks } = useMemo(() => {
    let hi = Number.isFinite(goal) ? goal : 0;
    for (const s of sim.series) if (s.arr > hi) hi = s.arr;
    const max = niceCeil(hi);
    const step = max / 4;
    const out: number[] = [];
    // Guard the step (finite, > 0) and cap the count so a degenerate domain can
    // never spin this loop into a multi-billion-element array (RangeError).
    if (Number.isFinite(step) && step > 0) {
      for (let v = 0; v <= max + 1 && out.length < 100; v += step) out.push(Math.round(v));
    }
    if (out.length === 0) out.push(0, Math.round(Number.isFinite(max) ? max : 0));
    return { yMax: max, yTicks: out };
  }, [sim, goal]);

  return (
    <div className="card">
      <h3>ARR &rarr; {money(goal, cur, fx)}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={sim.series} margin={{ top: 6, right: 10, left: 4, bottom: 2 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="i"
            ticks={ticks}
            tickFormatter={(i: number) =>
              DAYS[i]
                ? DAYS[i].date.toLocaleString("en-US", { month: "short", year: "2-digit" })
                : ""
            }
            tick={{ fontSize: 10, fill: "var(--muted)" }}
          />
          <YAxis
            domain={[0, yMax]}
            ticks={yTicks}
            tickFormatter={(v: number) => money(v, cur, fx)}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            width={48}
          />
          <Tooltip
            labelFormatter={(i: number) => (DAYS[i] ? dstr(DAYS[i].date) : "")}
            formatter={(v: number) => [money(v, cur, fx), "ARR"]}
          />
          <ReferenceLine
            y={goal}
            stroke="var(--gold)"
            strokeWidth={1.4}
            strokeDasharray="5 4"
            label={{
              value: money(goal, cur, fx),
              fill: "var(--gold)",
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
          <Line
            type="monotone"
            dataKey="arr"
            name="ARR"
            stroke="var(--ink)"
            strokeWidth={2.4}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
