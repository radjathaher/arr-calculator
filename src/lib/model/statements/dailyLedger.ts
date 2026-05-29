// The per-day series the simulation produces, handed to the statement builders.
// Keeping this as a plain data bundle lets the income-statement and balance-sheet
// builders stay pure functions, testable in isolation from the daily loop.
export interface DailyLedger {
  lastDay: number; // inclusive last day index
  recRev: Float64Array; // recognised (accrual) revenue per day, gross
  adSpend: Float64Array; // marketing cash spend per day
  infraPaid: Float64Array; // infra actually paid in cash per day
  feeDay: Float64Array; // platform fees taken per day (charged at billing)
  draw: Float64Array; // founder distribution per day
  netArr: Float64Array; // net cash balance (cash − credit) at day end
  processorAR: Float64Array; // net-of-fee billings not yet collected (receivable)
  deferred: Float64Array; // gross billed but not yet recognised (deferred revenue)
  startCash: number; // paid-in capital
  blendedFeeRate: number; // platform fees ÷ gross billings (0..1)
  infraPct: number; // infra as a fraction of recognised revenue (0..1)
  taxRate: number; // income-tax rate (0..1)
}
