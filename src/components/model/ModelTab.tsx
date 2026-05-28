import { useEffect, useMemo, useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { dstr, intf, money } from "../../lib/format";
import { maxDraw, optimize, solve } from "../../lib/engine";
import { DEFAULT_PARAMS, T } from "../../lib/defaults";
import { decodeParams, encodeParams } from "../../lib/urlState";
import { Big, Thin } from "../atoms";
import { Charts } from "./Charts";
import { RoutingPanel } from "./RoutingPanel";
import { Controls } from "./Controls";
import { Tornado } from "./Tornado";

const OPEN0: Record<string, boolean> = {
  cap: true,
  mkt: true,
  price: true,
  paid: false,
  org: false,
  fee: false,
  unit: false,
  dcf: false,
};

export function ModelTab() {
  const [params, setParams] = useState<Params>(() =>
    typeof window === "undefined"
      ? DEFAULT_PARAMS
      : decodeParams(window.location.search.replace(/^\?/, "")),
  );
  const [cur, setCur] = useState<Currency>("USD");
  const [open, setOpen] = useState(OPEN0);
  const [showLevers, setShowLevers] = useState(false);

  const tog = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const upd = (mut: (p: Params) => void) =>
    setParams((prev) => {
      const n = structuredClone(prev);
      mut(n);
      return n;
    });

  const solved = useMemo(() => solve(params), [params]);
  const maxDrawVal = useMemo(() => maxDraw(params), [params]);
  const effectiveParams = useMemo<Params>(
    () => ({ ...params, marketing: { ...params.marketing, monthlyBudget: solved.safeBudget } }),
    [params, solved.safeBudget],
  );

  useEffect(() => {
    const qs = encodeParams(params);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [params]);

  const R = solved.result;
  const sm = R.sum;
  const fx = params.fx;
  const C = (n: number) => money(n, cur, fx);

  const onOptimize = () => {
    const o = optimize(params);
    upd((q) => {
      q.marketing.paidShare = o.paidShare;
      q.marketing.monthlyBudget = Math.round(o.monthlyBudget);
    });
  };

  return (
    <div className="model">
      <div className="topbar">
        <div className="lblmono">
          {sm.reached
            ? `$1M ARR reached ${dstr(sm.D1Mdate)} · ${sm.monthsElapsed.toFixed(1)} months`
            : `Max ARR ${C(sm.maxARR)} within 5 years`}
        </div>
        <div className="topbar-actions">
          <div className="seg">
            {(["USD", "IDR"] as Currency[]).map((c) => (
              <button key={c} className={cur === c ? "on" : ""} onClick={() => setCur(c)}>
                {c}
              </button>
            ))}
          </div>
          <button className="opt" onClick={onOptimize}>
            ↻ optimize EV
          </button>
        </div>
      </div>

      {solved.throttled && (
        <div className="alert w">
          Budget throttled to <b>{C(solved.safeBudget)}/mo</b> to stay solvent on your working
          capital. Add cash, raise the credit line, route to web, or skew annual to deploy more.
        </div>
      )}
      {sm.insolventDay >= 0 && (
        <div className="alert d">
          Insolvent {dstr(sm.insolventDate)} — driven by the founder draw. Max sustainable ≈{" "}
          <b>{C(maxDrawVal)}/mo</b>.
        </div>
      )}
      {!sm.reached && sm.insolventDay < 0 && (
        <div className="alert w">
          $1M ARR not reached within 5 years (max <b>{C(sm.maxARR)}</b>). Lower CAC, lift retention,
          skew annual/web, or add working capital — then hit Optimize.
        </div>
      )}

      <div className="big3">
        <Big
          label="ARR"
          value={C(sm.horizonARR)}
          tone={sm.reached ? T.teal : T.danger}
          sub={sm.reached ? `$1M reached ${dstr(sm.D1Mdate)}` : "max achievable"}
        />
        <Big
          label="Ending cash"
          value={C(sm.endCash)}
          sub={sm.reached ? "at the $1M mark" : "at 5-year cap"}
        />
        <Big
          label="Enterprise value (DCF → today)"
          value={C(sm.EV)}
          tone={sm.EV >= 0 ? T.teal : T.danger}
          sub={`WACC ${sm.wacc.toFixed(2)}% · ${sm.evMultiple.toFixed(1)}× ARR`}
        />
      </div>

      <div className="thins">
        <Thin label="Date $1M" value={sm.reached ? dstr(sm.D1Mdate) : "—"} />
        <Thin label="Months" value={sm.monthsElapsed.toFixed(1)} />
        <Thin label="LTV" value={C(sm.ltv)} />
        <Thin label="CAC" value={C(sm.blendedCAC)} />
        <Thin label="LTV:CAC" value={`${sm.ltvCac.toFixed(2)}×`} />
        <Thin label="Payback" value={`${sm.paybackWk.toFixed(1)}w`} />
        <Thin label="Margin" value={`${(sm.gm * 100).toFixed(0)}%`} />
        <Thin
          label="Plan mix"
          value={`${(sm.blW * 100).toFixed(0)}w/${(sm.blA * 100).toFixed(0)}a`}
        />
        <Thin label="Life wks" value={sm.Lwbl.toFixed(1)} />
        <Thin label="Peak card" value={C(sm.peakCard)} />
        <Thin label="Eff AR days" value={`${sm.effAR.toFixed(0)}d`} />
        <Thin label="Total fees" value={C(sm.feeW + sm.feeI)} />
      </div>

      <Charts series={R.series} lastDay={R.lastDay} cur={cur} fx={fx} />

      <RoutingPanel sum={sm} apDays={params.capital.apDays} cur={cur} fx={fx} />

      <div className="card">
        <div className="tbl-head">
          <h3>Channels &amp; biggest levers</h3>
          <button className="mini-btn" onClick={() => setShowLevers((s) => !s)}>
            {showLevers ? "hide" : "analyze"}
          </button>
        </div>
        <div className="diag-grid">
          {sm.perCh.map((c) => (
            <div className="dg" key={c.name}>
              <span className="dl" style={{ color: c.color }}>
                {c.name} → {c.route === "WEB" ? "web checkout" : "app store"}
              </span>
              <span className="dv2">{C(c.spend)}</span>
              <span className="dp">
                {intf(c.cust)} cust · CAC {C(c.cac)}
              </span>
            </div>
          ))}
        </div>
        {showLevers && <Tornado params={effectiveParams} />}
      </div>

      <Controls
        params={params}
        upd={upd}
        open={open}
        tog={tog}
        cur={cur}
        fx={fx}
        maxDrawVal={maxDrawVal}
      />
    </div>
  );
}
