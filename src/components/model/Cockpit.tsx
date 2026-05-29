import type { Params, SimResult } from "../../lib/types";
import type { Statements } from "../../lib/statements";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { T } from "../../lib/defaults";
import { Big, NI } from "../atoms";

// The founder cockpit: the only decisions that matter on the left, and what they
// produce on the right. Everything else is a default behind "Full model".
export function Cockpit({
  params,
  upd,
  sim,
  st,
  cur,
  fx,
}: {
  params: Params;
  upd: (mut: (p: Params) => void) => void;
  sim: SimResult;
  st: Statements;
  cur: Currency;
  fx: number;
}) {
  const p = params;
  const sm = sim.sum;
  const fxC = (n: number) => money(n, cur, fx);
  const reached = sm.d1m >= 0;
  const months = (sm.d1m / 30.44).toFixed(0);

  return (
    <div className="cockpit">
      <div className="cockpit-decisions">
        <div className="cockpit-h">Your decisions</div>
        <NI
          label="Paid ads — spend $/mo"
          value={p.marketing.paidBudget}
          step={500}
          width={96}
          onChange={(v) => upd((q) => (q.marketing.paidBudget = v))}
        />
        <NI
          label="Organic / UGC — spend $/mo"
          value={p.marketing.organicBudget}
          step={500}
          width={96}
          onChange={(v) => upd((q) => (q.marketing.organicBudget = v))}
        />
        <NI
          label="Grow spend — %/month"
          value={p.marketing.budgetRampPct}
          step={1}
          width={64}
          suffix="%/mo"
          onChange={(v) => upd((q) => (q.marketing.budgetRampPct = v))}
        />
        <NI
          label="Founder draw — $/mo (flat)"
          value={p.capital.founderDraw}
          step={250}
          width={96}
          onChange={(v) => upd((q) => (q.capital.founderDraw = v))}
        />
        <NI
          label="Starting cash"
          value={p.capital.startCash}
          step={1000}
          width={96}
          onChange={(v) => upd((q) => (q.capital.startCash = v))}
        />
        <NI
          label="Credit line"
          value={p.capital.creditLimit}
          step={1000}
          width={96}
          onChange={(v) => upd((q) => (q.capital.creditLimit = v))}
        />
        <div className="cockpit-hint">
          Flat spend plateaus (new sign-ups just replace churn). Grow spend each month to break
          through — but too fast and you outrun your cash.
        </div>
      </div>

      <div className="cockpit-outcomes">
        <div className={`verdict ${reached ? "ok" : "warn"}`}>
          {reached ? (
            <>
              <span className="verdict-big">$1M ARR · {dstr(sm.d1mDate)}</span>
              <span className="verdict-sub">{months} months in</span>
            </>
          ) : (
            <>
              <span className="verdict-big">$1M ARR not reached</span>
              <span className="verdict-sub">by Dec 2030 — raise spend or growth %</span>
            </>
          )}
        </div>
        <div className="big3">
          <Big
            label="ARR (Dec 2030)"
            value={fxC(sm.endARR)}
            tone={T.teal}
            sub={`MRR ${fxC(sm.endARR / 12)}`}
          />
          <Big
            label="Ending cash"
            value={fxC(sm.endCash)}
            tone={sm.endCash >= 0 ? T.ink : T.danger}
            sub={
              sm.insolventDay >= 0
                ? `goes negative ${dstr(sm.insolventDate)}`
                : `min cash ${fxC(sm.minCash)}`
            }
          />
          <Big
            label="Enterprise value"
            value={fxC(st.ev)}
            tone={st.ev >= 0 ? T.teal : T.danger}
            sub={`equity ${fxC(st.equityValue)}`}
          />
        </div>
        {sm.insolventDay >= 0 && (
          <div className="alert d">
            You go broke chasing this — peak external funding needed <b>{fxC(sm.peakFunding)}</b>.
            Slow the growth %, raise the credit line, or add starting cash.
          </div>
        )}
      </div>
    </div>
  );
}
