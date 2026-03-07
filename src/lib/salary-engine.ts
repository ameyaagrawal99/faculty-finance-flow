import { AcademicLevel, GlobalSettings, SalaryBreakdownResult, HRA_RATES, EdgeCaseInputs } from "./types";
import { getDAForYear } from "./da-schedule";
import { getLevelById, PROMOTION_PATHS } from "./pay-matrix-data";

/** Round up to next 100 */
export function roundUpTo100(value: number): number {
  return Math.ceil(value / 100) * 100;
}

/** Generate pay cells from a given entry pay using 3% increments */
export function generatePayCells(entryPay: number, count: number): number[] {
  const cells: number[] = [entryPay];
  for (let i = 1; i < count; i++) {
    cells.push(roundUpTo100(cells[i - 1] * 1.03));
  }
  return cells;
}

/** Get a level with entry pay override applied */
export function getEffectiveLevel(level: AcademicLevel, settings: GlobalSettings): AcademicLevel {
  const override = settings.entryPayOverrides[level.id];
  if (override && override !== level.revisedEntryPay) {
    const newCells = generatePayCells(override, level.payCells.length);
    return { ...level, revisedEntryPay: override, payCells: newCells };
  }
  return level;
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
  if (level.capType === "NO_CAP") {
    let lastPay = level.payCells[level.payCells.length - 1];
    for (let i = level.payCells.length; i <= cellIndex; i++) {
      lastPay = roundUpTo100(lastPay * 1.03);
    }
    return lastPay;
  }
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
  return { newCellIndex: newIndex, newBasicPay: getBasicPayAtCell(level, newIndex), blocked: false };
}

/** Find the cell index in targetLevel whose basic >= tempPay */
export function findNextHigherCell(targetLevel: AcademicLevel, tempPay: number): number {
  for (let i = 0; i < targetLevel.payCells.length; i++) {
    if (targetLevel.payCells[i] >= tempPay) return i;
  }
  if (targetLevel.capType === "NO_CAP") {
    let pay = targetLevel.payCells[targetLevel.payCells.length - 1];
    let idx = targetLevel.payCells.length - 1;
    while (pay < tempPay) {
      pay = roundUpTo100(pay * 1.03);
      idx++;
    }
    return idx;
  }
  return targetLevel.payCells.length - 1;
}

/** Simulate promotion */
export function simulatePromotion(
  currentLevelId: string,
  currentCellIndex: number,
  settings?: GlobalSettings,
): { newLevelId: string; newCellIndex: number; newBasicPay: number; tempPay: number } | null {
  const path = PROMOTION_PATHS.find((p) => p.from === currentLevelId);
  if (!path) return null;

  let currentLevel = getLevelById(currentLevelId);
  let targetLevel = getLevelById(path.to);
  if (!currentLevel || !targetLevel) return null;

  if (settings) {
    currentLevel = getEffectiveLevel(currentLevel, settings);
    targetLevel = getEffectiveLevel(targetLevel, settings);
  }

  const currentBasic = getBasicPayAtCell(currentLevel, currentCellIndex);
  const tempPay = roundUpTo100(currentBasic * 1.03);
  const newCellIndex = findNextHigherCell(targetLevel, tempPay);
  const newBasicPay = getBasicPayAtCell(targetLevel, newCellIndex);

  return { newLevelId: path.to, newCellIndex, newBasicPay, tempPay };
}

