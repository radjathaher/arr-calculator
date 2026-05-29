import { type ReactNode, useEffect, useRef, useState } from "react";

// ---- Pure helpers for the live-formatted numeric field (exported for tests) ----

// Strip everything the input layer adds for readability (the comma thousands
// separators) so the buffer can be parsed as a plain number.
export function stripThousands(raw: string): string {
  return raw.replace(/,/g, "");
}

// Parse a display buffer (which may carry commas) into a number. Blank, a lone
// sign, or a lone decimal point are deliberately "incomplete" and yield NaN so
// the model pauses rather than computing on a stray zero.
export function parseNI(raw: string): number {
  const s = stripThousands(raw);
  if (s === "" || s === "-" || s === "." || s === "-.") return Number.NaN;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : Number.NaN;
}

// Format a raw buffer for display: group the integer part with commas while
// leaving the decimal part (and any in-progress trailing "." or ".x") untouched.
// Non-numeric noise is dropped, but the buffer is otherwise preserved verbatim
// so the user can keep typing freely.
export function formatThousands(raw: string): string {
  const s = stripThousands(raw);
  if (s === "" || s === "-" || s === "." || s === "-.") return s;
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf(".");
  const intPart = dot === -1 ? body : body.slice(0, dot);
  const fracPart = dot === -1 ? "" : body.slice(dot); // keeps the leading "."
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${groupedInt}${fracPart}`;
}

// Count the digits to the left of a string index — the caret anchor that
// survives comma insertion (raw indices shift, digit counts do not).
function digitsLeftOf(str: string, idx: number): number {
  let count = 0;
  for (let i = 0; i < idx && i < str.length; i++) if (/\d/.test(str[i])) count++;
  return count;
}

// Find the string index that sits just after the Nth digit, the inverse of
// digitsLeftOf — used to re-place the caret after reformatting.
function indexAfterNthDigit(str: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

// Numeric field backed by a local text buffer so the user can type freely.
// A blank field commits NaN (not 0) and stays visually empty — the model treats
// any blank input as "incomplete" and pauses rather than computing on a zero.
// As the user types, the integer part renders with comma thousands separators;
// the caret is restored by digit count so commas never knock it out of place.
export function NI({
  label,
  value,
  onChange,
  width = 56,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number; // accepted for call-site compatibility; not applied to the DOM
  width?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() =>
    Number.isFinite(value) ? formatThousands(String(value)) : "",
  );

  // Resync when a finite value changes from outside (URL load, etc.). Leave the
  // field alone while it holds a blank (NaN) the user just cleared.
  useEffect(() => {
    if (Number.isFinite(value) && parseNI(text) !== value) setText(formatThousands(String(value)));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className="ni">
      <span>{label}</span>
      <span className="ni-in">
        <input
          ref={ref}
          className="nospin"
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const el = e.target;
            const raw = el.value;
            const caret = el.selectionStart ?? raw.length;
            const digitsLeft = digitsLeftOf(raw, caret);
            const formatted = formatThousands(raw);
            setText(formatted);
            onChange(parseNI(formatted));
            // Restore the caret after React commits the reformatted value,
            // anchored by how many digits preceded it.
            const pos = indexAfterNthDigit(formatted, digitsLeft);
            requestAnimationFrame(() => {
              const node = ref.current;
              if (node) node.setSelectionRange(pos, pos);
            });
          }}
          onBlur={() => setText(Number.isFinite(value) ? formatThousands(String(value)) : "")}
          style={{ width }}
        />
        {suffix && <i>{suffix}</i>}
      </span>
    </label>
  );
}

// Collapsible control section.
export function Sec({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="sec">
      <button className="sec-h" onClick={onToggle}>
        <span>{title}</span>
        <span className="tg">{open ? "–" : "+"}</span>
      </button>
      {open && <div className="sec-b">{children}</div>}
    </div>
  );
}

// Headline metric card.
export function Big({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="big" style={{ borderColor: tone ?? "var(--line)" }}>
      <div className="big-l">{label}</div>
      <div className="big-v" style={{ color: tone ?? "var(--ink)" }}>
        {value}
      </div>
      {sub && <div className="big-s">{sub}</div>}
    </div>
  );
}

// Compact secondary metric.
export function Thin({ label, value }: { label: string; value: string }) {
  return (
    <div className="thin">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
