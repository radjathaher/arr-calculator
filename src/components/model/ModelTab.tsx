import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, money } from "../../lib/format";
import { simulate } from "../../lib/engine";
import { buildStatements } from "../../lib/statements";
import { DEFAULT_PARAMS, T } from "../../lib/defaults";
import { decodeParams, encodeParams } from "../../lib/urlState";
import { Big, Sec } from "../atoms";
import { MetricsStrip } from "./MetricsStrip";
import { Charts } from "./Charts";
import { Statements } from "./Statements";
import { DcfPanel } from "./DcfPanel";
import { Schedule } from "./Schedule";
import { Levers } from "./Levers";
import { Assumptions } from "./Assumptions";

export function ModelTab() {
  const [params, setParams] = useState<Params>(() =>
    typeof window === "undefined"
      ? DEFAULT_PARAMS
      : decodeParams(window.location.search.replace(/^\?/, "")),
  );
  const [cur, setCur] = useState<Currency>("USD");
  const [leversOpen, setLeversOpen] = useState(true);

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
  const C = (n: number) => money(n, cur, fx);
  const sm = sim.sum;

  return (
    <div className="model">
      <div className="topbar">
        <div className="lblmono">
          {sm.d1m >= 0
            ? `$1M ARR crossed ${dstr(sm.d1mDate)}`
            : `Ends at ${C(sm.endARR)} ARR (Dec 2030)`}
        </div>
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

      {sm.insolventDay >= 0 && (
        <div className="alert d">
          Cash goes negative {dstr(sm.insolventDate)} — peak external funding needed{" "}
          <b>{C(sm.peakFunding)}</b>. Lower the budget or draw, add cash/credit, or skew web/annual.
        </div>
      )}

      <div className="big3">
        <Big
          label="ARR (Dec 2030)"
          value={C(sm.endARR)}
          tone={T.teal}
          sub={sm.d1m >= 0 ? `$1M crossed ${dstr(sm.d1mDate)}` : "did not reach $1M"}
        />
        <Big
          label="Ending cash"
          value={C(sm.endCash)}
          tone={sm.endCash >= 0 ? T.ink : T.danger}
          sub={`min cash ${C(sm.minCash)}`}
        />
        <Big
          label="Enterprise value (DCF)"
          value={C(st.ev)}
          tone={st.ev >= 0 ? T.teal : T.danger}
          sub={`equity ${C(st.equityValue)} · ${st.impliedMultiple.toFixed(1)}× ARR`}
        />
      </div>

      <MetricsStrip st={st} cur={cur} fx={fx} />

      <Charts sim={sim} st={st} cur={cur} fx={fx} />

      <Statements st={st} cur={cur} fx={fx} />

      <DcfPanel st={st} cur={cur} fx={fx} />

      <Schedule sim={sim} cur={cur} fx={fx} />

      <Sec
        title="Levers — marketing budget & founder draw"
        open={leversOpen}
        onToggle={() => setLeversOpen((o) => !o)}
      >
        <Levers params={params} upd={upd} />
      </Sec>

      <Assumptions params={params} upd={upd} cur={cur} fx={fx} />
    </div>
  );
}
