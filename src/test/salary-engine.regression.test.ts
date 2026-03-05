import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { applyAnnualIncrement, calculateSalary, simulatePromotion } from "@/lib/salary-engine";
import { getLevelById } from "@/lib/pay-matrix-data";

describe("salary engine regression safety", () => {
  it("keeps OPS salary breakdown arithmetic stable", () => {
    const salary = calculateSalary(101500, DEFAULT_SETTINGS);

    expect(salary).toMatchObject({
      basicPay: 101500,
      da: 58870,
      hra: 0,
      ta: 5600,
      grossMonthly: 165970,
      grossAnnual: 1991640,
      ppf: 12180,
      gratuity: 4882,
      perksAnnual: 560000,
      perksMonthly: 46667,
      ctcMonthly: 229699,
      ctcAnnual: 2756384,
      npsEmployee: 0,
      npsEmployer: 0,
    });
  });

  it("keeps increment cap behavior for truncated levels", () => {
    const level12 = getLevelById("L12");
    expect(level12).toBeDefined();

    const res = applyAnnualIncrement(level12!, 17);
    expect(res.blocked).toBe(true);
    expect(res.newCellIndex).toBe(17);
    expect(res.newBasicPay).toBe(167400);
  });

  it("keeps promotion mapping and next higher cell behavior", () => {
    const promo = simulatePromotion("L12", 0, DEFAULT_SETTINGS);
    expect(promo).toEqual({
      newLevelId: "L13A1",
      newCellIndex: 0,
      newBasicPay: 131400,
      tempPay: 104600,
    });
  });
});
