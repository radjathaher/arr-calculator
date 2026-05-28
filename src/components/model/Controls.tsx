import type { Params } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { START } from "../../lib/engine";
import { NI, Sec } from "../atoms";
import { ChannelEditor } from "./ChannelEditor";

const MONTHS: string[] = (() => {
  const out: string[] = [];
  let d = new Date(START);
  for (let k = 0; k < 61; k++) {
    out.push(
      d.toLocaleString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(2),
    );
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return out;
})();

type Upd = (mut: (p: Params) => void) => void;

export function Controls({
  params,
  upd,
  open,
  tog,
  cur,
  fx,
  maxDrawVal,
}: {
  params: Params;
  upd: Upd;
  open: Record<string, boolean>;
  tog: (k: string) => void;
  cur: Currency;
  fx: number;
  maxDrawVal: number;
}) {
  const p = params;
  const wacc = p.valuation.rfRate + p.valuation.beta * p.valuation.erp;
  const drawTooHigh = p.capital.founderDraw > maxDrawVal + 1;
  const C = (n: number) => money(n, cur, fx);

  return (
    <div className="controls">
      <Sec title="Capital & withdrawal" open={open.cap} onToggle={() => tog("cap")}>
        <div className="ni-row">
          <NI
            label="Start cash"
            value={p.capital.startCash}
            step={1000}
            width={74}
            onChange={(v) => upd((q) => (q.capital.startCash = v))}
          />
          <NI
            label="Credit limit"
            value={p.capital.creditLimit}
            step={1000}
            width={74}
            onChange={(v) => upd((q) => (q.capital.creditLimit = v))}
          />
          <NI
            label="AP days"
            value={p.capital.apDays}
            width={44}
            suffix="d"
            onChange={(v) => upd((q) => (q.capital.apDays = v))}
          />
          <NI
            label="Reserve"
            value={p.capital.reserve}
            step={500}
            width={64}
            onChange={(v) => upd((q) => (q.capital.reserve = v))}
          />
        </div>
        <div className="ni-row">
          <NI
            label="Founder draw/mo"
            value={p.capital.founderDraw}
            step={250}
            width={72}
            onChange={(v) => upd((q) => (q.capital.founderDraw = v))}
          />
          <label className="ni">
            <span>Draw starts</span>
            <select
              className="nospin"
              value={p.capital.drawStartMonth}
              onChange={(e) =>
                upd((q) => (q.capital.drawStartMonth = Number.parseInt(e.target.value)))
              }
            >
              {MONTHS.map((m, j) => (
                <option key={j} value={j}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <span className={drawTooHigh ? "hint bad" : "hint ok"}>max ≈ {C(maxDrawVal)}/mo</span>
        </div>
      </Sec>

      <Sec title="Marketing budget" open={open.mkt} onToggle={() => tog("mkt")}>
        <div className="ni-row">
          <NI
            label="Budget/mo"
            value={p.marketing.monthlyBudget}
            step={500}
            width={78}
            onChange={(v) => upd((q) => (q.marketing.monthlyBudget = v))}
          />
          <NI
            label="Ramp/mo"
            value={p.marketing.budgetGrowthPct}
            step={1}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.marketing.budgetGrowthPct = v))}
          />
          <NI
            label="Paid share"
            value={p.marketing.paidShare}
            step={5}
            width={48}
            suffix="%"
            onChange={(v) => upd((q) => (q.marketing.paidShare = Math.max(0, Math.min(100, v))))}
          />
          <span className="lblmono">organic {100 - p.marketing.paidShare}%</span>
        </div>
        <div className="inline-note">
          Budget is financed on the card and capped by safe credit headroom. If it exceeds what your
          working capital can sustain, it is throttled to stay solvent. Hit <b>Optimize</b> to push
          to the safe maximum and best paid/organic split.
        </div>
      </Sec>

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
          LTV, CAC, payback and margin in the cards above are derived from the funnels, plans and
          retention. Infra is the one plugged cost — hosting/AI/support as a share of recognised
          revenue.
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
        <div className="inline-note">
          Enterprise value is every future dollar the business earns, discounted to today. Faster
          cash is worth more, so quick web payouts beat slow app-store ones. WACC = risk-free + β ×
          ERP (Damodaran method); terminal value uses Gordon growth, cross-checked against the
          implied ARR multiple.
        </div>
      </Sec>
    </div>
  );
}
