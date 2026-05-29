import { useEffect, useRef, useState } from "react";
import { T } from "../../lib/defaults";

// A scroll-pinned narrative that follows ONE example customer and the cash they
// generate, drawn as a two-lane timeline on a real-day axis (day 0 -> ~400).
//
// TOP lane = the customer's life (ad -> install -> trial -> charges -> churn).
// BOTTOM lane = your cash (spend now -> wait the payout lag -> money lands ->
// reinvest). Scrolling advances one beat at a time; the diagram pins to the
// viewport and the prose swaps per beat. Honors prefers-reduced-motion by
// rendering every beat stacked, statically, with no pin or animation.

// One clean teaching customer. CAC ~$63, $9.99/week, web charge lands +10 days,
// renews ~3x before churning -> LTV ~$41 (gross, web). These numbers are fixed
// for legibility; the live model lives on the Model tab.
const CAC = 63;
const WEEKLY = 9.99;
const WEB_LAG = 10;
const AXIS_DAYS = 400; // day-axis span the lanes are drawn against

type LaneSide = "top" | "bottom";

interface Beat {
  // Day on the 0..AXIS_DAYS axis where this beat's marker sits.
  day: number;
  lane: LaneSide;
  // Short marker chip text shown on the timeline track.
  chip: string;
  color: string;
  // The first-person prose for this beat (the indie dev's anxious inner voice).
  title: string;
  body: React.ReactNode;
}

const num = (n: number): string => `$${n.toFixed(2)}`;

const BEATS: Beat[] = [
  {
    day: 0,
    lane: "top",
    chip: "sees ad",
    color: T.muted,
    title: "Day 0 — a stranger scrolls past my ad",
    body: (
      <>
        I just shipped. Revenue is <code>$0</code>. So I buy attention. Out of every thousand people
        who see the ad, a handful tap install — and getting <b>one of them to actually pay</b> costs
        me about <code>{num(CAC)}</code>. That's my <b>CAC</b>. I haven't earned a cent yet; I've
        only spent.
      </>
    ),
  },
  {
    day: 0,
    lane: "bottom",
    chip: `−${num(CAC)}`,
    color: T.danger,
    title: "Day 0 — the meter starts in the red",
    body: (
      <>
        The ad spend leaves my account <i>today</i>. My cash lane opens at{" "}
        <code>−{num(CAC)}</code> per customer. Every customer I buy is a hole I'm betting they'll
        climb out of before I run out of runway.
      </>
    ),
  },
  {
    day: 1,
    lane: "top",
    chip: "install",
    color: T.gold,
    title: "Day 1 — they install, then start a 3-day trial",
    body: (
      <>
        They install and start the <b>free trial</b> (3 days, weekly plan). Still no money — a trial
        is a promise, not a payment. Most people who install never even open it twice. The ones who
        do are the only ones that matter.
      </>
    ),
  },
  {
    day: 4,
    lane: "top",
    chip: "first charge",
    color: T.teal,
    title: "Day 4 — the trial converts: first charge",
    body: (
      <>
        Trial ends, the card is charged <code>{num(WEEKLY)}</code>. This is the moment the whole
        model turns on. But the money isn't mine yet — it's sitting with the payment processor.
      </>
    ),
  },
  {
    day: 14,
    lane: "bottom",
    chip: `+${num(WEEKLY * 0.94)}`,
    color: T.green,
    title: "Day 14 — web money finally lands",
    body: (
      <>
        I sell through my own <b>web checkout</b>, so the fee is small (~6%) and the cash lands about{" "}
        <b>{WEB_LAG} days</b> after the charge. First real deposit:{" "}
        <code>{num(WEEKLY * 0.94)}</code> net. Smooth and fast — but still a sliver against my{" "}
        <code>{num(CAC)}</code> hole.
      </>
    ),
  },
  {
    day: 11,
    lane: "top",
    chip: "renew 1",
    color: T.teal,
    title: "Day 11 — renewal #1 (the brutal one)",
    body: (
      <>
        A week later they're charged again — if they stayed. This first renewal is the cliff: about{" "}
        <b>half</b> of weekly subscribers don't make it past it. Survive this and the curve flattens
        out fast.
      </>
    ),
  },
  {
    day: 18,
    lane: "top",
    chip: "renew 2",
    color: T.teal,
    title: "Day 18 — renewal #2 (it's calming down)",
    body: (
      <>
        Second renewal. The people still here are my real customers now; week-over-week survival
        climbs toward ~87%. Each renewal is another <code>{num(WEEKLY)}</code> charge stacking up
        behind a {WEB_LAG}-day payout wall.
      </>
    ),
  },
  {
    day: 60,
    lane: "top",
    chip: "mature",
    color: T.teal,
    title: "Day 25-60 — mature renewals, then they drift off",
    body: (
      <>
        Charges keep landing every 7 days at the flat mature rate. Add it all up and this one
        customer pays me roughly <code>{num(41)}</code> over their life — that's the gross{" "}
        <b>LTV</b>. <code>LTV {num(41)}</code> beats <code>CAC {num(CAC)}</code>? Not on its own —
        the engine only works because the survivors and faster-cash customers carry the rest.
      </>
    ),
  },
  {
    day: 45,
    lane: "bottom",
    chip: "IAP lump",
    color: T.orange,
    title: "If I'd sold through the App Store instead…",
    body: (
      <>
        Same charges, very different cash. Apple takes a <b>15–30% cut</b> and pays in a{" "}
        <b>lumpy monthly lump ~33 days after the fiscal month closes</b>. A charge can wait{" "}
        <b>45–75 days</b> before it shows up — one fat deposit, not a daily trickle. Cheaper to
        acquire, far slower and thinner to collect.
      </>
    ),
  },
  {
    day: 30,
    lane: "bottom",
    chip: "annual lump",
    color: T.gold,
    title: "Or if they'd bought the annual plan…",
    body: (
      <>
        Instead of a weekly drip, they pay one big <b>annual lump upfront</b>:{" "}
        <code>{num(69.99)}</code> in the bank now — wonderful for runway — but I only see it{" "}
        <b>once a year</b>. Weekly = many small payments; annual = cash now, then a long quiet
        stretch.
      </>
    ),
  },
  {
    day: 75,
    lane: "bottom",
    chip: "↺ reinvest",
    color: T.green,
    title: "The money recycles into the next ad",
    body: (
      <>
        Once enough payouts land to clear that customer's <code>−{num(CAC)}</code> hole, the surplus
        funds the <b>next</b> ad. That's the flywheel: <b>acquire → convert → retain → collect →
        reinvest ↺</b>. The faster cash comes back, the more times the wheel spins per year on the
        same credit line.
      </>
    ),
  },
];

