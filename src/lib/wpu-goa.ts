import { calculateSalary, roundUpTo100 } from "./salary-engine";
import { GlobalSettings } from "./types";
import { getLevelById } from "./pay-matrix-data";

export interface WpuGoaBandInput {
  id: string;
  title: string;
  salaryRangeLpa: [number, number];
  criteria: string;
  ugcAnchorLevelId: string;
}

export interface WpuGoaCalculatedBand extends WpuGoaBandInput {
  minAnnualSalary: number;
  maxAnnualSalary: number;
  minBasicPay: number;
  maxBasicPay: number;
  payCells: number[];
  startInclusiveAnnual: number;
  startCtcAnnual: number;
  ugcAnchorLabel: string;
  ugcAnchorEntryPay: number;
  nearestUgcBasicPay: number;
  nearestUgcCellIndex: number;
}

export const WPU_GOA_BANDS: WpuGoaBandInput[] = [
  {
    id: "assistant-professor-1",
    title: "Assistant Professor I",
    salaryRangeLpa: [15, 20],
    criteria: "Entry faculty band. Use for early-career candidates meeting minimum teaching eligibility.",
    ugcAnchorLevelId: "L10",
  },
  {
    id: "assistant-professor-2",
    title: "Assistant Professor II",
    salaryRangeLpa: [18, 22],
    criteria: "Strong assistant professor band. Use for candidates with stronger teaching/research evidence.",
    ugcAnchorLevelId: "L11",
  },
  {
    id: "assistant-professor-3",
    title: "Assistant Professor III",
    salaryRangeLpa: [20, 28],
    criteria: "Senior assistant professor band. Use for high-potential candidates with meaningful academic output.",
    ugcAnchorLevelId: "L12",
  },
  {
    id: "associate-professor",
    title: "Associate Professor",
    salaryRangeLpa: [24, 38],
    criteria: "Associate professor band. Use for established faculty with leadership, research, and program contribution.",
    ugcAnchorLevelId: "L13A2",
  },
  {
    id: "professor",
    title: "Professor",
    salaryRangeLpa: [34, 65],
    criteria: "Professor band. Use for senior faculty with institution-building, scholarship, and academic leadership.",
    ugcAnchorLevelId: "L14A",
  },
];

export function getWpuGoaInclusiveAnnual(basicPay: number, settings: GlobalSettings): number {
  const salary = calculateSalary(basicPay, settings);
  return salary.grossAnnual + (salary.ppf + salary.gratuity + salary.npsEmployer) * 12;
}

export function getWpuGoaCtcAnnual(basicPay: number, settings: GlobalSettings): number {
  const salary = calculateSalary(basicPay, settings);
  return getWpuGoaInclusiveAnnual(basicPay, settings) + salary.perksAnnual;
}

function findFirstBasicAtOrAbove(targetAnnual: number, settings: GlobalSettings): number {
  let low = 0;
  let high = 500000;

  while (getWpuGoaInclusiveAnnual(high, settings) < targetAnnual) {
    high *= 2;
  }

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (getWpuGoaInclusiveAnnual(mid, settings) >= targetAnnual) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return roundUpTo100(low);
}

function findLastBasicAtOrBelow(targetAnnual: number, settings: GlobalSettings): number {
  let low = 0;
  let high = 500000;

  while (getWpuGoaInclusiveAnnual(high, settings) <= targetAnnual) {
    high *= 2;
  }

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (getWpuGoaInclusiveAnnual(mid, settings) <= targetAnnual) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return Math.floor(low / 100) * 100;
}

function generateWpuGoaPayCells(minBasicPay: number, maxBasicPay: number): number[] {
  const cells = [minBasicPay];
  while (cells.length < 80) {
    const next = roundUpTo100(cells[cells.length - 1] * 1.03);
    if (next > maxBasicPay) break;
    cells.push(next);
  }
  return cells;
}

function getNearestUgcCell(ugcAnchorLevelId: string, targetBasicPay: number) {
  const level = getLevelById(ugcAnchorLevelId);
  if (!level) {
    return {
      ugcAnchorLabel: ugcAnchorLevelId,
      ugcAnchorEntryPay: 0,
      nearestUgcBasicPay: targetBasicPay,
      nearestUgcCellIndex: 0,
    };
  }

  const nearest = level.payCells.reduce(
    (best, pay, index) => {
      const distance = Math.abs(pay - targetBasicPay);
      return distance < best.distance ? { pay, index, distance } : best;
    },
    { pay: level.payCells[0], index: 0, distance: Math.abs(level.payCells[0] - targetBasicPay) },
  );

  return {
    ugcAnchorLabel: `${level.levelName} · ${level.designation}`,
    ugcAnchorEntryPay: level.revisedEntryPay,
    nearestUgcBasicPay: nearest.pay,
    nearestUgcCellIndex: nearest.index,
  };
}

export function backCalculateWpuGoaBands(
  settings: GlobalSettings,
  bands: WpuGoaBandInput[] = WPU_GOA_BANDS,
): WpuGoaCalculatedBand[] {
  return bands.map((band) => {
    const minAnnualSalary = band.salaryRangeLpa[0] * 100000;
    const maxAnnualSalary = band.salaryRangeLpa[1] * 100000;
    const minBasicPay = findFirstBasicAtOrAbove(minAnnualSalary, settings);
    const maxBasicPay = findLastBasicAtOrBelow(maxAnnualSalary, settings);
    const ugcAnchor = getNearestUgcCell(band.ugcAnchorLevelId, minBasicPay);

    return {
      ...band,
      minAnnualSalary,
      maxAnnualSalary,
      minBasicPay,
      maxBasicPay,
      payCells: generateWpuGoaPayCells(minBasicPay, maxBasicPay),
      startInclusiveAnnual: getWpuGoaInclusiveAnnual(minBasicPay, settings),
      startCtcAnnual: getWpuGoaCtcAnnual(minBasicPay, settings),
      ...ugcAnchor,
    };
  });
}
