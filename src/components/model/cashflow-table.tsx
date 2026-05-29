import { useMemo, useState } from "react";
import type { CashFlowRow, SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";

// Monthly cash-flow statement with drill-to-daily. Each month row expands to
// reveal its daily rows so the lumpy IAP payouts (a big iapIn one month, zero
// the next) read clearly against the smooth web inflows.
export function CashFlowTable({ sim, cur, fx }: { sim: SimResult; cur: Currency; fx: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const { monthly, daily } = sim.cashflow;

  // Group daily rows by calendar month so a selected month can show its days
  // without rescanning the full daily series on every render.
  const dailyByMonth = useMemo(() => {
    const map = new Map<string, CashFlowRow[]>();
    for (const d of daily) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      const bucket = map.get(key);
      if (bucket) bucket.push(d);
      else map.set(key, [d]);
    }
    return map;
  }, [daily]);

  if (monthly.length === 0) return <div className="cf-empty">No cash-flow rows yet.</div>;

  return (
    <div className="cf-scroll">
      <table className="cf-table">
        <thead>
          <tr>
            <th className="col-month">Month</th>
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
          {monthly.map((m) => {
            const isOpen = open === m.i;
            const days = isOpen
              ? (dailyByMonth.get(`${m.date.getFullYear()}-${m.date.getMonth()}`) ?? [])
              : [];
            return (
              <MonthRows
                key={m.i}
                row={m}
                days={days}
                isOpen={isOpen}
                onToggle={() => setOpen(isOpen ? null : m.i)}
                cur={cur}
                fx={fx}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MonthRows({
  row,
  days,
  isOpen,
  onToggle,
  cur,
  fx,
}: {
  row: CashFlowRow;
  days: CashFlowRow[];
  isOpen: boolean;
  onToggle: () => void;
  cur: Currency;
  fx: number;
}) {
  return (
    <>
      <tr className={isOpen ? "cf-row open" : "cf-row"} onClick={onToggle}>
        <td className="col-month">
          <span className="cf-caret">{isOpen ? "−" : "+"}</span>
          {row.label}
        </td>
        <Num n={row.webIn} cur={cur} fx={fx} />
        <Num n={row.iapIn} cur={cur} fx={fx} />
        <Num n={-row.adSpend} cur={cur} fx={fx} />
        <Num n={-row.infra} cur={cur} fx={fx} />
        <Num n={-row.draw} cur={cur} fx={fx} />
        <Num n={row.netChange} cur={cur} fx={fx} />
        <Num n={row.endBal} cur={cur} fx={fx} />
      </tr>
      {isOpen &&
        days.map((d) => (
          <tr key={d.i} className="cf-day">
            <td className="col-month">{d.label}</td>
            <Num n={d.webIn} cur={cur} fx={fx} />
            <Num n={d.iapIn} cur={cur} fx={fx} />
            <Num n={-d.adSpend} cur={cur} fx={fx} />
            <Num n={-d.infra} cur={cur} fx={fx} />
            <Num n={-d.draw} cur={cur} fx={fx} />
            <Num n={d.netChange} cur={cur} fx={fx} />
            <Num n={d.endBal} cur={cur} fx={fx} />
          </tr>
        ))}
    </>
  );
}

// Right-aligned mono cell; negatives carry the danger tint.
function Num({ n, cur, fx }: { n: number; cur: Currency; fx: number }) {
  return <td className={n < 0 ? "num neg" : "num"}>{money(n, cur, fx)}</td>;
}
