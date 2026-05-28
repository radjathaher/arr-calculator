import type { Channel, RouteKind } from "../../lib/types";
import type { Currency } from "../../lib/format";
import { money } from "../../lib/format";
import { baseCAC } from "../../lib/saturation";
import { NI } from "../atoms";

export function ChannelEditor({
  ch,
  onField,
  cur,
  fx,
}: {
  ch: Channel;
  onField: (mut: (c: Channel) => void) => void;
  cur: Currency;
  fx: number;
}) {
  const cac = baseCAC(ch);
  return (
    <div className="chblock">
      <div className="chhead">
        <span style={{ color: ch.color }}>● {ch.name}</span>
        <label className="rtsel">
          route
          <select
            className="nospin"
            value={ch.route}
            onChange={(e) =>
              onField((c) => {
                c.route = e.target.value as RouteKind;
              })
            }
          >
            <option value="WEB">web checkout</option>
            <option value="APP">app store</option>
          </select>
        </label>
        <span className="lblmono">CAC {money(cac, cur, fx)}</span>
      </div>

      <div className="subhead">funnel (cost per step)</div>
      <div className="ni-row">
        <NI
          label="CPM"
          value={ch.funnel.cpm}
          step={0.5}
          onChange={(v) => onField((c) => (c.funnel.cpm = v))}
        />
        <NI
          label="imp→inst%"
          value={ch.funnel.impToInstall}
          step={0.05}
          onChange={(v) => onField((c) => (c.funnel.impToInstall = v))}
        />
        <NI
          label="inst→trial%"
          value={ch.funnel.installToTrial}
          step={0.5}
          onChange={(v) => onField((c) => (c.funnel.installToTrial = v))}
        />
        <NI
          label="trial→paid%"
          value={ch.funnel.trialToPaid}
          step={0.5}
          onChange={(v) => onField((c) => (c.funnel.trialToPaid = v))}
        />
      </div>

      <div className="subhead">plan mix (%)</div>
      <div className="ni-row">
        <NI
          label="weekly"
          value={ch.mix.weekly}
          suffix="%"
          onChange={(v) => onField((c) => (c.mix.weekly = v))}
        />
        <NI
          label="monthly"
          value={ch.mix.monthly}
          suffix="%"
          onChange={(v) => onField((c) => (c.mix.monthly = v))}
        />
        <NI
          label="annual"
          value={ch.mix.annual}
          suffix="%"
          onChange={(v) => onField((c) => (c.mix.annual = v))}
        />
      </div>

      <div className="subhead">saturation</div>
      <div className="ni-row">
        <NI
          label="sat point $/day"
          value={ch.satPoint}
          step={50}
          width={72}
          onChange={(v) => onField((c) => (c.satPoint = v))}
        />
        <NI
          label="slope"
          value={ch.satSlope}
          step={0.05}
          onChange={(v) => onField((c) => (c.satSlope = v))}
        />
      </div>

      <div className="subhead">weekly retention — 1st / 2nd / 3rd / mature %</div>
      <div className="ni-row">
        <NI
          label="1st"
          value={ch.retention.weekly.r1}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.weekly.r1 = v))}
        />
        <NI
          label="2nd"
          value={ch.retention.weekly.r2}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.weekly.r2 = v))}
        />
        <NI
          label="3rd"
          value={ch.retention.weekly.r3}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.weekly.r3 = v))}
        />
        <NI
          label="mature"
          value={ch.retention.weekly.rMature}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.weekly.rMature = v))}
        />
      </div>

      <div className="subhead">monthly retention — 1st / 2nd / 3rd / mature %</div>
      <div className="ni-row">
        <NI
          label="1st"
          value={ch.retention.monthly.r1}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.monthly.r1 = v))}
        />
        <NI
          label="2nd"
          value={ch.retention.monthly.r2}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.monthly.r2 = v))}
        />
        <NI
          label="3rd"
          value={ch.retention.monthly.r3}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.monthly.r3 = v))}
        />
        <NI
          label="mature"
          value={ch.retention.monthly.rMature}
          width={44}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.monthly.rMature = v))}
        />
      </div>

      <div className="ni-row">
        <NI
          label="annual renewal"
          value={ch.retention.annualRenewal}
          width={48}
          suffix="%"
          onChange={(v) => onField((c) => (c.retention.annualRenewal = v))}
        />
      </div>
    </div>
  );
}
