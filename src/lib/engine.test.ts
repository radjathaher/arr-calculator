import { describe, expect, it } from "vitest";
import {
  feasible,
  maxBudget,
  maxDraw,
  optimize,
  simulate,
  tickRet,
  weeklyLifetime,
} from "./engine";
import { baseCAC, customersFromSpend, effectiveCAC } from "./saturation";
import { DEFAULT_PARAMS } from "./defaults";
import type { Params } from "./types";

const clone = (): Params => structuredClone(DEFAULT_PARAMS);

describe("baseCAC", () => {
  it("matches the funnel arithmetic for paid (CPI ~$2.50, install->paid ~4%)", () => {
    const cac = baseCAC(DEFAULT_PARAMS.channels[0]);
    // 20 / (1000 * 0.008 * 0.133 * 0.30)
    expect(cac).toBeCloseTo(62.66, 1);
  });

  it("makes organic far cheaper than paid", () => {
    const paid = baseCAC(DEFAULT_PARAMS.channels[0]);
    const organic = baseCAC(DEFAULT_PARAMS.channels[1]);
    expect(organic).toBeLessThan(paid);
    expect(organic).toBeCloseTo(7.42, 1);
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

  it("raises effective CAC above the base once past saturation", () => {
    const ch = DEFAULT_PARAMS.channels[1]; // organic, sat $300
    const flat = effectiveCAC(ch, 100);
    const stressed = effectiveCAC(ch, 30000);
    expect(flat).toBeCloseTo(baseCAC(ch), 5);
    expect(stressed).toBeGreaterThan(flat * 2);
  });

  it("kills the infinite-cheap-organic exploit (sublinear above sat)", () => {
    const linear = 30000 / base;
    const actual = customersFromSpend(30000, base, sat, slope);
    expect(actual).toBeLessThan(linear * 0.5);
  });
});

describe("retention curves", () => {
  it("tickRet returns 1 at age 0 and steps down (percentage inputs)", () => {
    const sd = { r1: 50, r2: 75, r3: 82, rMature: 85 };
    expect(tickRet(sd, 0)).toBe(1);
    expect(tickRet(sd, 1)).toBeCloseTo(0.5, 6);
    expect(tickRet(sd, 2)).toBeCloseTo(0.375, 6);
    expect(tickRet(sd, 3)).toBeCloseTo(0.3075, 6);
    expect(tickRet(sd, 4)).toBeCloseTo(0.3075 * 0.85, 6);
  });

  it("weeklyLifetime sums the survival curve and is finite", () => {
    const sd = { r1: 50, r2: 75, r3: 82, rMature: 85 };
    const life = weeklyLifetime(sd);
    expect(life).toBeGreaterThan(1);
    expect(life).toBeLessThan(10);
  });
});

describe("simulate", () => {
  it("is deterministic", () => {
    const a = simulate(clone());
    const b = simulate(clone());
    expect(a.sum.EV).toBe(b.sum.EV);
    expect(a.sum.horizonARR).toBe(b.sum.horizonARR);
  });

  it("produces a non-empty daily series with finite EV", () => {
    const r = simulate(clone());
    expect(r.series.length).toBeGreaterThan(0);
    expect(Number.isFinite(r.sum.EV)).toBe(true);
    expect(Number.isFinite(r.sum.horizonARR)).toBe(true);
  });

  it("with zero budget stays solvent and barely grows", () => {
    const p = clone();
    p.marketing.monthlyBudget = 0;
    const r = simulate(p);
    expect(feasible(r)).toBe(true);
    expect(r.sum.horizonARR).toBeLessThan(1000);
  });

  it("blended effective AR days sit between the web and app payout lags", () => {
    const r = simulate(clone());
    expect(r.sum.effAR).toBeGreaterThanOrEqual(DEFAULT_PARAMS.routes.webPayoutDays);
    expect(r.sum.effAR).toBeLessThanOrEqual(DEFAULT_PARAMS.routes.appPayoutDays);
  });

  it("values faster cash higher: all-web EV beats all-app EV, all else equal", () => {
    const web = clone();
    web.channels[0].route = "WEB";
    web.channels[1].route = "WEB";
    const app = clone();
    app.channels[0].route = "APP";
    app.channels[1].route = "APP";
    const evWeb = simulate(web).sum.EV;
    const evApp = simulate(app).sum.EV;
    expect(evWeb).toBeGreaterThan(evApp);
  });
});

describe("solvency search", () => {
  it("maxBudget returns a feasible budget; just above it is infeasible", () => {
    const p = clone();
    const mb = maxBudget(p);
    expect(mb).toBeGreaterThan(0);
    const ok = simulate({ ...p, marketing: { ...p.marketing, monthlyBudget: mb } });
    expect(feasible(ok)).toBe(true);
    const tooMuch = simulate({
      ...p,
      marketing: { ...p.marketing, monthlyBudget: mb * 1.5 + 5000 },
    });
    expect(feasible(tooMuch)).toBe(false);
  });

  it("maxDraw is non-negative and a larger draw breaks solvency", () => {
    // Isolate the draw: no ad spend (no revenue), draws from month 0, so the
    // run lasts the full horizon and the draw genuinely drains the cash.
    const p = clone();
    p.marketing.monthlyBudget = 0;
    p.capital.startCash = 10000;
    p.capital.drawStartMonth = 0;
    const md = maxDraw(p);
    expect(md).toBeGreaterThanOrEqual(0);
    const greedy = simulate({
      ...p,
      capital: { ...p.capital, founderDraw: md + 20000 },
    });
    expect(feasible(greedy)).toBe(false);
  });
});

describe("optimize", () => {
  it("returns a feasible plan that does not reduce enterprise value", () => {
    const p = clone();
    const baseEV = simulate({
      ...p,
      marketing: { ...p.marketing, monthlyBudget: maxBudget(p) },
    }).sum.EV;
    const best = optimize(p);
    expect(best.paidShare).toBeGreaterThanOrEqual(0);
    expect(best.paidShare).toBeLessThanOrEqual(100);
    const optimized = simulate({
      ...p,
      marketing: {
        ...p.marketing,
        paidShare: best.paidShare,
        monthlyBudget: best.monthlyBudget,
      },
    });
    expect(feasible(optimized)).toBe(true);
    expect(optimized.sum.EV).toBeGreaterThanOrEqual(baseEV - Math.abs(baseEV) * 0.01);
  });
});
