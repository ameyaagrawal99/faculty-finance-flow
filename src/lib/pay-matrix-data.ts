import { AcademicLevel, PromotionPath } from "./types";

// Pay Matrix data extracted from UGC 7th CPC Academic Pay Matrix
// Each level has pay cells with 3% increment: ceil(basic * 1.03 / 100) * 100

export const PAY_MATRIX: AcademicLevel[] = [
  {
    id: "L10",
    designation: "Assistant Professor Gr-II (College)",
    levelName: "Level 10",
    revisedEntryPay: 68800,
    payCells: [57700,59400,61200,63000,64900,66800,68800,70900,73000,75200,77500,79800,82200,84700,87200,89800,92500,95300,98200],
    capType: "TRUNCATED",
    maxCellIndex: 18,
  },
  {
    id: "L11",
    designation: "Assistant Professor Gr-I (College)",
    levelName: "Level 11",
    revisedEntryPay: 75300,
    payCells: [68900,71000,73100,75300,77600,79900,82300,84800,87300,89900,92600,95400,98300,101200,104200,107300,110500,113800,117200],
    capType: "TRUNCATED",
    maxCellIndex: 18,
  },
  {
    id: "L12",
    designation: "Assistant Professor Gr-II",
    levelName: "Level 12",
    revisedEntryPay: 101500,
    payCells: [101500,104500,107600,110800,114100,117500,121000,124600,128300,132100,136100,140200,144400,148700,153200,157800,162500,167400],
    capType: "TRUNCATED",
    maxCellIndex: 17,
  },
  {
    id: "L13A1",
    designation: "Assistant Professor Gr-I",
    levelName: "Level 13A1",
    revisedEntryPay: 131400,
    payCells: [131400,135300,139400,143600,147900,152300,156900,161600,166400,171400,176500,181800,187300,192900,198700,204700],
    capType: "TRUNCATED",
    maxCellIndex: 15,
  },
  {
    id: "L13A2",
    designation: "Associate Professor",
    levelName: "Level 13A2",
    revisedEntryPay: 148100,
    payCells: [139600,143800,148100,152500,157100,161800,166700,171700,176900,182200,187700,193300,199100,205100,211300,217600,224100],
    capType: "NO_CAP",
  },
  {
    id: "L14A",
    designation: "Professor",
    levelName: "Level 14A",
    revisedEntryPay: 173900,
    payCells: [159100,163900,168800,173900,179100,184500,190000,195700,201600,207600,213800,220200,226800,233600,240600,247800,255200,262900,270800],
    capType: "NO_CAP",
  },
  {
    id: "L15",
    designation: "Senior Professor",
    levelName: "Level 15",
    revisedEntryPay: 211300,
    payCells: [182200,187700,193300,199100,205100,211300,217600,224100,230800,237700,244800,252100,259700,267500,275500,283800],
    capType: "NO_CAP",
  },
  {
    id: "L16",
    designation: "Director",
    levelName: "Level 16",
    revisedEntryPay: 217900,
    payCells: [205400,211600,217900,224400,231100,238000,245100,252500,260100,267900],
    capType: "NO_CAP",
  },
  {
    id: "L16A",
    designation: "Pro Vice-Chancellor",
    levelName: "Level 16A",
    revisedEntryPay: 222800,
    payCells: [210000,216300,222800,229500,236400,243500,250800,258300,266000,274000],
    capType: "NO_CAP",
  },
  {
    id: "L17",
    designation: "Vice-Chancellor",
    levelName: "Level 17",
    revisedEntryPay: 225000,
    payCells: [225000,231800,238800,246000,253400,261000,268800,276900,285200,293800],
    capType: "NO_CAP",
  },
];

// Faculty-relevant levels for the calculator (university)
export const FACULTY_LEVELS = ["L12", "L13A1", "L13A2", "L14A"];

export const PROMOTION_PATHS: PromotionPath[] = [
  { from: "L10", to: "L11" },
  { from: "L11", to: "L12" },
  { from: "L12", to: "L13A1" },
  { from: "L13A1", to: "L13A2" },
  { from: "L13A2", to: "L14A" },
  { from: "L14A", to: "L15" },
];

export function getLevelById(id: string): AcademicLevel | undefined {
  return PAY_MATRIX.find((l) => l.id === id);
}
