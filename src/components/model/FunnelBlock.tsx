import type { Channel, Params, RouteKind } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { channelEconomics } from "../../lib/economics";
import { NI } from "../atoms";

// One acquisition channel as a first-class funnel: spend + the cost and
// conversion of each step (the dials a founder turns via better creatives),
// plan mix, retention (the product lever), and the route's fee/payout — with
// derived CPI, CAC and LTV per plan shown live.
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
  const e = channelEconomics(ch, params.plans, params.routes, params.unit.infraPct);
  const isWeb = ch.route === "WEB";
  const C = (n: number) => money(n, cur, fx);
  const cf = (mut: (c: Channel) => void) => upd((q) => mut(q.channels[idx]));
  const spend = idx === 0 ? params.marketing.paidBudget : params.marketing.organicBudget;
  const setSpend = (v: number) =>
    upd((q) => {
      if (idx === 0) q.marketing.paidBudget = v;
      else q.marketing.organicBudget = v;
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
        <span className="fb-metric">
          CAC {C(e.cac)} · LTV:CAC <b>{e.ltvCac.toFixed(1)}×</b>
        </span>
      </div>

      <div className="subhead">spend &amp; funnel — cost and conversion per step</div>
      <div className="ni-row">
        <NI label="spend $/mo" value={spend} width={84} onChange={setSpend} />
        <NI
          label="CPM"
          value={ch.funnel.cpm}
          width={56}
          onChange={(v) => cf((c) => (c.funnel.cpm = v))}
        />
        <NI
          label="imp→inst %"
          value={ch.funnel.impToInstall}
          width={56}
          onChange={(v) => cf((c) => (c.funnel.impToInstall = v))}
        />
        <NI
          label="inst→trial %"
          value={ch.funnel.installToTrial}
          width={56}
          onChange={(v) => cf((c) => (c.funnel.installToTrial = v))}
        />
        <NI
          label="trial→paid %"
          value={ch.funnel.trialToPaid}
          width={56}
          onChange={(v) => cf((c) => (c.funnel.trialToPaid = v))}
        />
      </div>
      <div className="econ">
        CPI <b>{C(e.cpi)}</b> · CAC <b>{C(e.cac)}</b>
      </div>

      <div className="subhead">plan mix % · LTV per plan</div>
      <div className="ni-row">
        <NI
          label="weekly"
          value={ch.mix.weekly}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.weekly = v))}
        />
        <NI
          label="monthly"
          value={ch.mix.monthly}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.monthly = v))}
        />
        <NI
          label="annual"
          value={ch.mix.annual}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.annual = v))}
        />
      </div>
      <div className="econ">
        LTV — weekly <b>{C(e.ltvW)}</b> · monthly <b>{C(e.ltvM)}</b> · annual <b>{C(e.ltvA)}</b>
      </div>

      <div className="subhead">retention — weekly 1st / 2nd / 3rd / mature %</div>
      <div className="ni-row">
        <NI
          label="1st"
          value={ch.retention.weekly.r1}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.r1 = v))}
        />
        <NI
          label="2nd"
          value={ch.retention.weekly.r2}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.r2 = v))}
        />
        <NI
          label="3rd"
          value={ch.retention.weekly.r3}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.r3 = v))}
        />
        <NI
          label="mature"
          value={ch.retention.weekly.rMature}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.rMature = v))}
        />
        <NI
          label="ann renew"
          value={ch.retention.annualRenewal}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.annualRenewal = v))}
        />
      </div>

      <div className="subhead">route — fee, payout &amp; saturation</div>
      <div className="ni-row">
        <NI label="fee %" value={fee} width={44} suffix="%" onChange={setFee} />
        <NI label="payout" value={payout} width={44} suffix="d" onChange={setPayout} />
        <NI
          label="sat $/day"
          value={ch.satPoint}
          width={64}
          onChange={(v) => cf((c) => (c.satPoint = v))}
        />
        <NI
          label="slope"
          value={ch.satSlope}
          width={48}
          onChange={(v) => cf((c) => (c.satSlope = v))}
        />
      </div>
    </div>
  );
}
