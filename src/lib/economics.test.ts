import { describe, expect, it } from "vitest";
import { channelEconomics } from "./economics";
import { DEFAULT_PARAMS } from "./defaults";

const econ = (i: 0 | 1) =>
  channelEconomics(DEFAULT_PARAMS.channels[i], DEFAULT_PARAMS.routes, DEFAULT_PARAMS.unit.infraPct);

describe("channelEconomics", () => {
  it("organic CAC is far below paid CAC", () => {
    expect(econ(1).cac).toBeLessThan(econ(0).cac);
  });

  it("derives a cost ladder (CPI ≤ cost/trial ≤ CAC) and positive LTVs", () => {
    const paid = econ(0);
    expect(paid.cpi).toBeGreaterThan(0);
    expect(paid.costPerTrial).toBeGreaterThan(paid.cpi);
    expect(paid.cac).toBeGreaterThan(paid.costPerTrial);
    expect(paid.ltvA).toBeGreaterThan(0);
    expect(paid.ltvCac).toBeGreaterThan(0);
  });

  it("uses per-channel prices for LTV", () => {
    const ch = structuredClone(DEFAULT_PARAMS.channels[0]);
    ch.prices.aPrice = 200;
    const e = channelEconomics(ch, DEFAULT_PARAMS.routes, DEFAULT_PARAMS.unit.infraPct);
    expect(e.ltvA).toBeGreaterThan(econ(0).ltvA);
  });

  it("LTV rises when retention improves", () => {
    const ch = structuredClone(DEFAULT_PARAMS.channels[0]);
    ch.retention.weekly.rMature = 95;
    const better = channelEconomics(ch, DEFAULT_PARAMS.routes, DEFAULT_PARAMS.unit.infraPct);
    expect(better.ltvW).toBeGreaterThan(econ(0).ltvW);
  });

  it("organic (in-app) has a lower gross margin than paid (web)", () => {
    expect(econ(1).gm).toBeLessThan(econ(0).gm);
  });
});
