import { useState } from "react";
import type { BalanceRow, CashFlowRow, IncomeRow, SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { Sec } from "../atoms";

// The three accrual financial statements, each its own collapsible section with
// an independent grain toggle. Income & Balance roll up to month/year; Cash flow
// adds day/week. The balance sheet is transposed (periods as columns) the way a
// real statement reads, with a final tie row proving Assets = Liab + Equity.

type IsGrain = "month" | "year";
type CfGrain = "day" | "week" | "month" | "year";

export function Statements({ sim, cur, fx }: { sim: SimResult; cur: Currency; fx: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [bsOpen, setBsOpen] = useState(false);
  const [cfOpen, setCfOpen] = useState(false);
  const [isGrain, setIsGrain] = useState<IsGrain>("month");
  const [bsGrain, setBsGrain] = useState<IsGrain>("month");
  const [cfGrain, setCfGrain] = useState<CfGrain>("month");

  const C = (n: number) => money(n, cur, fx);

  const incomeRows = isGrain === "month" ? sim.statements.income.monthly : sim.statements.income.annual;
  const balanceRows = bsGrain === "month" ? sim.statements.balance.monthly : sim.statements.balance.annual;
  const cashRows =
    cfGrain === "day"
      ? sim.cashflow.daily
      : cfGrain === "week"
        ? sim.cashflow.weekly
        : cfGrain === "month"
          ? sim.cashflow.monthly
          : sim.cashflow.annual;

  return (
    <>
      <Sec title="Income statement" open={isOpen} onToggle={() => setIsOpen((o) => !o)}>
        <Grains
          options={["month", "year"]}
          value={isGrain}
          onPick={(g) => setIsGrain(g as IsGrain)}
        />
        <IncomeTable rows={incomeRows} C={C} />
      </Sec>

      <Sec title="Balance sheet" open={bsOpen} onToggle={() => setBsOpen((o) => !o)}>
        <Grains
          options={["month", "year"]}
          value={bsGrain}
          onPick={(g) => setBsGrain(g as IsGrain)}
        />
        <BalanceTable rows={balanceRows} C={C} />
      </Sec>

      <Sec title="Cash flow" open={cfOpen} onToggle={() => setCfOpen((o) => !o)}>
        <Grains
          options={["day", "week", "month", "year"]}
          value={cfGrain}
          onPick={(g) => setCfGrain(g as CfGrain)}
        />
        <CashFlowTable rows={cashRows} C={C} />
      </Sec>
    </>
  );
}

// A small .seg-style toggle for the active grain.
function Grains({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (g: string) => void;
}) {
  return (
    <div className="seg st-grain">
      {options.map((o) => (
        <button key={o} className={value === o ? "on" : ""} onClick={() => onPick(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// ---- Income statement: periods as rows, line items as columns. ----
function IncomeTable({ rows, C }: { rows: IncomeRow[]; C: (n: number) => string }) {
  if (rows.length === 0) return <div className="cf-empty">No income rows yet.</div>;
  return (
    <div className="cf-scroll">
      <table className="cf-table">
        <thead>
          <tr>
            <th className="col-month">Period</th>
            <th>revenue</th>
            <th>platform fees</th>
            <th>infra</th>
            <th>gross profit</th>
            <th>marketing</th>
            <th>EBIT</th>
            <th>tax</th>
            <th>net income</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className="cf-row">
              <td className="col-month">{r.label}</td>
              <Num v={C(r.revenue)} />
              <Num v={C(-r.platformFees)} neg />
              <Num v={C(-r.infra)} neg />
              <Num v={C(r.grossProfit)} />
              <Num v={C(-r.marketing)} neg />
              <Num v={C(r.ebit)} tone={r.ebit < 0} />
              <Num v={C(-r.tax)} neg />
              <Num v={C(r.netIncome)} tone={r.netIncome < 0} strong />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Cash flow: periods as rows. Outflows shown negative + danger tint. ----
function CashFlowTable({ rows, C }: { rows: CashFlowRow[]; C: (n: number) => string }) {
  if (rows.length === 0) return <div className="cf-empty">No cash-flow rows yet.</div>;
  return (
    <div className="cf-scroll">
      <table className="cf-table">
        <thead>
          <tr>
            <th className="col-month">Period</th>
            <th>web in</th>
            <th>IAP in</th>
            <th>ad spend</th>
            <th>infra</th>
            <th>draw</th>
            <th>net change</th>
            <th>ending balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className="cf-row">
              <td className="col-month">{r.label}</td>
              <Num v={C(r.webIn)} />
              <Num v={C(r.iapIn)} />
              <Num v={C(-r.adSpend)} neg />
              <Num v={C(-r.infra)} neg />
              <Num v={C(-r.draw)} neg />
              <Num v={C(r.netChange)} tone={r.netChange < 0} />
              <Num v={C(r.endBal)} tone={r.endBal < 0} strong />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Balance sheet: transposed. Line items are rows, periods are columns. ----
function BalanceTable({ rows, C }: { rows: BalanceRow[]; C: (n: number) => string }) {
  if (rows.length === 0) return <div className="cf-empty">No balance rows yet.</div>;

  const head = (
    <thead>
      <tr>
        <th className="col-month">Line item</th>
        {rows.map((r) => (
          <th key={r.i}>{r.label}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="cf-scroll">
      <table className="cf-table bs-table">
        {head}
        <tbody>
          <BsGroup label="Assets" />
          <BsRow label="cash" rows={rows} pick={(r) => r.cash} C={C} />
          <BsRow label="receivable" rows={rows} pick={(r) => r.receivable} C={C} />
          <BsRow label="total assets" rows={rows} pick={(r) => r.totalAssets} C={C} total />

          <BsGroup label="Liabilities" />
          <BsRow label="deferred revenue" rows={rows} pick={(r) => r.deferredRevenue} C={C} />
          <BsRow label="credit drawn" rows={rows} pick={(r) => r.creditDrawn} C={C} />
          <BsRow label="accrued costs" rows={rows} pick={(r) => r.accruedCosts} C={C} />
          <BsRow label="total liabilities" rows={rows} pick={(r) => r.totalLiabilities} C={C} total />

          <BsGroup label="Equity" />
          <BsRow label="paid-in capital" rows={rows} pick={(r) => r.paidInCapital} C={C} />
          <BsRow label="retained earnings" rows={rows} pick={(r) => r.retainedEarnings} C={C} />
          <BsRow label="total equity" rows={rows} pick={(r) => r.totalEquity} C={C} total />

          <tr className="bs-tie">
            <td className="col-month">Assets − (Liab+Equity)</td>
            {rows.map((r) => (
              <td key={r.i} className={`num ${Math.abs(r.check) < 0.01 ? "tie-ok" : "neg"}`}>
                {C(r.check)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BsGroup({ label }: { label: string }) {
  return (
    <tr className="bs-group">
      <td className="col-month" colSpan={999}>
        {label}
      </td>
    </tr>
  );
}

function BsRow({
  label,
  rows,
  pick,
  C,
  total,
}: {
  label: string;
  rows: BalanceRow[];
  pick: (r: BalanceRow) => number;
  C: (n: number) => string;
  total?: boolean;
}) {
  return (
    <tr className={total ? "bs-row bs-total" : "bs-row"}>
      <td className="col-month">{label}</td>
      {rows.map((r) => (
        <td key={r.i} className="num">
          {C(pick(r))}
        </td>
      ))}
    </tr>
  );
}

// Right-aligned mono cell. `neg` forces the danger tint (outflows/expenses);
// `tone` tints by sign (net figures); `strong` weights the running balance.
function Num({
  v,
  neg,
  tone,
  strong,
}: {
  v: string;
  neg?: boolean;
  tone?: boolean;
  strong?: boolean;
}) {
  const cls = ["num", neg || tone ? "neg" : "", strong ? "strong" : ""].filter(Boolean).join(" ");
  return <td className={cls}>{v}</td>;
}
