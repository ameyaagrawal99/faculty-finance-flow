/**
 * DA (Dearness Allowance) schedule for Central Government / UGC employees
 * under the 7th Pay Commission.
 *
 * DA is revised bi-annually:
 *   - 1 January revision: based on average AICPI-IW for the preceding 12 months (Jul–Dec)
 *   - 1 July revision: based on average AICPI-IW for Jan–Jun of the same year
 *
 * Formula: DA% = ((12-month avg AICPI-IW − 261.42) / 261.42) × 100
 * Base index 261.42 corresponds to CPI-IW base year 2001=100.
 *
 * Sources: Labour Bureau notifications, Cabinet approvals, staffnews.in
 */

export interface DAEntry {
  effectiveFrom: string;  // "YYYY-MM"
  daPercent: number;      // as decimal fraction (0.60 = 60%)
  change: number;         // change from previous entry, as fraction
  status: "confirmed" | "projected";
  label: string;          // display string e.g. "Jan 2026"
}

/**
 * Historical confirmed rates (7th CPC era, post-COVID freeze).
 * Projections assume +2–3% per revision until 8th CPC implementation (~2028).
 *
 * COVID note: DA was frozen at 17% from Jan 2020 – Jun 2021; three withheld
 * instalments (+11%) were released together in Jul 2021.
 */
export const DA_SCHEDULE: DAEntry[] = [
  { effectiveFrom: "2022-01", daPercent: 0.34, change: 0.03, status: "confirmed", label: "Jan 2022" },
  { effectiveFrom: "2022-07", daPercent: 0.38, change: 0.04, status: "confirmed", label: "Jul 2022" },
  { effectiveFrom: "2023-01", daPercent: 0.42, change: 0.04, status: "confirmed", label: "Jan 2023" },
  { effectiveFrom: "2023-07", daPercent: 0.46, change: 0.04, status: "confirmed", label: "Jul 2023" },
  { effectiveFrom: "2024-01", daPercent: 0.50, change: 0.04, status: "confirmed", label: "Jan 2024" },
  { effectiveFrom: "2024-07", daPercent: 0.53, change: 0.03, status: "confirmed", label: "Jul 2024" },
  { effectiveFrom: "2025-01", daPercent: 0.55, change: 0.02, status: "confirmed", label: "Jan 2025" },
  { effectiveFrom: "2025-07", daPercent: 0.58, change: 0.03, status: "confirmed", label: "Jul 2025" },
  { effectiveFrom: "2026-01", daPercent: 0.60, change: 0.02, status: "confirmed", label: "Jan 2026" },
  // --- Projections below ---
  { effectiveFrom: "2026-07", daPercent: 0.62, change: 0.02, status: "projected", label: "Jul 2026" },
  { effectiveFrom: "2027-01", daPercent: 0.64, change: 0.02, status: "projected", label: "Jan 2027" },
  { effectiveFrom: "2027-07", daPercent: 0.67, change: 0.03, status: "projected", label: "Jul 2027" },
  { effectiveFrom: "2028-01", daPercent: 0.70, change: 0.03, status: "projected", label: "Jan 2028" },
];

/**
 * 8th Pay Commission note.
 * The 8PC was constituted in January 2025. Its recommendations are expected
 * ~mid-2027, with implementation (new pay scales + DA reset to 0%) likely in 2028.
 */
export const DA_8TH_CPC_NOTE =
  "The 8th Pay Commission (constituted Jan 2025) is expected to recommend revised pay scales by mid-2027. " +
  "Upon implementation (~2028), all accumulated DA will merge into the revised basic pay and reset to 0%.";

/**
 * Returns the DA rate (as decimal fraction) effective at the start (January)
 * of the given calendar year. Falls back to the last known rate for years
 * beyond the schedule.
 */
export function getDAForYear(year: number): number {
  const target = `${year}-01`;
  let result = DA_SCHEDULE[0].daPercent;
  for (const entry of DA_SCHEDULE) {
    if (entry.effectiveFrom <= target) {
      result = entry.daPercent;
    }
  }
  return result;
}

/** Returns the current confirmed DA rate (as decimal fraction). */
export function getCurrentDA(): number {
  const confirmed = DA_SCHEDULE.filter((e) => e.status === "confirmed");
  return confirmed[confirmed.length - 1].daPercent;
}
