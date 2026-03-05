import { useState, useMemo } from "react";
import { PAY_MATRIX, FACULTY_LEVELS, getLevelById } from "@/lib/pay-matrix-data";
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
import { ChevronDown } from "lucide-react";

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

const CORE_LEVELS = ["L12", "L13A1", "L13A2", "L14A"];
const OTHER_LEVELS = PAY_MATRIX.filter((l) => !CORE_LEVELS.includes(l.id)).map((l) => l.id);

export default function PayMatrixPage() {
  const { settings } = useSettings();
  const [visibleLevels, setVisibleLevels] = useState<Set<string>>(new Set(CORE_LEVELS));
  const [showOthers, setShowOthers] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [compLevels, setCompLevels] = useState<Set<string>>(new Set(CORE_LEVELS));

  const mult = isAnnual ? 12 : 1;

  const toggleLevel = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const levels = PAY_MATRIX.filter((l) => visibleLevels.has(l.id)).map((l) => getEffectiveLevel(l, settings));
  const maxRows = levels.length > 0 ? Math.max(...levels.map((l) => l.capType === "NO_CAP" ? l.payCells.length + 5 : l.payCells.length)) : 0;

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

  const LevelCheckboxes = ({ selected, onToggle, levelIds }: { selected: Set<string>; onToggle: (id: string) => void; levelIds: string[] }) => (
    <div className="flex flex-wrap gap-3">
      {levelIds.map((id) => {
        const l = getLevelById(id);
        if (!l) return null;
        return (
          <label key={id} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox checked={selected.has(id)} onCheckedChange={() => onToggle(id)} />
            <span>{l.levelName}</span>
            <span className="text-muted-foreground">({l.designation.split(" ").slice(0, 2).join(" ")})</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pay Matrix Reference</h1>
        <p className="text-muted-foreground text-sm mt-1">UGC 7th CPC Academic Pay Matrix (Teaching)</p>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">Pay Matrix</TabsTrigger>
          <TabsTrigger value="compensation">Compensation Table</TabsTrigger>
        </TabsList>

        {/* ── Pay Matrix Tab ── */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visible Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LevelCheckboxes selected={visibleLevels} onToggle={(id) => toggleLevel(id, visibleLevels, setVisibleLevels)} levelIds={CORE_LEVELS} />
              <Collapsible open={showOthers} onOpenChange={setShowOthers}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={`h-3 w-3 transition-transform ${showOthers ? "rotate-180" : ""}`} />
                  {showOthers ? "Hide" : "Show"} other levels
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <LevelCheckboxes selected={visibleLevels} onToggle={(id) => toggleLevel(id, visibleLevels, setVisibleLevels)} levelIds={OTHER_LEVELS} />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-3">
                Pay Matrix
                <Badge variant="outline" className="font-normal text-xs">All figures in ₹/month</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              {levels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Select at least one level above to view the matrix.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 w-16">Cell</TableHead>
                      {levels.map((l) => (
                        <TableHead key={l.id} className="text-center min-w-[120px]">
                          <div className="text-xs font-semibold">{l.levelName}</div>
                          <div className="text-[10px] text-muted-foreground">{l.designation}</div>
                          <Badge variant={l.capType === "NO_CAP" ? "default" : "secondary"} className="text-[10px] mt-1">
                            {l.capType === "NO_CAP" ? "No Cap" : "Truncated"}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 text-xs">Entry</TableHead>
                      {levels.map((l) => (
                        <TableHead key={l.id} className="text-center text-xs font-bold text-primary">
                          {fmt(l.revisedEntryPay)}
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
                        <TableRow key={i}>
                          <TableCell className="sticky left-0 bg-card z-10 font-medium text-xs">{i + 1}</TableCell>
                          {levels.map((l) => {
                            const isBeyond =
                              (l.capType === "TRUNCATED" && l.maxCellIndex !== undefined && i > l.maxCellIndex) ||
                              (l.capType === "TRUNCATED" && i >= l.payCells.length);

                            if (isBeyond) {
                              return <TableCell key={l.id} className="text-center text-xs text-muted-foreground">—</TableCell>;
                            }

                            const isNoCap = l.capType === "NO_CAP" && i >= l.payCells.length;
                            const pay = getBasicPayAtCell(l, i);
                            const isEntry = pay === l.revisedEntryPay;

                            return (
                              <TableCell
                                key={l.id}
                                className={`text-center text-xs ${isEntry ? "font-bold text-primary bg-primary/5" : ""} ${isNoCap ? "italic text-muted-foreground" : ""}`}
                              >
                                {fmt(pay)}
                                {isNoCap && <span className="text-[10px] ml-1">(gen)</span>}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Compensation Table Tab ── */}
        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Select Positions</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="comp-annual" className="text-xs text-muted-foreground">Monthly</Label>
                  <Switch id="comp-annual" checked={isAnnual} onCheckedChange={setIsAnnual} />
                  <Label htmlFor="comp-annual" className="text-xs text-muted-foreground">Annual</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LevelCheckboxes selected={compLevels} onToggle={(id) => toggleLevel(id, compLevels, setCompLevels)} levelIds={CORE_LEVELS} />
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className="h-3 w-3" />
                  More levels
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <LevelCheckboxes selected={compLevels} onToggle={(id) => toggleLevel(id, compLevels, setCompLevels)} levelIds={OTHER_LEVELS} />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-3">
                Full Compensation
                <Badge variant="outline" className="font-normal text-xs">{isAnnual ? "Annual" : "Monthly"} • DA {(settings.daPercent * 100).toFixed(0)}% • HRA {(settings.hraPercent * 100).toFixed(0)}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              {compData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Select at least one level to view compensation.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10 min-w-[140px]">Position</TableHead>
                      <TableHead className="text-center">Cell</TableHead>
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
                    {compData.map((row, idx) => {
                      const isFirstOfLevel = idx === 0 || compData[idx - 1].levelId !== row.levelId;
                      const isEntry = row.cellIndex === (getLevelById(row.levelId)?.payCells.indexOf(getLevelById(row.levelId)!.revisedEntryPay) ?? -1);
                      return (
                        <TableRow key={`${row.levelId}-${row.cellIndex}`} className={isFirstOfLevel ? "border-t-2 border-primary/20" : ""}>
                          <TableCell className="sticky left-0 bg-card z-10 text-xs">
                            {isFirstOfLevel && (
                              <div>
                                <div className="font-semibold">{row.levelName}</div>
                                <div className="text-muted-foreground text-[10px]">{row.designation}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-center text-xs ${isEntry ? "font-bold text-primary" : ""}`}>{row.cellIndex + 1}{isEntry ? " ★" : ""}</TableCell>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
