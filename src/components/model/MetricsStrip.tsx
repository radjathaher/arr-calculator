import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import type { Statements } from "../../lib/statements";

// Read-only KPI strip: four labeled groups of compact metric cards summarising
// margins/valuation, unit economics, working-capital/cash, and growth.

const pct = (frac: number): string => (Number.isFinite(frac) ? `${(frac * 100).toFixed(1)}%` : "—");
const mult = (n: number): string => (Number.isFinite(n) ? `${n.toFixed(1)}×` : "—");
const days = (n: number): string => (Number.isFinite(n) ? `${n.toFixed(0)}d` : "—");

interface Cell {
  label: string;
  value: string;
}

function Group({ title, cells }: { title: string; cells: Cell[] }) {
  return (
    <>
      <div className="kpi-group-label">{title}</div>
      <div className="thins">
        {cells.map((c) => (
          <div key={c.label} className="thin">
            <span>{c.label}</span>
            <b>{c.value}</b>
          </div>
        ))}
      </div>
    </>
  );
}

export function MetricsStrip({ st, cur, fx }: { st: Statements; cur: Currency; fx: number }) {
  const k = st.kpis;
  const margins: Cell[] = [
    { label: "Gross margin", value: pct(k.grossMargin) },
    { label: "EBITDA margin", value: pct(k.ebitdaMargin) },
    { label: "Net margin", value: pct(k.netMargin) },
    { label: "Enterprise value", value: money(k.ev, cur, fx) },
    { label: "Equity value", value: money(k.equityValue, cur, fx) },
    { label: "Implied ARR ×", value: mult(k.impliedMultiple) },
    { label: "WACC", value: pct(k.wacc) },
  ];
  const unit: Cell[] = [
    { label: "CAC", value: money(k.cac, cur, fx) },
    { label: "LTV", value: money(k.ltv, cur, fx) },
    { label: "LTV:CAC", value: mult(k.ltvCac) },
    {
      label: "Payback",
      value: Number.isFinite(k.paybackMonths) ? `${k.paybackMonths.toFixed(1)} mo` : "—",
    },
  ];
  const wc: Cell[] = [
    { label: "DSO", value: days(k.dso) },
    { label: "DPO", value: days(k.dpo) },
    { label: "Deferred bal.", value: money(k.deferredBal, cur, fx) },
    { label: "Burn", value: `${money(k.burn, cur, fx)}/mo` },
    {
      label: "Runway",
      value: k.runwayMonths === Infinity ? "∞" : `${k.runwayMonths.toFixed(0)} mo`,
    },
    { label: "Peak funding", value: money(k.peakFunding, cur, fx) },
  ];
  const growth: Cell[] = [
    { label: "ARR", value: money(k.endARR, cur, fx) },
    { label: "MRR", value: money(k.mrr, cur, fx) },
    { label: "MoM growth", value: pct(k.momGrowth) },
    { label: "Rule of 40", value: Number.isFinite(k.ruleOf40) ? `${k.ruleOf40.toFixed(0)}%` : "—" },
    { label: "FCF margin", value: pct(k.fcfMargin) },
    { label: "Months to $1M", value: k.monthsTo1M < 0 ? "—" : k.monthsTo1M.toFixed(1) },
  ];

  return (
    <div className="kpi-strip">
      <Group title="Margins & valuation" cells={margins} />
      <Group title="Unit economics" cells={unit} />
      <Group title="Working capital & cash" cells={wc} />
      <Group title="Growth & efficiency" cells={growth} />
    </div>
  );
}
