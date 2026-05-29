import { useState } from "react";
import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { NI, Sec } from "../atoms";
import { ChannelEditor } from "./ChannelEditor";

type Upd = (mut: (p: Params) => void) => void;

// Advanced, rarely-touched assumptions. The six founder decisions live in the
// cockpit; everything here ships with a sensible default.
export function Assumptions({
  params,
  upd,
  cur,
  fx,
}: {
  params: Params;
  upd: Upd;
  cur: Currency;
  fx: number;
}) {
  const p = params;
  const [open, setOpen] = useState<Record<string, boolean>>({
    price: false,
    paid: false,
    org: false,
    fee: false,
    unit: false,
    dcf: false,
    cap: false,
  });
  const tog = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const wacc = p.valuation.rfRate + p.valuation.beta * p.valuation.erp;

  return (
    <div className="controls">
      <Sec title="Pricing & plans" open={open.price} onToggle={() => tog("price")}>
        <div className="ni-row">
          <NI
            label="Weekly $"
            value={p.plans.wPrice}
            step={0.5}
            onChange={(v) => upd((q) => (q.plans.wPrice = v))}
          />
          <NI
            label="Monthly $"
            value={p.plans.mPrice}
            step={0.5}
            onChange={(v) => upd((q) => (q.plans.mPrice = v))}
          />
          <NI
            label="Annual $"
            value={p.plans.aPrice}
            step={1}
            onChange={(v) => upd((q) => (q.plans.aPrice = v))}
          />
          <NI
            label="Trial"
            value={p.plans.trialDays}
            width={40}
            suffix="d"
            onChange={(v) => upd((q) => (q.plans.trialDays = v))}
          />
        </div>
      </Sec>

      <Sec
        title="Paid ads — funnel, plans, retention"
        open={open.paid}
        onToggle={() => tog("paid")}
      >
        <ChannelEditor
          ch={p.channels[0]}
          cur={cur}
          fx={fx}
          onField={(m) => upd((q) => m(q.channels[0]))}
        />
      </Sec>

      <Sec
        title="Organic / UGC — funnel, plans, retention"
        open={open.org}
        onToggle={() => tog("org")}
      >
        <ChannelEditor
          ch={p.channels[1]}
          cur={cur}
          fx={fx}
          onField={(m) => upd((q) => m(q.channels[1]))}
        />
      </Sec>

      <Sec title="Routes — fees & payout timing" open={open.fee} onToggle={() => tog("fee")}>
        <div className="subhead">web checkout</div>
        <div className="ni-row">
          <NI
            label="fee %"
            value={p.routes.webFeePct}
            step={0.5}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.routes.webFeePct = v))}
          />
          <NI
            label="fixed $"
            value={p.routes.webFixed}
            step={0.05}
            width={50}
            onChange={(v) => upd((q) => (q.routes.webFixed = v))}
          />
          <NI
            label="payout"
            value={p.routes.webPayoutDays}
            width={44}
            suffix="d"
            onChange={(v) => upd((q) => (q.routes.webPayoutDays = v))}
          />
        </div>
        <div className="subhead">app store</div>
        <div className="ni-row">
          <NI
            label="fee <$1M"
            value={p.routes.appFeeLow}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.routes.appFeeLow = v))}
          />
          <NI
            label="fee >$1M"
            value={p.routes.appFeeHigh}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.routes.appFeeHigh = v))}
          />
          <NI
            label="payout"
            value={p.routes.appPayoutDays}
            width={44}
            suffix="d"
            onChange={(v) => upd((q) => (q.routes.appPayoutDays = v))}
          />
        </div>
      </Sec>

      <Sec title="Unit economics" open={open.unit} onToggle={() => tog("unit")}>
        <div className="ni-row">
          <NI
            label="Infra % of revenue"
            value={p.unit.infraPct}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.unit.infraPct = v))}
          />
        </div>
        <div className="inline-note">
          COGS = recognised revenue × (blended payment-fee rate + infra %). LTV/CAC/payback/margin
          are derived from the funnels, plans and retention.
        </div>
      </Sec>

      <Sec title="Valuation (DCF / WACC)" open={open.dcf} onToggle={() => tog("dcf")}>
        <div className="ni-row">
          <NI
            label="Risk-free"
            value={p.valuation.rfRate}
            step={0.1}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.rfRate = v))}
          />
          <NI
            label="ERP"
            value={p.valuation.erp}
            step={0.1}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.erp = v))}
          />
          <NI
            label="Beta"
            value={p.valuation.beta}
            step={0.05}
            width={48}
            onChange={(v) => upd((q) => (q.valuation.beta = v))}
          />
          <span className="lblmono">WACC {wacc.toFixed(2)}%</span>
        </div>
        <div className="ni-row">
          <NI
            label="Tax"
            value={p.valuation.taxRate}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.taxRate = v))}
          />
          <NI
            label="Term growth"
            value={p.valuation.termGrowth}
            step={0.5}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.termGrowth = v))}
          />
        </div>
      </Sec>

      <Sec title="Capital & currency" open={open.cap} onToggle={() => tog("cap")}>
        <div className="ni-row">
          <NI
            label="AP days"
            value={p.capital.apDays}
            width={44}
            suffix="d"
            onChange={(v) => upd((q) => (q.capital.apDays = v))}
          />
          <NI
            label="Cash reserve"
            value={p.capital.reserve}
            step={500}
            width={64}
            onChange={(v) => upd((q) => (q.capital.reserve = v))}
          />
          <NI
            label="IDR per USD"
            value={p.fx}
            step={10}
            width={70}
            onChange={(v) => upd((q) => (q.fx = v))}
          />
        </div>
      </Sec>
    </div>
  );
}
