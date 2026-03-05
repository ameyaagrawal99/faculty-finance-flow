import { useSettings } from "@/lib/settings-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2, ChevronDown, RotateCcw } from "lucide-react";
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
            DA {(settings.daPercent * 100).toFixed(0)}% · HRA {(settings.hraPercent * 100).toFixed(0)}% · TA ₹{settings.taMonthly}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 space-y-4 border-t">
          {/* Row 1: Core rates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SliderField
              label="DA %"
              value={settings.daPercent * 100}
              onChange={(v) => updateSettings({ daPercent: v / 100 })}
              min={0} max={100} step={1}
            />
            <div className="space-y-1">
              <Label className="text-xs">HRA City</Label>
              <Select value={settings.hraCityType} onValueChange={(v: "X" | "Y" | "Z") => updateSettings({ hraCityType: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="X">X City (30%)</SelectItem>
                  <SelectItem value="Y">Y City (20%)</SelectItem>
                  <SelectItem value="Z">Z City (10%)</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Row 2: Employer contributions */}
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
          </div>

          {/* Row 3: Remaining */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumberField
              label="Health Ins. (₹/yr)"
              value={settings.healthInsurance}
              onChange={(v) => updateSettings({ healthInsurance: v })}
            />
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={resetSettings} className="gap-1 text-xs h-8">
                <RotateCcw className="h-3 w-3" /> Reset All
              </Button>
            </div>
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
