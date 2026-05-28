import { describe, expect, it } from "vitest";
import { decodeParams, encodeParams } from "./urlState";
import { DEFAULT_PARAMS } from "./defaults";

describe("urlState", () => {
  it("encodes nothing when params equal defaults", () => {
    expect(encodeParams(DEFAULT_PARAMS)).toBe("");
  });

  it("round-trips scalar + route + channel edits", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.plans.wPrice = 12.49;
    p.marketing.paidShare = 75;
    p.capital.startCash = 5000;
    p.channels[0].route = "APP";
    p.channels[1].satPoint = 800;
    p.channels[1].retention.annualRenewal = 33;

    const back = decodeParams(encodeParams(p));
    expect(back.plans.wPrice).toBe(12.49);
    expect(back.marketing.paidShare).toBe(75);
    expect(back.capital.startCash).toBe(5000);
    expect(back.channels[0].route).toBe("APP");
    expect(back.channels[1].satPoint).toBe(800);
    expect(back.channels[1].retention.annualRenewal).toBe(33);
    expect(back.plans.aPrice).toBe(DEFAULT_PARAMS.plans.aPrice);
  });

  it("round-trips month schedules (base + sparse overrides)", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.budget = { base: 8000, overrides: { 3: 50000, 12: 30000 } };
    p.capital.draw = { base: 2000, overrides: { 24: 10000 } };

    const qs = encodeParams(p);
    expect(qs).toContain("bud=8000");
    expect(qs).toContain("budo=3%3A50000%3B12%3A30000");
    expect(qs).toContain("draw=2000");

    const back = decodeParams(qs);
    expect(back.marketing.budget.base).toBe(8000);
    expect(back.marketing.budget.overrides).toEqual({ 3: 50000, 12: 30000 });
    expect(back.capital.draw.base).toBe(2000);
    expect(back.capital.draw.overrides).toEqual({ 24: 10000 });
  });

  it("only includes changed keys", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.paidShare = 10;
    expect(encodeParams(p)).toBe("paid=10");
  });
});
