import { useState, useMemo } from "react";
import { useSettings } from "@/lib/settings-context";
import { PAY_MATRIX, getLevelById } from "@/lib/pay-matrix-data";
import { projectGrowth, getBasicPayAtCell } from "@/lib/salary-engine";
import { FacultyCase } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(230,60%,38%)", "hsl(38,90%,55%)", "hsl(160,60%,40%)", "hsl(280,50%,50%)"];

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

export default function ComparePage() {
  const { settings } = useSettings();
  const [cases, setCases] = useState<FacultyCase[]>([
    { id: "1", name: "Candidate A", levelId: "L12", cellIndex: 0, yearsOfService: 10, hasPhdIncentive: false },
  ]);
  const [years, setYears] = useState(15);
  const [promoYear, setPromoYear] = useState<number | undefined>(5);

  const addCase = () => {
    setCases((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Candidate ${String.fromCharCode(65 + prev.length)}`,
        levelId: "L12",
        cellIndex: 0,
        yearsOfService: 10,
        hasPhdIncentive: false,
      },
    ]);
  };

  const removeCase = (id: string) => setCases((prev) => prev.filter((c) => c.id !== id));

  const updateCase = (id: string, patch: Partial<FacultyCase>) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const projections = useMemo(() => {
    return cases.map((c) => ({
      ...c,
      data: projectGrowth(c.levelId, c.cellIndex, years, settings, promoYear, undefined, new Date().getFullYear()),
    }));
  }, [cases, years, settings, promoYear]);

  // Build chart data
  const chartData = useMemo(() => {
    const maxLen = Math.max(...projections.map((p) => p.data.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | string> = { year: i };
      projections.forEach((p) => {
        if (p.data[i]) {
          point[p.name + " CTC"] = p.data[i].salary.ctcAnnual;
          point[p.name + " Basic"] = p.data[i].basicPay;
        }
      });
      return point;
    });
  }, [projections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compare Scenarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare salary growth for multiple candidates</p>
        </div>
        <Button onClick={addCase} size="sm" className="gap-1" disabled={cases.length >= 4}>
          <Plus className="h-4 w-4" /> Add Case
        </Button>
      </div>

      {/* Case Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cases.map((c, idx) => {
          const level = getLevelById(c.levelId);
          const maxCells = level ? (level.capType === "NO_CAP" ? level.payCells.length + 10 : level.payCells.length) : 1;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <Input
                  value={c.name}
                  onChange={(e) => updateCase(c.id, { name: e.target.value })}
                  className="text-base font-semibold border-none p-0 h-auto focus-visible:ring-0"
                />
                {cases.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeCase(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Designation</Label>
                  <Select value={c.levelId} onValueChange={(v) => updateCase(c.id, { levelId: v, cellIndex: 0 })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_MATRIX.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="text-xs">
                          {l.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Starting Cell</Label>
                  <Select value={String(c.cellIndex)} onValueChange={(v) => updateCase(c.id, { cellIndex: Number(v) })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxCells }, (_, i) => (
                        <SelectItem key={i} value={String(i)} className="text-xs">
                          Cell {i + 1} — {fmt(getBasicPayAtCell(level!, i))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Projection Controls */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Years to Project</Label>
            <Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="h-8 w-24" min={1} max={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Promotion at Year</Label>
            <Input
              type="number"
              value={promoYear ?? ""}
              onChange={(e) => setPromoYear(e.target.value ? Number(e.target.value) : undefined)}
              className="h-8 w-24"
              min={0}
              max={years}
              placeholder="None"
            />
          </div>
        </CardContent>
      </Card>

      {/* Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annual CTC Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
              <YAxis tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              {projections.map((p, i) => (
                <Line key={p.id} type="monotone" dataKey={p.name + " CTC"} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Year-by-Year Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Year</TableHead>
                {projections.map((p) => (
                  <TableHead key={p.id} colSpan={2} className="text-center">{p.name}</TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead />
                {projections.map((p) => (
                  <>
                    <TableHead key={p.id + "-b"} className="text-xs">Basic</TableHead>
                    <TableHead key={p.id + "-c"} className="text-xs">CTC/yr</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: years + 1 }, (_, y) => (
                <TableRow key={y}>
                  <TableCell className="font-medium">{y}</TableCell>
                  {projections.map((p) => {
                    const d = p.data[y];
                    return d ? (
                      <>
                        <TableCell key={p.id + "-b-" + y} className="text-xs">{fmt(d.basicPay)}</TableCell>
                        <TableCell key={p.id + "-c-" + y} className="text-xs">{fmt(d.salary.ctcAnnual)}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell key={p.id + "-b-" + y}>—</TableCell>
                        <TableCell key={p.id + "-c-" + y}>—</TableCell>
                      </>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
