import { useState } from "react";
import type { Params } from "../../lib/types";
import { NI, Sec } from "../atoms";

type Upd = (mut: (p: Params) => void) => void;

// Rarely-touched assumptions in one collapsible at the bottom. Spend, funnel,
// pricing, mix, retention and route fee/payout live in the funnel blocks.
export function Assumptions({ params, upd }: { params: Params; upd: Upd }) {
  const p = params;
  const [open, setOpen] = useState(false);
  const wacc = p.valuation.rfRate + p.valuation.beta * p.valuation.erp;

  return (
    <div className="controls">
      <Sec
        title="Advanced — valuation, fees, currency"
        open={open}
        onToggle={() => setOpen((o) => !o)}
      >
        <div className="subhead">product &amp; infra</div>
        <div className="ni-row">
          <NI
            label="Infra % of revenue"
            value={p.unit.infraPct}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.unit.infraPct = v))}
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

        <div className="subhead">fees &amp; currency</div>
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
