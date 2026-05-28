import { describe, expect, it } from "vitest";
import { simulate, NMONTHS } from "./engine";
import { buildStatements } from "./statements";
import { buildSchedule } from "./schedule";
import { DEFAULT_PARAMS } from "./defaults";
import type { Params } from "./types";

const run = (mut?: (p: Params) => void) => {
  const p = structuredClone(DEFAULT_PARAMS);
  if (mut) mut(p);
  const sim = simulate(p);
  return { p, sim, st: buildStatements(sim, p) };
};

describe("articulation", () => {
  it("balance sheet balances every month", () => {
    const { st } = run();
    expect(st.balanced).toBe(true);
    for (const b of st.bs) {
      expect(Math.abs(b.totalAssets - (b.totalLiab + b.totalEquity))).toBeLessThan(1);
    }
  });

  it("cash flow ties: beginning + net change = ending, every month", () => {
    const { st, p } = run();
    let prev = p.capital.startCash;
    for (const c of st.cfs) {
      expect(Math.abs(prev + c.netChange - c.endCash)).toBeLessThan(1);
      prev = c.endCash;
    }
  });

  it("CFS ending cash equals the sim's actual cash balance", () => {
    const { sim, st } = run();
    expect(Math.abs(st.cfs[NMONTHS - 1].endCash - sim.daily.cash[sim.days - 1])).toBeLessThan(1);
  });

  it("holds under an aggressive (insolvent) scenario too", () => {
    const { st } = run((p) => {
      p.marketing.budget = { base: 80000, overrides: { 20: 200000 } };
      p.capital.draw = { base: 3000, overrides: {} };
    });
    expect(st.balanced).toBe(true);
  });

  it("monthly recognised revenue sums to the sim's total", () => {
    const { sim, st } = run();
    let dailyTot = 0;
    for (let i = 0; i < sim.days; i++) dailyTot += sim.daily.recRev[i];
    const monthlyTot = st.is.reduce((a, x) => a + x.revenue, 0);
    expect(Math.abs(monthlyTot - dailyTot)).toBeLessThan(1);
  });
});

describe("DCF", () => {
  it("EV = PV(explicit) + PV(terminal); equity = EV − card + cash", () => {
    const { sim, st } = run();
    expect(Math.abs(st.ev - (st.pvExplicit + st.pvTV))).toBeLessThan(1);
    const endCard = sim.daily.cardDebt[sim.days - 1];
    const endCash = sim.daily.cash[sim.days - 1];
    expect(Math.abs(st.equityValue - (st.ev - endCard + endCash))).toBeLessThan(1);
  });

  it("faster web payout yields higher EV than slow app payout, all else equal", () => {
    const web = run((p) => {
      p.channels[0].route = "WEB";
      p.channels[1].route = "WEB";
    }).st.ev;
    const app = run((p) => {
      p.channels[0].route = "APP";
      p.channels[1].route = "APP";
    }).st.ev;
    expect(web).toBeGreaterThan(app);
  });
});

describe("schedule rollups", () => {
  it("are sum-preserving across D / W / M for flows", () => {
    const { sim } = run();
    const sum = (rows: { recRev: number; billings: number; adSpend: number }[]) =>
      rows.reduce(
        (a, r) => ({
          recRev: a.recRev + r.recRev,
          billings: a.billings + r.billings,
          adSpend: a.adSpend + r.adSpend,
        }),
        { recRev: 0, billings: 0, adSpend: 0 },
      );
    const d = sum(buildSchedule(sim, "D"));
    const w = sum(buildSchedule(sim, "W"));
    const m = sum(buildSchedule(sim, "M"));
    expect(Math.abs(d.recRev - w.recRev)).toBeLessThan(1);
    expect(Math.abs(d.recRev - m.recRev)).toBeLessThan(1);
    expect(Math.abs(d.billings - m.billings)).toBeLessThan(1);
    expect(Math.abs(d.adSpend - m.adSpend)).toBeLessThan(1);
  });

  it("monthly schedule has one row per month", () => {
    const { sim } = run();
    expect(buildSchedule(sim, "M").length).toBe(NMONTHS);
  });
});
