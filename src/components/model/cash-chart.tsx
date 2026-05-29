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

// One net-balance line: cash minus credit drawn. Green above zero (real cash),
// red below (on credit), with a dashed floor at −credit limit = insolvent below.
export function CashChart({
  sim,
  creditLimit,
  cur,
  fx,
}: {
  sim: SimResult;
  creditLimit: number;
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

  const { yMax, yMin, zeroOff } = useMemo(() => {
    let hi = 0;
    let lo = -creditLimit;
    for (const s of sim.series) {
      if (s.net > hi) hi = s.net;
      if (s.net < lo) lo = s.net;
    }
    const span = hi - lo || 1;
    return { yMax: hi, yMin: lo, zeroOff: hi / span };
  }, [sim, creditLimit]);

  return (
    <div className="card">
      <h3>Net cash &rarr; credit floor</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={sim.series} margin={{ top: 6, right: 10, left: 4, bottom: 2 }}>
          <defs>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="var(--teal)" stopOpacity={0.5} />
              <stop offset={zeroOff} stopColor="var(--teal)" stopOpacity={0.08} />
              <stop offset={zeroOff} stopColor="var(--danger)" stopOpacity={0.08} />
              <stop offset={1} stopColor="var(--danger)" stopOpacity={0.42} />
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
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => money(v, cur, fx)}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            width={48}
          />
          <Tooltip
            labelFormatter={(i: number) => (DAYS[i] ? dstr(DAYS[i].date) : "")}
            formatter={(v: number) => [money(v, cur, fx), "Net cash"]}
          />
          <ReferenceLine y={0} stroke="var(--ink)" />
          <ReferenceLine
            y={-creditLimit}
            stroke="var(--danger)"
            strokeWidth={1.2}
            strokeDasharray="5 4"
            label={{
              value: "insolvent",
              fill: "var(--danger)",
              fontSize: 9,
              position: "insideBottomRight",
            }}
          />
          <Area
            type="monotone"
            dataKey="net"
            name="Net cash"
            stroke="var(--ink)"
            strokeWidth={2}
            fill="url(#netGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
