import { useState, useMemo } from "react";
import { useSettings } from "@/lib/settings-context";
import { PAY_MATRIX, getLevelById, FACULTY_LEVELS } from "@/lib/pay-matrix-data";
import { calculateSalary, getBasicPayAtCell, simulatePromotion, applyAnnualIncrement, canIncrement } from "@/lib/salary-engine";
import { SalaryBreakdownCard } from "@/components/SalaryBreakdownCard";
import { InlineSettings } from "@/components/InlineSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";

export default function CalculatorPage() {
  const { settings } = useSettings();
  const [selectedLevel, setSelectedLevel] = useState("L12");
  const [selectedCell, setSelectedCell] = useState(0);

  const level = getLevelById(selectedLevel);
  const allLevels = PAY_MATRIX;

  const basicPay = level ? getBasicPayAtCell(level, selectedCell) : 0;
  const salary = useMemo(() => calculateSalary(basicPay, settings), [basicPay, settings]);

  const incrementResult = level ? applyAnnualIncrement(level, selectedCell) : null;
  const promotionResult = simulatePromotion(selectedLevel, selectedCell);

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
      <div>
        <h1 className="text-2xl font-bold">Salary Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculate faculty compensation based on UGC 7th CPC pay matrix
        </p>
      </div>

      {/* Inline Settings */}
      <InlineSettings />

      {/* Selection Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleIncrement}
              disabled={incrementResult?.blocked}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Apply Increment (+3%)
              {incrementResult?.blocked && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
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

      {/* Salary Breakdown */}
      {level && (
        <SalaryBreakdownCard
          salary={salary}
          basicPay={basicPay}
          levelName={level.levelName}
          designation={level.designation}
          cellIndex={selectedCell}
        />
      )}

      {/* Promotion Preview */}
      {promotionResult && (
        <Card className="border-primary/20 bg-primary/[0.02]">
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
                <p className="font-semibold">₹{basicPay.toLocaleString("en-IN")}</p>
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
