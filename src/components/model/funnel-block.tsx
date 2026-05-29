import type { Channel, Params, RouteKind } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { channelEconomics } from "../../lib/model";
import { NI } from "../atoms";
import { PlanGrid } from "./plan-grid";

// One acquisition channel, top-to-bottom: header (name + route), spend, the
// funnel as a row-aligned rate │ cost ladder (CPM → CPI → cost/trial → CAC),
// the transposed plan grid, a scorecard verdict, and the route's fee/payout.
export function FunnelBlock({
  params,
  idx,
  upd,
  cur,
  fx,
}: {
  params: Params;
  idx: 0 | 1;
  upd: (mut: (p: Params) => void) => void;
  cur: Currency;
  fx: number;
}) {
  const ch = params.channels[idx];
  const e = channelEconomics(ch, params.routes, params.unit.infraPct);
  const isWeb = ch.route === "WEB";
  const C = (n: number) => money(n, cur, fx);
  const cf = (mut: (c: Channel) => void) => upd((q) => mut(q.channels[idx]));

  const spend = idx === 0 ? params.marketing.paidDaily : params.marketing.organicDaily;
  const setSpend = (v: number) =>
    upd((q) => {
      if (idx === 0) q.marketing.paidDaily = v;
      else q.marketing.organicDaily = v;
    });
  const fee = isWeb ? params.routes.webFeePct : params.routes.appFeeLow;
  const setFee = (v: number) =>
    upd((q) => {
      if (isWeb) q.routes.webFeePct = v;
      else q.routes.appFeeLow = v;
    });
  const payout = isWeb ? params.routes.webPayoutDays : params.routes.appPayoutDays;
  const setPayout = (v: number) =>
    upd((q) => {
      if (isWeb) q.routes.webPayoutDays = v;
      else q.routes.appPayoutDays = v;
    });

  return (
    <div className="funnel-block" style={{ borderTopColor: ch.color }}>
      <div className="fb-head">
        <span className="fb-name" style={{ color: ch.color }}>
          ● {ch.name}
        </span>
        <label className="rtsel">
          via
          <select
            className="nospin"
            value={ch.route}
            onChange={(ev) => cf((c) => (c.route = ev.target.value as RouteKind))}
          >
            <option value="WEB">web checkout</option>
            <option value="APP">app store</option>
          </select>
        </label>
      </div>

      <div className="ni-row">
        <NI label="spend $/day" value={spend} width={84} onChange={setSpend} />
      </div>

      <div className="subhead">funnel — rate │ cost per step</div>
      <div className="funnel-cols">
        <div className="fc-row fc-head">
          <span className="fc-rate" />
          <span className="fc-arrow" />
          <span className="fc-cost-h">cost</span>
        </div>
        <div className="fc-row">
          <span className="fc-rate" />
          <span className="fc-arrow" />
          <span className="fc-cost">
            <NI
              label="CPM"
              value={ch.funnel.cpm}
              width={56}
              onChange={(v) => cf((c) => (c.funnel.cpm = v))}
            />
          </span>
        </div>
        <div className="fc-row">
          <span className="fc-rate">
            <NI
              label="impression-to-install %"
              value={ch.funnel.impToInstall}
              width={52}
              suffix="%"
              onChange={(v) => cf((c) => (c.funnel.impToInstall = v))}
            />
          </span>
          <span className="fc-arrow">►</span>
          <span className="fc-cost">
            <span className="fc-cost-l">CPI</span>
            <b>{C(e.cpi)}</b>
          </span>
        </div>
        <div className="fc-row">
          <span className="fc-rate">
            <NI
              label="install-to-trial %"
              value={ch.funnel.installToTrial}
              width={52}
              suffix="%"
              onChange={(v) => cf((c) => (c.funnel.installToTrial = v))}
            />
          </span>
          <span className="fc-arrow">►</span>
          <span className="fc-cost">
            <span className="fc-cost-l">cost-per-trial</span>
            <b>{C(e.costPerTrial)}</b>
          </span>
        </div>
        <div className="fc-row">
          <span className="fc-rate">
            <NI
              label="trial-to-paid %"
              value={ch.funnel.trialToPaid}
              width={52}
              suffix="%"
              onChange={(v) => cf((c) => (c.funnel.trialToPaid = v))}
            />
          </span>
          <span className="fc-arrow">►</span>
          <span className="fc-cost">
            <span className="fc-cost-l">CAC</span>
            <b>{C(e.cac)}</b>
          </span>
        </div>
      </div>

      <div className="subhead">plans — price · mix · trial · renewal · LTV</div>
      <PlanGrid params={params} idx={idx} upd={upd} cur={cur} fx={fx} />

      <div className="fb-score">
        CAC <b>{C(e.cac)}</b> · blended LTV <b>{C(e.blendedLtv)}</b> · LTV:CAC{" "}
        <b>{e.ltvCac.toFixed(1)}×</b> · payback <b>{e.paybackWeeks.toFixed(0)} wk</b>
      </div>

      <div className="subhead">route — fee % · payout days</div>
      <div className="ni-row">
        <NI label="fee %" value={fee} width={44} suffix="%" onChange={setFee} />
        <NI label="payout" value={payout} width={44} suffix="d" onChange={setPayout} />
      </div>
    </div>
  );
}
