import { EdgeCaseInputs } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  edgeCases: EdgeCaseInputs;
  onChange: (ec: EdgeCaseInputs) => void;
}

export function EdgeCaseControls({ edgeCases, onChange }: Props) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<EdgeCaseInputs>) => onChange({ ...edgeCases, ...partial });

  const activeCount = [
    edgeCases.joiningMonth,
    edgeCases.payBunching,
    edgeCases.phdIncrements && edgeCases.phdIncrements > 0,
    edgeCases.serviceBreakMonths && edgeCases.serviceBreakMonths > 0,
  ].filter(Boolean).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span>Edge Cases</span>
          {activeCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{activeCount} active</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 border-t space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mid-year joining */}
            <div className="space-y-1">
              <Label className="text-xs">Mid-Year Joining Month</Label>
              <Select
                value={edgeCases.joiningMonth ? String(edgeCases.joiningMonth) : "none"}
                onValueChange={(v) => update({ joiningMonth: v === "none" ? undefined : Number(v) })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Not applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not applicable</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2024, i, 1).toLocaleString("default", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {edgeCases.joiningMonth && (
                <p className="text-[10px] text-muted-foreground">
                  Increment month: {settings.incrementMonth === 7 ? "July" : "January"}.
                  {" "}Need 6+ months service for eligibility.
                </p>
              )}
            </div>

            {/* Service break */}
            <div className="space-y-1">
              <Label className="text-xs">Service Break (months)</Label>
              <Input
                type="number"
                value={edgeCases.serviceBreakMonths ?? 0}
                onChange={(e) => update({ serviceBreakMonths: Number(e.target.value) || undefined })}
                min={0}
                max={12}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Unpaid leave affecting increment eligibility</p>
            </div>

            {/* PhD incentive */}
            <div className="space-y-1">
              <Label className="text-xs">PhD Incentive Increments</Label>
              <Input
                type="number"
                value={edgeCases.phdIncrements ?? 0}
                onChange={(e) => update({ phdIncrements: Number(e.target.value) || undefined })}
                min={0}
                max={5}
                className="h-8 text-xs"
              />
              {(edgeCases.phdIncrements ?? 0) > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px]">PhD obtained at year</Label>
                  <Input
                    type="number"
                    value={edgeCases.phdIncrementYear ?? 0}
                    onChange={(e) => update({ phdIncrementYear: Number(e.target.value) })}
                    min={0}
                    className="h-7 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Pay bunching */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pay Bunching (+3%)</Label>
                <Switch
                  checked={edgeCases.payBunching ?? false}
                  onCheckedChange={(v) => update({ payBunching: v })}
                  className="scale-75"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Extra 3% when two faculty at same pay cell
              </p>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
