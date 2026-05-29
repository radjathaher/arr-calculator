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
import { DAYS, NDAYS } from "../../lib/engine";

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
