import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitBranch, X } from "lucide-react";

const OPERATORS = [
  { value: "equals", label: "is exactly" },
  { value: "not_equals", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_empty", label: "is answered" },
];

// Only questions before this one can be used as conditions
export default function ConditionalLogicEditor({ question, allQuestions, currentIndex, onChange }) {
  const condition = question.condition || null;
  const eligibleQuestions = allQuestions.slice(0, currentIndex).filter((q) => q.id !== question.id && q.label);

  const sourceQuestion = eligibleQuestions.find((q) => q.id === condition?.source_question_id);
  const sourceHasOptions = sourceQuestion && ["multiple_choice", "checkbox", "dropdown"].includes(sourceQuestion.type);

  const updateCondition = (field, value) => {
    const updated = { ...(condition || { source_question_id: "", operator: "equals", value: "" }), [field]: value };
    onChange(updated);
  };

  const removeCondition = () => onChange(null);

  if (!condition) {
    if (eligibleQuestions.length === 0) return null;
    return (
      <button
        type="button"
        onClick={() => onChange({ source_question_id: "", operator: "equals", value: "" })}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <GitBranch className="w-3.5 h-3.5" />
        Add conditional logic
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-accent/40 border border-primary/20 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" /> Show this question only if…
        </span>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={removeCondition}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Source question */}
        <Select value={condition.source_question_id || ""} onValueChange={(v) => updateCondition("source_question_id", v)}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-32">
            <SelectValue placeholder="Pick a question" />
          </SelectTrigger>
          <SelectContent>
            {eligibleQuestions.map((q) => (
              <SelectItem key={q.id} value={q.id} className="text-xs">
                {q.label.length > 50 ? q.label.slice(0, 50) + "…" : q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator */}
        <Select value={condition.operator || "equals"} onValueChange={(v) => updateCondition("operator", v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value — hidden when operator is "not_empty" */}
        {condition.operator !== "not_empty" && (
          sourceHasOptions ? (
            <Select value={condition.value || ""} onValueChange={(v) => updateCondition("value", v)}>
              <SelectTrigger className="h-8 text-xs flex-1 min-w-28">
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {(sourceQuestion.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={condition.value || ""}
              onChange={(e) => updateCondition("value", e.target.value)}
              placeholder="Value…"
              className="h-8 text-xs flex-1 min-w-28"
            />
          )
        )}
      </div>
    </div>
  );
}