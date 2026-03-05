import { useState, useMemo } from "react";
import { useSettings } from "@/lib/settings-context";
import { EdgeCaseInputs } from "@/lib/types";
import { PAY_MATRIX, getLevelById } from "@/lib/pay-matrix-data";
import { calculateSalary, getBasicPayAtCell, simulatePromotion, applyAnnualIncrement, getEffectiveLevel, applyPhdIncentive, applyPayBunching } from "@/lib/salary-engine";
import { SalaryBreakdownCard } from "@/components/SalaryBreakdownCard";
import { InlineSettings } from "@/components/InlineSettings";
import { EdgeCaseControls } from "@/components/EdgeCaseControls";
import { QualificationInfo } from "@/components/QualificationInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";

export default function CalculatorPage() {
  const { settings } = useSettings();
  const [selectedLevel, setSelectedLevel] = useState("L12");
  const [selectedCell, setSelectedCell] = useState(0);
  const [edgeCases, setEdgeCases] = useState<EdgeCaseInputs>({});

  const rawLevel = getLevelById(selectedLevel);
  const level = rawLevel ? getEffectiveLevel(rawLevel, settings) : null;
  const allLevels = PAY_MATRIX;

  let effectiveCell = selectedCell;

  // Apply PhD incentive if set
  if (level && edgeCases.phdIncrements && edgeCases.phdIncrements > 0) {
    const phd = applyPhdIncentive(level, selectedCell, edgeCases.phdIncrements);
    effectiveCell = phd.newCellIndex;
  }

  const basicPay = level ? getBasicPayAtCell(level, effectiveCell) : 0;
  
  // Apply pay bunching
  const finalBasicPay = edgeCases.payBunching ? applyPayBunching(basicPay) : basicPay;

  const salary = useMemo(() => calculateSalary(finalBasicPay, settings), [finalBasicPay, settings]);

  const incrementResult = level ? applyAnnualIncrement(level, effectiveCell) : null;
  const promotionResult = simulatePromotion(selectedLevel, effectiveCell, settings);

  const maxCells = level
    ? level.capType === "NO_CAP"
      ? level.payCells.length + 10
      : level.payCells.length
    : 0;

  const cellOptions = Array.from({ length: maxCells }, (_, i) => ({
    index: i,
    pay: level ? getBasicPayAtCell(level, i) : 0,
  }));

  const handleIncrement = () => {
    if (incrementResult && !incrementResult.blocked) {
      setSelectedCell(incrementResult.newCellIndex);
    }
  };

  const handlePromotion = () => {
    if (promotionResult) {
      setSelectedLevel(promotionResult.newLevelId);
      setSelectedCell(promotionResult.newCellIndex);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card/80 p-5 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold">Salary Calculator</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl">
          Calculate faculty compensation based on the UGC 7th CPC pay matrix with a cleaner workflow for desktop and mobile.
        </p>
      </div>

      <InlineSettings />
      <EdgeCaseControls edgeCases={edgeCases} onChange={setEdgeCases} />

      {/* Selection Controls */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Core inputs</p>
          <CardTitle className="text-base">Select Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-2">
              <Label>Designation / Level</Label>
              <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setSelectedCell(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.designation} ({l.levelName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pay Cell (Basic Pay)</Label>
              <Select value={String(selectedCell)} onValueChange={(v) => setSelectedCell(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cellOptions.map((c) => (
                    <SelectItem key={c.index} value={String(c.index)}>
                      Cell {c.index + 1} — ₹{c.pay.toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edge case indicators */}
          {(edgeCases.phdIncrements || edgeCases.payBunching) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {edgeCases.phdIncrements && edgeCases.phdIncrements > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  PhD +{edgeCases.phdIncrements} increment(s) → Cell {effectiveCell + 1}
                </span>
              )}
              {edgeCases.payBunching && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Pay bunching +3% applied
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="outline"
              onClick={handleIncrement}
              disabled={incrementResult?.blocked}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Apply Increment (+3%)
              {incrementResult?.blocked && <AlertTriangle className="h-3 w-3 text-destructive" />}
            </Button>
            {promotionResult && (
              <Button onClick={handlePromotion} className="gap-2">
                <ArrowUp className="h-4 w-4" />
                Simulate Promotion
                <ArrowRight className="h-3 w-3" />
                {getLevelById(promotionResult.newLevelId)?.designation}
              </Button>
            )}
          </div>

          {incrementResult?.blocked && level && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Basic pay truncated at {level.levelName}. No further increments. Promotion required.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Qualification Info */}
      <QualificationInfo levelId={selectedLevel} />

      {/* Salary Breakdown */}
      {level && (
        <SalaryBreakdownCard
          salary={salary}
          basicPay={finalBasicPay}
          levelName={level.levelName}
          designation={level.designation}
          cellIndex={effectiveCell}
        />
      )}

      {/* Promotion Preview */}
      {promotionResult && (
        <Card className="border-primary/20 bg-primary/[0.04] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-primary" />
              Promotion Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Current Basic</p>
                <p className="font-semibold">₹{finalBasicPay.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">After Notional (+3%)</p>
                <p className="font-semibold">₹{promotionResult.tempPay.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">New Level</p>
                <p className="font-semibold">{getLevelById(promotionResult.newLevelId)?.levelName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">New Basic</p>
                <p className="font-bold text-primary">₹{promotionResult.newBasicPay.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
