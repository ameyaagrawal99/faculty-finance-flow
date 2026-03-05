import { SalaryBreakdownResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const rows = [
    { label: "Basic Pay", value: salary.basicPay, highlight: true },
    { label: "Dearness Allowance (DA)", value: salary.da },
    { label: "House Rent Allowance (HRA)", value: salary.hra },
    { label: "Transport Allowance (TA)", value: salary.ta },
    { label: "Gross (Monthly)", value: salary.grossMonthly, highlight: true },
    { label: "PPF (Employer)", value: salary.ppf },
    { label: "Gratuity", value: salary.gratuity },
    { label: "Perks (Monthly)", value: salary.perksMonthly },
    { label: "CTC (Monthly)", value: salary.ctcMonthly, highlight: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{designation}</CardTitle>
          <span className="text-xs font-medium text-muted-foreground rounded-full bg-muted px-2.5 py-1">
            {levelName} · Cell {cellIndex + 1}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
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
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">CTC (Annual)</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(salary.ctcAnnual)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-muted-foreground">Gross (Annual)</span>
            <span className="text-sm font-medium">{formatCurrency(salary.grossAnnual)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
