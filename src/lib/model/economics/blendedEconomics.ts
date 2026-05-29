import type { Params } from "../../types";
import { channelEconomics } from "./channelEconomics";

export interface BlendedEcon {
  cac: number;
  ltv: number;
  ltvCac: number;
  paybackWeeks: number;
}

// Spend-weighted economics across both channels — the headline "is the engine
// healthy" numbers. Weighted by how many customers each budget actually buys
// (true blend = total spend ÷ total customers), not a naive average of rates.
export function blendedEconomics(p: Params): BlendedEcon {
  const e0 = channelEconomics(p.channels[0], p.routes, p.unit.infraPct);
  const e1 = channelEconomics(p.channels[1], p.routes, p.unit.infraPct);
  const sp0 = Math.max(0, p.marketing.paidDaily) || 0;
  const sp1 = Math.max(0, p.marketing.organicDaily) || 0;
  const c0 = e0.cac > 0 ? sp0 / e0.cac : 0; // customers from each channel
  const c1 = e1.cac > 0 ? sp1 / e1.cac : 0;
  const cust = c0 + c1;
  if (cust <= 0) return { cac: 0, ltv: 0, ltvCac: 0, paybackWeeks: 0 };
  const cac = (sp0 + sp1) / cust;
  const ltv = (c0 * e0.blendedLtv + c1 * e1.blendedLtv) / cust;
  const paybackWeeks = (c0 * e0.paybackWeeks + c1 * e1.paybackWeeks) / cust;
  return { cac, ltv, ltvCac: cac > 0 ? ltv / cac : 0, paybackWeeks };
}
