import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import type { Statements } from "../../lib/statements";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { DAYS, NDAYS } from "../../lib/engine";
import { buildSchedule } from "../../lib/schedule";

interface DayTip {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function DailyTip({
  active,
  payload,
  label,
  cur,
  fx,
}: {
  active?: boolean;
  payload?: DayTip[];
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
  sim,
  st,
  cur,
  fx,
}: {
  sim: SimResult;
  st: Statements;
  cur: Currency;
  fx: number;
}) {
  const fmtY = (v: number) => money(v, cur, fx);

  const dayTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < NDAYS; i++) {
      const d = DAYS[i];
      if (d.first && d.date.getMonth() % 6 === 0) out.push(i);
    }
    return out;
  }, []);
  const fmtDayX = (i: number) =>
    DAYS[i] ? DAYS[i].date.toLocaleString("en-US", { month: "short", year: "2-digit" }) : "";

  const monthly = useMemo(() => {
    const sched = buildSchedule(sim, "M");
    let cum = 0;
    return st.labels.map((label, i) => {
      cum += st.dcf[i].pv;
      return {
        label,
        revenue: st.is[i].revenue,
        ebitda: st.is[i].ebitda,
        ni: st.is[i].netIncome,
        ufcf: st.dcf[i].ufcf,
        cumPv: cum,
        billings: sched[i]?.billings ?? 0,
        deferred: sched[i]?.deferredEnd ?? 0,
      };
    });
  }, [sim, st]);

  const monthTip = (v: number) => money(v, cur, fx);

  return (
    <div className="charts">
      <div className="card">
        <h3>Cash &amp; card float</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={sim.series} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="i"
              ticks={dayTicks}
              tickFormatter={fmtDayX}
              tick={{ fontSize: 9, fill: "var(--muted)" }}
            />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip content={<DailyTip cur={cur} fx={fx} />} />
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
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={sim.series} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="i"
              ticks={dayTicks}
              tickFormatter={fmtDayX}
              tick={{ fontSize: 9, fill: "var(--muted)" }}
            />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip content={<DailyTip cur={cur} fx={fx} />} />
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

      <div className="card">
        <h3>Monthly P&amp;L &rarr; net income</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" interval={5} tick={{ fontSize: 9, fill: "var(--muted)" }} />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip formatter={monthTip} />
            <ReferenceLine y={0} stroke="var(--ink)" />
            <Bar dataKey="revenue" name="Revenue" fill="var(--teal)" fillOpacity={0.85} />
            <Bar dataKey="ebitda" name="EBITDA" fill="var(--green)" fillOpacity={0.7} />
            <Line
              type="monotone"
              dataKey="ni"
              name="Net income"
              stroke="var(--orange)"
              strokeWidth={1.6}
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Recognised revenue · billings · deferred</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthly} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" interval={5} tick={{ fontSize: 9, fill: "var(--muted)" }} />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip formatter={monthTip} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Recognised"
              stroke="var(--teal)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="billings"
              name="Billings"
              stroke="var(--orange)"
              strokeWidth={1.4}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="deferred"
              name="Deferred bal"
              stroke="var(--gold)"
              strokeWidth={1.4}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Cumulative PV(FCF) &rarr; enterprise value</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthly} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" interval={5} tick={{ fontSize: 9, fill: "var(--muted)" }} />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 9, fill: "var(--muted)" }} width={44} />
            <Tooltip formatter={monthTip} />
            <ReferenceLine
              y={st.ev}
              stroke="var(--gold)"
              strokeWidth={1.2}
              strokeDasharray="5 4"
              label={{ value: "EV", fill: "var(--gold)", fontSize: 9, position: "insideTopRight" }}
            />
            <Area
              type="monotone"
              dataKey="cumPv"
              name="Cum. PV(FCF)"
              stroke="var(--teal)"
              strokeWidth={2}
              fill="url(#pvGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
