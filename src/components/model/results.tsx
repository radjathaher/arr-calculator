import type { Params, SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { blendedEconomics } from "../../lib/economics";
import { T } from "../../lib/defaults";

// The answer, on top: four metric cards that fold the verdict in directly.
// When any input is blank, `sim` is null and every value reads "—".
export function Results({
  sim,
  goal,
  params,
  cur,
  fx,
}: {
  sim: SimResult | null;
  goal: number;
  params: Params;
  cur: Currency;
  fx: number;
}) {
  const sm = sim?.sum ?? null;
  const blended = blendedEconomics(params);
  const fxC = (n: number) => money(n, cur, fx);
  const dash = "—";
  const goalLabel = Number.isFinite(goal) ? fxC(goal) : dash;

  const reached = sm != null && sm.d1m >= 0;
  const arrVerdict =
    sm == null
      ? "fill in every field to calculate"
      : reached
        ? `${goalLabel} reached in ${Math.round(sm.d1m / 30.44)} mo · ${dstr(sm.d1mDate)}`
        : `${goalLabel} not reached`;

  const cashSub =
    sm == null
      ? ""
      : sm.insolventDay >= 0
        ? `peak funding ${fxC(sm.peakFunding)}`
        : sm.cashPositiveDate
          ? `cash-positive ${dstr(sm.cashPositiveDate)}`
          : "never negative";

  return (
    <div className="results-top">
      <div className="cards-4">
        <Card
          label="ARR"
          value={sm ? fxC(sm.endARR) : dash}
          tone={T.teal}
          subs={
            sm
              ? [
                  { text: `MRR ${fxC(sm.endARR / 12)}` },
                  { text: `LTV:CAC ${blended.ltvCac.toFixed(1)}` },
                  { text: arrVerdict, lead: true },
                ]
              : [{ text: arrVerdict, lead: true }]
          }
        />
        <Card
          label="Cash"
          value={sm ? fxC(sm.endCash) : dash}
          tone={sm && sm.endCash < 0 ? T.danger : T.ink}
          subs={sm ? [{ text: `min ${fxC(sm.minCash)}` }, { text: cashSub, lead: true }] : []}
        />
        <Card
          label="Valuation"
          value={sm ? fxC(sm.EV) : dash}
          tone={T.teal}
          subs={
            sm
              ? [
                  { text: `equity ${fxC(sm.equity)}` },
                  { text: `${sm.evMultiple.toFixed(1)}× ARR` },
                  { text: `WACC ${sm.wacc.toFixed(1)}%` },
                ]
              : []
          }
        />
        <Card
          label="Unit economics"
          value={sm ? `${blended.ltvCac.toFixed(1)}×` : dash}
          tone={T.teal}
          subs={
            sm
              ? [
                  { text: `CAC ${fxC(blended.cac)}` },
                  { text: `LTV ${fxC(blended.ltv)}` },
                  { text: `payback ${blended.paybackWeeks.toFixed(0)} wk` },
                ]
              : []
          }
        />
      </div>

      {sm != null && sm.insolventDay >= 0 && (
        <div className="alert d results-alert">
          You run out of cash chasing this — peak external funding needed{" "}
          <b>{fxC(sm.peakFunding)}</b>. Slow the growth %, raise the credit line, or add starting
          cash.
        </div>
      )}
    </div>
  );
}

interface Sub {
  text: string;
  lead?: boolean;
}

// A headline metric card with the .big atom styling and stacked sub-lines.
function Card({
  label,
  value,
  tone,
  subs,
}: {
  label: string;
  value: string;
  tone?: string;
  subs: Sub[];
}) {
  return (
    <div className="big" style={{ borderColor: tone ?? "var(--line)" }}>
      <div className="big-l">{label}</div>
      <div className="big-v" style={{ color: tone ?? "var(--ink)" }}>
        {value}
      </div>
      {subs.length > 0 && (
        <div className="card-subs">
          {subs.map((s, i) => (
            <span key={i} className={s.lead ? "sub lead" : "sub"}>
              {s.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
