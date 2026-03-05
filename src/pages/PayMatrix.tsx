import { useState } from "react";
import { PAY_MATRIX, getLevelById } from "@/lib/pay-matrix-data";
import { getBasicPayAtCell } from "@/lib/salary-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

export default function PayMatrixPage() {
  const [filter, setFilter] = useState<string>("all");
  const levels = filter === "all" ? PAY_MATRIX : PAY_MATRIX.filter((l) => l.id === filter);

  // Find max rows across all visible levels
  const maxRows = Math.max(...levels.map((l) => l.capType === "NO_CAP" ? l.payCells.length + 5 : l.payCells.length));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pay Matrix Reference</h1>
          <p className="text-muted-foreground text-sm mt-1">UGC 7th CPC Academic Pay Matrix (Teaching)</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {PAY_MATRIX.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.designation} ({l.levelName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-3">
            Pay Matrix
            <Badge variant="outline" className="font-normal text-xs">All figures in ₹/month</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
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
                        return (
                          <TableCell key={l.id} className="text-center text-xs text-muted-foreground">
                            —
                          </TableCell>
                        );
                      }

                      const isNoCap = l.capType === "NO_CAP" && i >= l.payCells.length;
                      const pay = getBasicPayAtCell(l, i);
                      const isEntry = pay === l.revisedEntryPay;

                      return (
                        <TableCell
                          key={l.id}
                          className={`text-center text-xs ${
                            isEntry ? "font-bold text-primary bg-primary/5" : ""
                          } ${isNoCap ? "italic text-muted-foreground" : ""}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
