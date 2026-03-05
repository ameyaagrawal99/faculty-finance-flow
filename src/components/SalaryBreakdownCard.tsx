import { useState } from "react";
import { SalaryBreakdownResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatCurrency(val: number): string {
  return "₹" + val.toLocaleString("en-IN");
}

interface Props {
  salary: SalaryBreakdownResult;
  basicPay: number;
  levelName: string;
  designation: string;
  cellIndex: number;
}

export function SalaryBreakdownCard({ salary, basicPay, levelName, designation, cellIndex }: Props) {
  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const m = view === "annual" ? 12 : 1;
  const label = view === "annual" ? "Annual" : "Monthly";

  const rows = [
    { label: "Basic Pay", value: salary.basicPay * m, highlight: true },
    { label: "Dearness Allowance (DA)", value: salary.da * m },
    { label: "House Rent Allowance (HRA)", value: salary.hra * m },
    { label: "Transport Allowance (TA)", value: salary.ta * m },
    { label: `Gross (${label})`, value: salary.grossMonthly * m, highlight: true },
  ];

  const ctcRows = [
    { label: "PPF (Employer)", value: salary.ppf * m },
    { label: "Gratuity", value: salary.gratuity * m },
    { label: `Perks (${label})`, value: view === "annual" ? salary.perksAnnual : salary.perksMonthly },
    { label: `CTC (${label})`, value: view === "annual" ? salary.ctcAnnual : salary.ctcMonthly, highlight: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{designation}</CardTitle>
            <span className="text-xs font-medium text-muted-foreground rounded-full bg-muted px-2.5 py-1">
              {levelName} · Cell {cellIndex + 1}
            </span>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "monthly" | "annual")}>
            <TabsList className="h-8">
              <TabsTrigger value="monthly" className="text-xs px-3 h-6">Monthly</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs px-3 h-6">Annual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gross section */}
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">In-Hand / Gross</p>
        <div className="space-y-0.5">
          {rows.map((r) => (
            <div
              key={r.label}
              className={`flex justify-between py-1.5 px-2 rounded text-sm ${
                r.highlight ? "bg-primary/5 font-semibold" : ""
              }`}
            >
              <span className="text-muted-foreground">{r.label}</span>
              <span>{formatCurrency(r.value)}</span>
            </div>
          ))}
        </div>

        {/* CTC section */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Employer Cost / CTC</p>
          <div className="space-y-0.5">
            {ctcRows.map((r) => (
              <div
                key={r.label}
                className={`flex justify-between py-1.5 px-2 rounded text-sm ${
                  r.highlight ? "bg-primary/5 font-semibold" : ""
                }`}
              >
                <span className="text-muted-foreground">{r.label}</span>
                <span>{formatCurrency(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
