import React from "react";
import { base44 } from "@/api/foreform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";

function parseFileAnswer(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { file_name: "Uploaded file", file_url: value };
  }
}

function FileUploadInput({ value, onChange }) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInfo = parseFileAnswer(value);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      onChange(JSON.stringify({
        file_name: file.name,
        file_url: uploaded.file_url,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
      }));
      toast.success("File uploaded");
    } catch (error) {
      toast.error("File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/40">
        {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        <span className="text-sm font-medium">{isUploading ? "Uploading file..." : "Choose a file"}</span>
        <span className="text-xs text-muted-foreground">PDF, documents, spreadsheets, or images up to 10 MB</span>
        <Input type="file" className="sr-only" onChange={handleUpload} disabled={isUploading} />
      </Label>

      {fileInfo?.file_url && (
        <div className="flex items-center gap-3 rounded border border-border bg-card px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <a href={fileInfo.file_url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
            {fileInfo.file_name || "Uploaded file"}
          </a>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

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
      case "file_upload":
        return <FileUploadInput value={value} onChange={onChange} />;
      case "rating": {
        const rating = Number(value || 0);
        return (
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                aria-label={`${score} star${score === 1 ? "" : "s"}`}
                onClick={() => onChange(String(score))}
                className="rounded p-1 text-primary transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <Star className={`h-8 w-8 ${score <= rating ? "fill-current" : "fill-transparent"}`} />
              </button>
            ))}
            {rating > 0 && <span className="ml-1 text-sm font-medium text-muted-foreground">{rating} / 5</span>}
          </div>
        );
      }
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
