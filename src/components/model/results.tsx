import type { SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { T } from "../../lib/defaults";
import { Big } from "../atoms";

// The answer, on top: did you hit your target, when, and what you end with.
// When any input is blank, `sim` is null and everything reads "—".
export function Results({
  sim,
  goal,
  cur,
  fx,
}: {
  sim: SimResult | null;
  goal: number;
  cur: Currency;
  fx: number;
}) {
  const sm = sim?.sum ?? null;
  const fxC = (n: number) => money(n, cur, fx);
  const dash = "—";
  const reached = sm != null && sm.d1m >= 0;
  const goalLabel = Number.isFinite(goal) ? fxC(goal) : dash;

  return (
    <div className="results-top">
      <div className={`verdict ${reached ? "ok" : "warn"}`}>
        {sm == null ? (
          <>
            <span className="verdict-big">{dash}</span>
            <span className="verdict-sub">fill in every field to calculate</span>
          </>
        ) : reached ? (
          <>
            <span className="verdict-big">
              {goalLabel} ARR · {dstr(sm.d1mDate)}
            </span>
            <span className="verdict-sub">{(sm.d1m / 30.44).toFixed(0)} months in</span>
          </>
        ) : (
          <>
            <span className="verdict-big">{goalLabel} ARR not reached</span>
            <span className="verdict-sub">raise spend or growth % — or lower the goal</span>
          </>
        )}
      </div>
      <div className="big3">
        <Big
          label="ARR"
          value={sm ? fxC(sm.endARR) : dash}
          tone={T.teal}
          sub={sm ? `MRR ${fxC(sm.endARR / 12)}` : ""}
        />
        <Big
          label="Ending cash"
          value={sm ? fxC(sm.endCash) : dash}
          tone={sm && sm.endCash < 0 ? T.danger : T.ink}
          sub={
            sm
              ? sm.insolventDay >= 0
                ? `goes negative ${dstr(sm.insolventDate)}`
                : `min cash ${fxC(sm.minCash)}`
              : ""
          }
        />
        <Big
          label="Enterprise value"
          value={sm ? fxC(sm.EV) : dash}
          tone={sm && sm.EV < 0 ? T.danger : T.teal}
          sub={sm ? `equity ${fxC(sm.equity)}` : ""}
        />
      </div>
      {sm != null && sm.insolventDay >= 0 && (
        <div className="alert d">
          You run out of cash chasing this — peak external funding needed{" "}
          <b>{fxC(sm.peakFunding)}</b>. Slow the growth %, raise the credit line, or add starting
          cash.
        </div>
      )}
    </div>
  );
}
