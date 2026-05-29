import type { Valuation } from "../../types";

// Weighted average cost of capital as a decimal (CAPM-style):
// (riskFree + beta * equityRiskPremium) / 100.
export function wacc(v: Valuation): number {
  return (v.rfRate + v.beta * v.erp) / 100;
}
