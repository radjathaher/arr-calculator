import { EngineDocs } from "./engine-docs";
import { T } from "../../lib/defaults";

// The Explainer tab: plain, static editorial concepts (no scrollytelling, no
// pinning) that walk the customer lifecycle and the cash lifecycle end to end —
// the journey from $0 to $1M ARR — followed by the model's formula-level docs.

// Fixed teaching numbers, chosen for legibility. The live model lives on the
// Model tab; these never animate or recompute here.
const CAC = 63;
const WEEKLY = 9.99;
const WEB_LAG = 10;
const LTV = 41;

const num = (n: number): string => `$${n.toFixed(2)}`;

// A small reusable static concept section: kicker tag + title + prose/diagram.
function Concept({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="expl-concept">
      <span className="expl-concept-tag">{tag}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// Still side-by-side comparison of the two acquisition paths.
function PrayVsAcquire() {
  return (
    <div className="expl-split">
      <div className="expl-split-col" style={{ borderTopColor: T.muted }}>
        <div className="expl-split-head" style={{ color: T.muted }}>
          🙏 pray
        </div>
        <p>
          Ship it and wait. Refresh the dashboard. Hope the algorithm blesses you. Free, but you are
          not in control — most days the number stays <code>$0</code>.
        </p>
      </div>
      <div className="expl-split-col" style={{ borderTopColor: T.teal }}>
        <div className="expl-split-head" style={{ color: T.teal }}>
          🚀 acquire
        </div>
        <p>
          Go get users on purpose. Two roads:
        </p>
        <ul className="expl-list">
          <li>
            <b style={{ color: T.green }}>Organic</b> — cheap, slow, compounding. App-store search,
            content, word of mouth. You trade time for cost.
          </li>
          <li>
            <b style={{ color: T.orange }}>Paid</b> — fast, pricey, predictable. Buy impressions,
            push to a web checkout. You trade cash for speed.
          </li>
        </ul>
      </div>
    </div>
  );
}

// Still single timeline of one customer's life, drawn as inline ASCII so it
// renders identically everywhere with zero motion.
function CustomerTimeline() {
  const stages = `  day 0        day 1       day 4         +7d          +14d          ~+25d            tail
   │            │           │             │             │              │                │
 see ad ──▶  install ──▶  trial ──▶  first charge ─▶ renewal 1 ──▶ renewal 2 ──▶ mature renewals
                          (3-day)    ${num(WEEKLY)}      THE CLIFF      it calms       (or churn)
                                                       ~½ drop off      down`;
  return (
    <pre className="expl-code expl-ascii" aria-label="customer lifecycle timeline">
      {stages}
    </pre>
  );
}

// Still diagram of the cash gap: spend leaves today, money lands much later.
function CashGap() {
  return (
    <div className="expl-cash">
      <div className="expl-cash-row">
        <span className="expl-cash-label" style={{ color: T.danger }}>
          spend
        </span>
        <div className="expl-cash-bar">
          <span className="expl-cash-mark expl-cash-out" style={{ left: "2%" }}>
            −{num(CAC)} ad spend, today
          </span>
        </div>
      </div>
      <div className="expl-cash-row">
        <span className="expl-cash-label" style={{ color: T.green }}>
          web in
        </span>
        <div className="expl-cash-bar">
          <span className="expl-cash-mark" style={{ left: "30%", color: T.green }}>
            +{num(WEEKLY * 0.94)} · {WEB_LAG}d later, rolling
          </span>
        </div>
      </div>
      <div className="expl-cash-row">
        <span className="expl-cash-label" style={{ color: T.orange }}>
          IAP in
        </span>
        <div className="expl-cash-bar">
          <span className="expl-cash-mark" style={{ left: "70%", color: T.orange }}>
            one lumpy lump · ~33–45d after Apple's fiscal month closes
          </span>
        </div>
      </div>
      <div className="expl-cash-axis">
        <span style={{ left: "2%" }}>today</span>
        <span style={{ left: "50%" }}>weeks pass…</span>
        <span style={{ left: "92%" }}>cash lands</span>
      </div>
    </div>
  );
}

export function ExplainerTab() {
  return (
    <div className="expl">
      <header className="expl-hero">
        <div className="expl-kicker">A field guide · $0 → $1M ARR</div>
        <h1>
          You just shipped.
          <br />
          What's next?
        </h1>
        <p className="expl-sub">
          You shipped a subscription app. The app is live, the code is clean, and revenue is{" "}
          <code>$0</code>. From here you have exactly two moves: sit and <i>pray</i> users wander in,
          or go <b>acquire</b> them — organically for cheap and slow, or by spending on paid ads for
          fast and pricey. This guide walks the whole thing end to end: follow your customer from the
          ad they scroll past to their last renewal, and your cash from the spend today until it
          lands in the bank and funds the next ad — the journey from <code>$0</code> to{" "}
          <code>$1M ARR</code>.
        </p>
      </header>

      <Concept tag="01 · The choice" title="Pray, or acquire">
        <p>
          Praying is free and it feels safe, but it is not a plan. Acquiring is a decision: you point
          money or effort at strangers and convert a fraction of them into your paying customers. The
          two channels behave very differently, and the rest of this guide is about what happens
          after you choose.
        </p>
        <PrayVsAcquire />
      </Concept>

      <Concept tag="02 · Customer lifecycle" title="From a stranger to a mature subscriber">
        <p>
          Follow one of your customers all the way through. They see your ad, install, start a 3-day
          trial, get charged for the first time, then face <b>renewal 1</b> — the brutal cliff where
          roughly <b>half</b> of weekly subscribers fall off. Survive that and the curve flattens:
          renewal 2, then a long tail of mature renewals (or, eventually, churn). Add it all up and
          this one customer is worth about <code>{num(LTV)}</code> — their <b>blended LTV</b>.
        </p>
        <CustomerTimeline />
        <p className="expl-cap">
          One of your customers' lives on a real-day axis. Each charge is{" "}
          <code>{num(WEEKLY)}</code>; the cliff at renewal 1 is the single biggest lever on lifetime
          value.
        </p>
      </Concept>

      <Concept tag="03 · Cash lifecycle" title="The money leaves now and comes back later">
        <p>
          Here is the part that quietly kills indie apps: the cash and the customer are not on the
          same clock. You pay for the ad <i>today</i>, so your balance drops by{" "}
          <code>−{num(CAC)}</code> the instant you buy attention. The customer's first charge happens
          days later — and even then the money is not yours yet. It sits with the processor, then
          lands after a lag:
        </p>
        <ul className="expl-list">
          <li>
            <b style={{ color: T.green }}>Web checkout</b> — small fee, cash lands ~{WEB_LAG} days
            after each charge, rolling. Smooth and fast.
          </li>
          <li>
            <b style={{ color: T.orange }}>App Store / IAP</b> — Apple takes its cut and pays one{" "}
            <b>lumpy monthly lump ~33–45 days</b> after its fiscal month closes. A single charge can
            wait that long before it shows up in the bank.
          </li>
        </ul>
        <CashGap />
        <p className="expl-cap">
          The gap between when your cash leaves (left) and when it returns (right) is the runway you
          have to survive on. Faster cash = the wheel spins more times per year on the same credit
          line.
        </p>
      </Concept>

      <Concept tag="04 · The loop" title="Retain and reinvest your way to $1M ARR">
        <p>
          Once enough payouts land to clear a customer's <code>−{num(CAC)}</code> hole, the surplus
          funds your <b>next</b> ad. That is the flywheel:
        </p>
        <pre className="expl-code expl-ascii" aria-label="the growth flywheel">
          {`   acquire ──▶ convert ──▶ retain ──▶ collect ──▶ reinvest
      ▲                                                  │
      └──────────────────────────────────────────────────┘`}
        </pre>
        <p>
          You reach <code>$1M ARR</code> by keeping this loop net-positive: <b>retain</b> your
          customers longer than they churn and <b>reinvest</b> the returning cash faster than you
          burn it. Every renewal you save and every day you shave off the payout lag lets your wheel
          spin again sooner. That is the whole game — the formulas below are just this loop, written
          out precisely.
        </p>
      </Concept>

      <EngineDocs />
    </div>
  );
}
