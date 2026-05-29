import { describe, expect, it } from "vitest";
import { decodeParams, encodeParams, hasBlankInputs } from "./urlState";
import { DEFAULT_PARAMS } from "./defaults";

describe("urlState", () => {
  it("encodes nothing when params equal defaults", () => {
    expect(encodeParams(DEFAULT_PARAMS)).toBe("");
  });

  it("round-trips per-channel prices, route, annual retention, per-plan trials and levers", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.channels[0].prices.wPrice = 12.99;
    p.channels[0].route = "APP";
    p.channels[1].retention.annual.rMature = 77;
    p.channels[0].trials.weekly = 7;
    p.channels[1].trials.annual = 14;
    p.marketing.paidBudget = 9000;
    p.capital.founderDraw = 2500;
    p.arrGoal = 500_000;

    const back = decodeParams(encodeParams(p));
    expect(back.channels[0].prices.wPrice).toBe(12.99);
    expect(back.channels[0].route).toBe("APP");
    expect(back.channels[1].retention.annual.rMature).toBe(77);
    expect(back.channels[0].trials.weekly).toBe(7);
    expect(back.channels[1].trials.annual).toBe(14);
    expect(back.marketing.paidBudget).toBe(9000);
    expect(back.capital.founderDraw).toBe(2500);
    expect(back.arrGoal).toBe(500_000);
    expect(back.channels[1].prices.wPrice).toBe(DEFAULT_PARAMS.channels[1].prices.wPrice);
  });

  it("only includes changed keys, and never serialises a blank (NaN)", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.budgetRampPct = 10;
    expect(encodeParams(p)).toBe("ramp=10");
    p.capital.startCash = Number.NaN;
    expect(encodeParams(p)).toBe("ramp=10");
  });

  it("hasBlankInputs flags a blank numeric field", () => {
    expect(hasBlankInputs(DEFAULT_PARAMS)).toBe(false);
    const p = structuredClone(DEFAULT_PARAMS);
    p.channels[0].prices.wPrice = Number.NaN;
    expect(hasBlankInputs(p)).toBe(true);
  });
});
