import { TwoTimeline } from "./TwoTimeline";
import { ChurnBucket, Flywheel, FunnelCalc, PayoutTrap } from "./widgets";

// The Explainer tab: a warm, second-person teaching piece that bootstraps a
// total layperson into thinking like a subscription-app finance modeler. It
// uses the app's real default numbers and ends by handing the reader to the
// Model tab. Everything visual lives in CSS classes already defined in
// styles.css; only the prose lives here.

export function ExplainerTab() {
  return (
    <div className="zine">
      <header className="z-hero">
        <div className="z-kicker">A field guide to surviving your own app</div>
        <h1>You shipped an app. Now what?</h1>
        <p className="z-sub">
          You launch. You pray for users. <i>Nobody comes.</i> This is the story of the next
          eighteen months — told in <span className="mono">dollars</span>,{" "}
          <span className="mono">days</span>, and the gap between them — and how a{" "}
          <span className="mono">$20k</span> credit line either kills you or makes you.
        </p>
      </header>

      <article className="z-body">
        <p className="z-lead">
          You built a subscription app. People can pay you <b>$9.99 a week</b>,{" "}
          <b>$19.99 a month</b>, or <b>$69.99 a year</b>. Three buttons. The whole rest of this
          guide is about a single, stubborn truth:{" "}
          <i>earning money and having money are not the same thing</i>. Master that gap and you can
          out-grow companies ten times your size. Ignore it and you go broke while technically
          profitable.
        </p>

        {/* ---------------- ACT I ---------------- */}
        <span className="act-tag first">Act I</span>
        <h2>Buy a stranger</h2>
        <p>
          No one installs an app they have never heard of. So you buy attention — you pay to put
          your app in front of strangers and hope a few of them care. This is the funnel, and it
          leaks at every step.
        </p>
        <p>
          Money buys <b>impressions</b> (eyeballs). A sliver of those <b>install</b>. A sliver of
          those start a <b>trial</b>. A sliver of <i>those</i> become a <b>paying customer</b>. By
          the time a real subscriber falls out the bottom, you have spent on hundreds of people who
          did not. That total spend, divided by the one who stayed, is your <b>CAC</b> — customer
          acquisition cost. Drag the sliders and watch it move.
        </p>

        <FunnelCalc />

        <h3>Two kinds of stranger</h3>
        <p>
          Not all strangers cost the same. <b>Paid-ads</b> customers are expensive — you are bidding
          against everyone else for ready-to-buy people — but the algorithm finds buyers who skew
          toward the <b>annual</b> plan and stick around longer. <b>Organic / UGC</b> customers are
          almost free (a homemade video can deliver an install for about{" "}
          <span className="mono">$0.20</span>), but they convert worse, churn faster, and — as we
          will see — pay you through the <i>slow</i> door.
        </p>

        <TwoTimeline stage="funnel" />

        <p className="sidenote">
          The cheapest customer is not the best customer, and the best customer is not the cheapest.
          Most real businesses run a blend of both.
        </p>

        <p>
          Either way, Act I ends with you in the red. You just{" "}
          <b>spent money you don&apos;t have back yet</b>. To get it back, the stranger has to stay.
        </p>

        {/* ---------------- ACT II ---------------- */}
        <span className="act-tag">Act II</span>
        <h2>Keep them (or don&apos;t)</h2>
        <p>
          A new subscriber does not pay you on day one. There is a <b>3-day trial</b> first — a
          deliberate delay where they try the app for free and you have earned exactly nothing. Only
          when the trial ends does the first real charge land.
        </p>
        <p>
          From there, the <i>shape</i> of the money depends on which button they pressed.{" "}
          <b>Weekly</b> is a trickle — $9.99 at a time, again and again, if they keep coming back.{" "}
          <b>Annual</b> is a tide — $69.99 all at once, a year of commitment in a single payment. A
          monthly plan sits in between. More upfront cash is safer for you; smaller commitments are
          easier for them to start.
        </p>

        <TwoTimeline stage="retention" />

        <h3>The leaky bucket</h3>
        <p>
          Every week, some subscribers quietly cancel. That is <b>churn</b>, and it is the silent
          killer of subscription apps. Picture a bucket: you pour new customers in the top, and
          churn drains the old ones out the bottom.{" "}
          <i>Roughly half of weekly users are gone after the first week.</i> The bucket only fills
          if you pour in faster than it leaks.
        </p>

        <ChurnBucket />

        <p>
          Now you can see why CAC alone never tells the whole story. A customer who pays $9.99 once
          is a loss; a customer who pays it forty times is a gold mine. The hopeful version of the
          truth: a customer is worth <b>more than they cost — eventually</b>. The dangerous word is{" "}
          <i>eventually</i>.
        </p>

        {/* ---------------- ACT III ---------------- */}
        <span className="act-tag">Act III</span>
        <h2>Survive the gap</h2>
        <p>
          Here is where most founders get blindsided. When a customer pays, the money does{" "}
          <b>not</b> appear in your bank account. The payment processor holds it, takes a cut, and
          pays you out later — sometimes <i>much</i> later.{" "}
          <b>Earned revenue is not cash in the bank.</b>
        </p>
        <p>
          How much later depends on the door they paid through. <b>Web checkout</b> pays out in
          about <span className="mono">10 days</span>. The <b>app store</b> makes you wait roughly{" "}
          <span className="mono">60 days</span>. That is two full months between a customer&apos;s
          charge and your ability to spend it.
        </p>

        <TwoTimeline stage="cash" />

        <p>
          Watch what that does to your bank balance when you are spending on ads every single day
          but only collecting on a lag. Flip between the two payout speeds:
        </p>

        <PayoutTrap />

        <h3>The credit card as a time machine</h3>
        <p>
          This is what the <b>$20k credit line</b> is really for. It is not free money — it is a{" "}
          <i>time machine</i>. It lets you spend tomorrow&apos;s payout today, bridging the trough
          until the store finally pays you. Used well, it lets a tiny company punch far above its
          weight. Used carelessly, it runs dry mid-trough and the whole thing stops.
        </p>

        <h3>The flywheel</h3>
        <p>
          And there is a reward hiding in the speed. The faster your cash comes back, the faster you
          can pour it into the <i>next</i> batch of ads, which brings the next customers, whose cash
          comes back and buys the batch after that. A flywheel. The quicker the payout, the faster
          it spins.
        </p>

        <Flywheel />

        <p>
          So the lesson of Act III is brutal and simple:{" "}
          <b>the speed of cash is the speed of growth</b>. Two identical businesses, same prices,
          same churn — the one that gets paid faster wins.
        </p>

        {/* ---------------- ACT IV ---------------- */}
        <span className="act-tag">Act IV</span>
        <h2>What you built</h2>
        <p>
          Step back. If every paying customer is a recurring stream, then all of them together form
          one big stream. Multiply your current monthly recurring revenue by twelve and you get{" "}
          <b>ARR</b> — annual recurring revenue. It is the headline number everyone in this world
          watches: the run-rate of the whole machine.
        </p>
        <p>
          The famous milestone is <b>$1M ARR</b> — the first finish line that says the business is
          real. But it comes with a sting. Below $1M, the app store takes a <b>15%</b> cut. Cross
          $1M and that fee jumps to <b>30%</b>. The moment you start winning, the house doubles its
          take — one more reason the cheap-but-slow app-store route can quietly tax your growth.
        </p>

        <h3>What is it all worth?</h3>
        <p>
          Finally, the big one: <b>enterprise value</b> — what the whole company is worth, today.
          The tool for this is a <b>DCF</b>, a discounted cash flow, and it sounds scarier than it
          is.
        </p>
        <p>
          Here is the whole idea in plain words. A dollar you will earn <i>next year</i> is worth a
          little less than a dollar in your hand <i>right now</i> — because you could have used
          today&apos;s dollar in the meantime, and because the future is uncertain. So you take
          every dollar the business will ever earn, <b>pull each one back to today</b> (shrinking
          the far-off ones the most), and add them all up. That sum is what the company is worth
          now.
        </p>

        <TwoTimeline stage="value" />

        <p>
          And notice the punchline that ties the whole guide together:{" "}
          <b>faster cash is worth more</b>. Money that arrives sooner gets shrunk less on its way
          back to today — so the same revenue, collected faster, produces a more valuable company.
          The cash gap from Act III is not just a survival problem; it is a <i>valuation</i>{" "}
          problem.
        </p>
        <p>
          Which leaves one irresistible question: <b>how big can you get on a $20k credit line?</b>{" "}
          How much ARR — how much enterprise value — can you squeeze out of a single, recycling pool
          of bridge cash?
        </p>

        {/* ---------------- CLOSING ---------------- */}
        <span className="act-tag">The five gears</span>
        <h2>Now go turn them</h2>
        <p>
          Everything above reduces to five dials you actually control. The Model tab lets you turn
          each one and watch the whole machine respond:
        </p>
        <ol className="z-moves">
          <li>
            <b>Acquisition</b> — how cheaply you buy strangers, and the blend of paid vs. organic.
          </li>
          <li>
            <b>Pricing &amp; mix</b> — how many choose weekly trickle vs. annual tide.
          </li>
          <li>
            <b>Retention</b> — how slowly the bucket leaks.
          </li>
          <li>
            <b>Cash speed</b> — web vs. app store, and how hard your credit line works.
          </li>
          <li>
            <b>Reinvestment</b> — how fast the flywheel recycles every returning dollar.
          </li>
        </ol>
        <p className="z-end">
          You came in praying for users. You leave knowing the real game is <b>dollars and days</b>.
          Open the <b>Model</b> tab, set your dials, and hit <b>Optimize</b> — and find out how far
          a single stranger, bought on borrowed time, can take you.
        </p>
      </article>
    </div>
  );
}
