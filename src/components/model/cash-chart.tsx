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
import { DAYS, NDAYS } from "../../lib/model";

// Round a magnitude up to a clean bound: 1, 2, 2.5, or 5 times a power of ten.
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = 10 ** exp;
  const frac = v / base;
  const step = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return step * base;
}

// A clean tick step that yields roughly four to six intervals across the span.
function niceStep(span: number): number {
  return niceCeil(span / 5) || 1;
}

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

  const { yMax, yMin, yTicks, zeroOff } = useMemo(() => {
    let hi = 0;
    let lo = -creditLimit;
    for (const s of sim.series) {
      if (s.net > hi) hi = s.net;
      if (s.net < lo) lo = s.net;
    }
    // Round each side out to a clean bound and derive evenly-spaced ticks that
    // always land on zero, so the baseline and tick labels read cleanly.
    const hiN = niceCeil(hi);
    const loN = -niceCeil(-lo);
    const step = niceStep(hiN - loN);
    const out: number[] = [];
    // Guard the step (finite, > 0) and cap the count so a degenerate domain can
    // never spin these loops into a multi-billion-element array (RangeError).
    if (Number.isFinite(step) && step > 0) {
      for (let v = 0; v <= hiN + 1 && out.length < 100; v += step) out.push(Math.round(v));
      for (let v = -step; v >= loN - 1 && out.length < 200; v -= step) out.unshift(Math.round(v));
    }
    if (out.length === 0) {
      out.push(Math.round(Number.isFinite(loN) ? loN : 0), 0, Math.round(Number.isFinite(hiN) ? hiN : 0));
    }
    const span = hiN - loN || 1;
    return { yMax: hiN, yMin: loN, yTicks: out, zeroOff: hiN / span };
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
            ticks={yTicks}
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