/** Calculate full salary breakdown */
export function calculateSalary(
  basicPay: number,
  settings: GlobalSettings,
): SalaryBreakdownResult {
  const da = Math.round(basicPay * settings.daPercent);

  // HRA logic: off by default
  let hra = 0;
  if (settings.hraEnabled) {
    if (settings.hraOverride !== null && settings.hraOverride !== undefined) {
      hra = Math.round(basicPay * settings.hraOverride);
    } else {
      const hraRate = HRA_RATES[settings.hraCityType] ?? settings.hraPercent;
      hra = Math.round(basicPay * hraRate);
    }
  }

  const ta = settings.taMonthly;
  const grossMonthly = basicPay + da + hra + ta;
  const grossAnnual = grossMonthly * 12;

  const ppf = Math.round(basicPay * settings.ppfPercent);
  const gratuity = Math.round(basicPay * settings.gratuityPercent);
  const perksAnnual = settings.housingSupport + settings.cpda + settings.healthInsurance;
  const perksMonthly = Math.round(perksAnnual / 12);

  // NPS/OPS
  let npsEmployee = 0;
  let npsEmployer = 0;
  if (settings.pensionScheme === "NPS") {
    npsEmployee = Math.round((basicPay + da) * 0.10);
    npsEmployer = Math.round((basicPay + da) * 0.14);
  }

  const ctcMonthly = grossMonthly + ppf + gratuity + perksMonthly + npsEmployer;
  const ctcAnnual = grossAnnual + (ppf + gratuity + npsEmployer) * 12 + perksAnnual;

  return {
    basicPay, da, hra, ta,
    grossMonthly, grossAnnual,
    ppf, gratuity,
    perksAnnual, perksMonthly,
    ctcMonthly, ctcAnnual,
    npsEmployee, npsEmployer,
  };
}

/** Check mid-year joining increment eligibility */
export function isMidYearEligible(joiningMonth: number, incrementMonth: number): boolean {
  // Must have at least 6 months of service before increment date
  const monthsOfService = ((incrementMonth - joiningMonth) + 12) % 12;
  return monthsOfService >= 6;
}

/** Apply pay bunching: extra 3% when two faculty reach same cell */
export function applyPayBunching(basicPay: number): number {
  return roundUpTo100(basicPay * 1.03);
}

/** Apply PhD incentive: additional increments */
export function applyPhdIncentive(level: AcademicLevel, cellIndex: number, increments: number): {
  newCellIndex: number;
  newBasicPay: number;
} {
  let idx = cellIndex;
  for (let i = 0; i < increments; i++) {
    if (canIncrement(level, idx)) idx++;
  }
  return { newCellIndex: idx, newBasicPay: getBasicPayAtCell(level, idx) };
}

/** Apply stagnation increment: extra increment after N years at same level */
export function applyStagnationIncrement(level: AcademicLevel, cellIndex: number, yearsAtLevel: number, stagnationYears: number): {
  newCellIndex: number;
  newBasicPay: number;
  applied: boolean;
} {
  if (yearsAtLevel >= stagnationYears && !canIncrement(level, cellIndex)) {
    // Grant one extra increment beyond cap
    const newPay = roundUpTo100(getBasicPayAtCell(level, cellIndex) * 1.03);
    return { newCellIndex: cellIndex + 1, newBasicPay: newPay, applied: true };
  }
  return { newCellIndex: cellIndex, newBasicPay: getBasicPayAtCell(level, cellIndex), applied: false };
}

/** Calculate arrears for retrospective DA/pay revision */
export function calculateArrears(
  basicPay: number,
  oldDaPercent: number,
  newDaPercent: number,
  retrospectiveMonths: number,
  settings: GlobalSettings,
): {
  oldGross: number;
  newGross: number;
  monthlyDifference: number;
  totalArrears: number;
  months: number;
} {
  const oldDa = Math.round(basicPay * oldDaPercent);
  const newDa = Math.round(basicPay * newDaPercent);

  let hra = 0;
  if (settings.hraEnabled) {
    if (settings.hraOverride !== null && settings.hraOverride !== undefined) {
      hra = Math.round(basicPay * settings.hraOverride);
    } else {
      const hraRate = HRA_RATES[settings.hraCityType] ?? settings.hraPercent;
      hra = Math.round(basicPay * hraRate);
    }
  }

  const oldGross = basicPay + oldDa + hra + settings.taMonthly;
  const newGross = basicPay + newDa + hra + settings.taMonthly;
  const monthlyDifference = newGross - oldGross;
  const totalArrears = monthlyDifference * retrospectiveMonths;

  return { oldGross, newGross, monthlyDifference, totalArrears, months: retrospectiveMonths };
}

