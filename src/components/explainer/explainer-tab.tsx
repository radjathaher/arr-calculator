import { ChurnBucket, Flywheel, FunnelCalc, PayoutTrap } from "./widgets";

// A short field guide to the model: two ways to buy growth, the leaky bucket,
// the cash gap, and the three dials you actually set to race to an ARR target.
export function ExplainerTab() {
  return (
    <div className="zine">
      <div className="z-hero">
        <div className="z-kicker">A field guide</div>
        <h1>
          You shipped an app.
          <br />
          Now what?
        </h1>
        <p className="z-sub">
          Months of work, you launch, and revenue is <span className="mono">$0</span>. Growth is a
          machine: it buys attention, turns it into paying subscribers, and recycles the cash faster
          than it burns. Here are the few dials that decide whether it reaches{" "}
          <span className="mono">$1M ARR</span> — and when.
        </p>
      </div>

      <div className="z-body">
        <p className="z-lead">
          Everything below reduces to three decisions:{" "}
          <b>how much to spend on paid ads vs organic</b>, <b>how fast to grow that spend</b>, and{" "}
          <b>how much to pay yourself</b>. The rest is the machinery that turns those into ARR,
          cash, and a valuation.
        </p>

        <span className="act-tag first">01 · Two ways to buy a stranger</span>
        <h2>Paid ads vs. organic</h2>
        <p>
          <b>Paid ads</b> land ready-to-buy users, but the CPM is brutal — every install costs real
          money. The upside: you route them through your own <b>web checkout</b>, so the fee is
          small (~6%) and the cash comes back in about <b>10 days</b>.
        </p>
        <p>
          <b>Organic / UGC</b> — paying creators to post — is dirt-cheap to reach (a $0.13 install
          is real), but it converts worse and bills through the <i>app store</i>: a{" "}
          <b>15–30% cut</b> and a <b>~60-day</b> payout. Cheap to acquire, expensive and slow to
          collect.
        </p>
        <p>Money in ÷ paying customers out = your CAC. Drag the funnel and watch it move:</p>
        <FunnelCalc />
        <aside className="sidenote">
          The whole paid-vs-organic choice is a trade between <b>cost</b> (organic wins) and{" "}
          <b>cash speed + margin</b> (paid wins). The model prices both so you can see which gets
          you to the target without going broke.
        </aside>

        <span className="act-tag">02 · The leaky bucket</span>
        <h2>Keep them, or run to stand still</h2>
        <p>
          Every week some subscribers cancel. Pour in faster than it leaks and you grow; otherwise
          you plateau — new sign-ups just replace the ones churning out. The hole is widest at the
          very top: about half of weekly users vanish after the first charge.
        </p>
        <ChurnBucket />

        <span className="act-tag">03 · The cash gap</span>
        <h2>Earned ≠ in the bank</h2>
        <p>
          You pay for ads <i>today</i>. Web money lands in ~10 days; app-store money in ~60. Spend
          now, collect much later, with bills stacking in between — that gap is where good apps die.
          Your credit line is the bridge; used too hard, the bill beats the money.
        </p>
        <PayoutTrap />

        <span className="act-tag">04 · The three dials</span>
        <h2>Race to your target</h2>
        <p>
          So the decision is: split spend between paid and organic, set how fast it{" "}
          <b>grows each month</b>, and how much you <b>draw</b> out. Flat spend plateaus; growth
          compounds — but grow too fast and you outrun your cash. The model runs until you hit your
          ARR goal and tells you the date, the cash, and what the company is worth.
        </p>
        <Flywheel />

        <ol className="z-moves">
          <li>
            <b>Cheaper customers.</b> Everything compounds off CAC.
          </li>
          <li>
            <b>Faster cash.</b> Web (10d) beats app store (60d) — speed is free growth.
          </li>
          <li>
            <b>Keep them past week one.</b> The biggest lever on lifetime value.
          </li>
          <li>
            <b>Grow spend — but stay solvent.</b> The whole game in one line.
          </li>
        </ol>

        <p className="z-end">
          That's the machine. Open the <b>Model</b> tab, set the dials, and watch when you hit your
          target.
        </p>
      </div>
    </div>
  );
}
