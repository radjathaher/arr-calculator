import type { BalanceRow, BalanceSheet, IncomeStatement } from "../../types";
import { DAYS } from "../calendar";
import type { DailyLedger } from "./dailyLedger";

// Point-in-time balance sheet, snapshotted at each month end. It ties by
// construction: substituting the engine's exact cash identity
//   netCash = startCash + collections − adSpend − infraPaid − draw
// the accounting identity A = L + E holds when "accrued costs" carries the three
// real accrual-vs-cash timing wedges:
//   accrued = (feesOnRecognised − feesCharged)   prepaid platform fees (annual upfront)
//           + (infraAccrued − infraPaid)          infra incurred but unpaid at the credit floor
//           + taxAccrued                          tax expensed but never paid in cash by the engine
// `check` (assets − liabilities − equity) should read ≈ 0 at every period.
export function buildBalanceSheet(L: DailyLedger, income: IncomeStatement): BalanceSheet {
  const monthly: BalanceRow[] = [];
  let recCum = 0;
  let feeCum = 0;
  let infraPaidCum = 0;
  let drawCum = 0;
  let netIncomeCum = 0;
  let taxCum = 0;
  let mIdx = 0;

  for (let d = 0; d <= L.lastDay; d++) {
    recCum += L.recRev[d];
    feeCum += L.feeDay[d];
    infraPaidCum += L.infraPaid[d];
    drawCum += L.draw[d];

    const date = DAYS[d].date;
    const monthEnd = d === L.lastDay || DAYS[d + 1].date.getMonth() !== date.getMonth();
    if (!monthEnd) continue;

    const inc = income.monthly[mIdx];
    mIdx++;
    if (inc) {
      netIncomeCum += inc.netIncome;
      taxCum += inc.tax;
    }

    const net = L.netArr[d];
    const cash = Math.max(0, net);
    const creditDrawn = Math.max(0, -net);
    const receivable = L.processorAR[d];
    const deferredRevenue = L.deferred[d];
    const accruedCosts =
      recCum * L.blendedFeeRate - feeCum + (recCum * L.infraPct - infraPaidCum) + taxCum;
    const paidInCapital = L.startCash;
    const retainedEarnings = netIncomeCum - drawCum;

    const totalAssets = cash + receivable;
    const totalLiabilities = deferredRevenue + creditDrawn + accruedCosts;
    const totalEquity = paidInCapital + retainedEarnings;

    monthly.push({
      i: d,
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      label: date.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      cash,
      receivable,
      totalAssets,
      deferredRevenue,
      creditDrawn,
      accruedCosts,
      totalLiabilities,
      paidInCapital,
      retainedEarnings,
      totalEquity,
      check: totalAssets - totalLiabilities - totalEquity,
    });
  }

  // Annual = each year's closing (last) monthly snapshot, relabelled by year.
  const annual: BalanceRow[] = [];
  for (let i = 0; i < monthly.length; i++) {
    const m = monthly[i];
    const next = monthly[i + 1];
    if (!next || next.date.getFullYear() !== m.date.getFullYear()) {
      annual.push({ ...m, label: String(m.date.getFullYear()) });
    }
  }
  return { monthly, annual };
}
