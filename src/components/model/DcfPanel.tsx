import { useState } from "react";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import type { MonthDCF, Statements } from "../../lib/statements";
import { Sec } from "../atoms";

// Read-only DCF view: a summary card grid (EV bridge + assumptions) followed by
// a collapsible monthly unlevered free-cash-flow table.

interface DcfLine {
  label: string;
  pick: (m: MonthDCF) => number;
  total?: boolean;
}

const DCF_LINES: ReadonlyArray<DcfLine> = [
  { label: "EBIT", pick: (m) => m.ebit },
  { label: "NOPAT", pick: (m) => m.nopat },
  { label: "Δ NWC", pick: (m) => m.dNwc },
  { label: "Unlevered FCF", pick: (m) => m.ufcf, total: true },
  { label: "PV of FCF", pick: (m) => m.pv },
];

export function DcfPanel({ st, cur, fx }: { st: Statements; cur: Currency; fx: number }) {
  const [openSummary, setOpenSummary] = useState(true);
  const [openTable, setOpenTable] = useState(false);

  const cards: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Enterprise value", value: money(st.ev, cur, fx) },
    { label: "PV explicit", value: money(st.pvExplicit, cur, fx) },
    { label: "PV terminal", value: money(st.pvTV, cur, fx) },
    { label: "Terminal value", value: money(st.tv, cur, fx) },
    { label: "Equity value", value: money(st.equityValue, cur, fx) },
    {
      label: "Implied ARR ×",
      value: Number.isFinite(st.impliedMultiple) ? `${st.impliedMultiple.toFixed(1)}×` : "—",
    },
    { label: "WACC", value: Number.isFinite(st.wacc) ? `${(st.wacc * 100).toFixed(1)}%` : "—" },
  ];

  return (
    <>
      <Sec title="DCF summary" open={openSummary} onToggle={() => setOpenSummary((o) => !o)}>
        <div className="dcf-summary">
          {cards.map((c) => (
            <div key={c.label} className="thin">
              <span>{c.label}</span>
              <b>{c.value}</b>
            </div>
          ))}
        </div>
      </Sec>
      <Sec
        title="DCF — monthly cash flow"
        open={openTable}
        onToggle={() => setOpenTable((o) => !o)}
      >
        <div className="stmt-wrap">
          <table className="stmt">
            <thead>
              <tr>
                <th className="rowlabel">$</th>
                {st.labels.map((l, i) => (
                  <th key={i}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DCF_LINES.map((line) => (
                <tr key={line.label} className={line.total ? "total" : ""}>
                  <td className="rowlabel">{line.label}</td>
                  {st.dcf.map((m, i) => {
                    const v = line.pick(m);
                    return (
                      <td key={i} className={v < 0 ? "neg" : ""}>
                        {money(v, cur, fx)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>
    </>
  );
}
