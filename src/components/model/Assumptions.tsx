import { useState } from "react";
import type { Params } from "../../lib/types";
import { NI, Sec } from "../atoms";

type Upd = (mut: (p: Params) => void) => void;

// Rarely-touched assumptions, tucked into one collapsible at the bottom. The
// funnels, mix, retention, spend and route fee/payout live in the funnel blocks
// above; the cross-cutting levers live in the plan strip.
export function Assumptions({ params, upd }: { params: Params; upd: Upd }) {
  const p = params;
  const [open, setOpen] = useState(false);
  const wacc = p.valuation.rfRate + p.valuation.beta * p.valuation.erp;

  return (
    <div className="controls">
      <Sec
        title="Advanced — pricing, valuation, fees, capital"
        open={open}
        onToggle={() => setOpen((o) => !o)}
      >
        <div className="subhead">pricing &amp; plans</div>
        <div className="ni-row">
          <NI
            label="Weekly $"
            value={p.plans.wPrice}
            onChange={(v) => upd((q) => (q.plans.wPrice = v))}
          />
          <NI
            label="Monthly $"
            value={p.plans.mPrice}
            onChange={(v) => upd((q) => (q.plans.mPrice = v))}
          />
          <NI
            label="Annual $"
            value={p.plans.aPrice}
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

        <div className="subhead">valuation (DCF / WACC)</div>
        <div className="ni-row">
          <NI
            label="Risk-free"
            value={p.valuation.rfRate}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.rfRate = v))}
          />
          <NI
            label="ERP"
            value={p.valuation.erp}
            width={44}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.erp = v))}
          />
          <NI
            label="Beta"
            value={p.valuation.beta}
            width={48}
            onChange={(v) => upd((q) => (q.valuation.beta = v))}
          />
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
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.valuation.termGrowth = v))}
          />
          <span className="lblmono">WACC {wacc.toFixed(2)}%</span>
        </div>

        <div className="subhead">fees &amp; capital</div>
        <div className="ni-row">
          <NI
            label="web fixed $/txn"
            value={p.routes.webFixed}
            width={50}
            onChange={(v) => upd((q) => (q.routes.webFixed = v))}
          />
          <NI
            label="app fee >$1M %"
            value={p.routes.appFeeHigh}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.routes.appFeeHigh = v))}
          />
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
            width={64}
            onChange={(v) => upd((q) => (q.capital.reserve = v))}
          />
          <NI
            label="IDR per USD"
            value={p.fx}
            width={70}
            onChange={(v) => upd((q) => (q.fx = v))}
          />
        </div>
      </Sec>
    </div>
  );
}
