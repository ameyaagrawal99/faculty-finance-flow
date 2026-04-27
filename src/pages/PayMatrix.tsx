import { useState, useMemo } from "react";
import { PAY_MATRIX, getLevelById } from "@/lib/pay-matrix-data";
import { getBasicPayAtCell, calculateSalary, getEffectiveLevel } from "@/lib/salary-engine";
import { useSettings } from "@/lib/settings-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, SlidersHorizontal, Table2 } from "lucide-react";

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

type MatrixMetric = "basic" | "gross" | "ctc";
type MatrixPeriod = "monthly" | "annual";

const CORE_LEVELS = ["L12", "L13A1", "L13A2", "L14A"];
const OTHER_LEVELS = PAY_MATRIX.filter((l) => !CORE_LEVELS.includes(l.id)).map((l) => l.id);
const ALL_LEVELS = PAY_MATRIX.map((l) => l.id);

function getEntryCellIndex(levelId: string) {
  const level = getLevelById(levelId);
  return level ? level.payCells.indexOf(level.revisedEntryPay) : -1;
}

function SelectionToolbar({
  selected,
  onChange,
  label,
}: {
  selected: Set<string>;
  onChange: (levels: Set<string>) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-sm">{label}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{selected.size} of {PAY_MATRIX.length} levels selected</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(new Set(CORE_LEVELS))}>
          Core
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(new Set(ALL_LEVELS))}>
          All
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(new Set())} disabled={selected.size === 0}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export default function PayMatrixPage() {
  const { settings } = useSettings();
  const [visibleLevels, setVisibleLevels] = useState<Set<string>>(new Set(CORE_LEVELS));
  const [showOthers, setShowOthers] = useState(false);
  const [matrixPeriod, setMatrixPeriod] = useState<MatrixPeriod>("monthly");
  const [matrixMetric, setMatrixMetric] = useState<MatrixMetric>("basic");
  const [isMatrixSettingsOpen, setIsMatrixSettingsOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    levelId: string;
    levelName: string;
    designation: string;
    cellIndex: number;
    basicPay: number;
  } | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [compLevels, setCompLevels] = useState<Set<string>>(new Set(CORE_LEVELS));
  const [showCompOthers, setShowCompOthers] = useState(false);
  const [compSearch, setCompSearch] = useState("");

  const mult = isAnnual ? 12 : 1;

  const toggleLevel = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const levels = PAY_MATRIX.filter((l) => visibleLevels.has(l.id)).map((l) => getEffectiveLevel(l, settings));
  const maxRows = levels.length > 0 ? Math.max(...levels.map((l) => l.capType === "NO_CAP" ? l.payCells.length + 5 : l.payCells.length)) : 0;

  const getDisplayValue = (basicPay: number) => {
    const salary = calculateSalary(basicPay, settings);
    if (matrixMetric === "basic") return matrixPeriod === "annual" ? salary.basicPay * 12 : salary.basicPay;
    if (matrixMetric === "gross") return matrixPeriod === "annual" ? salary.grossMonthly * 12 : salary.grossMonthly;
    return matrixPeriod === "annual" ? salary.ctcAnnual : salary.ctcMonthly;
  };

  const matrixMetricLabel = matrixMetric === "basic" ? "Basic" : matrixMetric === "gross" ? "Gross" : "CTC";

  const matrixSummary = useMemo(() => {
    if (levels.length === 0) return null;

    const allPayValues = levels.flatMap((level) => {
      const rowCount = level.capType === "NO_CAP" ? level.payCells.length + 5 : level.payCells.length;
      return Array.from({ length: rowCount }, (_, i) => getDisplayValue(getBasicPayAtCell(level, i)));
    });

    const entryPays = levels.map((level) => getDisplayValue(level.revisedEntryPay));

    return {
      selectedLevels: levels.length,
      minPay: Math.min(...allPayValues),
      maxPay: Math.max(...allPayValues),
      avgEntryPay: Math.round(entryPays.reduce((sum, pay) => sum + pay, 0) / entryPays.length),
      noCapLevels: levels.filter((level) => level.capType === "NO_CAP").length,
    };
  }, [levels, matrixMetric, matrixPeriod, settings]);

  // Compensation table data
  const compData = useMemo(() => {
    const rows: Array<{ levelId: string; levelName: string; designation: string; cellIndex: number; monthlyBasic: number; basic: number; da: number; hra: number; ta: number; gross: number; ppf: number; gratuity: number; perks: number; ctc: number }> = [];
    PAY_MATRIX.filter((l) => compLevels.has(l.id)).map((l) => getEffectiveLevel(l, settings)).forEach((level) => {
      const cellCount = level.capType === "NO_CAP" ? level.payCells.length + 3 : level.payCells.length;
      for (let i = 0; i < cellCount; i++) {
        if (level.capType === "TRUNCATED" && level.maxCellIndex !== undefined && i > level.maxCellIndex) break;
        const basic = getBasicPayAtCell(level, i);
        const s = calculateSalary(basic, settings);
        rows.push({
          levelId: level.id,
          levelName: level.levelName,
          designation: level.designation,
          cellIndex: i,
          monthlyBasic: s.basicPay,
          basic: s.basicPay * mult,
          da: s.da * mult,
          hra: s.hra * mult,
          ta: s.ta * mult,
          gross: s.grossMonthly * mult,
          ppf: s.ppf * mult,
          gratuity: s.gratuity * mult,
          perks: isAnnual ? s.perksAnnual : s.perksMonthly,
          ctc: isAnnual ? s.ctcAnnual : s.ctcMonthly,
        });
      }
    });
    return rows;
  }, [compLevels, settings, mult, isAnnual]);

  const filteredCompData = useMemo(() => {
    const query = compSearch.trim().toLowerCase();
    if (!query) return compData;

    return compData.filter((row) => {
      const searchable = [
        row.levelId,
        row.levelName,
        row.designation,
        `cell ${row.cellIndex + 1}`,
        String(row.cellIndex + 1),
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }, [compData, compSearch]);

  const compensationSummary = useMemo(() => {
    if (filteredCompData.length === 0) return null;
    return {
      rows: filteredCompData.length,
      maxCtc: Math.max(...filteredCompData.map((row) => row.ctc)),
      maxGross: Math.max(...filteredCompData.map((row) => row.gross)),
      entryRows: filteredCompData.filter((row) => row.cellIndex === getEntryCellIndex(row.levelId)).length,
    };
  }, [filteredCompData]);

  const LevelCheckboxes = ({ selected, onToggle, levelIds }: { selected: Set<string>; onToggle: (id: string) => void; levelIds: string[] }) => (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {levelIds.map((id) => {
        const l = getLevelById(id);
        if (!l) return null;
        const isChecked = selected.has(id);
        return (
          <label
            key={id}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-xs transition-colors ${
              isChecked ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <Checkbox checked={isChecked} onCheckedChange={() => onToggle(id)} />
            <span className="min-w-0">
              <span className="block font-semibold">{l.levelName}</span>
              <span className="block truncate text-muted-foreground">{l.designation}</span>
            </span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pay Matrix Reference</h1>
          <p className="text-muted-foreground text-sm mt-1">UGC 7th CPC Academic Pay Matrix (Teaching)</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Badge variant="outline" className="justify-center py-1.5 font-normal">DA {(settings.daPercent * 100).toFixed(0)}%</Badge>
          <Badge variant="outline" className="justify-center py-1.5 font-normal">HRA {(settings.hraPercent * 100).toFixed(0)}%</Badge>
          <Badge variant="secondary" className="justify-center py-1.5 font-normal">{settings.pensionScheme}</Badge>
        </div>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="matrix">Pay Matrix</TabsTrigger>
          <TabsTrigger value="compensation">Compensation Table</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <SelectionToolbar selected={visibleLevels} onChange={setVisibleLevels} label="Visible Levels" />
            </CardHeader>
            <CardContent className="space-y-3">
              <LevelCheckboxes selected={visibleLevels} onToggle={(id) => toggleLevel(id, visibleLevels, setVisibleLevels)} levelIds={CORE_LEVELS} />
              <Collapsible open={showOthers} onOpenChange={setShowOthers}>
                <CollapsibleTrigger className="flex items-center gap-1 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronDown className={`h-3 w-3 transition-transform ${showOthers ? "rotate-180" : ""}`} />
                  {showOthers ? "Hide" : "Show"} other levels
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <LevelCheckboxes selected={visibleLevels} onToggle={(id) => toggleLevel(id, visibleLevels, setVisibleLevels)} levelIds={OTHER_LEVELS} />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {matrixSummary && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Selected levels</p>
                  <p className="mt-1 text-2xl font-bold">{matrixSummary.selectedLevels}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{matrixMetricLabel} pay range ({matrixPeriod})</p>
                  <p className="mt-1 text-xl font-bold">{fmt(matrixSummary.minPay)} - {fmt(matrixSummary.maxPay)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Average entry {matrixMetricLabel} ({matrixPeriod})</p>
                  <p className="mt-1 text-2xl font-bold">{fmt(matrixSummary.avgEntryPay)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">No-cap levels</p>
                  <p className="mt-1 text-2xl font-bold">{matrixSummary.noCapLevels}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col gap-2 text-base sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" />
                  Pay Matrix
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-fit font-normal text-xs">
                    {matrixMetricLabel} • {matrixPeriod === "annual" ? "₹/year" : "₹/month"}
                  </Badge>
                  <Dialog open={isMatrixSettingsOpen} onOpenChange={setIsMatrixSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">View Options</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Matrix Display Options</DialogTitle>
                        <DialogDescription>Choose what each matrix cell should show.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Time Period</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant={matrixPeriod === "monthly" ? "default" : "outline"} onClick={() => setMatrixPeriod("monthly")}>Monthly</Button>
                            <Button type="button" variant={matrixPeriod === "annual" ? "default" : "outline"} onClick={() => setMatrixPeriod("annual")}>Annual</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Value Type</p>
                          <div className="grid grid-cols-3 gap-2">
                            <Button type="button" variant={matrixMetric === "basic" ? "default" : "outline"} onClick={() => setMatrixMetric("basic")}>Basic</Button>
                            <Button type="button" variant={matrixMetric === "gross" ? "default" : "outline"} onClick={() => setMatrixMetric("gross")}>Gross</Button>
                            <Button type="button" variant={matrixMetric === "ctc" ? "default" : "outline"} onClick={() => setMatrixMetric("ctc")}>CTC</Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click any matrix number to open full salary bifurcation for that level and cell.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {levels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Select at least one level above to view the matrix.</p>
              ) : (
                <div className="max-h-[72vh] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
                    <TableRow>
                      <TableHead className="sticky left-0 z-30 w-16 bg-card shadow-[1px_0_0_hsl(var(--border))]">Cell</TableHead>
                      {levels.map((l) => (
                        <TableHead key={l.id} className="min-w-[140px] text-center">
                          <div className="text-xs font-semibold">{l.levelName}</div>
                          <div className="text-[10px] text-muted-foreground">{l.designation}</div>
                          <Badge variant={l.capType === "NO_CAP" ? "default" : "secondary"} className="text-[10px] mt-1">
                            {l.capType === "NO_CAP" ? "No Cap" : "Truncated"}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead className="sticky left-0 z-30 bg-card text-xs shadow-[1px_0_0_hsl(var(--border))]">Entry</TableHead>
                      {levels.map((l) => (
                        <TableHead key={l.id} className="text-center text-xs font-bold text-primary">
                          {fmt(getDisplayValue(l.revisedEntryPay))}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: maxRows }, (_, i) => {
                      const isTruncatedRow = levels.every((l) => {
                        if (l.capType === "TRUNCATED" && l.maxCellIndex !== undefined && i > l.maxCellIndex) return true;
                        if (l.capType === "TRUNCATED" && i >= l.payCells.length) return true;
                        return false;
                      });
                      if (isTruncatedRow) return null;

                      return (
                        <TableRow key={i} className="hover:bg-muted/40">
                          <TableCell className="sticky left-0 z-10 bg-card font-medium text-xs shadow-[1px_0_0_hsl(var(--border))]">{i + 1}</TableCell>
                          {levels.map((l) => {
                            const isBeyond =
                              (l.capType === "TRUNCATED" && l.maxCellIndex !== undefined && i > l.maxCellIndex) ||
                              (l.capType === "TRUNCATED" && i >= l.payCells.length);

                            if (isBeyond) {
                              return <TableCell key={l.id} className="text-center text-xs text-muted-foreground">—</TableCell>;
                            }

                            const isNoCap = l.capType === "NO_CAP" && i >= l.payCells.length;
                            const pay = getBasicPayAtCell(l, i);
                            const displayValue = getDisplayValue(pay);
                            const isEntry = pay === l.revisedEntryPay;

                            return (
                              <TableCell
                                key={l.id}
                                className={`text-center text-xs ${isEntry ? "bg-primary/5 font-bold text-primary" : ""} ${isNoCap ? "italic text-muted-foreground" : ""}`}
                              >
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onClick={() =>
                                    setSelectedCell({
                                      levelId: l.id,
                                      levelName: l.levelName,
                                      designation: l.designation,
                                      cellIndex: i,
                                      basicPay: pay,
                                    })
                                  }
                                  title="Open salary bifurcation"
                                >
                                  {fmt(displayValue)}
                                </button>
                                {isNoCap && (
                                  <>
                                    {" "}
                                    <span className="ml-1 rounded bg-muted px-1 text-[10px] not-italic" title="Generated beyond source matrix cells">gen</span>
                                  </>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SelectionToolbar selected={compLevels} onChange={setCompLevels} label="Select Positions" />
                <div className="flex items-center gap-2">
                  <Label htmlFor="comp-annual" className="text-xs text-muted-foreground">Monthly</Label>
                  <Switch id="comp-annual" checked={isAnnual} onCheckedChange={setIsAnnual} />
                  <Label htmlFor="comp-annual" className="text-xs text-muted-foreground">Annual</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LevelCheckboxes selected={compLevels} onToggle={(id) => toggleLevel(id, compLevels, setCompLevels)} levelIds={CORE_LEVELS} />
              <Collapsible open={showCompOthers} onOpenChange={setShowCompOthers}>
                <CollapsibleTrigger className="flex items-center gap-1 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronDown className={`h-3 w-3 transition-transform ${showCompOthers ? "rotate-180" : ""}`} />
                  {showCompOthers ? "Hide" : "Show"} other levels
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <LevelCheckboxes selected={compLevels} onToggle={(id) => toggleLevel(id, compLevels, setCompLevels)} levelIds={OTHER_LEVELS} />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-4 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Full Compensation
                </CardTitle>
                <Badge variant="outline" className="w-fit font-normal text-xs">{isAnnual ? "Annual" : "Monthly"} • DA {(settings.daPercent * 100).toFixed(0)}% • HRA {(settings.hraPercent * 100).toFixed(0)}%</Badge>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={compSearch}
                    onChange={(event) => setCompSearch(event.target.value)}
                    placeholder="Search level, designation, or cell"
                    className="pl-9"
                  />
                </div>
                {compensationSummary && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">{compensationSummary.rows} rows</Badge>
                    <Badge variant="secondary" className="font-normal">Top gross {fmt(compensationSummary.maxGross)}</Badge>
                    <Badge variant="secondary" className="font-normal">Top CTC {fmt(compensationSummary.maxCtc)}</Badge>
                    <Badge variant="secondary" className="font-normal">{compensationSummary.entryRows} entry cells</Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredCompData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {compLevels.size === 0 ? "Select at least one level to view compensation." : "No compensation rows match your search."}
                </p>
              ) : (
                <div className="max-h-[72vh] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
                    <TableRow>
                      <TableHead className="sticky left-0 z-30 min-w-[170px] bg-card shadow-[1px_0_0_hsl(var(--border))]">Position</TableHead>
                      <TableHead className="text-center">Cell</TableHead>
                      {isAnnual && <TableHead className="text-right">Basic/mo</TableHead>}
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">DA</TableHead>
                      <TableHead className="text-right">HRA</TableHead>
                      <TableHead className="text-right">TA</TableHead>
                      <TableHead className="text-right font-semibold">Gross</TableHead>
                      <TableHead className="text-right">PPF</TableHead>
                      <TableHead className="text-right">Gratuity</TableHead>
                      <TableHead className="text-right">Perks</TableHead>
                      <TableHead className="text-right font-semibold">CTC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompData.map((row, idx) => {
                      const isFirstOfLevel = idx === 0 || filteredCompData[idx - 1].levelId !== row.levelId;
                      const isEntry = row.cellIndex === getEntryCellIndex(row.levelId);
                      return (
                        <TableRow key={`${row.levelId}-${row.cellIndex}`} className={`${isFirstOfLevel ? "border-t-2 border-primary/20" : ""} hover:bg-muted/40`}>
                          <TableCell className="sticky left-0 z-10 bg-card text-xs shadow-[1px_0_0_hsl(var(--border))]">
                            {isFirstOfLevel && (
                              <div>
                                <div className="font-semibold">{row.levelName}</div>
                                <div className="text-muted-foreground text-[10px]">{row.designation}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-center text-xs ${isEntry ? "font-bold text-primary" : ""}`}>{row.cellIndex + 1}{isEntry ? " ★" : ""}</TableCell>
                          {isAnnual && <TableCell className="text-right text-xs text-muted-foreground">{fmt(row.monthlyBasic)}</TableCell>}
                          <TableCell className="text-right text-xs">{fmt(row.basic)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.da)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.hra)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.ta)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{fmt(row.gross)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.ppf)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.gratuity)}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.perks)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-primary">{fmt(row.ctc)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Salary Bifurcation</DialogTitle>
            <DialogDescription>
              {selectedCell ? `${selectedCell.levelName} (${selectedCell.designation}) • Cell ${selectedCell.cellIndex + 1}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedCell && (() => {
            const s = calculateSalary(selectedCell.basicPay, settings);
            const monthlyRows = [
              { label: "Basic", value: s.basicPay },
              { label: "DA", value: s.da },
              { label: "HRA", value: s.hra },
              { label: "TA", value: s.ta },
              { label: "Gross", value: s.grossMonthly },
              { label: "PPF", value: s.ppf },
              { label: "Gratuity", value: s.gratuity },
              { label: "Perks", value: s.perksMonthly },
              { label: "CTC", value: s.ctcMonthly },
            ];
            const annualRows = [
              { label: "Basic", value: s.basicPay * 12 },
              { label: "DA", value: s.da * 12 },
              { label: "HRA", value: s.hra * 12 },
              { label: "TA", value: s.ta * 12 },
              { label: "Gross", value: s.grossMonthly * 12 },
              { label: "PPF", value: s.ppf * 12 },
              { label: "Gratuity", value: s.gratuity * 12 },
              { label: "Perks", value: s.perksAnnual },
              { label: "CTC", value: s.ctcAnnual },
            ];

            return (
              <div className="space-y-4">
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <Badge variant="outline" className="justify-center font-normal">Pension: {settings.pensionScheme}</Badge>
                  <Badge variant="outline" className="justify-center font-normal">DA: {(settings.daPercent * 100).toFixed(0)}%</Badge>
                  <Badge variant="outline" className="justify-center font-normal">HRA: {(settings.hraPercent * 100).toFixed(0)}%</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {monthlyRows.map((row) => (
                        <div key={`m-${row.label}`} className="flex items-center justify-between text-sm">
                          <span className={`${row.label === "Gross" || row.label === "CTC" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{row.label}</span>
                          <span className={`${row.label === "Gross" || row.label === "CTC" ? "font-semibold" : ""}`}>{fmt(row.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Annual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {annualRows.map((row) => (
                        <div key={`a-${row.label}`} className="flex items-center justify-between text-sm">
                          <span className={`${row.label === "Gross" || row.label === "CTC" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{row.label}</span>
                          <span className={`${row.label === "Gross" || row.label === "CTC" ? "font-semibold" : ""}`}>{fmt(row.value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
