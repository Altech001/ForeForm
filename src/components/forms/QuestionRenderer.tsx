import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function QuestionRenderer({ question, value, onChange }) {
  const renderInput = () => {
    switch (question.type) {
      case "short_text":
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" />;
      case "long_text":
        return <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" rows={4} />;
      case "multiple_choice":
        return (
          <RadioGroup value={value || ""} onValueChange={onChange} className="space-y-2">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all cursor-pointer">
                <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
                <Label htmlFor={`${question.id}-${i}`} className="cursor-pointer flex-1">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox": {
        const selected = value ? value.split(", ") : [];
        return (
          <div className="space-y-2">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    const newSelected = checked ? [...selected, opt] : selected.filter((s) => s !== opt);
                    onChange(newSelected.join(", "));
                  }}
                  id={`${question.id}-${i}`}
                />
                <Label htmlFor={`${question.id}-${i}`} className="cursor-pointer flex-1">{opt}</Label>
              </div>
            ))}
          </div>
        );
      }
      case "dropdown":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {(question.options || []).map((opt, i) => (
                <SelectItem key={i} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "number":
        return <Input type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="0" />;
      case "email":
        return <Input type="email" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="email@example.com" />;
      default:
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-1">
        <span className="text-base font-medium">{question.label}</span>
        {question.required && <span className="text-destructive text-sm">*</span>}
      </div>
      {renderInput()}
    </div>
  );
}