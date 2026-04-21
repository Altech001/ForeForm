import React, { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, Table, Sparkles, CheckCircle2, AlertCircle, LucideWholeWord, ArrowLeft, ArrowRight, X } from "lucide-react";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { quickPrompt } from "@/lib/ai_agent";

function generateId() {
    return "q_" + Math.random().toString(36).substring(2, 9);
}

interface ImportPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (questions: any[]) => void;
}

export default function ImportPanel({ open, onOpenChange, onImport }: ImportPanelProps) {
    const [tab, setTab] = useState("ai");
    const [loading, setLoading] = useState(false);
    const [pastedText, setPastedText] = useState("");
    const [preview, setPreview] = useState<any[] | null>(null);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const parseWithAI = async (text: string, files?: { mimeType: string, data: string }[]) => {
        setLoading(true);
        setError("");
        setPreview(null);
        try {
            const basePrompt = `You are a research form builder assistant. Extract questions from the following text/document content and convert them into structured form questions.

For each question, determine the most appropriate type:
- short_text: for short one-line answers
- long_text: for paragraph answers
- multiple_choice: for single-select from options
- checkbox: for multi-select from options
- dropdown: for dropdown selection
- date: for date inputs
- number: for numeric inputs
- email: for email inputs

Return ONLY valid JSON matching this schema: { "questions": [ { "label": "question text", "type": "short_text", "required": true, "options": [] } ] }. No extra text, reasoning, or markdown blocks.`;

            const prompt = text
                ? `${basePrompt}\n\nContent to process:\n---\n${text}\n---`
                : basePrompt;

            const resultText = await quickPrompt(prompt, { temperature: 0.2, files });

            const jsonMatch = resultText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");

            let parsedData = JSON.parse(jsonMatch[0]);

            // If parsedData is an array instead of { questions: [] }, normalize it
            if (Array.isArray(parsedData)) {
                parsedData = { questions: parsedData };
            }

            const questions = (parsedData.questions || []).map((q: any) => ({ ...q, id: generateId(), options: q.options || [] }));

            if (!questions.length) {
                setError("No questions found. Try a different input.");
                return;
            }
            setPreview(questions);
        } catch (err) {
            setError("Failed to process content with AI. Please try again.");
            toast.error("AI processing failed");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setPreview(null);

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(",")[1];
                    let mimeType = file.type;
                    if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                    if (file.name.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

                    await parseWithAI("", [{ mimeType: mimeType || "application/octet-stream", data: base64Data }]);
                } catch (err) {
                    setError("File upload or extraction failed.");
                }
            };
            reader.onerror = () => {
                setError("Failed to read file.");
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError("File upload or extraction failed.");
        }
    };

    const handlePasteImport = () => {
        if (!pastedText.trim()) {
            setError("Please paste some content first.");
            return;
        }
        parseWithAI(pastedText);
    };

    const confirmImport = () => {
        if (!preview) return;
        onImport(preview);
        toast.success(`Imported ${preview.length} questions`);
        setPreview(null);
        setPastedText("");
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md md:max-w-lg w-full h-full flex flex-col p-0 border-l border-border/50">
                <SheetHeader className="p-6 pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-black ">Import Questions</SheetTitle>
                    </div>
                    <SheetDescription className="text-sm">
                        Choose your preferred method to quickly generate form questions.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0 mt-2">
                    {!preview ? (
                        <div className="flex-1 flex flex-col overflow-hidden px-6 min-h-0">
                            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0 h-full">
                                <TabsList className="w-full h-11 bg-muted/50 p-1 rounded transition-all shrink-0">
                                    <TabsTrigger value="ai" className="flex-1 gap-2 rounded data-[state=active]:bg-card data-[state=active]:shadow-sm"><Sparkles className="w-3.5 h-3.5" /> AI Upload</TabsTrigger>
                                    <TabsTrigger value="paste" className="flex-1 gap-2 rounded data-[state=active]:bg-card data-[state=active]:shadow-sm"><FileText className="w-3.5 h-3.5" /> Paste</TabsTrigger>
                                </TabsList>

                                <div className="flex-1 py-4 overflow-y-auto no-scrollbar min-h-fit">
                                    <TabsContent value="ai" className="m-0 space-y-4 no-scrollbar outline-none">
                                        <div
                                            onClick={() => fileRef.current?.click()}
                                            className="group relative border-2 border-dashed border-border rounded p-8 sm:p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                                        >
                                            <div className="w-16 h-16 rounded-full  flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-8 h-8 text-primary/60" />
                                            </div>
                                            <p className="font-bold text-lg mb-1">Click to browse</p>
                                            <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">Upload PDF, Word, or Excel. AI will extract and format questions.</p>
                                            <input ref={fileRef} type="file" accept=".pdf,.docx,.xlsx,.txt" className="hidden" onChange={handleFileUpload} />
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded border border-border/50">
                                            <h4 className="text-xs font-bold  mb-2 flex items-center gap-2">
                                                Supported Formats
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {['PDF', 'DOCX', 'XLSX', 'Plain Text'].map(f => (
                                                    <Badge key={f} variant="secondary" className="bg-background/80 font-medium text-[10px]">{f}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="paste" className="m-0 space-y-4 flex flex-col h-fit min-h-[380px]">
                                        <div className="grid gap-1 flex-1">
                                            <Label className="text-sm font-bold text-muted-foreground">Paste Content</Label>
                                            <Textarea
                                                value={pastedText}
                                                onChange={(e) => setPastedText(e.target.value)}
                                                placeholder="Paste your questionnaire content here. AI will detect questions and types..."
                                                className="flex-1 min-h-[200px] resize-none focus:ring-1 transition-all"
                                            />
                                        </div>
                                        <Button onClick={handlePasteImport} disabled={loading} className="w-full h-11 shadow-none font-bold transition-all hover:scale-[1.01] active:scale-[0.99] gap-2">
                                            <Sparkles className="w-4 h-4" /> {loading ? "Processing..." : "Generate AI Questions"}
                                        </Button>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">Ready to Import</h4>
                                        <p className="text-[11px] text-muted-foreground">{preview.length} questions detected</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="h-8 gap-1.5 text-xs font-medium">
                                    <ArrowLeft className="w-3 h-3" /> Re-upload
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 px-6 py-4">
                                <div className="space-y-3 pb-8">
                                    {preview.map((q, i) => (
                                        <div key={i} className="group relative flex items-start gap-3 p-3.5 bg-card border border-border/50 rounded hover:border-primary/30 hover:bg-primary/[0.01] transition-all duration-200">
                                            <div className="mt-0.5 text-[10px] font-bold text-muted-foreground/40 bg-muted rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground/90 break-words leading-snug">{q.label}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-bold uppercase  bg-muted text-muted-foreground group-hover:bg-background transition-colors">{q.type.replace('_', ' ')}</Badge>
                                                    {q.required && <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-bold uppercase  bg-destructive/5 text-destructive border-destructive/10">Required</Badge>}
                                                    {q.options?.length > 0 && (
                                                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                                            <Table className="w-3 h-3" /> {q.options.length} options
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border/50 bg-card/50">
                    {loading && (
                        <div className="flex items-center gap-3 text-sm font-medium animate-pulse mb-4 bg-primary/5 p-3 rounded border border-primary/10">
                            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="text-primary truncate">AI is analyzing content...</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-4 bg-destructive/5 p-3 rounded border border-destructive/10">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {preview ? (
                            <Button className="w-full h-12 shadow-xl shadow-primary/10 text-base font-black gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={confirmImport}>
                                <CheckCircle2 className="w-5 h-5" /> Import {preview.length} Questions
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full h-11 text-sm font-bold" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Label({ children, className, ...props }: any) {
    return <label className={className} {...props}>{children}</label>;
}
