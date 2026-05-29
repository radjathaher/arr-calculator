import type { Channel, Params, RouteKind } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { channelEconomics } from "../../lib/economics";
import { NI } from "../atoms";

// One acquisition channel, full: spend, the funnel as a rate│cost ladder
// (CPM → CPI → cost/trial → CAC), plan mix + per-channel pricing + the LTV each
// plan is worth, retention, and the route's fee/payout.
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

      <div className="subhead">spend &amp; funnel — rate │ cost per step</div>
      <div className="ni-row">
        <NI label="spend $/mo" value={spend} width={84} onChange={setSpend} />
      </div>
      <div className="funnel-ladder">
        <div className="fl-row">
          <NI
            label="CPM"
            value={ch.funnel.cpm}
            width={64}
            onChange={(v) => cf((c) => (c.funnel.cpm = v))}
          />
          <span className="fl-cost" />
        </div>
        <div className="fl-row">
          <NI
            label="imp→install %"
            value={ch.funnel.impToInstall}
            width={64}
            suffix="%"
            onChange={(v) => cf((c) => (c.funnel.impToInstall = v))}
          />
          <span className="fl-cost">
            CPI <b>{C(e.cpi)}</b>
          </span>
        </div>
        <div className="fl-row">
          <NI
            label="install→trial %"
            value={ch.funnel.installToTrial}
            width={64}
            suffix="%"
            onChange={(v) => cf((c) => (c.funnel.installToTrial = v))}
          />
          <span className="fl-cost">
            cost/trial <b>{C(e.costPerTrial)}</b>
          </span>
        </div>
        <div className="fl-row">
          <NI
            label="trial→paid %"
            value={ch.funnel.trialToPaid}
            width={64}
            suffix="%"
            onChange={(v) => cf((c) => (c.funnel.trialToPaid = v))}
          />
          <span className="fl-cost">
            CAC <b>{C(e.cac)}</b>
          </span>
        </div>
      </div>

      <div className="subhead">plans — mix % · price $ · LTV</div>
      <div className="ni-row">
        <NI
          label="weekly mix"
          value={ch.mix.weekly}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.weekly = v))}
        />
        <NI
          label="weekly $"
          value={ch.prices.wPrice}
          width={56}
          onChange={(v) => cf((c) => (c.prices.wPrice = v))}
        />
        <span className="fl-cost">
          LTV <b>{C(e.ltvW)}</b>
        </span>
      </div>
      <div className="ni-row">
        <NI
          label="monthly mix"
          value={ch.mix.monthly}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.monthly = v))}
        />
        <NI
          label="monthly $"
          value={ch.prices.mPrice}
          width={56}
          onChange={(v) => cf((c) => (c.prices.mPrice = v))}
        />
        <span className="fl-cost">
          LTV <b>{C(e.ltvM)}</b>
        </span>
      </div>
      <div className="ni-row">
        <NI
          label="annual mix"
          value={ch.mix.annual}
          width={48}
          suffix="%"
          onChange={(v) => cf((c) => (c.mix.annual = v))}
        />
        <NI
          label="annual $"
          value={ch.prices.aPrice}
          width={56}
          onChange={(v) => cf((c) => (c.prices.aPrice = v))}
        />
        <span className="fl-cost">
          LTV <b>{C(e.ltvA)}</b>
        </span>
      </div>

      <div className="subhead">retention % — 1st · 2nd · mature</div>
      <div className="ni-row">
        <NI
          label="wk 1st"
          value={ch.retention.weekly.r1}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.r1 = v))}
        />
        <NI
          label="wk 2nd"
          value={ch.retention.weekly.r2}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.weekly.r2 = v))}
        />
        <NI
          label="wk mature"
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
      <div className="ni-row">
        <NI
          label="mo 1st"
          value={ch.retention.monthly.r1}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.monthly.r1 = v))}
        />
        <NI
          label="mo 2nd"
          value={ch.retention.monthly.r2}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.monthly.r2 = v))}
        />
        <NI
          label="mo mature"
          value={ch.retention.monthly.rMature}
          width={44}
          suffix="%"
          onChange={(v) => cf((c) => (c.retention.monthly.rMature = v))}
        />
      </div>

      <div className="subhead">route — fee % · payout days</div>
      <div className="ni-row">
        <NI label="fee %" value={fee} width={44} suffix="%" onChange={setFee} />
        <NI label="payout" value={payout} width={44} suffix="d" onChange={setPayout} />
      </div>
    </div>
  );
}
