import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_SETTINGS, GlobalSettings, HRA_RATES } from "@/lib/types";
import { calculateSalary, roundUpTo100 } from "@/lib/salary-engine";
import { backCalculateWpuGoaBands, getWpuGoaCtcAnnual, getWpuGoaInclusiveAnnual, WPU_GOA_BANDS } from "@/lib/wpu-goa";
import { BarChart3, Calculator, Columns3, Copy, Download, IndianRupee, ListChecks, RotateCcw, Search, Settings, Table2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type WpuMetric = "basic" | "inclusive" | "ctc";
type WpuColumn = "basic" | "gross" | "ppf" | "gratuity" | "inclusive" | "perks" | "ctc";

function fmt(value: number) {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

function lpa(value: number) {
  return `${(value / 100000).toFixed(2)} LPA`;
}

const wpuNav = [
  { id: "overview", label: "Overview", icon: ListChecks },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "pay-matrix", label: "Pay Matrix", icon: Table2 },
  { id: "compensation", label: "Compensation", icon: Columns3 },
  { id: "growth", label: "Growth Plan", icon: TrendingUp },
  { id: "settings", label: "Settings", icon: Settings },
];

const wpuDefaultSettings: GlobalSettings = {
  ...DEFAULT_SETTINGS,
  institutionCluster: "WPU Goa",
};

const compensationColumns: Array<{ key: WpuColumn; label: string }> = [
  { key: "basic", label: "Basic" },
  { key: "gross", label: "Gross" },
  { key: "ppf", label: "PPF" },
  { key: "gratuity", label: "Gratuity" },
  { key: "inclusive", label: "Inclusive Salary" },
  { key: "perks", label: "Perks" },
  { key: "ctc", label: "CTC" },
];

export default function WpuGoaPage() {
  const [active, setActive] = useState("overview");
  const [settings, setSettings] = useState<GlobalSettings>(wpuDefaultSettings);
  const [selectedBandId, setSelectedBandId] = useState("assistant-professor-1");
  const [selectedBasic, setSelectedBasic] = useState<number | null>(null);
  const [visibleBandIds, setVisibleBandIds] = useState<Set<string>>(new Set(WPU_GOA_BANDS.map((band) => band.id)));
  const [search, setSearch] = useState("");
  const [matrixMetric, setMatrixMetric] = useState<WpuMetric>("basic");
  const [matrixAnnual, setMatrixAnnual] = useState(false);
  const [compAnnual, setCompAnnual] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<Set<WpuColumn>>(new Set(["basic", "inclusive", "ctc"]));
  const [growthYears, setGrowthYears] = useState(8);

  const bands = useMemo(() => backCalculateWpuGoaBands(settings), [settings]);
  const selectedBand = bands.find((band) => band.id === selectedBandId) ?? bands[0];
  const visibleBands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bands.filter((band) => {
      const isVisible = visibleBandIds.has(band.id);
      const matches = !query || `${band.title} ${band.criteria} ${band.ugcAnchorLabel}`.toLowerCase().includes(query);
      return isVisible && matches;
    });
  }, [bands, search, visibleBandIds]);

  const calculatorBasic = selectedBasic ?? selectedBand.minBasicPay;
  const calculatorSalary = calculateSalary(calculatorBasic, settings);
  const inclusiveAnnual = getWpuGoaInclusiveAnnual(calculatorBasic, settings);
  const ctcAnnual = getWpuGoaCtcAnnual(calculatorBasic, settings);
  const perksAnnual = settings.housingSupport + settings.cpda + settings.healthInsurance;
  const maxCells = Math.max(...bands.map((band) => band.payCells.length));
  const lowestVisibleStartCtc = visibleBands.length ? Math.min(...visibleBands.map((band) => band.startCtcAnnual)) : null;
  const highestVisibleBandLpa = visibleBands.length ? Math.max(...visibleBands.map((band) => band.salaryRangeLpa[1])) : null;

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
    navigator.clipboard.writeText(String(Math.round(value))).then(() => toast.success(`Copied ${label}`));
  };

  const toggleBand = (id: string) => {
    setVisibleBandIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        if (next.size === 1) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleColumn = (column: WpuColumn) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) {
        if (next.size === 1) return next;
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const getMatrixValue = (basic: number) => {
    if (matrixMetric === "basic") return matrixAnnual ? basic * 12 : basic;
    if (matrixMetric === "inclusive") {
      const annual = getWpuGoaInclusiveAnnual(basic, settings);
      return matrixAnnual ? annual : Math.round(annual / 12);
    }
    const annual = getWpuGoaCtcAnnual(basic, settings);
    return matrixAnnual ? annual : Math.round(annual / 12);
  };

  const getCompValue = (basic: number, column: WpuColumn) => {
    const salary = calculateSalary(basic, settings);
    const annualValues: Record<WpuColumn, number> = {
      basic: salary.basicPay * 12,
      gross: salary.grossAnnual,
      ppf: salary.ppf * 12,
      gratuity: salary.gratuity * 12,
      inclusive: getWpuGoaInclusiveAnnual(basic, settings),
      perks: salary.perksAnnual,
      ctc: getWpuGoaCtcAnnual(basic, settings),
    };
    const value = annualValues[column];
    return compAnnual ? value : Math.round(value / 12);
  };

  const downloadCSV = () => {
    const rows = bands.map((band) => [
      band.title,
      band.ugcAnchorLabel,
      `${band.salaryRangeLpa[0]}-${band.salaryRangeLpa[1]} LPA`,
      band.criteria,
      String(band.minBasicPay),
      String(band.maxBasicPay),
      String(band.startInclusiveAnnual),
      String(band.startCtcAnnual),
    ]);
    const csv = [
      ["Position", "UGC Anchor", "Salary Range", "Criteria", "Start Basic", "Max Basic", "Start Inclusive Salary", "Start CTC"],
      ...rows,
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wpu-goa-salary-ranges.csv";
    link.click();
  };

  const growthRows = useMemo(() => {
    let bandIndex = Math.max(0, bands.findIndex((band) => band.id === selectedBand.id));
    let basic = calculatorBasic;

    return Array.from({ length: growthYears }, (_, index) => {
      let band = bands[bandIndex];
      const nextBasic = index === 0 ? basic : roundUpTo100(basic * (1 + settings.incrementRate));
      let note = index === 0 ? "Current starting point" : "Annual increment";
      basic = nextBasic;

      if (basic > band.maxBasicPay && bandIndex < bands.length - 1) {
        bandIndex += 1;
        band = bands[bandIndex];
        basic = Math.max(basic, band.minBasicPay);
        note = `Moved into ${band.title}`;
      }

      return {
        year: index + 1,
        band,
        basic,
        inclusive: getWpuGoaInclusiveAnnual(basic, settings),
        ctc: getWpuGoaCtcAnnual(basic, settings),
        note,
      };
    });
  }, [bands, calculatorBasic, growthYears, selectedBand.id, settings]);

  const bandStatus = inclusiveAnnual < selectedBand.minAnnualSalary
    ? "Below selected range"
    : inclusiveAnnual > selectedBand.maxAnnualSalary
      ? "Above selected range"
      : "Within selected range";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Entity Workspace</p>
          <h1 className="text-2xl font-bold">WPU Goa Faculty Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A WPU-specific version of the tool, anchored to nearby UGC academic levels and WPU Goa salary bands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-normal">Inclusive salary includes PPF + gratuity</Badge>
          <Badge variant="secondary" className="font-normal">Perks added to CTC</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
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
          <Card>
            <CardContent className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search WPU levels, criteria, or UGC anchors" className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-2">
                {bands.map((band) => (
                  <label key={band.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                    <Checkbox checked={visibleBandIds.has(band.id)} onCheckedChange={() => toggleBand(band.id)} />
                    <span>{band.title.replace(" Professor", " Prof.")}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {active === "overview" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Salary Range Overview</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">WPU Goa bands with UGC anchor levels, criteria, and back-calculated start pay.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadCSV}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Visible WPU levels</p>
                      <p className="mt-1 text-2xl font-bold">{visibleBands.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Lowest start CTC</p>
                      <p className="mt-1 text-xl font-bold">{lowestVisibleStartCtc ? lpa(lowestVisibleStartCtc) : "—"}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Highest inclusive band</p>
                      <p className="mt-1 text-xl font-bold">{highestVisibleBandLpa ? `${highestVisibleBandLpa} LPA` : "—"}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="min-w-[190px]">WPU Level</TableHead>
                        <TableHead className="min-w-[170px]">UGC Anchor</TableHead>
                        <TableHead>Salary Range</TableHead>
                        <TableHead className="min-w-[280px]">Criteria</TableHead>
                        <TableHead className="text-right">Basic Range</TableHead>
                        <TableHead className="text-right">Start CTC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleBands.map((band) => (
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
                            <Badge variant="secondary" className="font-normal">{band.ugcAnchorLevelId}</Badge>
                            <div className="mt-1 text-xs text-muted-foreground">{band.ugcAnchorLabel}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{band.salaryRangeLpa[0]}-{band.salaryRangeLpa[1]} LPA</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{band.criteria}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(band.minBasicPay)} - {fmt(band.maxBasicPay)}</TableCell>
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
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>WPU Level</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedBandId}
                        onChange={(event) => {
                          const band = bands.find((item) => item.id === event.target.value);
                          setSelectedBandId(event.target.value);
                          setSelectedBasic(band?.minBasicPay ?? null);
                        }}
                      >
                        {bands.map((band) => <option key={band.id} value={band.id}>{band.title} · {band.salaryRangeLpa[0]}-{band.salaryRangeLpa[1]} LPA</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Pay</Label>
                      <Input type="number" value={calculatorBasic} onChange={(event) => setSelectedBasic(Number(event.target.value))} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Band status</p>
                        <p className="mt-1 text-sm font-semibold">{bandStatus}</p>
                      </CardContent>
                    </Card>
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
                    ["Inclusive/year", inclusiveAnnual],
                    ["CTC/year", ctcAnnual],
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
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle className="text-base">WPU Goa Pay Matrix</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {(["basic", "inclusive", "ctc"] as WpuMetric[]).map((metric) => (
                      <Button key={metric} variant={matrixMetric === metric ? "default" : "outline"} size="sm" onClick={() => setMatrixMetric(metric)}>
                        {metric === "basic" ? "Basic" : metric === "inclusive" ? "Inclusive" : "CTC"}
                      </Button>
                    ))}
                    <div className="flex items-center gap-2 rounded-md border px-3">
                      <Label htmlFor="wpu-matrix-annual" className="text-xs text-muted-foreground">Annual</Label>
                      <Switch id="wpu-matrix-annual" checked={matrixAnnual} onCheckedChange={setMatrixAnnual} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="sticky left-0 bg-muted">Cell</TableHead>
                        {visibleBands.map((band) => (
                          <TableHead key={band.id} className="min-w-[160px] text-center">
                            <div>{band.title}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">{band.ugcAnchorLevelId}</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: maxCells }, (_, index) => (
                        <TableRow key={index} className="hover:bg-muted/40">
                          <TableCell className="sticky left-0 bg-card text-xs font-medium">{index + 1}</TableCell>
                          {visibleBands.map((band) => {
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
                                    {fmt(getMatrixValue(basic))}
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
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">WPU Goa Compensation Table</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Choose columns just like the main compensation table.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="wpu-comp-annual" className="text-xs text-muted-foreground">Monthly</Label>
                    <Switch id="wpu-comp-annual" checked={compAnnual} onCheckedChange={setCompAnnual} />
                    <Label htmlFor="wpu-comp-annual" className="text-xs text-muted-foreground">Annual</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {compensationColumns.map((column) => (
                    <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                      <Checkbox checked={visibleColumns.has(column.key)} onCheckedChange={() => toggleColumn(column.key)} />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>WPU Level</TableHead>
                        <TableHead>UGC</TableHead>
                        <TableHead>Cell</TableHead>
                        {compensationColumns.filter((column) => visibleColumns.has(column.key)).map((column) => (
                          <TableHead key={column.key} className="text-right">{column.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleBands.flatMap((band) => band.payCells.map((basic, index) => (
                        <TableRow key={`${band.id}-${basic}`} className="hover:bg-muted/40">
                          <TableCell className="text-xs font-medium">{band.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{band.ugcAnchorLevelId}</TableCell>
                          <TableCell className="text-xs">{index + 1}</TableCell>
                          {compensationColumns.filter((column) => visibleColumns.has(column.key)).map((column) => (
                            <TableCell key={column.key} className={`text-right text-xs ${column.key === "ctc" ? "font-semibold text-primary" : ""}`}>
                              {fmt(getCompValue(basic, column.key))}
                            </TableCell>
                          ))}
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "growth" && (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Growth Plan</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Projects annual increments and rolls into the next WPU level when the current band is crossed.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="wpu-growth-years" className="text-xs text-muted-foreground">Years</Label>
                    <Input id="wpu-growth-years" className="w-20" type="number" min={1} max={20} value={growthYears} onChange={(event) => setGrowthYears(Number(event.target.value))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>WPU Level</TableHead>
                        <TableHead className="text-right">Basic</TableHead>
                        <TableHead className="text-right">Inclusive</TableHead>
                        <TableHead className="text-right">CTC</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {growthRows.map((row) => (
                        <TableRow key={row.year} className="hover:bg-muted/40">
                          <TableCell>{row.year}</TableCell>
                          <TableCell className="text-xs font-medium">{row.band.title}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(row.basic)}</TableCell>
                          <TableCell className="text-right text-xs">{lpa(row.inclusive)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-primary">{lpa(row.ctc)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.note}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "settings" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">WPU Goa Settings</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">These controls affect only this WPU Goa workspace.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setSettings(wpuDefaultSettings)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
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
                <div className="space-y-2">
                  <Label>Increment %</Label>
                  <Input type="number" value={settings.incrementRate * 100} onChange={(event) => updateSettings({ incrementRate: Number(event.target.value) / 100 })} />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <Label htmlFor="wpu-hra">HRA enabled</Label>
                    <p className="text-xs text-muted-foreground">Uses city rate when on.</p>
                  </div>
                  <Switch id="wpu-hra" checked={settings.hraEnabled} onCheckedChange={(checked) => updateSettings({ hraEnabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label>HRA city type</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settings.hraCityType} onChange={(event) => updateSettings({ hraCityType: event.target.value as GlobalSettings["hraCityType"] })}>
                    <option value="X">X · 30%</option>
                    <option value="Y">Y · 20%</option>
                    <option value="Z">Z · 10%</option>
                  </select>
                </div>
                <Card className="md:col-span-2 xl:col-span-1">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current perks package</p>
                      <p className="text-lg font-semibold">{fmt(perksAnnual)}</p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
