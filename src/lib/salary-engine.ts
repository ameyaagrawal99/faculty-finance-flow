import { AcademicLevel, GlobalSettings, SalaryBreakdownResult, HRA_RATES } from "./types";
import { getLevelById, PROMOTION_PATHS } from "./pay-matrix-data";

/** Round up to next 100 */
export function roundUpTo100(value: number): number {
  return Math.ceil(value / 100) * 100;
}

/** Get the next pay cell basic pay (3% increment, rounded) */
export function getNextIncrement(basicPay: number): number {
  return roundUpTo100(basicPay * 1.03);
}

/** Get the basic pay at a given cell index for a level. Generates dynamically for NO_CAP. */
export function getBasicPayAtCell(level: AcademicLevel, cellIndex: number): number {
  if (cellIndex < level.payCells.length) {
    return level.payCells[cellIndex];
  }
  // For NO_CAP levels, generate cells dynamically beyond table
  if (level.capType === "NO_CAP") {
    let lastPay = level.payCells[level.payCells.length - 1];
    for (let i = level.payCells.length; i <= cellIndex; i++) {
      lastPay = roundUpTo100(lastPay * 1.03);
    }
    return lastPay;
  }
  // TRUNCATED: return last cell
  return level.payCells[level.payCells.length - 1];
}

/** Check if increment is allowed */
export function canIncrement(level: AcademicLevel, currentCellIndex: number): boolean {
  if (level.capType === "NO_CAP") return true;
  if (level.maxCellIndex !== undefined) {
    return currentCellIndex < level.maxCellIndex;
  }
  return currentCellIndex < level.payCells.length - 1;
}

/** Apply annual increment. Returns new cell index. */
export function applyAnnualIncrement(level: AcademicLevel, currentCellIndex: number): {
  newCellIndex: number;
  newBasicPay: number;
  blocked: boolean;
} {
  if (!canIncrement(level, currentCellIndex)) {
    return {
      newCellIndex: currentCellIndex,
      newBasicPay: getBasicPayAtCell(level, currentCellIndex),
      blocked: true,
    };
  }
  const newIndex = currentCellIndex + 1;
  return {
    newCellIndex: newIndex,
    newBasicPay: getBasicPayAtCell(level, newIndex),
    blocked: false,
  };
}

/** Find the cell index in targetLevel whose basic >= tempPay */
export function findNextHigherCell(targetLevel: AcademicLevel, tempPay: number): number {
  // Search existing cells
  for (let i = 0; i < targetLevel.payCells.length; i++) {
    if (targetLevel.payCells[i] >= tempPay) return i;
  }
  // For NO_CAP, generate beyond
  if (targetLevel.capType === "NO_CAP") {
    let pay = targetLevel.payCells[targetLevel.payCells.length - 1];
    let idx = targetLevel.payCells.length - 1;
    while (pay < tempPay) {
      pay = roundUpTo100(pay * 1.03);
      idx++;
    }
    return idx;
  }
  // TRUNCATED: return last cell
  return targetLevel.payCells.length - 1;
}

/** Simulate promotion. Returns new level, cell index, and basic pay. */
export function simulatePromotion(
  currentLevelId: string,
  currentCellIndex: number,
): { newLevelId: string; newCellIndex: number; newBasicPay: number; tempPay: number } | null {
  const path = PROMOTION_PATHS.find((p) => p.from === currentLevelId);
  if (!path) return null;

  const currentLevel = getLevelById(currentLevelId);
  const targetLevel = getLevelById(path.to);
  if (!currentLevel || !targetLevel) return null;

  const currentBasic = getBasicPayAtCell(currentLevel, currentCellIndex);
  // Step 1: Notional increment
  const tempPay = roundUpTo100(currentBasic * 1.03);
  // Step 2: Find next higher cell in target level
  const newCellIndex = findNextHigherCell(targetLevel, tempPay);
  const newBasicPay = getBasicPayAtCell(targetLevel, newCellIndex);

  return { newLevelId: path.to, newCellIndex, newBasicPay, tempPay };
}

/** Calculate full salary breakdown */
export function calculateSalary(
  basicPay: number,
  settings: GlobalSettings,
): SalaryBreakdownResult {
  const hraRate = HRA_RATES[settings.hraCityType] ?? settings.hraPercent;
  const da = Math.round(basicPay * settings.daPercent);
  const hra = Math.round(basicPay * hraRate);
  const ta = settings.taMonthly;
  const grossMonthly = basicPay + da + hra + ta;
  const grossAnnual = grossMonthly * 12;

  const ppf = Math.round(basicPay * settings.ppfPercent);
  const gratuity = Math.round(basicPay * settings.gratuityPercent);
  const perksAnnual = settings.housingSupport + settings.cpda + settings.healthInsurance;
  const perksMonthly = Math.round(perksAnnual / 12);

  const ctcMonthly = grossMonthly + ppf + gratuity + perksMonthly;
  const ctcAnnual = grossAnnual + (ppf + gratuity) * 12 + perksAnnual;

  return {
    basicPay, da, hra, ta,
    grossMonthly, grossAnnual,
    ppf, gratuity,
    perksAnnual, perksMonthly,
    ctcMonthly, ctcAnnual,
  };
}

/** Project salary growth over N years from a starting point */
export function projectGrowth(
  levelId: string,
  startCellIndex: number,
  years: number,
  settings: GlobalSettings,
  promotionAtYear?: number, // year at which promotion occurs
): Array<{
  year: number;
  levelId: string;
  cellIndex: number;
  basicPay: number;
  salary: SalaryBreakdownResult;
}> {
  const results: Array<{
    year: number;
    levelId: string;
    cellIndex: number;
    basicPay: number;
    salary: SalaryBreakdownResult;
  }> = [];

  let curLevel = levelId;
  let curCell = startCellIndex;

  for (let y = 0; y <= years; y++) {
    const level = getLevelById(curLevel);
    if (!level) break;
    const basic = getBasicPayAtCell(level, curCell);
    const salary = calculateSalary(basic, settings);
    results.push({ year: y, levelId: curLevel, cellIndex: curCell, basicPay: basic, salary });

    // Check promotion
    if (promotionAtYear !== undefined && y === promotionAtYear) {
      const promo = simulatePromotion(curLevel, curCell);
      if (promo) {
        curLevel = promo.newLevelId;
        curCell = promo.newCellIndex;
        continue;
      }
    }

    // Apply increment for next year
    if (y < years) {
      const lev = getLevelById(curLevel)!;
      const inc = applyAnnualIncrement(lev, curCell);
      curCell = inc.newCellIndex;
    }
  }

  return results;
}
