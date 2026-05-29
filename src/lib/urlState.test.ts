import { describe, expect, it } from "vitest";
import { decodeParams, encodeParams, hasBlankInputs } from "./urlState";
import { DEFAULT_PARAMS } from "./defaults";

describe("urlState", () => {
  it("encodes nothing when params equal defaults", () => {
    expect(encodeParams(DEFAULT_PARAMS)).toBe("");
  });

  it("round-trips scalar + route + channel edits", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.plans.wPrice = 12.49;
    p.capital.startCash = 5000;
    p.channels[0].route = "APP";
    p.channels[1].satPoint = 800;
    p.channels[1].retention.annualRenewal = 33;

    const back = decodeParams(encodeParams(p));
    expect(back.plans.wPrice).toBe(12.49);
    expect(back.capital.startCash).toBe(5000);
    expect(back.channels[0].route).toBe("APP");
    expect(back.channels[1].satPoint).toBe(800);
    expect(back.channels[1].retention.annualRenewal).toBe(33);
    expect(back.plans.aPrice).toBe(DEFAULT_PARAMS.plans.aPrice);
  });

  it("round-trips the cockpit decisions (budgets, ramp, draw, cash, credit)", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.paidBudget = 9000;
    p.marketing.organicBudget = 15000;
    p.marketing.budgetRampPct = 10;
    p.capital.founderDraw = 2500;
    p.capital.creditLimit = 50000;

    const back = decodeParams(encodeParams(p));
    expect(back.marketing.paidBudget).toBe(9000);
    expect(back.marketing.organicBudget).toBe(15000);
    expect(back.marketing.budgetRampPct).toBe(10);
    expect(back.capital.founderDraw).toBe(2500);
    expect(back.capital.creditLimit).toBe(50000);
  });

  it("only includes changed keys, and never serialises a blank (NaN)", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.budgetRampPct = 10;
    expect(encodeParams(p)).toBe("ramp=10");
    p.capital.startCash = Number.NaN;
    expect(encodeParams(p)).toBe("ramp=10"); // NaN skipped
  });

  it("hasBlankInputs flags a blank numeric field", () => {
    expect(hasBlankInputs(DEFAULT_PARAMS)).toBe(false);
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.paidBudget = Number.NaN;
    expect(hasBlankInputs(p)).toBe(true);
  });
});
