import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Params } from "../../lib/types";
import { MAXDAYS, simulate } from "../../lib/engine";

interface Lever {
  label: string;
  days: number; // days shaved off reaching $1M (positive = faster)
}

// Days to $1M for a param set (MAXDAYS if never reached within the cap).
function daysTo1M(p: Params): number {
  const r = simulate(p);
  return r.sum.reached ? r.sum.D1M : MAXDAYS;
}

export function Tornado({ params }: { params: Params }) {
  const items = useMemo<Lever[]>(() => {
    const baseD = daysTo1M(params);
    const run = (mut: (p: Params) => void): number => {
      const p = structuredClone(params);
      mut(p);
      return baseD - daysTo1M(p);
    };
    const list: Lever[] = [
      { label: "Weekly price +10%", days: run((p) => (p.plans.wPrice *= 1.1)) },
      { label: "Annual price +10%", days: run((p) => (p.plans.aPrice *= 1.1)) },
      {
        label: "Paid annual mix +15",
        days: run((p) => {
          p.channels[0].mix.annual = Math.min(100, p.channels[0].mix.annual + 15);
        }),
      },
      {
        label: "Paid 1st-wk ret +10",
        days: run((p) => {
          p.channels[0].retention.weekly.r1 = Math.min(95, p.channels[0].retention.weekly.r1 + 10);
        }),
      },
      { label: "Organic CPM −20%", days: run((p) => (p.channels[1].funnel.cpm *= 0.8)) },
      { label: "Paid CPM −20%", days: run((p) => (p.channels[0].funnel.cpm *= 0.8)) },
      { label: "All paid (share 100)", days: run((p) => (p.marketing.paidShare = 100)) },
      { label: "All organic (share 0)", days: run((p) => (p.marketing.paidShare = 0)) },
      { label: "Budget +50%", days: run((p) => (p.marketing.monthlyBudget *= 1.5)) },
      { label: "Credit limit +50%", days: run((p) => (p.capital.creditLimit *= 1.5)) },
      { label: "Start cash +50%", days: run((p) => (p.capital.startCash *= 1.5)) },
      {
        label: "App payout −15d",
        days: run((p) => (p.routes.appPayoutDays = Math.max(1, p.routes.appPayoutDays - 15))),
      },
      { label: "Vendor terms +15d", days: run((p) => (p.capital.apDays += 15)) },
      {
        label: "Trial −2d",
        days: run((p) => (p.plans.trialDays = Math.max(0, p.plans.trialDays - 2))),
      },
    ];
    return list.sort((a, b) => Math.abs(b.days) - Math.abs(a.days));
  }, [params]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, items.length * 26)}>
      <BarChart data={items} layout="vertical" margin={{ top: 8, right: 30, left: 120, bottom: 4 }}>
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 9, fill: "var(--muted)" }}
          tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}d`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--ink)" }}
          width={116}
        />
        <Tooltip
          formatter={(v: number) => [
            `${v >= 0 ? "−" : "+"}${Math.abs(v)} days`,
            v >= 0 ? "faster" : "slower",
          ]}
        />
        <ReferenceLine x={0} stroke="var(--ink)" />
        <Bar dataKey="days" radius={[0, 3, 3, 0]}>
          {items.map((it, i) => (
            <Cell
              key={i}
              fill={it.days > 0 ? "var(--teal)" : it.days < 0 ? "var(--danger)" : "var(--muted)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
