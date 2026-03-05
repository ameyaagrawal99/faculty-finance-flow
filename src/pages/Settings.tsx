import { useSettings } from "@/lib/settings-context";
import { HRA_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

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
              step="0.1"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">DA (%)</Label>
            <Input
              type="number"
              value={(settings.daPercent * 100).toFixed(1)}
              onChange={(e) => updateSettings({ daPercent: Number(e.target.value) / 100 })}
              step="1"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">HRA City Type</Label>
            <Select value={settings.hraCityType} onValueChange={(v: "X" | "Y" | "Z") => updateSettings({ hraCityType: v })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X City (30%)</SelectItem>
                <SelectItem value="Y">Y City (20%)</SelectItem>
                <SelectItem value="Z">Z City (10%)</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Employer Contributions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employer Contributions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">PPF (%)</Label>
            <Input
              type="number"
              value={(settings.ppfPercent * 100).toFixed(1)}
              onChange={(e) => updateSettings({ ppfPercent: Number(e.target.value) / 100 })}
              step="0.1"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gratuity (%)</Label>
            <Input
              type="number"
              value={(settings.gratuityPercent * 100).toFixed(2)}
              onChange={(e) => updateSettings({ gratuityPercent: Number(e.target.value) / 100 })}
              step="0.01"
              className="h-8"
            />
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
            <Input
              type="number"
              value={settings.housingSupport}
              onChange={(e) => updateSettings({ housingSupport: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CPDA (₹/year)</Label>
            <Input
              type="number"
              value={settings.cpda}
              onChange={(e) => updateSettings({ cpda: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Health Insurance (₹/year)</Label>
            <Input
              type="number"
              value={settings.healthInsurance}
              onChange={(e) => updateSettings({ healthInsurance: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Settings are saved automatically in your browser. Cloud sync coming soon.
      </p>
    </div>
  );
}
