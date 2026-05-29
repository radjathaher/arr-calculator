import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";
import { T } from "../../lib/defaults";

// Living, formula-level documentation of the simulation engine, organized to
// mirror its code domains (acquisition, retention, billing, payout, cash,
// valuation). This reads as a precise spec a developer could re-implement from.
// Numbers and formulas track src/lib/engine.ts, economics.ts, and defaults.ts.

function Domain({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="expl-domain">
      <span className="expl-domain-tag">{tag}</span>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// Tiny illustration of the 3-point step-down survival curve (tickRet) using the
// paid-weekly defaults: r1=55, r2=78, rMature=87.
function RetentionChart() {
  const r1 = 0.55;
  const r2 = 0.78;
  const rM = 0.87;
  const data = Array.from({ length: 8 }, (_, k) => {
    let f = 1;
    if (k >= 1) f = r1;
    if (k >= 2) f = r1 * r2;
    if (k >= 3) f = r1 * r2 * Math.pow(rM, k - 2);
    return { k: `k${k}`, surv: Math.round(f * 100) };
  });
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <XAxis dataKey="k" tick={{ fontSize: 9, fill: T.muted }} />
        <Bar dataKey="surv" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? T.gold : i === 1 ? T.danger : T.teal} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EngineDocs() {
  return (
    <div className="expl-docs">
      <div className="expl-docs-head">
        <span className="expl-kicker">The engine, spelled out</span>
        <h2>How the numbers are actually computed</h2>
        <p className="expl-docs-sub">
          The story above is the intuition. Below is the spec: every formula the daily cohort
          simulation runs, in the order the code runs them. Day 0 = 1 Jun 2026; the loop ticks once
          per day until ARR hits the target (5-year cap).
        </p>
      </div>

      <Domain tag="01 · Acquisition" title="Spend turns into customers, linearly">
        <p>
          Acquisition is a deterministic cost ladder. Each step divides cost by a conversion rate,
          so a worse rate multiplies cost:
        </p>
        <pre className="expl-code">
          {`CPI           = CPM / 1000 ÷ (impression-to-install %)
cost-per-trial = CPI         ÷ (install-to-trial %)
CAC            = cost-per-trial ÷ (trial-to-paid %)

customers acquired = adSpend ÷ CAC`}
        </pre>
        <p>
          With the paid defaults (<code>CPM 20</code>, <code>impression-to-install 0.8%</code>,{" "}
          <code>install-to-trial 13.3%</code>, <code>trial-to-paid 30%</code>): CPI{" "}
          <code>$2.50</code> → cost-per-trial <code>$18.80</code> → CAC <code>≈$63</code>. There is
          no saturation curve here in the explainer's example — spend in, customers out, in fixed
          proportion. Cheaper customers (better creative CVR) shift every downstream number, all the
          way through to <code>blended LTV</code>.
        </p>
      </Domain>

      <Domain tag="02 · Retention" title="A 3-point step-down survival curve (tickRet)">
        <p>
          Each cohort decays on a 3-point curve. <code>tickRet(sd, k)</code> returns the cumulative
          fraction still paying at billing tick <code>k</code>:
        </p>
        <pre className="expl-code">
          {`tickRet(sd, k):
  k = 0  -> 1                         (everyone pays the 1st charge)
  k = 1  -> r1                        (1st renewal — brutal)
  k = 2  -> r1·r2                     (2nd renewal)
  k ≥ 3  -> r1·r2·rMature^(k−2)       (flat mature decay)

lifetime (billing ticks) = Σ tickRet(sd, k)`}
        </pre>
        <p>
          This runs <b>per plan</b> (weekly / monthly / annual) <b>per channel</b> — each has its
          own <code>{`{ r1, r2, rMature }`}</code>. The sum of the curve is the lifetime in ticks;
          multiplied by price × gross margin it becomes LTV (see <code>weeklyLifetime</code> /{" "}
          <code>channelEconomics</code>). The cliff at <code>k=1</code> is the single biggest LTV
          lever.
        </p>
        <RetentionChart />
        <p className="expl-cap">
          Cumulative survival, paid-weekly defaults (r1 55%, r2 78%, rMature 87%). Gold = first
          charge, red = the brutal 1st renewal, teal = the flattening mature tail.
        </p>
      </Domain>

      <Domain tag="03 · Billing / cohorts" title="Each cohort is scheduled forward in time">
        <p>
          When <code>n</code> customers are acquired on day <code>d</code>, they're split by the
          channel's plan mix and scheduled as future charges (function <code>sched</code>):
        </p>
        <pre className="expl-code">
          {`first charge day = d + max(1, trialDays)      (0-day trial → next day)
charge cadence   = every 7 / 30 / 365 days   (weekly / monthly / annual)
charge k amount  = n · planMix · tickRet(sd, k) · price[channel][plan]`}
        </pre>
        <p>
          Survival scales every charge, so a cohort's billing tapers as it churns. Active counts are
          tracked with difference arrays (a charge adds at its day and subtracts one period later),
          which is how ARR and recognised revenue are reconstructed each tick. Price is the{" "}
          <b>channel's per-plan price</b> baked in at schedule time.
        </p>
      </Domain>

      <Domain tag="04 · Payout" title="When the billed money actually lands as cash">
        <p>Two collection paths, modeled distinctly:</p>
        <p>
          <b>WEB — rolling.</b> Each day's net (after ~6% fee + fixed per-txn) lands{" "}
          <code>webPayoutDays</code> (default 10) later, shifted to <b>Monday</b> if it would fall
          on a weekend. Smooth and fast.
        </p>
        <p>
          <b>IAP / App Store — Apple-faithful lump.</b> Net revenue accrues per Apple{" "}
          <b>fiscal month</b>, then is paid as one lump <b>33 days after that fiscal month closes</b>
          :
        </p>
        <pre className="expl-code">
          {`Apple fiscal calendar:
  FY starts the last Sunday of September
  quarters are 5-4-4 weeks; every fiscal month ends on a Saturday
  payout = sum(net revenue in fiscal month) landed 33 days after month-end`}
        </pre>
        <p>
          So a single charge can wait <b>~45–75 days</b> for cash, arriving as a fat monthly deposit
          rather than a daily trickle. The 33-day figure sits inside Apple's legal maximum of{" "}
          <i>"within 45 days of the fiscal month end"</i> per Apple's App Store Connect payment docs.
        </p>
        <pre className="expl-code expl-ascii">
          {`WEB   charge ──10d──▶ $ $ $ $ $ $   (smooth, rolling)

IAP   charge ─────accrue all month─────▶ │
                          month close +33d │▌  (one lump)`}
        </pre>
      </Domain>

      <Domain tag="05 · Cash" title="One net balance, recycled marketing">
        <p>
          The model tracks a single <b>net balance = cash − credit drawn</b>. Payouts add to it.
          Marketing is <b>recycle-only</b>: it spends just the cash on hand, so you spend, wait for
          the payout, get paid back, and spend again — it never draws the credit line:
        </p>
        <pre className="expl-code">
          {`infraPaid   = min(infra, max(0, balance + creditLimit))  (fixed cost; may use credit)
spendRoom   = max(0, balance − infraPaid)                (positive cash only)
adSpend     = min(desiredAdSpend, spendRoom)             (ads self-funded)

balance −= adSpend + infraPaid`}
        </pre>
        <p>
          Because ad spend only ever uses cash you actually hold, the net balance draws down as you
          buy installs, then recovers ~10 days later (web) or on the next app-store lump as the cash
          lands — a draw-and-recover sawtooth rather than a pinned credit line. Growth is therefore
          self-funded: it can only go as fast as collected cash allows. The credit line is a backstop
          for <b>infra</b> and <b>founder draws</b>; a draw on the 1st of the month is the only thing
          that can push the balance below <code>−creditLimit</code> (<b>insolvency</b>).{" "}
          <b>Cash-positive</b> = the first day the balance climbs back to <code>≥ 0</code> after
          dipping negative.
        </p>
      </Domain>

      <Domain tag="06 · Valuation" title="Daily DCF to an enterprise & equity value">
        <p>The run is discounted into a present value with a CAPM cost of capital:</p>
        <pre className="expl-code">
          {`WACC      = rf + β · ERP

per day:
  EBIT    = recRev · grossMargin − adSpend
  NOPAT   = EBIT − tax·max(0, EBIT)
  FCF     = NOPAT − ΔAR + Δdeferred
  PV     += FCF / (1 + WACC)^(day/365)

terminal  = Gordon TV on horizon ARR, discounted to today
EV        = Σ PV(FCF) + PV(terminal)
equity    = EV + ending net cash`}
        </pre>
        <p>
          Free cash flow corrects accrual profit for working capital: subtract the rise in
          processor receivables (<code>ΔAR</code>, cash still owed to you) and add the rise in
          deferred revenue (<code>Δdeferred</code>, cash collected but not yet earned). The terminal
          value is a Gordon-growth perpetuity on horizon ARR. <code>EV / horizon ARR</code> is the
          familiar revenue multiple.
        </p>
      </Domain>

      <p className="expl-docs-end">
        That's the whole engine. Open the <b>Model</b> tab to drive these formulas with live dials
        and watch the date, the cash trough, and the valuation move.
      </p>
    </div>
  );
}
