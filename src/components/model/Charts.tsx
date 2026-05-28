import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { DAYS } from "../../lib/engine";

interface TipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function Tip({
  active,
  payload,
  label,
  cur,
  fx,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: number;
  cur: Currency;
  fx: number;
}) {
  if (!active || !payload?.length || label == null) return null;
  const d = DAYS[label];
  return (
    <div className="tt">
      <div className="tt-h">{d ? dstr(d.date) : ""}</div>
      {payload.map((p, i) => (
        <div key={i} className="tt-r">
          <span style={{ color: p.color }}>{p.name}</span>
          <b>{money(p.dataKey === "card" ? -p.value : p.value, cur, fx)}</b>
        </div>
      ))}
    </div>
  );
}

export function Charts({
  series,
  lastDay,
  cur,
  fx,
}: {
  series: SeriesPoint[];
  lastDay: number;
  cur: Currency;
  fx: number;
}) {
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= lastDay; i++) {
      const d = DAYS[i];
      if (d.first && d.date.getMonth() % 3 === 0) out.push(i);
    }
    return out;
  }, [lastDay]);
  const fmtX = (i: number) =>
    DAYS[i] ? DAYS[i].date.toLocaleString("en-US", { month: "short", year: "2-digit" }) : "";
  const fmtY = (v: number) => money(v, cur, fx);

  return (
    <div className="charts">
      <div className="card">
        <h3>Cash &amp; card float</h3>
        <ResponsiveContainer width="100%" height={188}>
          <AreaChart data={series} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="i"
              ticks={ticks}
              tickFormatter={fmtX}
              tick={{ fontSize: 9, fill: "var(--muted)" }}
            />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip content={<Tip cur={cur} fx={fx} />} />
            <ReferenceLine y={0} stroke="var(--ink)" />
            <Area
              type="monotone"
              dataKey="cash"
              name="Cash"
              stroke="var(--teal)"
              strokeWidth={2}
              fill="url(#cashGrad)"
            />
            <Area
              type="monotone"
              dataKey="card"
              name="Card"
              stroke="var(--orange)"
              strokeWidth={1.3}
              fill="var(--orange)"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>ARR &rarr; $1M</h3>
        <ResponsiveContainer width="100%" height={188}>
          <LineChart data={series} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="i"
              ticks={ticks}
              tickFormatter={fmtX}
              tick={{ fontSize: 9, fill: "var(--muted)" }}
            />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip content={<Tip cur={cur} fx={fx} />} />
            <ReferenceLine
              y={1e6}
              stroke="var(--gold)"
              strokeWidth={1.3}
              strokeDasharray="5 4"
              label={{ value: "$1M", fill: "var(--gold)", fontSize: 9, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="arr"
              name="ARR"
              stroke="var(--ink)"
              strokeWidth={2.1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
