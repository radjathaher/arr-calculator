import { useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { T } from "../../lib/defaults";
import { intf } from "../../lib/format";

// --- shared helpers -------------------------------------------------------

// A labelled range slider that reads its value off the event target so the
// caller never has to thread an `any` through the handler.
function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: React.ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="zlab">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.currentTarget.value))
        }
      />
    </label>
  );
}

// Map a value to a 4..100% bar width on a log scale so a funnel that spans
// hundreds of thousands down to single digits stays legible.
function logWidth(value: number, max: number): number {
  if (value <= 0) return 4;
  const w = (Math.log10(value + 1) / Math.log10(max + 1)) * 100;
  return Math.max(4, Math.min(100, w));
}

// --- FunnelCalc -----------------------------------------------------------

// Walk a daily ad budget down the attention -> install -> trial -> paid
// funnel. The conversion rates are the canned story's numbers; only the two
// inputs the buyer actually controls (spend and CPM) are live.
export function FunnelCalc() {
  const [budget, setBudget] = useState(120);
  const [cpm, setCpm] = useState(20);

  const impressions = (budget / cpm) * 1000;
  const installs = impressions * 0.0027;
  const trials = installs * 0.12;
  const paid = trials * 0.3;
  const cac = paid > 0 ? budget / paid : 0;
  const weeklyPrice = 9.99;
  const weeksToRecoup = cac > 0 ? cac / weeklyPrice : 0;

  const rows: { label: string; value: number; suffix: string; color: string }[] = [
    { label: "Impressions", value: impressions, suffix: "", color: T.muted },
    { label: "Installs (0.27%)", value: installs, suffix: "", color: T.green },
    { label: "Trials (12%)", value: trials, suffix: "", color: T.gold },
    { label: "Paid (30%)", value: paid, suffix: "", color: T.teal },
  ];

  return (
    <div className="zw">
      <div className="zw-ctrls">
        <Slider
          label={`Daily budget · $${budget}`}
          min={20}
          max={500}
          step={5}
          value={budget}
          onChange={setBudget}
        />
        <Slider label={`CPM · $${cpm}`} min={2} max={40} step={1} value={cpm} onChange={setCpm} />
      </div>
      {rows.map((r) => (
        <div className="fn-row" key={r.label}>
          <span>{r.label}</span>
          <div
            className="fn-bar"
            style={{ width: `${logWidth(r.value, impressions)}%`, background: r.color }}
          />
          <b>
            {intf(r.value)}
            {r.suffix}
          </b>
        </div>
      ))}
      <div className="zw-out">
        One paying customer costs you <b>${cac.toFixed(2)}</b> — that is your CAC. At $9.99/week it
        takes roughly <b>{weeksToRecoup.toFixed(1)} weeks</b> of payments just to win that money
        back, and only if they stay.
      </div>
    </div>
  );
}

// --- ChurnBucket ----------------------------------------------------------

