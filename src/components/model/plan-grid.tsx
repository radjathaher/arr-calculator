import type { Channel, Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { channelEconomics } from "../../lib/economics";
import { NI } from "../atoms";

// Transposed plan matrix for one channel: columns are weekly · monthly · annual,
// rows are the editable inputs (price, mix, trial, the full three-step renewal
// curve) plus a read-only LTV each plan is worth. Every plan — including annual —
// now carries a full 1st/2nd/mature step-down.
export function PlanGrid({
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
  const C = (n: number) => money(n, cur, fx);
  const cf = (mut: (c: Channel) => void) => upd((q) => mut(q.channels[idx]));
  const W = 48;

  return (
    <div className="plan-grid">
      <span className="pg-corner" />
      <span className="pg-col-h">weekly</span>
      <span className="pg-col-h">monthly</span>
      <span className="pg-col-h">annual</span>

      <span className="pg-row-h">price $</span>
      <NI label="" value={ch.prices.wPrice} width={W} onChange={(v) => cf((c) => (c.prices.wPrice = v))} />
      <NI label="" value={ch.prices.mPrice} width={W} onChange={(v) => cf((c) => (c.prices.mPrice = v))} />
      <NI label="" value={ch.prices.aPrice} width={W} onChange={(v) => cf((c) => (c.prices.aPrice = v))} />

      <span className="pg-row-h">mix %</span>
      <NI label="" value={ch.mix.weekly} width={W} suffix="%" onChange={(v) => cf((c) => (c.mix.weekly = v))} />
      <NI label="" value={ch.mix.monthly} width={W} suffix="%" onChange={(v) => cf((c) => (c.mix.monthly = v))} />
      <NI label="" value={ch.mix.annual} width={W} suffix="%" onChange={(v) => cf((c) => (c.mix.annual = v))} />

      <span className="pg-row-h">trial d</span>
      <NI label="" value={ch.trials.weekly} width={W} suffix="d" onChange={(v) => cf((c) => (c.trials.weekly = v))} />
      <NI label="" value={ch.trials.monthly} width={W} suffix="d" onChange={(v) => cf((c) => (c.trials.monthly = v))} />
      <NI label="" value={ch.trials.annual} width={W} suffix="d" onChange={(v) => cf((c) => (c.trials.annual = v))} />

      <span className="pg-row-h">1st renew %</span>
      <NI label="" value={ch.retention.weekly.r1} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.weekly.r1 = v))} />
      <NI label="" value={ch.retention.monthly.r1} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.monthly.r1 = v))} />
      <NI label="" value={ch.retention.annual.r1} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.annual.r1 = v))} />

      <span className="pg-row-h">2nd renew %</span>
      <NI label="" value={ch.retention.weekly.r2} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.weekly.r2 = v))} />
      <NI label="" value={ch.retention.monthly.r2} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.monthly.r2 = v))} />
      <NI label="" value={ch.retention.annual.r2} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.annual.r2 = v))} />

      <span className="pg-row-h">mature %</span>
      <NI label="" value={ch.retention.weekly.rMature} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.weekly.rMature = v))} />
      <NI label="" value={ch.retention.monthly.rMature} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.monthly.rMature = v))} />
      <NI label="" value={ch.retention.annual.rMature} width={W} suffix="%" onChange={(v) => cf((c) => (c.retention.annual.rMature = v))} />

      <span className="pg-row-h">LTV</span>
      <span className="pg-ltv">{C(e.ltvW)}</span>
      <span className="pg-ltv">{C(e.ltvM)}</span>
      <span className="pg-ltv">{C(e.ltvA)}</span>
    </div>
  );
}
