import { describe, expect, it } from "vitest";
import { DAYS_IN_MONTH, NDAYS, NMONTHS, simulate, tickRet, weeklyLifetime } from "./engine";
import { baseCAC, customersFromSpend, effectiveCAC } from "./saturation";
import { DEFAULT_PARAMS } from "./defaults";
import type { Params } from "./types";

const clone = (): Params => structuredClone(DEFAULT_PARAMS);

describe("calendar", () => {
  it("spans Jun 2026 -> Dec 2030 (55 months)", () => {
    expect(NMONTHS).toBe(55);
    expect(NDAYS).toBeGreaterThan(1600);
    expect(DAYS_IN_MONTH.reduce((a, b) => a + b, 0)).toBe(NDAYS);
  });
});

describe("baseCAC", () => {
  it("matches the funnel arithmetic for paid (CPI ~$2.50, install->paid ~4%)", () => {
    expect(baseCAC(DEFAULT_PARAMS.channels[0])).toBeCloseTo(62.66, 1);
  });
  it("makes organic far cheaper than paid", () => {
    expect(baseCAC(DEFAULT_PARAMS.channels[1])).toBeLessThan(baseCAC(DEFAULT_PARAMS.channels[0]));
    expect(baseCAC(DEFAULT_PARAMS.channels[1])).toBeCloseTo(7.42, 1);
  });
});

describe("saturation", () => {
  const base = 10;
  const sat = 100;
  const slope = 0.7;
  it("is linear below the saturation point", () => {
    expect(customersFromSpend(50, base, sat, slope)).toBeCloseTo(5, 6);
  });
  it("is continuous at the saturation point", () => {
    const below = customersFromSpend(99.999, base, sat, slope);
    const above = customersFromSpend(100.001, base, sat, slope);
    expect(Math.abs(above - below)).toBeLessThan(1e-3);
  });
  it("raises effective CAC past saturation", () => {
    const ch = DEFAULT_PARAMS.channels[1];
    expect(effectiveCAC(ch, 30000)).toBeGreaterThan(effectiveCAC(ch, 100) * 2);
  });
});

describe("retention", () => {
  it("tickRet steps down from 1 (percentage inputs)", () => {
    const sd = { r1: 50, r2: 75, r3: 82, rMature: 85 };
    expect(tickRet(sd, 0)).toBe(1);
    expect(tickRet(sd, 1)).toBeCloseTo(0.5, 6);
    expect(tickRet(sd, 2)).toBeCloseTo(0.375, 6);
    expect(tickRet(sd, 4)).toBeCloseTo(0.375 * 0.82 * 0.85, 6);
  });
  it("weeklyLifetime is finite", () => {
    const life = weeklyLifetime({ r1: 50, r2: 75, r3: 82, rMature: 85 });
    expect(life).toBeGreaterThan(1);
    expect(life).toBeLessThan(10);
  });
});

describe("simulate", () => {
  it("is deterministic and emits full-length daily blocks", () => {
    const a = simulate(clone());
    const b = simulate(clone());
    expect(a.days).toBe(NDAYS);
    expect(a.daily.arr.length).toBe(NDAYS);
    expect(a.daily.cash.length).toBe(NDAYS);
    expect(a.series.length).toBe(NDAYS);
    expect(a.sum.endARR).toBe(b.sum.endARR);
  });

  it("grows ARR with a positive budget", () => {
    const r = simulate(clone());
    expect(r.sum.maxARR).toBeGreaterThan(0);
    expect(r.sum.endARR).toBeGreaterThan(0);
  });

  it("with zero budget stays at starting cash and acquires nobody", () => {
    const p = clone();
    p.marketing.paidBudget = 0;
    p.marketing.organicBudget = 0;
    const r = simulate(p);
    expect(r.sum.maxARR).toBe(0);
    expect(r.sum.insolventDay).toBe(-1);
    expect(r.daily.cash[r.days - 1]).toBeCloseTo(p.capital.startCash, 0);
  });

  it("shows insolvency (no auto-throttle) when budget far exceeds working capital", () => {
    const p = clone();
    p.marketing.paidBudget = 500000;
    const r = simulate(p);
    expect(r.sum.insolventDay).toBeGreaterThanOrEqual(0);
    expect(r.sum.minCash).toBeLessThan(0);
    expect(r.sum.peakFunding).toBeGreaterThan(0);
  });

  it("a positive budget ramp raises total spend", () => {
    const flat = simulate(clone());
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const ramped = simulate(p);
    expect(ramped.sum.totSpend).toBeGreaterThan(flat.sum.totSpend);
  });

  it("blended effective AR days sit between web and app payout lags", () => {
    const r = simulate(clone());
    expect(r.sum.effAR).toBeGreaterThanOrEqual(DEFAULT_PARAMS.routes.webPayoutDays);
    expect(r.sum.effAR).toBeLessThanOrEqual(DEFAULT_PARAMS.routes.appPayoutDays);
  });

  it("founder draw reduces ending cash vs no draw (when solvent)", () => {
    const noDraw = simulate(clone());
    const p = clone();
    p.capital.founderDraw = 1000;
    const withDraw = simulate(p);
    expect(withDraw.sum.endCash).toBeLessThan(noDraw.sum.endCash);
  });
});
