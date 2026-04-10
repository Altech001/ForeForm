import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, Table, Sparkles, CheckCircle2, AlertCircle, LucideWholeWord } from "lucide-react";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";

function generateId() {
  return "q_" + Math.random().toString(36).substring(2, 9);
}

export default function ImportQuestionsDialog({ open, onClose, onImport }) {
  const [tab, setTab] = useState("ai");
  const [loading, setLoading] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFromAI = async (text) => {
    setLoading(true);
    setError("");
    setPreview(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a research form builder assistant. Extract questions from the following text/document content and convert them into structured form questions.

For each question, determine the most appropriate type:
- short_text: for short one-line answers
- long_text: for paragraph answers
- multiple_choice: for single-select from options
- checkbox: for multi-select from options
- dropdown: for dropdown selection
- date: for date inputs
- number: for numeric inputs
- email: for email inputs

Content to process:
---
${text}
---

Return only valid JSON matching this schema, no extra text.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                type: { type: "string" },
                required: { type: "boolean" },
                options: { type: "array", items: { type: "string" } }
              },
              required: ["label", "type"]
            }
          }
        },
        required: ["questions"]
      }
    });
    setLoading(false);
    let parsedData = typeof result === "string" ? JSON.parse(result) : result;
    if (typeof parsedData === "string") parsedData = JSON.parse(parsedData);
    const questions = (parsedData.questions || []).map(q => ({ ...q, id: generateId(), options: q.options || [] }));
    if (!questions.length) { setError("No questions found. Try a different input."); return; }
    setPreview(questions);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setPreview(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          raw_text: { type: "string", description: "All text content from the file" }
        }
      }
    });

    const text = extracted?.output?.raw_text || JSON.stringify(extracted?.output || "");
    if (!text) { setLoading(false); setError("Could not extract text from file."); return; }
    await parseFromAI(text);
  };

  const handlePasteImport = () => {
    if (!pastedText.trim()) { setError("Please paste some content first."); return; }
    parseFromAI(pastedText);
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      // Expect CSV: question,type,required,option1,option2,...
      const questions = lines.map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        const label = cols[0];
        const type = cols[1] || "short_text";
        const required = cols[2]?.toLowerCase() === "true";
        const options = cols.slice(3).filter(Boolean);
        return { id: generateId(), label, type, required, options };
      });
      setPreview(questions);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onImport(preview);
    toast.success(`Imported ${preview.length} questions`);
    setPreview(null);
    setPastedText("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Questions
          </DialogTitle>
          <DialogDescription>Upload a PDF, paste text, or use a CSV template to auto-generate questions.</DialogDescription>
        </DialogHeader>

        {!preview ? (
          <Tabs value={tab} onValueChange={setTab} className="rounded">
            <TabsList className="w-full rounded">
              <TabsTrigger value="ai" className="flex-1 gap-1.5 rounded"><Sparkles className="w-3.5 h-3.5" /> AI from PDF/Doc</TabsTrigger>
              <TabsTrigger value="paste" className="flex-1 gap-1.5 rounded"><FileText className="w-3.5 h-3.5" /> Paste Text</TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 gap-1.5 rounded"><Table className="w-3.5 h-3.5" /> CSV Template</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4 pt-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all"
              >
                <LucideWholeWord className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Click to upload PDF, DOCX, or XLSX</p>
                <p className="text-sm text-muted-foreground mt-1">AI will extract and format questions automatically</p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.xlsx,.csv,.txt" className="hidden" onChange={handleFileUpload} />
            </TabsContent>

            <TabsContent value="paste" className="space-y-4 pt-4">
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your questionnaire, interview guide, or survey content here…"
                rows={8}
              />
              <Button onClick={handlePasteImport} disabled={loading} className="w-full gap-2">
                <Sparkles className="w-4 h-4" /> {loading ? "Extracting questions…" : "Generate Questions with AI"}
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-xl w-full p-4 text-sm space-y-2 overflow-hidden">
                <p className="font-semibold">CSV Template Format:</p>
                <code className="block text-xs bg-background border border-border rounded p-3 font-mono whitespace-pre-wrap break-words">{`question,type,required,option1,option2
"What is your age?",number,true
"Select your gender",multiple_choice,true,Male,Female,Non-binary,Prefer not to say
"Describe your experience",long_text,false
"Preferred contact method",dropdown,true,Email,Phone,WhatsApp`}</code>
                <p className="text-muted-foreground text-xs">Types: short_text · long_text · multiple_choice · checkbox · dropdown · date · number · email</p>
              </div>
              <div
                onClick={() => document.getElementById("csv-upload").click()}
                className="border-2 border-dashed border-border rounded p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all"
              >
                <Table className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">Upload CSV file</p>
                <p className="text-sm text-muted-foreground mt-1">CSV Tool will extract and format questions automatically</p>
              </div>
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4" />
              {preview.length} questions ready to import
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {preview.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{q.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground bg-border/80 px-1.5 py-0.5 rounded">{q.type}</span>
                      {q.required && <span className="text-xs text-destructive">required</span>}
                      {q.options?.length > 0 && <span className="text-xs text-muted-foreground">{q.options.length} options</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>Back</Button>
              <Button className="flex-1 gap-2" onClick={confirmImport}><CheckCircle2 className="w-4 h-4" /> Import All</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
            <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
            Processing with AI…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}