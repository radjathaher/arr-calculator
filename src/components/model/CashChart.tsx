import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

interface TipRow {
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
  payload?: TipRow[];
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

// Cash on hand (above the line) and card float (below) over the run.
export function CashChart({ sim, cur, fx }: { sim: SimResult; cur: Currency; fx: number }) {
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
      <h3>Cash &amp; card float</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={sim.series} margin={{ top: 6, right: 10, left: 4, bottom: 2 }}>
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
  );
}
