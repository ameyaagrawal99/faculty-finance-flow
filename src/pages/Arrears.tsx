import { useState, useMemo } from "react";
import { useSettings } from "@/lib/settings-context";
import { PAY_MATRIX, getLevelById } from "@/lib/pay-matrix-data";
import { getBasicPayAtCell, calculateArrears, getEffectiveLevel } from "@/lib/salary-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

export default function ArrearsPage() {
  const { settings } = useSettings();
  const [selectedLevel, setSelectedLevel] = useState("L12");
  const [selectedCell, setSelectedCell] = useState(0);
  const [oldDa, setOldDa] = useState(50);
  const [newDa, setNewDa] = useState(58);
  const [months, setMonths] = useState(6);

  const level = getLevelById(selectedLevel);
  const effectiveLevel = level ? getEffectiveLevel(level, settings) : null;
  const basicPay = effectiveLevel ? getBasicPayAtCell(effectiveLevel, selectedCell) : 0;

  const arrears = useMemo(() => {
    if (!basicPay) return null;
    return calculateArrears(basicPay, oldDa / 100, newDa / 100, months, settings);
  }, [basicPay, oldDa, newDa, months, settings]);

  const maxCells = effectiveLevel
    ? effectiveLevel.capType === "NO_CAP"
      ? effectiveLevel.payCells.length + 10
      : effectiveLevel.payCells.length
    : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Arrears Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculate back-pay for retrospective DA or pay revisions
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Input Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setSelectedCell(0); }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_MATRIX.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.designation} ({l.levelName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pay Cell</Label>
              <Select value={String(selectedCell)} onValueChange={(v) => setSelectedCell(Number(v))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxCells }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Cell {i + 1} — {fmt(effectiveLevel ? getBasicPayAtCell(effectiveLevel, i) : 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Old DA %</Label>
              <Input type="number" value={oldDa} onChange={(e) => setOldDa(Number(e.target.value))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">New DA %</Label>
              <Input type="number" value={newDa} onChange={(e) => setNewDa(Number(e.target.value))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Retrospective Months</Label>
              <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} min={1} className="h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {arrears && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Arrears Breakdown
              <Badge variant="outline" className="font-normal text-xs">Basic: {fmt(basicPay)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Old (per month)</TableHead>
                  <TableHead className="text-right">New (per month)</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm">DA</TableCell>
                  <TableCell className="text-right text-sm">{fmt(Math.round(basicPay * oldDa / 100))}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(Math.round(basicPay * newDa / 100))}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary">
                    {fmt(Math.round(basicPay * newDa / 100) - Math.round(basicPay * oldDa / 100))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-semibold">Gross</TableCell>
                  <TableCell className="text-right text-sm">{fmt(arrears.oldGross)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(arrears.newGross)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary">{fmt(arrears.monthlyDifference)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Difference</p>
                  <p className="text-lg font-bold text-primary">{fmt(arrears.monthlyDifference)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Arrears ({months} months)</p>
                  <p className="text-xl font-bold text-primary">{fmt(arrears.totalArrears)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
