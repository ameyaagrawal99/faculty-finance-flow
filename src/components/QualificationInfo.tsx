import { getQualificationsForLevel } from "@/lib/qualification-data";
import { useSettings } from "@/lib/settings-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronDown, BookOpen, Clock, FileText, Award } from "lucide-react";
import { useState } from "react";

interface Props {
  levelId: string;
}

export function QualificationInfo({ levelId }: Props) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const qual = getQualificationsForLevel(levelId, settings.institutionCluster);

  if (!qual) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span>Eligibility & Qualifications</span>
          <Badge variant="outline" className="text-[10px]">{settings.institutionCluster}</Badge>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 border-t space-y-3">
          {/* Qualifications */}
          <Section icon={<BookOpen className="h-3.5 w-3.5" />} title="Qualifications">
            <ul className="list-disc list-inside space-y-0.5">
              {qual.qualifications.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </Section>

          {/* PhD */}
          <Section icon={<Award className="h-3.5 w-3.5" />} title="PhD Requirement">
            <p>{qual.phdRequirement}</p>
          </Section>

          {/* Experience */}
          <Section icon={<Clock className="h-3.5 w-3.5" />} title="Experience & Tenure">
            <p><strong>Experience:</strong> {qual.experience}</p>
            <p><strong>Tenure:</strong> {qual.tenure}</p>
            {qual.regularizationPath && <p><strong>Regularization:</strong> {qual.regularizationPath}</p>}
          </Section>

          {/* Publications */}
          {qual.publications && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="Publications">
              <p>{qual.publications}</p>
            </Section>
          )}

          {/* Other requirements */}
          {qual.otherRequirements && qual.otherRequirements.length > 0 && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="Other Requirements">
              <ul className="list-disc list-inside space-y-0.5">
                {qual.otherRequirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Section>
          )}

          {/* Notes */}
          {qual.notes && qual.notes.length > 0 && (
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-dashed">
              {qual.notes.map((n, i) => <p key={i}>• {n}</p>)}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div className="text-xs text-muted-foreground pl-5">{children}</div>
    </div>
  );
}
