import type { Params } from "../../lib/types";
import { MonthGrid } from "./MonthGrid";

// The two interactive levers: marketing budget and founder draw, each entered as
// a base $/month plus per-month override cells.
export function Levers({
  params,
  upd,
}: {
  params: Params;
  upd: (mut: (p: Params) => void) => void;
}) {
  return (
    <div className="chblock">
      <div className="subhead">Marketing budget — what you spend acquiring users each month</div>
      <MonthGrid
        label="Budget"
        schedule={params.marketing.budget}
        step={500}
        onChange={(s) => upd((q) => (q.marketing.budget = s))}
      />
      <div className="subhead">
        Founder draw — cash you withdraw (an owner distribution, not an expense)
      </div>
      <MonthGrid
        label="Draw"
        schedule={params.capital.draw}
        step={250}
        onChange={(s) => upd((q) => (q.capital.draw = s))}
      />
    </div>
  );
}
