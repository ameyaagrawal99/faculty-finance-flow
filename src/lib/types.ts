export type CapType = "TRUNCATED" | "NO_CAP";

export interface AcademicLevel {
  id: string;
  designation: string;
  levelName: string;
  revisedEntryPay: number;
  payCells: number[];
  capType: CapType;
  maxCellIndex?: number;
}

export interface PromotionPath {
  from: string;
  to: string;
}

export type PensionScheme = "NPS" | "OPS";
export type IncrementMonth = 1 | 7;

export interface GlobalSettings {
  incrementRate: number;
  daPercent: number;
  hraPercent: number;
  hraCityType: "X" | "Y" | "Z";
  hraEnabled: boolean;
  hraOverride: number | null;
  taMonthly: number;
  ppfPercent: number;
  gratuityPercent: number;
  housingSupport: number;
  cpda: number;
  healthInsurance: number;
  phdIncentiveIncrements: number;
  // New Phase 2 fields
  entryPayOverrides: Record<string, number>;
  pensionScheme: PensionScheme;
  incrementMonth: IncrementMonth;
  stagnationEnabled: boolean;
  stagnationYears: number;
  institutionCluster: string;
}

export interface SalaryBreakdownResult {
  basicPay: number;
  da: number;
  hra: number;
  ta: number;
  grossMonthly: number;
  grossAnnual: number;
  ppf: number;
  gratuity: number;
  perksAnnual: number;
  perksMonthly: number;
  ctcMonthly: number;
  ctcAnnual: number;
  // NPS fields
  npsEmployee: number;
  npsEmployer: number;
}

export interface FacultyCase {
  id: string;
  name: string;
  levelId: string;
  cellIndex: number;
  yearsOfService: number;
  hasPhdIncentive: boolean;
}

export interface EdgeCaseInputs {
  joiningMonth?: number; // 1-12, for mid-year joining
  payBunching?: boolean;
  phdIncrementYear?: number; // year at which PhD obtained
  phdIncrements?: number;
  serviceBreakMonths?: number;
}

export const HRA_RATES: Record<string, number> = {
  X: 0.30,
  Y: 0.20,
  Z: 0.10,
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  incrementRate: 0.03,
  daPercent: 0.58,
  hraPercent: 0.20,
  hraCityType: "Y",
  hraEnabled: false,
  hraOverride: null,
  taMonthly: 5600,
  ppfPercent: 0.12,
  gratuityPercent: 0.0481,
  housingSupport: 400000,
  cpda: 150000,
  healthInsurance: 10000,
  phdIncentiveIncrements: 0,
  entryPayOverrides: {},
  pensionScheme: "NPS",
  incrementMonth: 7,
  stagnationEnabled: false,
  stagnationYears: 10,
  institutionCluster: "BITS",
};
