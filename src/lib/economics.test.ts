import { describe, expect, it } from "vitest";
import { channelEconomics } from "./economics";
import { DEFAULT_PARAMS } from "./defaults";

const econ = (i: 0 | 1) =>
  channelEconomics(
    DEFAULT_PARAMS.channels[i],
    DEFAULT_PARAMS.plans,
    DEFAULT_PARAMS.routes,
    DEFAULT_PARAMS.unit.infraPct,
  );

describe("channelEconomics", () => {
  it("organic CAC is far below paid CAC", () => {
    expect(econ(1).cac).toBeLessThan(econ(0).cac);
  });

  it("derives a sensible CPI and positive LTVs", () => {
    const paid = econ(0);
    expect(paid.cpi).toBeGreaterThan(0);
    expect(paid.ltvW).toBeGreaterThan(0);
    expect(paid.ltvA).toBeGreaterThan(paid.ltvW); // annual worth more than a weekly cohort
    expect(Number.isFinite(paid.ltvCac)).toBe(true);
    expect(paid.ltvCac).toBeGreaterThan(0);
  });

  it("LTV rises when retention improves (better product)", () => {
    const base = econ(0);
    const ch = structuredClone(DEFAULT_PARAMS.channels[0]);
    ch.retention.weekly.rMature = 95; // stickier
    const better = channelEconomics(
      ch,
      DEFAULT_PARAMS.plans,
      DEFAULT_PARAMS.routes,
      DEFAULT_PARAMS.unit.infraPct,
    );
    expect(better.ltvW).toBeGreaterThan(base.ltvW);
  });

  it("organic (in-app) has a lower gross margin than paid (web)", () => {
    expect(econ(1).gm).toBeLessThan(econ(0).gm);
  });
});
