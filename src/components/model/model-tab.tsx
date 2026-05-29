import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { simulate } from "../../lib/model";
import { DEFAULT_PARAMS } from "../../lib/defaults";
import { decodeParams, encodeParams, hasBlankInputs } from "../../lib/urlState";
import { NI } from "../atoms";
import { Results } from "./results";
import { ArrChart } from "./arr-chart";
import { CashChart } from "./cash-chart";
import { Statements } from "./statements";
import { Cohorts } from "./cohorts";
import { FunnelBlock } from "./funnel-block";
import { Assumptions } from "./assumptions";

const initial: Params =
  typeof window === "undefined"
    ? DEFAULT_PARAMS
    : decodeParams(window.location.search.replace(/^\?/, ""));

export function ModelTab() {
  const [params, setParams] = useState<Params>(initial);
  // The committed snapshot drives the simulation. Live edits to `params` only
  // flow into `committed` when the user clicks Recalculate, so the model never
  // recomputes mid-keystroke.
  const [committed, setCommitted] = useState<Params>(initial);
  const [cur, setCur] = useState<Currency>("USD");

  const upd = (mut: (p: Params) => void) =>
    setParams((prev) => {
      const n = structuredClone(prev);
      mut(n);
      return n;
    });

  const sim = useMemo(() => (hasBlankInputs(committed) ? null : simulate(committed)), [committed]);

  // Edits diverge from the committed snapshot until the next recalc.
  const stale = JSON.stringify(params) !== JSON.stringify(committed);
  const blank = hasBlankInputs(params);

  useEffect(() => {
    const qs = encodeParams(params);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [params]);

  const fx = params.fx;

  return (
    <div className="model">
      <div className="topbar">
        <div className="lblmono">Compare the two funnels — watch when you hit your ARR goal</div>
        <div className="topbar-actions">
          {(stale || blank) && (
            <span className="recalc-stale">
              {blank ? "fill every field" : "inputs changed — recalculate"}
            </span>
          )}
          <button
            className="recalc"
            disabled={!stale || blank}
            onClick={() => setCommitted(structuredClone(params))}
          >
            ⟳ Recalculate
          </button>
          <div className="seg">
            {(["USD", "IDR"] as Currency[]).map((c) => (
              <button key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sim && (
        <div className="charts">
          <ArrChart sim={sim} goal={params.arrGoal} cur={cur} fx={fx} />
          <CashChart sim={sim} creditLimit={params.capital.creditLimit} cur={cur} fx={fx} />
        </div>
      )}

      <Results sim={sim} goal={params.arrGoal} params={params} cur={cur} fx={fx} />

      <div className="strip-cap">KEY ASSUMPTIONS</div>
      <div className="card plan-strip">
        <NI
          label="ARR goal"
          value={params.arrGoal}
          width={104}
          onChange={(v) => upd((q) => (q.arrGoal = v))}
        />
        <NI
          label="Infra %"
          value={params.unit.infraPct}
          width={48}
          suffix="%"
          onChange={(v) => upd((q) => (q.unit.infraPct = v))}
        />
        <NI
          label="web fixed $/txn"
          value={params.routes.webFixed}
          width={50}
          onChange={(v) => upd((q) => (q.routes.webFixed = v))}
        />
        <NI
          label="app fee SBP %"
          value={params.routes.appFeeLow}
          width={48}
          suffix="%"
          onChange={(v) => upd((q) => (q.routes.appFeeLow = v))}
        />
        <NI
          label="app fee std %"
          value={params.routes.appFeeHigh}
          width={48}
          suffix="%"
          onChange={(v) => upd((q) => (q.routes.appFeeHigh = v))}
        />
        <NI
          label="IDR per USD"
          value={params.fx}
          width={70}
          onChange={(v) => upd((q) => (q.fx = v))}
        />
        <span className="lblmono">
          app fee auto-steps SBP→standard at $1M trailing app-store proceeds
        </span>
      </div>

      <div className="strip-cap">SPEND &amp; CAPITAL</div>
      <div className="card plan-strip">
        <NI
          label="paid $/day"
          value={params.marketing.paidDaily}
          width={84}
          onChange={(v) => upd((q) => (q.marketing.paidDaily = v))}
        />
        <NI
          label="organic $/day"
          value={params.marketing.organicDaily}
          width={84}
          onChange={(v) => upd((q) => (q.marketing.organicDaily = v))}
        />
        <NI
          label="grow spend %/mo"
          value={params.marketing.budgetRampPct}
          width={56}
          suffix="%/mo"
          onChange={(v) => upd((q) => (q.marketing.budgetRampPct = v))}
        />
        <NI
          label="founder draw $/mo"
          value={params.capital.founderDraw}
          width={84}
          onChange={(v) => upd((q) => (q.capital.founderDraw = v))}
        />
        <NI
          label="starting cash"
          value={params.capital.startCash}
          width={84}
          onChange={(v) => upd((q) => (q.capital.startCash = v))}
        />
        <NI
          label="credit line"
          value={params.capital.creditLimit}
          width={84}
          onChange={(v) => upd((q) => (q.capital.creditLimit = v))}
        />
      </div>

      <div className="channels-2col">
        <FunnelBlock params={params} idx={0} upd={upd} cur={cur} fx={fx} />
        <FunnelBlock params={params} idx={1} upd={upd} cur={cur} fx={fx} />
      </div>

      {sim && (
        <div className="controls">
          <Statements sim={sim} cur={cur} fx={fx} />
          <Cohorts sim={sim} cur={cur} fx={fx} />
        </div>
      )}

      <Assumptions params={params} upd={upd} />
    </div>
  );
}
