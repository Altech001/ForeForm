import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Trash2, Plus, X } from "lucide-react";
import QuestionTypeIcon, { getQuestionTypeLabel } from "./QuestionTypeIcon";
import ConditionalLogicEditor from "./ConditionalLogicEditor";

const QUESTION_TYPES = [
  "short_text", "long_text", "multiple_choice", "checkbox", "dropdown", "date", "number", "email"
];

const hasOptions = (type) => ["multiple_choice", "checkbox", "dropdown"].includes(type);

export default function QuestionEditor({ question, onUpdate, onDelete, dragHandleProps, allQuestions, questionIndex }) {
  const updateField = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const addOption = () => {
    const options = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
    updateField("options", options);
  };

  const updateOption = (index, value) => {
    const options = [...(question.options || [])];
    options[index] = value;
    updateField("options", options);
  };

  const removeOption = (index) => {
    const options = (question.options || []).filter((_, i) => i !== index);
    updateField("options", options);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2 sm:gap-3">
        <div {...dragHandleProps} className="mt-2 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={question.label}
              onChange={(e) => updateField("label", e.target.value)}
              placeholder="Question text..."
              className="text-base font-medium flex-1"
            />
            <Select value={question.type} onValueChange={(val) => updateField("type", val)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-2">
                      <QuestionTypeIcon type={t} className="w-4 h-4 text-primary" />
                      {getQuestionTypeLabel(t)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasOptions(question.type) && (
            <div className="space-y-2 pl-1">
              {(question.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <QuestionTypeIcon type={question.type} className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 h-9 min-w-0"
                    placeholder={`Option ${i + 1}`}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addOption} className="text-primary hover:text-primary/80">
                <Plus className="w-4 h-4 mr-1" /> Add option
              </Button>
            </div>
          )}

          {/* Conditional logic */}
          {questionIndex > 0 && (
            <ConditionalLogicEditor
              question={question}
              allQuestions={allQuestions || []}
              currentIndex={questionIndex}
              onChange={(condition) => updateField("condition", condition)}
            />
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={question.required}
                onCheckedChange={(val) => updateField("required", val)}
                id={`required-${question.id}`}
              />
              <Label htmlFor={`required-${question.id}`} className="text-sm text-muted-foreground">
                Required
              </Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}