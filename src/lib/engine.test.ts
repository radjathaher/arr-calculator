import { describe, expect, it } from "vitest";
import { DAYS_IN_MONTH, MAXDAYS, NDAYS, simulate, tickRet, weeklyLifetime } from "./engine";
import { baseCAC, customersFromSpend, effectiveCAC } from "./saturation";
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
  it("matches the funnel arithmetic for paid (CPI ~$2.50, install->paid ~4%)", () => {
    expect(baseCAC(DEFAULT_PARAMS.channels[0])).toBeCloseTo(62.66, 1);
  });
  it("makes organic far cheaper than paid", () => {
    expect(baseCAC(DEFAULT_PARAMS.channels[1])).toBeLessThan(baseCAC(DEFAULT_PARAMS.channels[0]));
  });
});

describe("saturation", () => {
  it("is linear below the sat point, climbs above", () => {
    expect(customersFromSpend(50, 10, 100, 0.7)).toBeCloseTo(5, 6);
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
  });
  it("weeklyLifetime is finite", () => {
    expect(weeklyLifetime({ r1: 50, r2: 75, r3: 82, rMature: 85 })).toBeGreaterThan(1);
  });
});

describe("simulate — run to target", () => {
  it("is deterministic", () => {
    expect(simulate(clone()).sum.endARR).toBe(simulate(clone()).sum.endARR);
  });

  it("default ($1M goal) plateaus and never reaches — runs to the cap", () => {
    const r = simulate(clone());
    expect(r.sum.d1m).toBe(-1);
    expect(r.lastDay).toBe(NDAYS - 1);
    expect(r.sum.endARR).toBeLessThan(1e6);
    expect(r.sum.maxARR).toBeGreaterThan(0);
  });

  it("a budget ramp breaks through and stops the clock at the target", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const r = simulate(p);
    expect(r.sum.d1m).toBeGreaterThanOrEqual(0);
    expect(r.lastDay).toBe(r.sum.d1m);
    expect(r.sum.endARR).toBeGreaterThanOrEqual(1e6);
    expect(r.series.length).toBe(r.lastDay + 1);
  });

  it("respects an editable target (lower goal reached sooner)", () => {
    const p = clone();
    p.arrGoal = 300_000;
    const r = simulate(p);
    expect(r.sum.d1m).toBeGreaterThanOrEqual(0);
    expect(r.sum.endARR).toBeGreaterThanOrEqual(300_000);
  });
});

describe("simulate — economics & cash", () => {
  it("with zero budget stays at starting cash and acquires nobody", () => {
    const p = clone();
    p.marketing.paidBudget = 0;
    p.marketing.organicBudget = 0;
    const r = simulate(p);
    expect(r.sum.maxARR).toBe(0);
    expect(r.sum.insolventDay).toBe(-1);
    expect(r.sum.endCash).toBeCloseTo(p.capital.startCash, 0);
  });

  it("caps spend at fundable capital — no blow-up from an absurd budget", () => {
    const p = clone();
    p.marketing.paidBudget = 1e9;
    p.marketing.organicBudget = 1e9;
    p.capital.startCash = 0;
    const r = simulate(p);
    expect(Number.isFinite(r.sum.endARR)).toBe(true);
    expect(r.sum.peakCard).toBeLessThanOrEqual(p.capital.creditLimit + 1);
    expect(r.sum.minCash).toBeGreaterThan(-1e6); // not quadrillions in the hole
  });

  it("produces a finite enterprise value and equity bridge", () => {
    const r = simulate(clone());
    expect(Number.isFinite(r.sum.EV)).toBe(true);
    expect(Number.isFinite(r.sum.equity)).toBe(true);
    expect(r.sum.wacc).toBeGreaterThan(0);
  });

  it("values faster web payout above slow app payout, all else equal", () => {
    const web = clone();
    web.channels[0].route = "WEB";
    web.channels[1].route = "WEB";
    const app = clone();
    app.channels[0].route = "APP";
    app.channels[1].route = "APP";
    expect(simulate(web).sum.EV).toBeGreaterThan(simulate(app).sum.EV);
  });

  it("founder draw reduces ending cash", () => {
    const noDraw = simulate(clone());
    const p = clone();
    p.capital.founderDraw = 1000;
    expect(simulate(p).sum.endCash).toBeLessThan(noDraw.sum.endCash);
  });
});
