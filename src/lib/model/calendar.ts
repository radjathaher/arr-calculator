// ---- Calendar -------------------------------------------------------------
// Day 0 = 1 June 2026 (launch). The model runs until the ARR target is hit,
// with a 5-year safety cap.
export const START = new Date(2026, 5, 1);
export const MAXDAYS = 1826; // 5-year cap

export interface DayInfo {
  date: Date;
  mi: number; // month index since start (0 = Jun 2026)
  first: boolean;
}

export const DAYS: DayInfo[] = (() => {
  const out: DayInfo[] = [];
  for (let i = 0; i < MAXDAYS; i++) {
    const d = new Date(START.getTime() + i * 864e5);
    out.push({
      date: d,
      mi: (d.getFullYear() - 2026) * 12 + d.getMonth() - 5,
      first: d.getDate() === 1,
    });
  }
  return out;
})();

export const NDAYS = DAYS.length;
const NMONTHS = DAYS[NDAYS - 1].mi + 1;

// Days per calendar month within the horizon (used by the budget ramp).
export const DAYS_IN_MONTH: number[] = (() => {
  const out = Array.from({ length: NMONTHS }, () => 0);
  for (const d of DAYS) out[d.mi]++;
  return out;
})();
