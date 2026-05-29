import { EngineDocs } from "./engine-docs";
import { LifecycleStory } from "./lifecycle-story";

// The Explainer tab: a scroll-pinned story that walks one customer and the cash
// they generate end to end, followed by the model's formula-level living docs.
export function ExplainerTab() {
  return (
    <div className="expl">
      <header className="expl-hero">
        <div className="expl-kicker">A field guide</div>
        <h1>
          One customer.
          <br />
          Where does the cash go?
        </h1>
        <p className="expl-sub">
          I'm a solo dev who just shipped a subscription app, and revenue is <code>$0</code>. Follow
          a single customer from the ad they scroll past all the way to mature renewals — and follow
          the money I spend to win them, waiting on payouts until it lands in the bank and funds the
          next ad. Scroll to walk the cycle.
        </p>
      </header>

      <LifecycleStory />

      <EngineDocs />
    </div>
  );
}
