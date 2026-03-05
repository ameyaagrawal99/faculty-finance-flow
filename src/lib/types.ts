export type CapType = "TRUNCATED" | "NO_CAP";

export interface AcademicLevel {
  id: string;
  designation: string;
  levelName: string;
  revisedEntryPay: number;
  payCells: number[];
  capType: CapType;
  maxCellIndex?: number; // index in payCells where truncation occurs (only for TRUNCATED)
}

export interface PromotionPath {
  from: string; // level id
  to: string;   // level id
}

export interface GlobalSettings {
  incrementRate: number;       // default 0.03
  daPercent: number;           // default 0.58
  hraPercent: number;          // default 0.20
  hraCityType: "X" | "Y" | "Z";
  taMonthly: number;           // default 5600
  ppfPercent: number;          // default 0.12
  gratuityPercent: number;     // default 0.0481
  housingSupport: number;      // annual, default 400000
  cpda: number;                // annual, default 150000
  healthInsurance: number;     // annual, default 10000
  phdIncentiveIncrements: number; // default 0
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
}

export interface FacultyCase {
  id: string;
  name: string;
  levelId: string;
  cellIndex: number;
  yearsOfService: number;
  hasPhdIncentive: boolean;
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
  taMonthly: 5600,
  ppfPercent: 0.12,
  gratuityPercent: 0.0481,
  housingSupport: 400000,
  cpda: 150000,
  healthInsurance: 10000,
  phdIncentiveIncrements: 0,
};
