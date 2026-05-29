import { type ReactNode, useEffect, useState } from "react";

// Numeric field backed by a local text buffer so the user can type freely.
// A blank field commits NaN (not 0) and stays visually empty — the model treats
// any blank input as "incomplete" and pauses rather than computing on a zero.
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
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : ""));

  // Resync when a finite value changes from outside (URL load, etc.). Leave the
  // field alone while it holds a blank (NaN) the user just cleared.
  useEffect(() => {
    if (Number.isFinite(value) && Number.parseFloat(text) !== value) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className="ni">
      <span>{label}</span>
      <span className="ni-in">
        <input
          className="nospin"
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            if (raw === "" || raw === "-" || raw === ".") {
              onChange(Number.NaN);
              return;
            }
            const n = Number.parseFloat(raw);
            onChange(Number.isFinite(n) ? n : Number.NaN);
          }}
          onBlur={() => setText(Number.isFinite(value) ? String(value) : "")}
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
