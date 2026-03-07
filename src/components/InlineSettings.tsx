import { useSettings } from "@/lib/settings-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, ChevronDown, RotateCcw, TrendingUp, Lock } from "lucide-react";
import { useState } from "react";

export function InlineSettings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span>Calculation Settings</span>
          <span className="text-xs text-muted-foreground">
            DA {(settings.daPercent * 100).toFixed(0)}%{settings.daMode === "projected" ? " (proj.)" : ""}
            {settings.hraEnabled ? ` · HRA ${settings.hraOverride !== null ? (settings.hraOverride * 100).toFixed(0) : settings.hraCityType}` : " · No HRA"}
            {" "}· TA ₹{settings.taMonthly} · {settings.pensionScheme}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 space-y-4 border-t">
          {/* Row 1: Core rates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">DA</Label>
                <div className="flex items-center gap-0.5 rounded border p-0.5 bg-muted/50">
                  <button
                    onClick={() => updateSettings({ daMode: "flat" })}
                    title="Flat rate"
                    className={`p-0.5 rounded transition-colors ${settings.daMode === "flat" ? "bg-background shadow" : "text-muted-foreground"}`}
                  >
                    <Lock className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => updateSettings({ daMode: "projected" })}
                    title="Projected growth"
                    className={`p-0.5 rounded transition-colors ${settings.daMode === "projected" ? "bg-background shadow text-emerald-600" : "text-muted-foreground"}`}
                  >
                    <TrendingUp className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {settings.daMode === "flat" ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{(settings.daPercent * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[settings.daPercent * 100]}
                    onValueChange={([v]) => updateSettings({ daPercent: v / 100 })}
                    min={0} max={100} step={1}
                    className="py-1"
                  />
                </div>
              ) : (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                  Uses 7th CPC schedule<br />
                  <span className="text-muted-foreground">({(settings.daPercent * 100).toFixed(0)}% base · grows ~2–3%/revision)</span>
                </p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">HRA</Label>
                <Switch
                  checked={settings.hraEnabled}
                  onCheckedChange={(v) => updateSettings({ hraEnabled: v })}
                  className="scale-75"
                />
              </div>
              {settings.hraEnabled ? (
                <div className="space-y-1">
                  <Select value={settings.hraCityType} onValueChange={(v: "X" | "Y" | "Z") => updateSettings({ hraCityType: v, hraOverride: null })}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">X City (30%)</SelectItem>
                      <SelectItem value="Y">Y City (20%)</SelectItem>
                      <SelectItem value="Z">Z City (10%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Override %"
                    value={settings.hraOverride !== null ? (settings.hraOverride * 100).toFixed(0) : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSettings({ hraOverride: val ? Number(val) / 100 : null });
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">HRA disabled</p>
              )}
            </div>
            <NumberField
              label="TA (₹/mo)"
              value={settings.taMonthly}
              onChange={(v) => updateSettings({ taMonthly: v })}
            />
            <SliderField
              label="Increment %"
              value={settings.incrementRate * 100}
              onChange={(v) => updateSettings({ incrementRate: v / 100 })}
              min={1} max={10} step={0.5}
            />
          </div>

          {/* Row 2: Employer contributions + pension */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SliderField
              label="PPF %"
              value={settings.ppfPercent * 100}
              onChange={(v) => updateSettings({ ppfPercent: v / 100 })}
              min={0} max={20} step={0.5}
            />
            <SliderField
              label="Gratuity %"
              value={settings.gratuityPercent * 100}
              onChange={(v) => updateSettings({ gratuityPercent: v / 100 })}
              min={0} max={10} step={0.01}
            />
            <div className="space-y-1">
              <Label className="text-xs">Pension</Label>
              <Select value={settings.pensionScheme} onValueChange={(v: "NPS" | "OPS") => updateSettings({ pensionScheme: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPS">NPS (10%+14%)</SelectItem>
                  <SelectItem value="OPS">OPS (Defined Benefit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Increment Month</Label>
              <Select value={String(settings.incrementMonth)} onValueChange={(v) => updateSettings({ incrementMonth: Number(v) as 1 | 7 })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">July (1st Jul)</SelectItem>
                  <SelectItem value="1">January (1st Jan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Perks + stagnation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumberField
              label="Housing (₹/yr)"
              value={settings.housingSupport}
              onChange={(v) => updateSettings({ housingSupport: v })}
            />
            <NumberField
              label="CPDA (₹/yr)"
              value={settings.cpda}
              onChange={(v) => updateSettings({ cpda: v })}
            />
            <NumberField
              label="Health Ins. (₹/yr)"
              value={settings.healthInsurance}
              onChange={(v) => updateSettings({ healthInsurance: v })}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Stagnation</Label>
                <Switch
                  checked={settings.stagnationEnabled}
                  onCheckedChange={(v) => updateSettings({ stagnationEnabled: v })}
                  className="scale-75"
                />
              </div>
              {settings.stagnationEnabled && (
                <Input
                  type="number"
                  value={settings.stagnationYears}
                  onChange={(e) => updateSettings({ stagnationYears: Number(e.target.value) })}
                  className="h-7 text-xs"
                  min={1}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Cluster</Label>
              <Select value={settings.institutionCluster} onValueChange={(v) => updateSettings({ institutionCluster: v })}>
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BITS">Engineering / BITS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={resetSettings} className="gap-1 text-xs h-8">
              <RotateCcw className="h-3 w-3" /> Reset All
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SliderField({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-mono text-muted-foreground">{value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min} max={max} step={step}
        className="py-1"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-xs"
      />
    </div>
  );
}
