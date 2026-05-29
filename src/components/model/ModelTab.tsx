import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { simulate } from "../../lib/engine";
import { DEFAULT_PARAMS } from "../../lib/defaults";
import { decodeParams, encodeParams, hasBlankInputs } from "../../lib/urlState";
import { Cockpit } from "./Cockpit";
import { ArrChart } from "./ArrChart";
import { CashChart } from "./CashChart";
import { Assumptions } from "./Assumptions";

export function ModelTab() {
  const [params, setParams] = useState<Params>(() =>
    typeof window === "undefined"
      ? DEFAULT_PARAMS
      : decodeParams(window.location.search.replace(/^\?/, "")),
  );
  const [cur, setCur] = useState<Currency>("USD");

  const upd = (mut: (p: Params) => void) =>
    setParams((prev) => {
      const n = structuredClone(prev);
      mut(n);
      return n;
    });

  // Pause the calculation while any input is blank.
  const sim = useMemo(() => (hasBlankInputs(params) ? null : simulate(params)), [params]);

  useEffect(() => {
    const qs = encodeParams(params);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [params]);

  const fx = params.fx;

  return (
    <div className="model">
      <div className="topbar">
        <div className="lblmono">Move the dials — watch when you hit your ARR goal</div>
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

      <Cockpit params={params} upd={upd} sim={sim} cur={cur} fx={fx} />

      {sim && (
        <>
          <ArrChart sim={sim} goal={params.arrGoal} cur={cur} fx={fx} />
          <CashChart sim={sim} cur={cur} fx={fx} />
        </>
      )}

      <Assumptions params={params} upd={upd} cur={cur} fx={fx} />
    </div>
  );
}
