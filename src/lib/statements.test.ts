import { describe, expect, it } from "vitest";
import { simulate } from "./model";
import { DEFAULT_PARAMS } from "./defaults";
import type { Params } from "./types";

const clone = (): Params => structuredClone(DEFAULT_PARAMS);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("balance sheet ties", () => {
  const scenarios: [string, (p: Params) => void][] = [
    ["default plateau", () => {}],
    ["ramped to target", (p) => void (p.marketing.budgetRampPct = 5)],
    [
      "with a founder draw",
      (p) => void ((p.marketing.budgetRampPct = 4), (p.capital.founderDraw = 1500)),
    ],
  ];
  for (const [name, mut] of scenarios) {
    it(`A = L + E every month — ${name}`, () => {
      const p = clone();
      mut(p);
      const { monthly } = simulate(p).statements.balance;
      expect(monthly.length).toBeGreaterThan(0);
      for (const row of monthly) {
        const scale = Math.abs(row.totalAssets) + 1;
        expect(Math.abs(row.check) / scale).toBeLessThan(1e-7);
      }
    });
  }
});

describe("income statement", () => {
  it("annual rows are the exact sum of their months", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const { monthly, annual } = simulate(p).statements.income;
    for (const a of annual) {
      const months = monthly.filter((m) => m.date.getFullYear() === a.date.getFullYear());
      expect(a.revenue).toBeCloseTo(sum(months.map((m) => m.revenue)), 4);
      expect(a.netIncome).toBeCloseTo(sum(months.map((m) => m.netIncome)), 4);
      expect(a.tax).toBeCloseTo(sum(months.map((m) => m.tax)), 4);
    }
  });

  it("retained earnings = cumulative net income − draws", () => {
    const p = clone();
    p.marketing.budgetRampPct = 4;
    p.capital.founderDraw = 1000;
    const r = simulate(p);
    const lastBs = r.statements.balance.monthly.at(-1)!;
    const niCum = sum(r.statements.income.monthly.map((m) => m.netIncome));
    const drawCum = sum(r.cashflow.monthly.map((m) => m.draw));
    expect(lastBs.retainedEarnings).toBeCloseTo(niCum - drawCum, 2);
  });
});

describe("cash-flow rollups", () => {
  it("weekly / monthly / annual sum to the daily totals", () => {
    const p = clone();
    p.marketing.budgetRampPct = 5;
    const cf = simulate(p).cashflow;
    const totalAd = sum(cf.daily.map((d) => d.adSpend));
    for (const g of [cf.weekly, cf.monthly, cf.annual]) {
      expect(sum(g.map((r) => r.adSpend))).toBeCloseTo(totalAd, 4);
    }
    // Ending balance carries through, not summed.
    expect(cf.annual.at(-1)!.endBal).toBeCloseTo(cf.daily.at(-1)!.endBal, 6);
  });
});

describe("daily spend semantics", () => {
  it("monthly ad spend ≈ daily rate × days in month (uncapped)", () => {
    const p = clone();
    p.marketing.budgetRampPct = 0;
    p.capital.startCash = 5_000_000; // huge, so spend is never credit-capped
    const dailyRate = p.marketing.paidDaily + p.marketing.organicDaily; // 400/day
    const june = simulate(p).cashflow.monthly[0]; // day 0 = 1 Jun 2026, a full 30-day month
    expect(june.adSpend).toBeCloseTo(dailyRate * 30, 0);
  });
});
