import { useSettings } from "@/lib/settings-context";
import { PAY_MATRIX } from "@/lib/pay-matrix-data";
import { HRA_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  const setEntryPayOverride = (levelId: string, value: number) => {
    updateSettings({
      entryPayOverrides: { ...settings.entryPayOverrides, [levelId]: value },
    });
  };

  const clearEntryPayOverride = (levelId: string) => {
    const next = { ...settings.entryPayOverrides };
    delete next[levelId];
    updateSettings({ entryPayOverrides: next });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure calculation parameters</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetSettings} className="gap-1">
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>

      {/* Core Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Core Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Increment Rate (%)</Label>
            <Input
              type="number"
              value={(settings.incrementRate * 100).toFixed(1)}
              onChange={(e) => updateSettings({ incrementRate: Number(e.target.value) / 100 })}
              step="0.1" className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">DA (%)</Label>
            <Input
              type="number"
              value={(settings.daPercent * 100).toFixed(1)}
              onChange={(e) => updateSettings({ daPercent: Number(e.target.value) / 100 })}
              step="1" className="h-8"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">HRA</Label>
              <Switch checked={settings.hraEnabled} onCheckedChange={(v) => updateSettings({ hraEnabled: v })} />
            </div>
            {settings.hraEnabled && (
              <>
                <Select value={settings.hraCityType} onValueChange={(v: "X" | "Y" | "Z") => updateSettings({ hraCityType: v, hraOverride: null })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">X City (30%)</SelectItem>
                    <SelectItem value="Y">Y City (20%)</SelectItem>
                    <SelectItem value="Z">Z City (10%)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Override HRA %"
                  value={settings.hraOverride !== null ? (settings.hraOverride * 100).toFixed(0) : ""}
                  onChange={(e) => updateSettings({ hraOverride: e.target.value ? Number(e.target.value) / 100 : null })}
                  className="h-8"
                />
              </>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Transport Allowance (₹/month)</Label>
            <Input
              type="number"
              value={settings.taMonthly}
              onChange={(e) => updateSettings({ taMonthly: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pension */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pension & Contributions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Pension Scheme</Label>
            <Select value={settings.pensionScheme} onValueChange={(v: "NPS" | "OPS") => updateSettings({ pensionScheme: v })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NPS">NPS (Employee 10% + Employer 14%)</SelectItem>
                <SelectItem value="OPS">OPS (Old Pension Scheme)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {settings.pensionScheme === "NPS"
                ? "NPS: 10% of (Basic+DA) from employee, 14% from employer added to CTC"
                : "OPS: Defined benefit pension, no employee contribution shown"}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">PPF (%)</Label>
            <Input
              type="number"
              value={(settings.ppfPercent * 100).toFixed(1)}
              onChange={(e) => updateSettings({ ppfPercent: Number(e.target.value) / 100 })}
              step="0.1" className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gratuity (%)</Label>
            <Input
              type="number"
              value={(settings.gratuityPercent * 100).toFixed(2)}
              onChange={(e) => updateSettings({ gratuityPercent: Number(e.target.value) / 100 })}
              step="0.01" className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Increment Month</Label>
            <Select value={String(settings.incrementMonth)} onValueChange={(v) => updateSettings({ incrementMonth: Number(v) as 1 | 7 })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">July (1st July)</SelectItem>
                <SelectItem value="1">January (1st January)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Perks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Annual Perks</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Housing Support (₹/year)</Label>
            <Input type="number" value={settings.housingSupport} onChange={(e) => updateSettings({ housingSupport: Number(e.target.value) })} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CPDA (₹/year)</Label>
            <Input type="number" value={settings.cpda} onChange={(e) => updateSettings({ cpda: Number(e.target.value) })} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Health Insurance (₹/year)</Label>
            <Input type="number" value={settings.healthInsurance} onChange={(e) => updateSettings({ healthInsurance: Number(e.target.value) })} className="h-8" />
          </div>
        </CardContent>
      </Card>

      {/* Stagnation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stagnation Increment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable Stagnation Increment</Label>
              <Switch checked={settings.stagnationEnabled} onCheckedChange={(v) => updateSettings({ stagnationEnabled: v })} />
            </div>
            <p className="text-[10px] text-muted-foreground">Grant extra increment after N years at same level without promotion</p>
          </div>
          {settings.stagnationEnabled && (
            <div className="space-y-1">
              <Label className="text-xs">Years before stagnation increment</Label>
              <Input type="number" value={settings.stagnationYears} onChange={(e) => updateSettings({ stagnationYears: Number(e.target.value) })} min={1} className="h-8" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Pay Overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entry Pay Overrides</CardTitle>
          <p className="text-xs text-muted-foreground">Change entry pay for any level. All cells will be recalculated using 3% increments.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAY_MATRIX.map((l) => {
            const override = settings.entryPayOverrides[l.id];
            const isOverridden = override !== undefined && override !== l.revisedEntryPay;
            return (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-40 text-xs">
                  <span className="font-medium">{l.levelName}</span>
                  <span className="text-muted-foreground ml-1 text-[10px]">{l.designation.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <Input
                  type="number"
                  value={override ?? l.revisedEntryPay}
                  onChange={(e) => setEntryPayOverride(l.id, Number(e.target.value))}
                  className="h-8 text-xs w-32"
                />
                <span className="text-[10px] text-muted-foreground">Default: ₹{l.revisedEntryPay.toLocaleString("en-IN")}</span>
                {isOverridden && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => clearEntryPayOverride(l.id)}>
                    Reset
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Institution Cluster */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Institution Cluster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs">Active Cluster</Label>
            <Select value={settings.institutionCluster} onValueChange={(v) => updateSettings({ institutionCluster: v })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BITS">Engineering / BITS Pilani</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Determines qualification criteria shown per level. More clusters coming soon.</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Settings are saved automatically in your browser.
      </p>
    </div>
  );
}
