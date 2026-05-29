import type { CohortRow, CohortTable, Params, PlanKind, StepDown } from "../../types";
import { dstr } from "../../format";
import { DAYS } from "../calendar";
import { baseCAC } from "../acquisition/baseCac";
import { channelEconomics } from "../economics/channelEconomics";
import { weeklyLifetime } from "../retention/weeklyLifetime";
import { discountedLifetime } from "../retention/discountedLifetime";

type Grain = "day" | "week" | "month" | "year";

interface PlanMeta {
  kind: PlanKind;
  mix: number; // fraction 0..1
  price: number;
  ltv: number; // per-customer contribution lifetime (undiscounted, gm-adjusted)
  infraPerCust: number; // infra cost over the cohort's life, per customer
  cbcvPerCust: number; // discounted contribution PV per customer, at acquisition date
}

interface ChannelMeta {
  name: string;
  cac: number;
  plans: PlanMeta[];
}

function sliceKey(d: number, grain: Grain): string {
  const date = DAYS[d].date;
  if (grain === "day") return String(d);
  if (grain === "week") return String(Math.floor(d / 7));
  if (grain === "month") return `${date.getFullYear()}-${date.getMonth()}`;
  return String(date.getFullYear());
}

function sliceLabel(d: number, grain: Grain): string {
  const date = DAYS[d].date;
  if (grain === "day") return dstr(date);
  if (grain === "week") return `wk ${dstr(date)}`;
  if (grain === "month") return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
  return String(date.getFullYear());
}

function planMetas(
  prices: { wPrice: number; mPrice: number; aPrice: number },
  mix: { weekly: number; monthly: number; annual: number },
  ret: { weekly: StepDown; monthly: StepDown; annual: StepDown },
  econ: { ltvW: number; ltvM: number; ltvA: number; gm: number },
  infraPct: number,
  wacc: number,
): PlanMeta[] {
  const make = (
    kind: PlanKind,
    mixPct: number,
    price: number,
    sd: StepDown,
    periodDays: number,
    ltv: number,
  ): PlanMeta => {
    const lifeTicks = weeklyLifetime(sd);
    const discLife = discountedLifetime(sd, periodDays, wacc);
    return {
      kind,
      mix: mixPct / 100,
      price,
      ltv,
      infraPerCust: lifeTicks * price * infraPct,
      cbcvPerCust: price * econ.gm * discLife,
    };
  };
  return [
    make("weekly", mix.weekly, prices.wPrice, ret.weekly, 7, econ.ltvW),
    make("monthly", mix.monthly, prices.mPrice, ret.monthly, 30, econ.ltvM),
    make("annual", mix.annual, prices.aPrice, ret.annual, 365, econ.ltvA),
  ];
}

// Build the cohort table at every grain. A cohort = acquisition slice × channel ×
// plan. CBCV factorises cheaply: per-customer discounted value is constant per
// channel/plan, so a slice's CBCV is that value times the discount-weighted sum
// of customers acquired across the slice's days.
export function buildCohorts(
  p: Params,
  acq: Float64Array[],
  lastDay: number,
  wacc: number,
): CohortTable {
  const infraPct = p.unit.infraPct / 100;
  const meta: ChannelMeta[] = p.channels.map((ch) => {
    const econ = channelEconomics(ch, p.routes, p.unit.infraPct);
    return {
      name: ch.name,
      cac: baseCAC(ch),
      plans: planMetas(ch.prices, ch.mix, ch.retention, econ, infraPct, wacc),
    };
  });
  const discFactor = (d: number): number => 1 / (1 + wacc) ** (d / 365);

  const buildGrain = (grain: Grain): CohortRow[] => {
    const rows: CohortRow[] = [];
    // [channel][plan] → { customers, discCustomers }
    const cust = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    const discCust = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    let key = "";
    let firstD = 0;

    const flush = () => {
      for (let c = 0; c < 2; c++) {
        for (let pi = 0; pi < 3; pi++) {
          const n = cust[c][pi];
          if (n <= 1e-9) continue;
          const pm = meta[c].plans[pi];
          rows.push({
            i: firstD,
            date: DAYS[firstD].date,
            label: sliceLabel(firstD, grain),
            channel: meta[c].name,
            plan: pm.kind,
            customers: n,
            cac: meta[c].cac,
            infra: n * pm.infraPerCust,
            ltv: pm.ltv,
            cbcv: pm.cbcvPerCust * discCust[c][pi],
          });
        }
      }
      for (let c = 0; c < 2; c++) {
        cust[c] = [0, 0, 0];
        discCust[c] = [0, 0, 0];
      }
    };

    for (let d = 0; d <= lastDay; d++) {
      const k = sliceKey(d, grain);
      if (k !== key) {
        if (key !== "") flush();
        key = k;
        firstD = d;
      }
      const df = discFactor(d);
      for (let c = 0; c < 2; c++) {
        const n = acq[c][d];
        if (n <= 0) continue;
        for (let pi = 0; pi < 3; pi++) {
          const m = meta[c].plans[pi].mix;
          if (m <= 0) continue;
          cust[c][pi] += n * m;
          discCust[c][pi] += n * m * df;
        }
      }
    }
    if (key !== "") flush();
    return rows;
  };

  return {
    daily: buildGrain("day"),
    weekly: buildGrain("week"),
    monthly: buildGrain("month"),
    annual: buildGrain("year"),
  };
}
