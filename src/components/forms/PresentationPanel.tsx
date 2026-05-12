import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LayoutList, Shuffle, MessageSquare, RefreshCw, BarChart2, Lock, Pencil, type LucideIcon } from "lucide-react";

type PresentationSettings = {
  show_progress_bar?: boolean;
  shuffle_questions?: boolean;
  confirmation_message?: string;
  show_submit_another?: boolean;
  show_results_summary?: boolean;
  disable_autosave?: boolean;
};

type PresentationPanelProps = {
  presentation?: PresentationSettings;
  onChange: (presentation: PresentationSettings) => void;
};

type RowProps = {
  icon: LucideIcon;
  label: string;
  desc?: string;
  children: React.ReactNode;
};

const Row = ({ icon: Icon, label, desc, children }: RowProps) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
    <div className="ml-4 shrink-0">{children}</div>
  </div>
);

export default function PresentationPanel({ presentation = {}, onChange }: PresentationPanelProps) {
  const [editingMsg, setEditingMsg] = useState(false);

  const s = {
    show_progress_bar: presentation.show_progress_bar ?? true,
    shuffle_questions: presentation.shuffle_questions ?? false,
    confirmation_message: presentation.confirmation_message ?? "Your response has been recorded",
    show_submit_another: presentation.show_submit_another ?? false,
    show_results_summary: presentation.show_results_summary ?? false,
    disable_autosave: presentation.disable_autosave ?? false,
  };

  const update = <K extends keyof PresentationSettings>(field: K, value: PresentationSettings[K]) => onChange({ ...s, [field]: value });

  return (
    <div className="space-y-6">
      {/* Form Presentation */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Form Presentation</p>
        <div className="border border-border rounded-xl overflow-hidden">
          <Row icon={LayoutList} label="Show progress bar" desc="">
            <Switch checked={s.show_progress_bar} onCheckedChange={(v) => update("show_progress_bar", v)} />
          </Row>
          <Row icon={Shuffle} label="Shuffle question order" desc="">
            <Switch checked={s.shuffle_questions} onCheckedChange={(v) => update("shuffle_questions", v)} />
          </Row>
        </div>
      </div>

      {/* After Submission */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">After Submission</p>
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Confirmation message */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Confirmation message</p>
                  {!editingMsg && (
                    <p className="text-xs text-muted-foreground mt-0.5">{s.confirmation_message}</p>
                  )}
                </div>
              </div>
              <Button variant="link" size="sm" className="text-primary h-auto p-0 ml-4 shrink-0" onClick={() => setEditingMsg(!editingMsg)}>
                {editingMsg ? "Done" : <><Pencil className="w-3 h-3 mr-1" />Edit</>}
              </Button>
            </div>
            {editingMsg && (
              <Textarea
                value={s.confirmation_message}
                onChange={(e) => update("confirmation_message", e.target.value)}
                className="mt-3 text-sm"
                rows={3}
                placeholder="e.g. Thank you for your response!"
              />
            )}
          </div>

          <Row icon={RefreshCw} label="Show link to submit another response" desc="">
            <Switch checked={s.show_submit_another} onCheckedChange={(v) => update("show_submit_another", v)} />
          </Row>
          <Row icon={BarChart2} label="View results summary" desc="Share results summary with respondents">
            <Switch checked={s.show_results_summary} onCheckedChange={(v) => update("show_results_summary", v)} />
          </Row>
        </div>
      </div>

      {/* Restrictions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Restrictions</p>
        <div className="border border-border rounded-xl overflow-hidden">
          <Row icon={Lock} label="Disable autosave for all respondents" desc="Responses won't be saved automatically as respondents fill out the form">
            <Switch checked={s.disable_autosave} onCheckedChange={(v) => update("disable_autosave", v)} />
          </Row>
        </div>
      </div>
    </div>
  );
}
