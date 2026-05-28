import { describe, expect, it } from "vitest";
import { decodeParams, encodeParams } from "./urlState";
import { DEFAULT_PARAMS } from "./defaults";

describe("urlState", () => {
  it("encodes nothing when params equal defaults", () => {
    expect(encodeParams(DEFAULT_PARAMS)).toBe("");
  });

  it("round-trips modified params", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.plans.wPrice = 12.49;
    p.marketing.paidShare = 75;
    p.capital.startCash = 5000;
    p.channels[0].route = "APP";
    p.channels[1].satPoint = 800;
    p.channels[1].retention.annualRenewal = 33;

    const qs = encodeParams(p);
    const back = decodeParams(qs);

    expect(back.plans.wPrice).toBe(12.49);
    expect(back.marketing.paidShare).toBe(75);
    expect(back.capital.startCash).toBe(5000);
    expect(back.channels[0].route).toBe("APP");
    expect(back.channels[1].satPoint).toBe(800);
    expect(back.channels[1].retention.annualRenewal).toBe(33);
    // untouched fields stay at defaults
    expect(back.plans.aPrice).toBe(DEFAULT_PARAMS.plans.aPrice);
  });

  it("only includes changed keys in the querystring", () => {
    const p = structuredClone(DEFAULT_PARAMS);
    p.marketing.paidShare = 10;
    const qs = encodeParams(p);
    expect(qs).toBe("paid=10");
  });
});
