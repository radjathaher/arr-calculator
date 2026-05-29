import { describe, expect, it } from "vitest";
import { DAYS_IN_MONTH, MAXDAYS, NDAYS, simulate, tickRet, weeklyLifetime } from "./engine";
import { baseCAC } from "./saturation";
import { DEFAULT_PARAMS } from "./defaults";
import type { Params } from "./types";

const clone = (): Params => structuredClone(DEFAULT_PARAMS);

describe("calendar", () => {
  it("spans a 5-year cap from Jun 2026", () => {
    expect(NDAYS).toBe(MAXDAYS);
    expect(DAYS_IN_MONTH.reduce((a, b) => a + b, 0)).toBe(NDAYS);
  });
});

describe("baseCAC", () => {
  it("organic is far cheaper than paid", () => {
    expect(baseCAC(DEFAULT_PARAMS.channels[1])).toBeLessThan(baseCAC(DEFAULT_PARAMS.channels[0]));
  });
});

describe("retention (3-point)", () => {
  it("tickRet: 1 → r1 → r1·r2 → mature decay", () => {
    const sd = { r1: 50, r2: 75, rMature: 85 };
    expect(tickRet(sd, 0)).toBe(1);
    expect(tickRet(sd, 1)).toBeCloseTo(0.5, 6);
    expect(tickRet(sd, 2)).toBeCloseTo(0.375, 6);
    expect(tickRet(sd, 3)).toBeCloseTo(0.375 * 0.85, 6);
    expect(tickRet(sd, 4)).toBeCloseTo(0.375 * 0.85 * 0.85, 6);
  });
  it("weeklyLifetime is finite", () => {
    expect(weeklyLifetime({ r1: 50, r2: 75, rMature: 85 })).toBeGreaterThan(1);
  });
});

describe("simulate — run to target", () => {
  it("is deterministic", () => {
    expect(simulate(clone()).sum.endARR).toBe(simulate(clone()).sum.endARR);
  });

  it("default ($1M goal) plateaus and runs to the cap", () => {
    const r = simulate(clone());
    expect(r.sum.d1m).toBe(-1);
    expect(r.lastDay).toBe(NDAYS - 1);
    expect(r.sum.endARR).toBeLessThan(1e6);
  });

  it("a budget ramp breaks through and stops at the target", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const r = simulate(p);
    expect(r.sum.d1m).toBeGreaterThanOrEqual(0);
    expect(r.lastDay).toBe(r.sum.d1m);
    expect(r.sum.endARR).toBeGreaterThanOrEqual(1e6);
  });

  it("respects an editable target", () => {
    const p = clone();
    p.arrGoal = 300_000;
    expect(simulate(p).sum.d1m).toBeGreaterThanOrEqual(0);
  });
});

describe("simulate — net cash & credit", () => {
  it("caps spend at fundable capital — bounded near the credit line, no blow-up", () => {
    const p = clone();
    p.marketing.paidBudget = 1e9;
    p.marketing.organicBudget = 1e9;
    const r = simulate(p);
    expect(Number.isFinite(r.sum.endARR)).toBe(true);
    // bounded near the credit line, not quadrillions in the hole (the old bug)
    expect(r.sum.minCash).toBeGreaterThan(-1e6);
  });

  it("a founder draw can push below −creditLimit → insolvent", () => {
    const p = clone();
    p.marketing.paidBudget = 0;
    p.marketing.organicBudget = 0;
    p.capital.startCash = 0;
    p.capital.creditLimit = 20000;
    p.capital.founderDraw = 5000;
    const r = simulate(p);
    expect(r.sum.insolventDay).toBeGreaterThanOrEqual(0);
    expect(r.sum.minCash).toBeLessThan(-20000);
    expect(r.sum.peakFunding).toBeGreaterThan(0);
  });

  it("founder draw reduces ending cash", () => {
    const noDraw = simulate(clone()).sum.endCash;
    const p = clone();
    p.capital.founderDraw = 1000;
    expect(simulate(p).sum.endCash).toBeLessThan(noDraw);
  });
});

describe("simulate — per-channel pricing", () => {
  it("raising one channel's prices raises ARR", () => {
    const base = simulate(clone()).sum.maxARR;
    const p = clone();
    p.channels[0].prices = { wPrice: 19.99, mPrice: 39.99, aPrice: 139.99 };
    expect(simulate(p).sum.maxARR).toBeGreaterThan(base);
  });
});

describe("simulate — valuation", () => {
  it("finite EV and equity = EV + net cash", () => {
    const r = simulate(clone());
    expect(Number.isFinite(r.sum.EV)).toBe(true);
    expect(r.sum.equity).toBeCloseTo(r.sum.EV + r.sum.endCash, 2);
    expect(r.sum.wacc).toBeGreaterThan(0);
  });
});
