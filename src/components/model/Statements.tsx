import { useState } from "react";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import type { MonthBS, MonthCFS, MonthIS, Statements as Stmts } from "../../lib/statements";
import { Sec } from "../atoms";

// Read-only three-statement viewer. Each statement is a horizontally scrolling
// table with a sticky row-label column and sticky header row, one column per
// simulated month.

type RowKind = "" | "total" | "sub";

interface Line<T> {
  label: string;
  pick: (m: T) => number;
  kind?: RowKind;
}

function StmtTable<T>({
  labels,
  rows,
  lines,
  cur,
  fx,
}: {
  labels: string[];
  rows: T[];
  lines: ReadonlyArray<Line<T> | "spacer">;
  cur: Currency;
  fx: number;
}) {
  return (
    <div className="stmt-wrap">
      <table className="stmt">
        <thead>
          <tr>
            <th className="rowlabel">$</th>
            {labels.map((l, i) => (
              <th key={i}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, li) => {
            if (line === "spacer") {
              return (
                <tr key={`sp${li}`} className="spacer">
                  <td />
                </tr>
              );
            }
            return (
              <tr key={line.label} className={line.kind ?? ""}>
                <td className="rowlabel">{line.label}</td>
                {rows.map((m, i) => {
                  const v = line.pick(m);
                  return (
                    <td key={i} className={v < 0 ? "neg" : ""}>
                      {money(v, cur, fx)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const IS_LINES: ReadonlyArray<Line<MonthIS> | "spacer"> = [
  { label: "Revenue", pick: (m) => m.revenue },
  { label: "COGS", pick: (m) => -m.cogs },
  { label: "Gross profit", pick: (m) => m.grossProfit, kind: "total" },
  { label: "S&M", pick: (m) => -m.sm },
  { label: "EBITDA", pick: (m) => m.ebitda, kind: "total" },
  { label: "Tax", pick: (m) => -m.tax },
  { label: "Net income", pick: (m) => m.netIncome, kind: "total" },
];

const BS_LINES: ReadonlyArray<Line<MonthBS> | "spacer"> = [
  { label: "Cash", pick: (m) => m.cash },
  { label: "Processor AR", pick: (m) => m.ar },
  { label: "Prepaid", pick: (m) => m.prepaid },
  { label: "Total assets", pick: (m) => m.totalAssets, kind: "total" },
  "spacer",
  { label: "Card debt", pick: (m) => m.card },
  { label: "Deferred revenue", pick: (m) => m.deferred },
  { label: "Accrued liabilities", pick: (m) => m.accrued },
  { label: "Taxes payable", pick: (m) => m.taxPayable },
  { label: "Total liabilities", pick: (m) => m.totalLiab, kind: "total" },
  "spacer",
  { label: "Paid-in capital", pick: (m) => m.paidIn },
  { label: "Retained earnings", pick: (m) => m.retained },
  { label: "Total equity", pick: (m) => m.totalEquity, kind: "total" },
];

const CFS_LINES: ReadonlyArray<Line<MonthCFS> | "spacer"> = [
  { label: "Net income", pick: (m) => m.netIncome },
  { label: "Δ deferred rev", pick: (m) => m.dDeferred },
  { label: "Δ AR", pick: (m) => m.dAR },
  { label: "Δ prepaid", pick: (m) => m.dPrepaid },
  { label: "Δ accrued", pick: (m) => m.dAccrued },
  { label: "Δ taxes payable", pick: (m) => m.dTaxPayable },
  { label: "CF from operations", pick: (m) => m.cfo, kind: "total" },
  { label: "CF investing", pick: (m) => m.cfi },
  { label: "Δ card debt", pick: (m) => m.dCard },
  { label: "Founder distribution", pick: (m) => -m.distribution },
  { label: "CF financing", pick: (m) => m.cff, kind: "total" },
  { label: "Net change in cash", pick: (m) => m.netChange, kind: "total" },
  { label: "Ending cash", pick: (m) => m.endCash, kind: "total" },
];

export function Statements({ st, cur, fx }: { st: Stmts; cur: Currency; fx: number }) {
  const [openIS, setOpenIS] = useState(true);
  const [openBS, setOpenBS] = useState(false);
  const [openCFS, setOpenCFS] = useState(false);

  return (
    <>
      <Sec title="Income statement" open={openIS} onToggle={() => setOpenIS((o) => !o)}>
        <StmtTable labels={st.labels} rows={st.is} lines={IS_LINES} cur={cur} fx={fx} />
      </Sec>
      <Sec title="Balance sheet" open={openBS} onToggle={() => setOpenBS((o) => !o)}>
        <StmtTable labels={st.labels} rows={st.bs} lines={BS_LINES} cur={cur} fx={fx} />
      </Sec>
      <Sec title="Cash flow statement" open={openCFS} onToggle={() => setOpenCFS((o) => !o)}>
        <StmtTable labels={st.labels} rows={st.cfs} lines={CFS_LINES} cur={cur} fx={fx} />
      </Sec>
    </>
  );
}
