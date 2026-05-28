import { T } from "../../lib/defaults";

// The recurring motif of the whole piece. Two stacked tracks share one clock:
// the CUSTOMER's life on top (install -> trial -> first payment -> churn) and
// your CASH's life below (the CAC leaves now, the payout arrives much later).
// Each act passes a different `stage` so the same diagram can accumulate detail
// without the reader losing the through-line.

export type TimelineStage = "funnel" | "retention" | "cash" | "value";

// A marker is a single labelled block placed on a 0..100 track. `left` and
// `width` are percentages of the track; colors are chosen by the caller so the
// CSS stays generic.
interface Marker {
  left: number;
  width: number;
  label: string;
  bg: string;
  color: string;
}

interface TimelineRow {
  label: string;
  markers: Marker[];
}

interface StageConfig {
  rows: TimelineRow[];
  caption: React.ReactNode;
}

const INK = T.ink;
const PAPER = "#fffdf9";

// Each stage is a self-contained snapshot. They reuse the same horizontal
// positions on purpose: "install" always sits at the left, "payout" always
// lands far to the right, so the gap between earning and getting paid is the
// visual punchline the reader keeps seeing.
const STAGES: Record<TimelineStage, StageConfig> = {
  // Act I — the funnel. We only know the customer arrived and the money left.
  funnel: {
    rows: [
      {
        label: "Customer",
        markers: [{ left: 0, width: 22, label: "install", bg: T.green, color: PAPER }],
      },
      {
        label: "Your cash",
        markers: [{ left: 0, width: 22, label: "− CAC paid now", bg: T.danger, color: PAPER }],
      },
    ],
    caption: (
      <>
        Read it as one clock. The customer <b>shows up</b> on the top track; on the bottom track
        your money has already <b>left the building</b>. So far you are purely out of pocket.
      </>
    ),
  },

  // Act II — retention. The trial delay and the first real payment appear, plus
  // the churn cliff where many customers quietly walk out.
  retention: {
    rows: [
      {
        label: "Customer",
        markers: [
          { left: 0, width: 16, label: "install", bg: T.green, color: PAPER },
          { left: 17, width: 14, label: "3-day trial", bg: T.gold, color: PAPER },
          { left: 32, width: 18, label: "1st payment", bg: T.teal, color: PAPER },
          { left: 64, width: 18, label: "churn?", bg: T.muted, color: PAPER },
        ],
      },
      {
        label: "Your cash",
        markers: [{ left: 0, width: 16, label: "− CAC", bg: T.danger, color: PAPER }],
      },
    ],
    caption: (
      <>
        The <b>3-day trial</b> is a delay before any money is owed at all. Then the customer either
        pays and keeps paying — or hits the <b>churn cliff</b> and the stream stops.
      </>
    ),
  },

  // Act III — the cash gap. The payout finally appears on the cash track, far
  // to the right of when the customer actually paid.
  cash: {
    rows: [
      {
        label: "Customer",
        markers: [
          { left: 0, width: 14, label: "install", bg: T.green, color: PAPER },
          { left: 15, width: 12, label: "trial", bg: T.gold, color: PAPER },
          { left: 28, width: 16, label: "paid", bg: T.teal, color: PAPER },
        ],
      },
      {
        label: "Your cash",
        markers: [
          { left: 0, width: 14, label: "− CAC", bg: T.danger, color: PAPER },
          { left: 70, width: 28, label: "+ payout (≈60d)", bg: T.green, color: PAPER },
        ],
      },
    ],
    caption: (
      <>
        Look at the gap. The customer <b>paid weeks ago</b>, but the cash only lands when the store
        finally pays out. You financed every day in between.
      </>
    ),
  },

  // Act IV — value. The same customer, viewed as a stream of renewals that
  // compounds into ARR and, discounted back, into enterprise value.
  value: {
    rows: [
      {
        label: "Customer",
        markers: [
          { left: 0, width: 14, label: "paid", bg: T.teal, color: PAPER },
          { left: 30, width: 14, label: "renews", bg: T.teal, color: PAPER },
          { left: 60, width: 14, label: "renews", bg: T.teal, color: PAPER },
          { left: 86, width: 14, label: "…", bg: T.teal, color: PAPER },
        ],
      },
      {
        label: "Value today",
        markers: [
          { left: 0, width: 26, label: "$1.00", bg: T.gold, color: INK },
          { left: 30, width: 22, label: "$0.80", bg: T.gold, color: INK },
          { left: 60, width: 18, label: "$0.62", bg: T.gold, color: INK },
          { left: 86, width: 12, label: "↓", bg: T.gold, color: INK },
        ],
      },
    ],
    caption: (
      <>
        Every future renewal is worth <b>a little less today</b> than the last — a dollar next year
        is not a dollar now. Add up all those shrinking dollars and you get <b>enterprise value</b>.
      </>
    ),
  },
};

export function TwoTimeline({ stage }: { stage: TimelineStage }) {
  const cfg = STAGES[stage];
  return (
    <div className="two-timeline">
      {cfg.rows.map((row) => (
        <div className="tl-row" key={row.label}>
          <div className="tl-label">{row.label}</div>
          <div className="tl-track">
            {row.markers.map((m, i) => (
              <div
                className="tl-marker"
                key={i}
                style={{
                  left: `${m.left}%`,
                  width: `${m.width}%`,
                  background: m.bg,
                  color: m.color,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="tl-caption">{cfg.caption}</div>
    </div>
  );
}
