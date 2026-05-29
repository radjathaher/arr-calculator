import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { simulate } from "../../lib/engine";
import { DEFAULT_PARAMS } from "../../lib/defaults";
import { decodeParams, encodeParams, hasBlankInputs } from "../../lib/urlState";
import { NI, Sec } from "../atoms";
import { Results } from "./results";
import { ArrChart } from "./arr-chart";
import { CashChart } from "./cash-chart";
import { CashFlowTable } from "./cashflow-table";
import { FunnelBlock } from "./funnel-block";
import { Assumptions } from "./assumptions";

export function ModelTab() {
  const [params, setParams] = useState<Params>(() =>
    typeof window === "undefined"
      ? DEFAULT_PARAMS
      : decodeParams(window.location.search.replace(/^\?/, "")),
  );
  const [cur, setCur] = useState<Currency>("USD");
  const [cfOpen, setCfOpen] = useState(false);

  const upd = (mut: (p: Params) => void) =>
    setParams((prev) => {
      const n = structuredClone(prev);
      mut(n);
      return n;
    });

  const sim = useMemo(() => (hasBlankInputs(params) ? null : simulate(params)), [params]);

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

      <div className="card plan-strip">
        <NI
          label="ARR goal"
          value={params.arrGoal}
          width={104}
          onChange={(v) => upd((q) => (q.arrGoal = v))}
        />
        <NI
          label="paid $/mo"
          value={params.marketing.paidBudget}
          width={84}
          onChange={(v) => upd((q) => (q.marketing.paidBudget = v))}
        />
        <NI
          label="organic $/mo"
          value={params.marketing.organicBudget}
          width={84}
          onChange={(v) => upd((q) => (q.marketing.organicBudget = v))}
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
          <Sec title="Cash-flow statement" open={cfOpen} onToggle={() => setCfOpen((o) => !o)}>
            <CashFlowTable sim={sim} cur={cur} fx={fx} />
          </Sec>
        </div>
      )}

      <Assumptions params={params} upd={upd} />
    </div>
  );
}
