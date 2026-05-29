import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { simulate } from "../../lib/engine";
import { buildStatements } from "../../lib/statements";
import { DEFAULT_PARAMS } from "../../lib/defaults";
import { decodeParams, encodeParams } from "../../lib/urlState";
import { Cockpit } from "./Cockpit";
import { ArrChart } from "./ArrChart";
import { MetricsStrip } from "./MetricsStrip";
import { Charts } from "./Charts";
import { Statements } from "./Statements";
import { DcfPanel } from "./DcfPanel";
import { Schedule } from "./Schedule";
import { Assumptions } from "./Assumptions";

export function ModelTab() {
  const [params, setParams] = useState<Params>(() =>
    typeof window === "undefined"
      ? DEFAULT_PARAMS
      : decodeParams(window.location.search.replace(/^\?/, "")),
  );
  const [cur, setCur] = useState<Currency>("USD");
  const [full, setFull] = useState(false);

  const upd = (mut: (p: Params) => void) =>
    setParams((prev) => {
      const n = structuredClone(prev);
      mut(n);
      return n;
    });

  const sim = useMemo(() => simulate(params), [params]);
  const st = useMemo(() => buildStatements(sim, params), [sim, params]);

  useEffect(() => {
    const qs = encodeParams(params);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [params]);

  const fx = params.fx;

  return (
    <div className="model">
      <div className="topbar">
        <div className="lblmono">Jun 2026 → Dec 2030 · {full ? "full model" : "founder view"}</div>
        <div className="topbar-actions">
          <div className="seg">
            {(["USD", "IDR"] as Currency[]).map((c) => (
              <button key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)}>
                {c}
              </button>
            ))}
          </div>
          <button className="mini-btn" onClick={() => setFull((f) => !f)}>
            {full ? "Hide full model ▴" : "Full model ▾"}
          </button>
        </div>
      </div>

      <Cockpit params={params} upd={upd} sim={sim} st={st} cur={cur} fx={fx} />

      <ArrChart sim={sim} cur={cur} fx={fx} />

      {full && (
        <>
          <MetricsStrip st={st} cur={cur} fx={fx} />
          <Charts sim={sim} st={st} cur={cur} fx={fx} />
          <Statements st={st} cur={cur} fx={fx} />
          <DcfPanel st={st} cur={cur} fx={fx} />
          <Schedule sim={sim} cur={cur} fx={fx} />
          <Assumptions params={params} upd={upd} cur={cur} fx={fx} />
        </>
      )}
    </div>
  );
}