/** Project salary growth over N years from a starting point */
export function projectGrowth(
  levelId: string,
  startCellIndex: number,
  years: number,
  settings: GlobalSettings,
  promotionAtYear?: number,
  edgeCases?: EdgeCaseInputs,
  startYear?: number,
): Array<{
  year: number;
  levelId: string;
  cellIndex: number;
  basicPay: number;
  salary: SalaryBreakdownResult;
  notes: string[];
}> {
  const results: Array<{
    year: number;
    levelId: string;
    cellIndex: number;
    basicPay: number;
    salary: SalaryBreakdownResult;
    notes: string[];
  }> = [];

  let curLevel = levelId;
  let curCell = startCellIndex;
  let yearsAtLevel = 0;
  let firstIncrementDelayed = false;

  // Mid-year joining check
  if (edgeCases?.joiningMonth) {
    firstIncrementDelayed = !isMidYearEligible(edgeCases.joiningMonth, settings.incrementMonth);
  }

  for (let y = 0; y <= years; y++) {
    let level = getLevelById(curLevel);
    if (!level) break;
    level = getEffectiveLevel(level, settings);

    const notes: string[] = [];
    let basic = getBasicPayAtCell(level, curCell);

    // PhD incentive at specified year
    if (edgeCases?.phdIncrementYear !== undefined && y === edgeCases.phdIncrementYear && edgeCases.phdIncrements) {
      const phd = applyPhdIncentive(level, curCell, edgeCases.phdIncrements);
      curCell = phd.newCellIndex;
      basic = phd.newBasicPay;
      notes.push(`PhD incentive: +${edgeCases.phdIncrements} increment(s)`);
    }

    // Pay bunching
    if (edgeCases?.payBunching && y > 0) {
      // Mark for display — actual bunching logic would compare two cases
      notes.push("Pay bunching eligible");
    }

    // Stagnation increment
    if (settings.stagnationEnabled && yearsAtLevel >= settings.stagnationYears) {
      const stag = applyStagnationIncrement(level, curCell, yearsAtLevel, settings.stagnationYears);
      if (stag.applied) {
        curCell = stag.newCellIndex;
        basic = stag.newBasicPay;
        notes.push(`Stagnation increment granted (${yearsAtLevel} years at level)`);
      }
    }

    let effectiveSettings = settings;
    if (settings.daMode === "projected" && startYear !== undefined) {
      const projectedDA = getDAForYear(startYear + y);
      effectiveSettings = { ...settings, daPercent: projectedDA };
    }
    const salary = calculateSalary(basic, effectiveSettings);
    results.push({ year: y, levelId: curLevel, cellIndex: curCell, basicPay: basic, salary, notes });

    // Check promotion
    if (promotionAtYear !== undefined && y === promotionAtYear) {
      const promo = simulatePromotion(curLevel, curCell, settings);
      if (promo) {
        curLevel = promo.newLevelId;
        curCell = promo.newCellIndex;
        yearsAtLevel = 0;
        continue;
      }
    }

    // Apply increment for next year
    if (y < years) {
      // Service break delays increment
      if (edgeCases?.serviceBreakMonths && edgeCases.serviceBreakMonths > 0 && y === 0) {
        const effectiveMonths = 12 - edgeCases.serviceBreakMonths;
        if (effectiveMonths < 6) {
          notes.push("Increment delayed due to service break");
          yearsAtLevel++;
          continue;
        }
      }

      // Mid-year joining delays first increment
      if (y === 0 && firstIncrementDelayed) {
        notes.push("First increment delayed (mid-year joining, < 6 months service)");
        yearsAtLevel++;
        continue;
      }

      const lev = getEffectiveLevel(getLevelById(curLevel)!, settings);
      const inc = applyAnnualIncrement(lev, curCell);
      curCell = inc.newCellIndex;
      yearsAtLevel++;
    }
  }

  return results;
}
