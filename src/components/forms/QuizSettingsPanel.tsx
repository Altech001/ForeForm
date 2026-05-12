import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trophy, Hash } from "lucide-react";

type QuizSettings = {
  enabled?: boolean;
  release_grades?: "immediately" | "manual";
  show_missed_questions?: boolean;
  show_correct_answers?: boolean;
  show_point_values?: boolean;
  default_points?: number;
};

type QuizSettingsPanelProps = {
  quiz?: QuizSettings;
  onChange: (quiz: QuizSettings) => void;
};

export default function QuizSettingsPanel({ quiz = {}, onChange }: QuizSettingsPanelProps) {
  const update = <K extends keyof QuizSettings>(field: K, value: QuizSettings[K]) => onChange({ ...quiz, [field]: value });
  const respondentSettings: Array<{
    key: "show_missed_questions" | "show_correct_answers" | "show_point_values";
    label: string;
    desc: string;
  }> = [
    { key: "show_missed_questions", label: "Missed questions", desc: "Respondents can see which questions were answered incorrectly" },
    { key: "show_correct_answers", label: "Correct answers", desc: "Respondents can see correct answers after grades are released" },
    { key: "show_point_values", label: "Point values", desc: "Respondents can see total points and points received for each question" },
  ];

  const settings = {
    enabled: quiz.enabled ?? false,
    release_grades: quiz.release_grades ?? "immediately",
    show_missed_questions: quiz.show_missed_questions ?? true,
    show_correct_answers: quiz.show_correct_answers ?? false,
    show_point_values: quiz.show_point_values ?? true,
    default_points: quiz.default_points ?? 10,
  };

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl border border-border">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Make this a quiz</p>
            <p className="text-xs text-muted-foreground mt-0.5">Assign point values, set answers, and automatically provide feedback</p>
          </div>
        </div>
        <Switch checked={settings.enabled} onCheckedChange={(v) => update("enabled", v)} />
      </div>

      {settings.enabled && (
        <div className="space-y-6 pl-2">
          {/* Release grades */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Release Grades</p>
            <RadioGroup value={settings.release_grades} onValueChange={(v) => update("release_grades", v as QuizSettings["release_grades"])} className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/20 cursor-pointer">
                <RadioGroupItem value="immediately" id="rg-immediately" />
                <Label htmlFor="rg-immediately" className="cursor-pointer">
                  <p className="font-medium text-sm">Immediately after each submission</p>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/20 cursor-pointer">
                <RadioGroupItem value="manual" id="rg-manual" />
                <Label htmlFor="rg-manual" className="cursor-pointer">
                  <p className="font-medium text-sm">Later, after manual review</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Respondent settings */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Respondent Settings</p>
            <div className="space-y-1 border border-border rounded-xl overflow-hidden">
              {respondentSettings.map(({ key, label, desc }, idx, arr) => (
                <div key={key} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? "border-b border-border" : ""}`}>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={settings[key]} onCheckedChange={(v) => update(key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Default points */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global Quiz Defaults</p>
            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div>
                <p className="text-sm font-medium flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Default question point value</p>
                <p className="text-xs text-muted-foreground">Point values for every new question</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={settings.default_points}
                  onChange={(e) => update("default_points", Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
