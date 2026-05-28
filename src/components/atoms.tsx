import type { ReactNode } from "react";

// Number input with no spinner arrows; parses to a number on change.
export function NI({
  label,
  value,
  onChange,
  step = 1,
  width = 56,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  width?: number;
  suffix?: string;
}) {
  return (
    <label className="ni">
      <span>{label}</span>
      <span className="ni-in">
        <input
          className="nospin"
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
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
