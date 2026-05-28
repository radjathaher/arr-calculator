import type { SimSummary } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";

export function RoutingPanel({
  sum,
  apDays,
  cur,
  fx,
}: {
  sum: SimSummary;
  apDays: number;
  cur: Currency;
  fx: number;
}) {
  const tot = sum.webVol + sum.iapVol || 1;
  const webPct = (sum.webVol / tot) * 100;
  const appPct = (sum.iapVol / tot) * 100;
  const gap = sum.effAR - apDays; // +ve: cash arrives slower than card bills

  return (
    <div className="card">
      <h3>Payment routing &amp; cash timing</h3>
      <div className="route-grid">
        <div className="rg">
          <span className="rl" style={{ color: "var(--teal)" }}>
            Web checkout
          </span>
          <span className="rv">{money(sum.webVol, cur, fx)}</span>
          <span className="rp">
            {webPct.toFixed(0)}% of billings · fees {money(sum.feeW, cur, fx)}
          </span>
        </div>
        <div className="rg">
          <span className="rl" style={{ color: "var(--orange)" }}>
            App store
          </span>
          <span className="rv">{money(sum.iapVol, cur, fx)}</span>
          <span className="rp">
            {appPct.toFixed(0)}% of billings · fees {money(sum.feeI, cur, fx)}
          </span>
        </div>
        <div className="rg">
          <span className="rl">Effective AR days</span>
          <span className="rv">{sum.effAR.toFixed(0)}d</span>
          <span className="rp">vs vendor terms {apDays}d</span>
        </div>
        <div className="rg">
          <span className="rl">Total fees paid</span>
          <span className="rv">{money(sum.feeW + sum.feeI, cur, fx)}</span>
          <span className="rp">gross margin {(sum.gm * 100).toFixed(0)}%</span>
        </div>
      </div>
      {gap > 0.5 ? (
        <div className="route-note gap">
          Cash gap: customer money arrives ~{gap.toFixed(0)} days <b>after</b> your card bills come
          due — you must bridge it with working capital.
        </div>
      ) : (
        <div className="route-note float">
          Positive float: customer money lands ~{Math.abs(gap).toFixed(0)} days <b>before</b> your
          card bills — the card finances itself.
        </div>
      )}
    </div>
  );
}