// A leaky bucket: you pour new paying users in, churn drains them out. Lower
// churn = higher steady water level. The SVG level is the survivor fraction.
export function ChurnBucket() {
  const [churn, setChurn] = useState(45);

  const retain = 1 - churn / 100;
  const level = Math.max(0.04, retain); // 0..1 fill fraction
  const bucketH = 110;
  const waterH = bucketH * level;
  const waterY = 20 + (bucketH - waterH);

  return (
    <div className="zw">
      <div className="zw-row">
        <svg width={140} height={150} role="img" aria-label="leaky bucket">
          <path d="M30 20 L110 20 L100 130 L40 130 Z" fill="none" stroke={T.line} strokeWidth={2} />
          <rect x={31} y={waterY} width={78} height={waterH} fill={T.teal} opacity={0.85} />
          <line x1={102} y1={120} x2={118} y2={134} stroke={T.danger} strokeWidth={2} />
          <text x={120} y={140} fontSize={10} fill={T.danger} fontFamily="monospace">
            leak
          </text>
        </svg>
        <div>
          <Slider
            label={`Weekly churn · ${churn}%`}
            min={5}
            max={60}
            step={1}
            value={churn}
            onChange={setChurn}
          />
          <div className="zw-out">
            You pour new customers in the top; churn drains them out the bottom. At{" "}
            <b>{churn}% weekly churn</b>, only <b>{Math.round(retain * 100)}%</b> survive each week
            — and roughly <b>half of all signups leave after week one</b>. The bucket only fills if
            you pour faster than it leaks.
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PayoutTrap -----------------------------------------------------------

type Route = "WEB" | "APP";

// Cumulative bank balance over 90 days when you spend ~$30/day on ads and earn
// ~$33/day — but the earnings only land after the route's payout lag. The web
// dips shallow; the app store dips into a deep, scary trough first.
export function PayoutTrap() {
  const [route, setRoute] = useState<Route>("APP");
  const lag = route === "WEB" ? 10 : 60;
  const spendPerDay = 30;
  const earnPerDay = 33;
  const days = 90;

  const series: { day: number; cash: number }[] = [];
  let cash = 0;
  for (let d = 0; d <= days; d++) {
    cash -= spendPerDay;
    if (d >= lag) cash += earnPerDay;
    series.push({ day: d, cash: Math.round(cash) });
  }
  const trough = Math.min(...series.map((p) => p.cash));

  return (
    <div className="zw">
      <div className="zw-toggle">
        <button
          type="button"
          className={route === "WEB" ? "on" : ""}
          onClick={() => setRoute("WEB")}
        >
          Web · 10-day
        </button>
        <button
          type="button"
          className={route === "APP" ? "on" : ""}
          onClick={() => setRoute("APP")}
        >
          App store · 60-day
        </button>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: T.muted }}
            tickFormatter={(v: number) => `d${v}`}
          />
          <YAxis tick={{ fontSize: 9, fill: T.muted }} width={42} />
          <ReferenceLine y={0} stroke={T.danger} strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="cash"
            stroke={route === "WEB" ? T.teal : T.danger}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="zw-out">
        Same customers, same revenue — only the <b>payout speed</b> changes. The{" "}
        {route === "WEB" ? "10-day web" : "60-day app-store"} route digs your balance down to{" "}
        <b>${intf(trough)}</b> before any money returns. That hole is what your credit line has to
        cover. Slow payouts can sink a <i>profitable</i> business.
      </div>
    </div>
  );
}

// --- Flywheel -------------------------------------------------------------

// A wheel that literally spins faster when payouts are faster. The intuition:
// cash that comes back quickly is recycled into the next batch of ads sooner,
// so the whole growth machine turns more times per year.
export function Flywheel() {
  const [payoutDays, setPayoutDays] = useState(30);

  // 5 days -> ~1.2s/turn (fast), 60 days -> ~9s/turn (sluggish).
  const duration = 1.2 + ((payoutDays - 5) / 55) * 7.8;

  return (
    <div className="zw">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div className="zw-row">
        <svg
          className="flywheel"
          width={120}
          height={120}
          viewBox="0 0 120 120"
          role="img"
          aria-label="reinvestment flywheel"
          style={{
            animationName: "spin",
            animationDuration: `${duration}s`,
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
          }}
        >
          <circle cx={60} cy={60} r={46} fill="none" stroke={T.teal} strokeWidth={6} />
          <circle cx={60} cy={60} r={10} fill={T.gold} />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1={60}
              y1={60}
              x2={60 + 44 * Math.cos((deg * Math.PI) / 180)}
              y2={60 + 44 * Math.sin((deg * Math.PI) / 180)}
              stroke={T.teal}
              strokeWidth={4}
            />
          ))}
        </svg>
        <div>
          <Slider
            label={`Payout · ${payoutDays} days`}
            min={5}
            max={60}
            step={1}
            value={payoutDays}
            onChange={setPayoutDays}
          />
          <div className="zw-out">
            At <b>{payoutDays}-day</b> payouts the wheel turns about every{" "}
            <b>{duration.toFixed(1)}s</b>. Faster cash means each dollar of ad spend comes back and
            buys the <i>next</i> customer sooner — the same $20k credit line funds far more growth
            when it recycles quickly.
          </div>
        </div>
      </div>
    </div>
  );
}
