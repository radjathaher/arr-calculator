export type Currency = "USD" | "IDR";

// Compact money formatter. Always en-US (dot decimals, comma thousands).
// `fx` is IDR per USD; values are stored in USD and converted for display.
export function money(n: number | null | undefined, cur: Currency, fx: number): string {
  if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "—";
  const v = cur === "IDR" ? n * fx : n;
  const sym = cur === "IDR" ? "Rp" : "$";
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  if (a >= 1e15) return `${sign}${sym}${a.toExponential(1)}`;
  if (a >= 1e12) return `${sign}${sym}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sign}${sym}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}${sym}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}${sym}${(a / 1e3).toFixed(1)}k`;
  return `${sign}${sym}${a.toFixed(0)}`;
}

// Plain integer with thousands separators.
export function intf(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n) || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

// Short date label, e.g. "Jun 7, 27".
export function dstr(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