// Marker x-position as a percentage of the day axis.
const xPct = (day: number): number => Math.min(98, Math.max(2, (day / AXIS_DAYS) * 100));

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function Timeline({ active }: { active: number }) {
  const ticks = [0, 100, 200, 300, 400];
  const lane = (side: LaneSide): React.ReactNode => {
    const beats = BEATS.map((b, i) => ({ b, i })).filter(({ b }) => b.lane === side);
    return (
      <div className="expl-tl-row">
        <span className="expl-tl-label">{side === "top" ? "customer" : "your cash"}</span>
        <div className="expl-tl-track">
          {beats.map(({ b, i }) => {
            const revealed = i <= active;
            const isCurrent = i === active;
            return (
              <div
                key={`${side}-${i}`}
                className={`expl-tl-marker${revealed ? " on" : ""}${isCurrent ? " cur" : ""}`}
                style={{
                  left: `${xPct(b.day)}%`,
                  borderColor: b.color,
                  color: revealed ? b.color : "transparent",
                }}
                aria-hidden={!revealed}
              >
                {b.chip}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="expl-two-timeline">
      {lane("top")}
      <div className="expl-tl-axis">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${xPct(t)}%` }}>
            d{t}
          </span>
        ))}
      </div>
      {lane("bottom")}
    </div>
  );
}

export function LifecycleStory() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map scroll progress through the tall container to a beat index. The sticky
  // diagram stays pinned while the prose steps advance underneath it.
  useEffect(() => {
    if (reduced) return;
    const el = containerRef.current;
    if (!el) return;
    const onScroll = (): void => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = scrolled / total;
      const idx = Math.min(BEATS.length - 1, Math.floor(p * BEATS.length));
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  if (reduced) {
    // Static fallback: full timeline + every beat stacked, no pin, no motion.
    return (
      <section className="expl-story" aria-label="customer and cash lifecycle">
        <Timeline active={BEATS.length - 1} />
        <div className="expl-beats-static">
          {BEATS.map((b, i) => (
            <div key={i} className="expl-beat" style={{ borderColor: b.color }}>
              <div className="expl-beat-chip" style={{ color: b.color }}>
                {b.chip}
              </div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const beat = BEATS[active];
  return (
    <section className="expl-story" aria-label="customer and cash lifecycle">
      {/* Tall scroll container: one viewport of scroll per beat. */}
      <div
        ref={containerRef}
        className="expl-scroll-wrap"
        style={{ height: `${(BEATS.length + 1) * 70}vh` }}
      >
        <div className="expl-sticky">
          <Timeline active={active} />
          <div className="expl-beat-live" key={active}>
            <div className="expl-beat-chip" style={{ color: beat.color }}>
              {beat.chip}
            </div>
            <h3>{beat.title}</h3>
            <p>{beat.body}</p>
            <div className="expl-beat-progress" aria-hidden="true">
              {BEATS.map((_, i) => (
                <span key={i} className={i <= active ? "on" : ""} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
