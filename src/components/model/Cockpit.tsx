import type { Params, SimResult } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { T } from "../../lib/defaults";
import { Big, NI } from "../atoms";

// The founder cockpit: the decisions on the left, and what they produce on the
// right — when you hit your ARR target, plus cash and enterprise value. When any
// input is blank the model pauses (sim is null) and the outputs read "—".
export function Cockpit({
  params,
  upd,
  sim,
  cur,
  fx,
}: {
  params: Params;
  upd: (mut: (p: Params) => void) => void;
  sim: SimResult | null;
  cur: Currency;
  fx: number;
}) {
  const p = params;
  const sm = sim?.sum ?? null;
  const fxC = (n: number) => money(n, cur, fx);
  const dash = "—";
  const reached = sm != null && sm.d1m >= 0;
  const goalLabel = Number.isFinite(p.arrGoal) ? fxC(p.arrGoal) : dash;

  return (
    <div className="cockpit">
      <div className="cockpit-decisions">
        <div className="cockpit-h">Your decisions</div>
        <NI
          label="Paid ads — spend $/mo (web funnel)"
          value={p.marketing.paidBudget}
          width={96}
          onChange={(v) => upd((q) => (q.marketing.paidBudget = v))}
        />
        <NI
          label="Organic / UGC — spend $/mo (in-app)"
          value={p.marketing.organicBudget}
          width={96}
          onChange={(v) => upd((q) => (q.marketing.organicBudget = v))}
        />
        <NI
          label="Grow spend — %/month"
          value={p.marketing.budgetRampPct}
          width={64}
          suffix="%/mo"
          onChange={(v) => upd((q) => (q.marketing.budgetRampPct = v))}
        />
        <NI
          label="Founder draw — $/mo (flat)"
          value={p.capital.founderDraw}
          width={96}
          onChange={(v) => upd((q) => (q.capital.founderDraw = v))}
        />
        <NI
          label="Starting cash"
          value={p.capital.startCash}
          width={96}
          onChange={(v) => upd((q) => (q.capital.startCash = v))}
        />
        <NI
          label="Credit line"
          value={p.capital.creditLimit}
          width={96}
          onChange={(v) => upd((q) => (q.capital.creditLimit = v))}
        />
        <NI
          label="ARR goal — the target you're racing to"
          value={p.arrGoal}
          width={120}
          onChange={(v) => upd((q) => (q.arrGoal = v))}
        />
        <div className="cockpit-hint">
          Paid ads bill through your web checkout — cheap ~6% fee, money back in ~10 days, but the
          CPM is brutal. Organic/UGC is dirt-cheap to reach but bills in-app: 15–30% cut, ~60-day
          payout. Flat spend plateaus; grow it to break through — too fast and you outrun your cash.
        </div>
      </div>

      <div className="cockpit-outcomes">
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
    </div>
  );
}
