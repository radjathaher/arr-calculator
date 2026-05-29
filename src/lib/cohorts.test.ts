import { describe, expect, it } from "vitest";
import { simulate } from "./model";
import { DEFAULT_PARAMS } from "./defaults";
import type { CohortRow, Params } from "./types";

const clone = (): Params => structuredClone(DEFAULT_PARAMS);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const totalCust = (rows: CohortRow[]) => sum(rows.map((r) => r.customers));

describe("cohorts", () => {
  it("total customers are consistent across grains", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const c = simulate(p).cohorts;
    expect(totalCust(c.monthly)).toBeCloseTo(totalCust(c.daily), 2);
    expect(totalCust(c.weekly)).toBeCloseTo(totalCust(c.daily), 2);
    expect(totalCust(c.annual)).toBeCloseTo(totalCust(c.daily), 2);
  });

  it("each cohort's CBCV is positive and ≤ its undiscounted lifetime value", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    for (const row of simulate(p).cohorts.monthly) {
      expect(row.customers).toBeGreaterThan(0);
      expect(row.cbcv).toBeGreaterThan(0);
      // discounting can only reduce value vs. customers × per-customer LTV
      expect(row.cbcv).toBeLessThanOrEqual(row.customers * row.ltv + 1e-6);
    }
  });

  it("Σ CBCV is finite and positive (customer-based valuation)", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const totalCbcv = sum(simulate(p).cohorts.monthly.map((r) => r.cbcv));
    expect(Number.isFinite(totalCbcv)).toBe(true);
    expect(totalCbcv).toBeGreaterThan(0);
  });

  it("rows carry channel + plan dimensions", () => {
    const c = simulate(clone()).cohorts.monthly;
    expect(c.length).toBeGreaterThan(0);
    expect(c.some((r) => r.plan === "weekly")).toBe(true);
    expect(new Set(c.map((r) => r.channel)).size).toBeGreaterThanOrEqual(1);
  });
});

describe("Apple SBP app-store fee step-up", () => {
  // Route everything through the app store (paid budget 0 → only organic/APP
  // bills), so the blended fee rate IS the effective app-store fee:
  // effectiveAppFee = 1 − gm − infra.
  const appOnly = (organicDaily: number, ramp: number): number => {
    const p = clone();
    p.marketing.paidDaily = 0;
    p.marketing.organicDaily = organicDaily;
    p.marketing.budgetRampPct = ramp;
    p.arrGoal = 1e12; // never stop early; run the full horizon
    const r = simulate(p);
    return 1 - r.sum.gm - p.unit.infraPct / 100;
  };

  it("stays at ~15% (SBP) below $1M trailing proceeds and steps up above it", () => {
    const small = appOnly(20, 0); // tiny, never crosses $1M
    const big = appOnly(4000, 8); // large + ramp, crosses $1M trailing proceeds
    expect(small).toBeCloseTo(0.15, 2);
    expect(big).toBeGreaterThan(small + 0.01);
    expect(big).toBeLessThanOrEqual(0.3 + 1e-9);
  });
});
