import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SETTINGS, GlobalSettings, HRA_RATES } from "@/lib/types";
import { calculateSalary } from "@/lib/salary-engine";
import { backCalculateWpuGoaBands, getWpuGoaCtcAnnual, getWpuGoaInclusiveAnnual } from "@/lib/wpu-goa";
import { Calculator, Columns3, Copy, Download, IndianRupee, ListChecks, Settings, Table2 } from "lucide-react";
import { toast } from "sonner";

function fmt(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

function lpa(value: number) {
  return `${(value / 100000).toFixed(2)} LPA`;
}

const wpuNav = [
  { id: "overview", label: "Overview", icon: ListChecks },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "pay-matrix", label: "Pay Matrix", icon: Table2 },
  { id: "compensation", label: "Compensation", icon: Columns3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const wpuDefaultSettings: GlobalSettings = {
  ...DEFAULT_SETTINGS,
  institutionCluster: "WPU Goa",
};

export default function WpuGoaPage() {
  const [active, setActive] = useState("overview");
  const [settings, setSettings] = useState<GlobalSettings>(wpuDefaultSettings);
  const [selectedBandId, setSelectedBandId] = useState("assistant-professor-1");
  const [selectedBasic, setSelectedBasic] = useState<number | null>(null);
  const [showDetailColumns, setShowDetailColumns] = useState(false);

  const bands = useMemo(() => backCalculateWpuGoaBands(settings), [settings]);
  const selectedBand = bands.find((band) => band.id === selectedBandId) ?? bands[0];
  const calculatorBasic = selectedBasic ?? selectedBand.minBasicPay;
  const calculatorSalary = calculateSalary(calculatorBasic, settings);
  const inclusiveAnnual = getWpuGoaInclusiveAnnual(calculatorBasic, settings);
  const ctcAnnual = getWpuGoaCtcAnnual(calculatorBasic, settings);
  const perksAnnual = settings.housingSupport + settings.cpda + settings.healthInsurance;

  const updateSettings = (partial: Partial<GlobalSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...partial };
      if (partial.hraCityType && next.hraEnabled && next.hraOverride === null) {
        next.hraPercent = HRA_RATES[partial.hraCityType] ?? current.hraPercent;
      }
      return next;
    });
  };

  const copyValue = (value: number, label: string) => {
    navigator.clipboard.writeText(String(value)).then(() => toast.success(`Copied ${label}`));
  };

  const downloadCSV = () => {
    const rows = bands.map((band) => [
      band.title,
      `${band.salaryRangeLpa[0]}-${band.salaryRangeLpa[1]} LPA`,
      band.criteria,
      String(band.minBasicPay),
      String(band.maxBasicPay),
      String(band.startInclusiveAnnual),
      String(band.startCtcAnnual),
    ]);
    const csv = [
      ["Position", "Salary Range", "Criteria", "Start Basic", "Max Basic", "Start Inclusive Salary", "Start CTC"],
      ...rows,
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wpu-goa-salary-ranges.csv";
    link.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Entity Workspace</p>
          <h1 className="text-2xl font-bold">WPU Goa Faculty Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Separate salary-range tool using WPU Goa bands, local settings, back-calculated basic pay, and the same bifurcation logic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-normal">Inclusive salary excludes perks</Badge>
          <Badge variant="secondary" className="font-normal">Perks added to CTC</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="p-2">
            <div className="space-y-1">
              {wpuNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active === item.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          {active === "overview" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Salary Range Overview</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Interactive position bands with criteria, start basic, and start CTC.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadCSV}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="min-w-[190px]">Position</TableHead>
                        <TableHead>Salary Range</TableHead>
                        <TableHead className="min-w-[280px]">Criteria</TableHead>
                        <TableHead className="text-right">Start Basic</TableHead>
                        <TableHead className="text-right">Inclusive Start</TableHead>
                        <TableHead className="text-right">CTC Start</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bands.map((band) => (
                        <TableRow
                          key={band.id}
                          className={`cursor-pointer transition-colors ${selectedBandId === band.id ? "bg-primary/5" : "hover:bg-muted/40"}`}
                          onClick={() => {
                            setSelectedBandId(band.id);
                            setSelectedBasic(band.minBasicPay);
                          }}
                        >
                          <TableCell>
                            <div className="font-semibold">{band.title}</div>
                            <div className="text-xs text-muted-foreground">{band.payCells.length} computed cells</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{band.salaryRangeLpa[0]}-{band.salaryRangeLpa[1]} LPA</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{band.criteria}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(band.minBasicPay)}</TableCell>
                          <TableCell className="text-right">{lpa(band.startInclusiveAnnual)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">{lpa(band.startCtcAnnual)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "calculator" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">WPU Goa Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedBandId}
                        onChange={(event) => {
                          const band = bands.find((item) => item.id === event.target.value);
                          setSelectedBandId(event.target.value);
                          setSelectedBasic(band?.minBasicPay ?? null);
                        }}
                      >
                        {bands.map((band) => <option key={band.id} value={band.id}>{band.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Pay</Label>
                      <Input
                        type="number"
                        value={calculatorBasic}
                        onChange={(event) => setSelectedBasic(Number(event.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Inclusive salary</p>
                        <p className="mt-1 text-xl font-bold">{lpa(inclusiveAnnual)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Perks</p>
                        <p className="mt-1 text-xl font-bold">{lpa(perksAnnual)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">CTC</p>
                        <p className="mt-1 text-xl font-bold text-primary">{lpa(ctcAnnual)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bifurcation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["Basic", calculatorSalary.basicPay],
                    ["DA", calculatorSalary.da],
                    ["HRA", calculatorSalary.hra],
                    ["TA", calculatorSalary.ta],
                    ["Gross/mo", calculatorSalary.grossMonthly],
                    ["PPF/mo", calculatorSalary.ppf],
                    ["Gratuity/mo", calculatorSalary.gratuity],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <button className="font-medium hover:text-primary" onClick={() => copyValue(Number(value), String(label))}>{fmt(Number(value))}</button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {active === "pay-matrix" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">WPU Goa Pay Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="sticky left-0 bg-muted">Cell</TableHead>
                        {bands.map((band) => <TableHead key={band.id} className="min-w-[150px] text-center">{band.title}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: Math.max(...bands.map((band) => band.payCells.length)) }, (_, index) => (
                        <TableRow key={index} className="hover:bg-muted/40">
                          <TableCell className="sticky left-0 bg-card text-xs font-medium">{index + 1}</TableCell>
                          {bands.map((band) => {
                            const basic = band.payCells[index];
                            return (
                              <TableCell key={band.id} className="text-center text-xs">
                                {basic ? (
                                  <button
                                    className="rounded px-1.5 py-0.5 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => {
                                      setSelectedBandId(band.id);
                                      setSelectedBasic(basic);
                                      setActive("calculator");
                                    }}
                                  >
                                    {fmt(basic)}
                                  </button>
                                ) : "—"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "compensation" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">WPU Goa Compensation Table</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Inclusive salary already includes PPF and gratuity. Toggle detail columns when needed.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="wpu-detail-columns" className="text-xs text-muted-foreground">Details</Label>
                  <Switch id="wpu-detail-columns" checked={showDetailColumns} onCheckedChange={setShowDetailColumns} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Cell</TableHead>
                        <TableHead className="text-right">Basic</TableHead>
                        {showDetailColumns && (
                          <>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">PPF</TableHead>
                            <TableHead className="text-right">Gratuity</TableHead>
                          </>
                        )}
                        <TableHead className="text-right">Inclusive Salary</TableHead>
                        <TableHead className="text-right">CTC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bands.flatMap((band) => band.payCells.map((basic, index) => {
                        const salary = calculateSalary(basic, settings);
                        return (
                          <TableRow key={`${band.id}-${basic}`} className="hover:bg-muted/40">
                            <TableCell className="text-xs font-medium">{band.title}</TableCell>
                            <TableCell className="text-xs">{index + 1}</TableCell>
                            <TableCell className="text-right text-xs">{fmt(basic)}</TableCell>
                            {showDetailColumns && (
                              <>
                                <TableCell className="text-right text-xs">{fmt(salary.grossAnnual)}</TableCell>
                                <TableCell className="text-right text-xs">{fmt(salary.ppf * 12)}</TableCell>
                                <TableCell className="text-right text-xs">{fmt(salary.gratuity * 12)}</TableCell>
                              </>
                            )}
                            <TableCell className="text-right text-xs">{fmt(getWpuGoaInclusiveAnnual(basic, settings))}</TableCell>
                            <TableCell className="text-right text-xs font-semibold text-primary">{fmt(getWpuGoaCtcAnnual(basic, settings))}</TableCell>
                          </TableRow>
                        );
                      }))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">WPU Goa Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>DA %</Label>
                  <Input type="number" value={settings.daPercent * 100} onChange={(event) => updateSettings({ daPercent: Number(event.target.value) / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>TA Monthly</Label>
                  <Input type="number" value={settings.taMonthly} onChange={(event) => updateSettings({ taMonthly: Number(event.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>PPF %</Label>
                  <Input type="number" value={settings.ppfPercent * 100} onChange={(event) => updateSettings({ ppfPercent: Number(event.target.value) / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>Gratuity %</Label>
                  <Input type="number" value={settings.gratuityPercent * 100} onChange={(event) => updateSettings({ gratuityPercent: Number(event.target.value) / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>Annual perks</Label>
                  <Input type="number" value={perksAnnual} onChange={(event) => updateSettings({ housingSupport: Number(event.target.value), cpda: 0, healthInsurance: 0 })} />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <Label htmlFor="wpu-hra">HRA enabled</Label>
                    <p className="text-xs text-muted-foreground">Uses city rate when on.</p>
                  </div>
                  <Switch id="wpu-hra" checked={settings.hraEnabled} onCheckedChange={(checked) => updateSettings({ hraEnabled: checked })} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
