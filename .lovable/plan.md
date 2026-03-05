

## Plan: Pay Matrix Page Enhancements

### 1. Default Visibility — Show Only Core Faculty Levels

Currently the Pay Matrix page shows all 10 levels. Change the default to show only 6 core levels:
- **3 Assistant Professor levels**: L10, L11, L12 (or L12, L13A1 — clarify: the 3 assistant levels are L10 "Asst Prof Gr-II (College)", L11 "Asst Prof Gr-I (College)", L12 "Asst Prof Gr-II" — but from context, likely means L12, L13A1, L13A2... Actually user said "3 level of assistant, 2 level of associate, 1 professor". Looking at data: Assistant = L10, L11, L12, L13A1 (4 levels). Associate = L13A2 (1 level). So user likely means: L12 (Asst Gr-II), L13A1 (Asst Gr-I), L13A2 (Assoc), L14A (Prof) — that's 2 asst + 1 assoc + 1 prof. Let me re-read: "3 level of assistant" = L10, L11, L12 or L12, L13A1, and one more? The designations are: L10=Asst Gr-II (College), L11=Asst Gr-I (College), L12=Asst Prof Gr-II, L13A1=Asst Prof Gr-I. So 4 assistant levels exist. "2 level of associate" — only L13A2 exists as associate. This is confusing.)

**Resolution**: Default visible = L12 (Asst Gr-II), L13A1 (Asst Gr-I), L13A2 (Associate), L14A (Professor) — the 4 faculty-relevant levels. Add a multi-select toggle or checkboxes to show/hide additional levels (L10, L11, L15, L16, L16A, L17). This matches `FACULTY_LEVELS` already defined.

**Implementation**:
- Replace the single-select filter with a multi-select checkbox group
- Default checked: L12, L13A1, L13A2, L14A
- "Show All" toggle to reveal L10, L11, L15, L16, L16A, L17
- Collapsible "More Levels" section for the administrative/senior levels

### 2. New "Compensation Table" View

A second tab/view on the Pay Matrix page where user can:
- Select one or more positions (level + cell)
- See a full compensation table per selection showing: Basic, DA, HRA, TA, Gross, PPF, Gratuity, Perks, CTC — all in one row
- Monthly/Annual toggle
- Uses current global settings for calculations

**Implementation**:
- Add a Tabs component at the top: "Pay Matrix" | "Compensation Table"
- Compensation Table tab:
  - Multi-select for levels (checkboxes)
  - For each selected level, show ALL cells as rows in a table
  - Columns: Cell#, Basic, DA, HRA, TA, Gross, PPF, Gratuity, Perks/mo, CTC
  - Monthly/Annual toggle
  - Uses `calculateSalary()` from salary-engine for each cell
- This gives a quick glance at complete compensation for any position

### Files to Change

| File | Change |
|------|--------|
| `src/pages/PayMatrix.tsx` | Add tabs (Matrix vs Compensation Table), multi-select level visibility, compensation table view |
| No new files needed — all logic already exists in `salary-engine.ts` |

### Technical Approach
- Use `Tabs` for view switching
- Use `Checkbox` components for level selection with sensible defaults
- Compensation table iterates over selected levels' cells, calls `calculateSalary()` per cell
- Monthly/Annual toggle reuses the same pattern from `SalaryBreakdownCard`

