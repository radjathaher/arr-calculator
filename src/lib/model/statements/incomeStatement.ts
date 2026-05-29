import type { IncomeRow, IncomeStatement } from "../../types";
import { DAYS } from "../calendar";
import type { DailyLedger } from "./dailyLedger";

const blank = (i: number, date: Date, label: string): IncomeRow => ({
  i,
  date,
  label,
  revenue: 0,
  platformFees: 0,
  infra: 0,
  grossProfit: 0,
  marketing: 0,
  ebit: 0,
  tax: 0,
  netIncome: 0,
});

// Finalise the derived lines once a period's flows are summed. Fees and infra
// are recognised against revenue (so gross profit = revenue · gm); tax falls
// only on positive EBIT.
function close(r: IncomeRow, taxRate: number): void {
  r.grossProfit = r.revenue - r.platformFees - r.infra;
  r.ebit = r.grossProfit - r.marketing;
  r.tax = r.ebit > 0 ? r.ebit * taxRate : 0;
  r.netIncome = r.ebit - r.tax;
}

// Accrual P&L: revenue recognised ratably, fees + infra matched to it, marketing
// expensed as spent. Monthly rows, then an annual roll-up that is the exact sum
// of its months (so the two grains reconcile).
export function buildIncomeStatement(L: DailyLedger): IncomeStatement {
  const monthly: IncomeRow[] = [];
  let cur: IncomeRow | null = null;
  let key = "";
  for (let d = 0; d <= L.lastDay; d++) {
    const date = DAYS[d].date;
    const k = `${date.getFullYear()}-${date.getMonth()}`;
    if (k !== key) {
      cur = blank(
        d,
        new Date(date.getFullYear(), date.getMonth(), 1),
        date.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      );
      monthly.push(cur);
      key = k;
    }
    if (cur) {
      const rev = L.recRev[d];
      cur.revenue += rev;
      cur.platformFees += rev * L.blendedFeeRate;
      cur.infra += rev * L.infraPct;
      cur.marketing += L.adSpend[d];
    }
  }
  for (const r of monthly) close(r, L.taxRate);

  // Annual = sum of the year's months (every line, including tax/net income, so
  // the annual figure ties exactly to the monthly detail).
  const annual: IncomeRow[] = [];
  let acc: IncomeRow | null = null;
  let year = NaN;
  for (const m of monthly) {
    const y = m.date.getFullYear();
    if (y !== year) {
      acc = blank(m.i, new Date(y, 0, 1), String(y));
      annual.push(acc);
      year = y;
    }
    if (acc) {
      acc.revenue += m.revenue;
      acc.platformFees += m.platformFees;
      acc.infra += m.infra;
      acc.grossProfit += m.grossProfit;
      acc.marketing += m.marketing;
      acc.ebit += m.ebit;
      acc.tax += m.tax;
      acc.netIncome += m.netIncome;
    }
  }
  return { monthly, annual };
}
