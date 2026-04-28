import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { backCalculateWpuGoaBands, getWpuGoaInclusiveAnnual } from "@/lib/wpu-goa";

describe("WPU Goa salary back-calculation", () => {
  it("finds basic pay ranges that fit inclusive annual salary bands", () => {
    const bands = backCalculateWpuGoaBands(DEFAULT_SETTINGS);
    const assistantOne = bands.find((band) => band.id === "assistant-professor-1");

    expect(assistantOne).toMatchObject({
      title: "Assistant Professor I",
      salaryRangeLpa: [15, 20],
      criteria: expect.stringContaining("Entry faculty"),
      minBasicPay: 67600,
      maxBasicPay: 91000,
    });

    expect(getWpuGoaInclusiveAnnual(assistantOne!.minBasicPay, DEFAULT_SETTINGS)).toBeGreaterThanOrEqual(1500000);
    expect(getWpuGoaInclusiveAnnual(assistantOne!.maxBasicPay, DEFAULT_SETTINGS)).toBeLessThanOrEqual(2000000);
    expect(assistantOne!.payCells[0]).toBe(67600);
    expect(assistantOne!.payCells.at(-1)).toBeLessThanOrEqual(91100);
  });

  it("adds perks after the WPU Goa inclusive salary to produce CTC", () => {
    const bands = backCalculateWpuGoaBands(DEFAULT_SETTINGS);
    const professor = bands.find((band) => band.id === "professor");

    expect(professor).toBeDefined();
    expect(professor!.salaryRangeLpa).toEqual([34, 65]);
    expect(professor!.startInclusiveAnnual).toBe(getWpuGoaInclusiveAnnual(professor!.minBasicPay, DEFAULT_SETTINGS));
    expect(professor!.startCtcAnnual).toBe(professor!.startInclusiveAnnual + DEFAULT_SETTINGS.housingSupport + DEFAULT_SETTINGS.cpda + DEFAULT_SETTINGS.healthInsurance);
  });
});
