/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/foreform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FileText,
    Download,
    FileArchive,
    ArrowLeft,
    Search,
    ChevronRight,
    Loader2,
    Settings2,
    CheckCircle2,
    Menu,
    Eye
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateDocxBlob, downloadDocx } from "@/lib/generateDocx";
import { renderAsync } from "docx-preview";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { docxTemplates, getDocxTemplate } from "@/templates";

export default function DocxPreview() {
    const navigate = useNavigate();
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isExportingAll, setIsExportingAll] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("preview");
    const [mobilePreviewPanel, setMobilePreviewPanel] = useState<"studio" | "document">("studio");
    const [isFullPreview, setIsFullPreview] = useState(false);

    // Editable state for the current response
    const [editableResponse, setEditableResponse] = useState<any>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState("alber");

    // Fetch forms
    const { data: forms = [], isLoading: isLoadingForms } = useQuery({
        queryKey: ["forms"],
        queryFn: () => base44.entities.Form.list(),
    });

    // Fetch responses for selected form
    const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
        queryKey: ["responses", selectedFormId],
        queryFn: () => selectedFormId ? base44.entities.FormResponse.filter({ form_id: selectedFormId }) : Promise.resolve([]),
        enabled: !!selectedFormId,
    });

    const selectedForm = forms.find(f => f.id === selectedFormId);
    const selectedResponse = responses.find(r => r.id === selectedResponseId);
    const activeTemplate = getDocxTemplate(selectedTemplateId);
    const selectedFormForDocx = useMemo(() => selectedForm ? {
        ...selectedForm,
        branding: {
            ...(selectedForm.branding || {}),
            docx_template: selectedTemplateId,
        },
    } : null, [selectedForm, selectedTemplateId]);

    // Filtered responses
    const filteredResponses = responses.filter(r =>
        (r.respondent_name || "Anonymous").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.respondent_email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // When a response is selected, initialize editable state
    useEffect(() => {
        if (selectedResponse) {
            setEditableResponse({ ...selectedResponse });
        } else {
            setEditableResponse(null);
            setPreviewBlob(null);
        }
    }, [selectedResponse]);

    useEffect(() => {
        if (selectedForm?.branding?.docx_template) {
            setSelectedTemplateId(selectedForm.branding.docx_template);
        }
    }, [selectedForm]);

    useEffect(() => {
        setMobilePreviewPanel("studio");
    }, [selectedResponseId]);

    // Update preview when editable data changes
    useEffect(() => {
        const updatePreview = async () => {
            if (editableResponse && selectedFormForDocx) {
                setIsRefreshingPreview(true);
                try {
                    const blob = await generateDocxBlob(selectedFormForDocx, editableResponse);
                    setPreviewBlob(blob);
                } catch (error) {
                    console.error("Failed to generate preview:", error);
                } finally {
                    setIsRefreshingPreview(false);
                }
            }
        };

        const timer = setTimeout(updatePreview, 500); // Debounce
        return () => clearTimeout(timer);
    }, [editableResponse, selectedFormForDocx]);

    // Render the docx preview
    useEffect(() => {
        if (previewContainerRef.current && previewBlob) {
            // Clear previous content
            previewContainerRef.current.innerHTML = "";
            renderAsync(previewBlob, previewContainerRef.current, undefined, {
                className: "docx-preview-output",
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false,
                debug: false
            });
        }
    }, [previewBlob]);

    const handleAnswerChange = (index: number, newValue: string) => {
        if (!editableResponse) return;
        const newAnswers = [...editableResponse.answers];
        newAnswers[index] = { ...newAnswers[index], answer: newValue };
        setEditableResponse({ ...editableResponse, answers: newAnswers });
    };

    const handleDownloadAll = async () => {
        if (!selectedForm || responses.length === 0) return;

        setIsExportingAll(true);
        const zip = new JSZip();
        const folderName = `${selectedForm.title.replace(/[^a-zA-Z0-9]/g, "_")}_Responses`;
        const folder = zip.folder(folderName);

        try {
            toast.info(`Preparing ${responses.length} files...`);

            for (const resp of responses) {
                const blob = await generateDocxBlob(selectedFormForDocx, resp);
                const fileName = `${(resp.respondent_name || "anonymous").replace(/\s+/g, "_")}_${resp.id.slice(0, 5)}.docx`;
                folder?.file(fileName, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);
            toast.success("Successfully exported all responses as ZIP");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export files");
        } finally {
            setIsExportingAll(false);
        }
    };

    const handleTemplatePreview = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setActiveTab("preview");
        setMobilePreviewPanel("document");
        setIsFullPreview(true);
    };

    const renderSidebar = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r w-80 max-w-[80vw]">
            <div className="p-4 border-b shrink-0">
                <Label className="text-[10px] font-bold uppercase  text-muted-foreground mb-2 block">Select Survey</Label>
                <select
                    className="w-full bg-transparent dark:bg-slate-800 border rounded px-3 py-2 text-sm outline-none focus:ring-primary"
                    value={selectedFormId || ""}
                    onChange={(e) => {
                        setSelectedFormId(e.target.value);
                        setSelectedResponseId(null);
                    }}
                >
                    <option value="">Choose a form...</option>
                    {forms.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex items-center gap-2 shrink-0">
                    <div className="relative flex-1 bg-transparent">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search respondents..."
                            className="pl-9 h-9 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {!selectedFormId ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                            <FileText className="w-8 h-8 mb-2" />
                            <p className="text-xs">Select a form to see responses</p>
                        </div>
                    ) : isLoadingResponses ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                        </div>
                    ) : filteredResponses.length === 0 ? (
                        <p className="text-center py-10 text-xs text-muted-foreground">No responses found</p>
                    ) : (
                        <div className="space-y-1">
                            {filteredResponses.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedResponseId(r.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded transition-all group ${selectedResponseId === r.id
                                        ? "bg-primary text-primary-foreground shadow shadow-primary/20"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold truncate flex-1">
                                            {r.respondent_name || "Anonymous"}
                                        </span>
                                        <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity ${selectedResponseId === r.id ? "hidden" : ""}`} />
                                    </div>
                                    <p className={`text-[10px] mt-0.5 truncate ${selectedResponseId === r.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                        {r.respondent_email || "No email"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-transparent dark:bg-slate-950">
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b px-4 lg:px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-2 lg:gap-4">
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden rounded-full shrink-0">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-auto border-none">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation</SheetTitle>
                            </SheetHeader>
                            {renderSidebar()}
                        </SheetContent>
                    </Sheet>

                    <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full hidden lg:flex shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="/docx.png" alt="DOCX" className="w-8 h-8 hidden sm:block" />
                        <div>
                            <h1 className="text-base sm:text-lg font-bold line-clamp-1">Word Preview & Export</h1>
                            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Preview, edit and batch download survey reports</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden xl:flex items-center gap-2 rounded-full border bg-white px-2 py-1 shadow-sm">
                        <span className="px-2 text-[10px] font-bold uppercase  text-muted-foreground">DOCX style</span>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="h-8 w-[180px] border-0 bg-transparent text-xs shadow-none focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {docxTemplates.map((template) => (
                                    <SelectItem key={template.id} value={template.id} className="text-xs">
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedFormId && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={responses.length === 0 || isExportingAll}
                            onClick={handleDownloadAll}
                            className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
                        >
                            {isExportingAll ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <FileArchive className="w-4 h-4 sm:mr-2" />}
                            <span className="hidden sm:inline">Download All ({responses.length})</span>
                        </Button>
                    )}
                    {selectedResponse && (
                        <Button size="sm" onClick={() => downloadDocx(selectedFormForDocx, editableResponse)} className="bg-primary gap-1 sm:gap-2">
                            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download Current</span>
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block h-full border-r bg-white dark:bg-slate-900">
                    {renderSidebar()}
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {selectedResponse && editableResponse ? (
                        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden w-full h-full min-h-0">



                            {/* Editor Panel */}
                            <div className={`${activeTab === "edit" ? "flex" : "hidden"} lg:flex w-full lg:w-80 xl:w-96 border-r bg-white dark:bg-slate-900 flex-col p-6 pb-28 lg:pb-6 overflow-y-auto shadow-inner custom-scrollbar shrink-0 min-h-0`}>
                                <div className="flex items-center gap-2 mb-6">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-bold uppercase ">Edit Payload</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs mb-1.5 block text-muted-foreground font-medium">Respondent Name</Label>
                                            <Input
                                                value={editableResponse?.respondent_name || ""}
                                                onChange={(e) => setEditableResponse({ ...editableResponse!, respondent_name: e.target.value })}
                                                className="bg-transparent  dark:bg-slate-800 dark:border-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs mb-1.5 block text-muted-foreground font-medium">Respondent Email</Label>
                                            <Input
                                                value={editableResponse?.respondent_email || ""}
                                                onChange={(e) => setEditableResponse({ ...editableResponse!, respondent_email: e.target.value })}
                                                className="bg-transparent  dark:bg-slate-800 dark:border-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                    <div className="space-y-4">
                                        <Label className="text-[12px] font-semibold text-primary block">Answer Fields</Label>
                                        {editableResponse?.answers?.map((a: any, i: number) => {
                                            const question = selectedForm?.questions?.find((q: any) => q.id === a.question_id || q.label === a.question_label);
                                            const type = question?.type || "short_text";
                                            const options = question?.options || [];

                                            return (
                                                <div key={i} className="space-y-1.5 group">
                                                    <Label className="text-[11px] leading-tight block group-hover:text-primary transition-colors italic">
                                                        {a.question_label}
                                                    </Label>

                                                    {type === "checkbox" ? (
                                                        <div className="space-y-2 pt-1">
                                                            {options.map((opt: string) => {
                                                                const selected = (a.answer || "").split(",").map((s: string) => s.trim());
                                                                const isChecked = selected.includes(opt);
                                                                return (
                                                                    <div key={opt} className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            id={`opt-${i}-${opt}`}
                                                                            checked={isChecked}
                                                                            onCheckedChange={(checked) => {
                                                                                let newSelected = [...selected];
                                                                                if (checked) newSelected.push(opt);
                                                                                else newSelected = newSelected.filter(s => s !== opt);
                                                                                handleAnswerChange(i, newSelected.filter(Boolean).join(", "));
                                                                            }}
                                                                        />
                                                                        <label htmlFor={`opt-${i}-${opt}`} className="text-xs">{opt}</label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : type === "multiple_choice" ? (
                                                        <RadioGroup
                                                            value={a.answer || ""}
                                                            onValueChange={(val) => handleAnswerChange(i, val)}
                                                            className="space-y-1.5 pt-1"
                                                        >
                                                            {options.map((opt: string) => (
                                                                <div key={opt} className="flex items-center gap-2">
                                                                    <RadioGroupItem value={opt} id={`radio-${i}-${opt}`} />
                                                                    <label htmlFor={`radio-${i}-${opt}`} className="text-xs">{opt}</label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    ) : type === "dropdown" ? (
                                                        <Select value={a.answer || ""} onValueChange={(val) => handleAnswerChange(i, val)}>
                                                            <SelectTrigger className="w-full text-xs h-9 bg-transparent rounded">
                                                                <SelectValue placeholder="Select an option" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {options.map((opt: string) => (
                                                                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : type === "date" ? (
                                                        <Input
                                                            type="date"
                                                            value={a.answer || ""}
                                                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                                                            className="bg-transparent dark:bg-slate-800 dark:border-slate-700 h-9 text-xs"
                                                        />
                                                    ) : type === "long_text" ? (
                                                        <Textarea
                                                            className="w-full text-xs p-2.5 rounded bg-transparent dark:bg-slate-800 border dark:border-slate-700 focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[80px]"
                                                            value={a.answer || ""}
                                                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={a.answer || ""}
                                                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                                                            className="bg-transparent dark:bg-slate-800 dark:border-slate-700 h-9 text-xs"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Panel */}
                            <div className={`${activeTab === "preview" ? "flex" : "hidden"} lg:flex flex-1 flex-col dark:bg-slate-900 overflow-hidden p-4 sm:p-6 pb-28 lg:pb-6 relative bg-slate-50 min-h-0`}>
                                <div className="lg:hidden mb-4 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setMobilePreviewPanel("studio")}
                                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${mobilePreviewPanel === "studio" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                                        >
                                            Template Studio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMobilePreviewPanel("document")}
                                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${mobilePreviewPanel === "document" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                                        >
                                            Word Preview
                                        </button>
                                    </div>
                                </div>

                                <div className="grid flex-1 min-h-0 gap-4">
                                    <section className={`${mobilePreviewPanel === "studio" && !isFullPreview ? "flex" : "hidden"} ${isFullPreview ? 'hidden' : 'xl:flex'} min-h-0 flex-col rounded bg-white/95 p-4 shadow-sm`}>
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground">Template Preview Studio</p>
                                                <h2 className="text-sm font-semibold" style={{ color: activeTemplate.text }}>{activeTemplate.previewTitle}</h2>
                                                <p className="text-xs text-muted-foreground">{activeTemplate.previewSubtitle}</p>
                                            </div>
                                            <div className="w-full lg:w-[220px] xl:w-full 2xl:w-[220px]">
                                                <Label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">Switch DOCX template</Label>
                                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {docxTemplates.map((template) => (
                                                            <SelectItem key={template.id} value={template.id} className="text-xs">
                                                                {template.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid flex-1 auto-rows-max gap-3 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                            {docxTemplates.map((template) => {
                                                const PreviewCard = template.Preview;
                                                const active = template.id === selectedTemplateId;
                                                return (
                                                    <div
                                                        key={template.id}
                                                        className={`group relative rounded-2xl border p-3 text-left transition-all ${active ? "border-slate-900 shadow-lg ring-2 ring-offset-2" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                                                        style={active ? { borderColor: template.accent, boxShadow: `0 18px 40px -28px ${template.accent}` } : undefined}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                            className="absolute inset-0 rounded-2xl"
                                                            aria-label={`Select ${template.name} template`}
                                                        />
                                                        <div className="mb-3 flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold" style={{ color: template.text }}>{template.name}</p>
                                                                <p className="mt-1 text-[11px] text-muted-foreground">{template.description}</p>
                                                            </div>
                                                            <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: template.accent }} />
                                                        </div>
                                                        <div className="relative h-52 overflow-hidden rounded-2xl" style={{ backgroundColor: template.surface }}>
                                                            <PreviewCard form={selectedForm || undefined} />
                                                            <div className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-950/45 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleTemplatePreview(template.id);
                                                                    }}
                                                                    className="gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-100"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Preview
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className={`${mobilePreviewPanel === "document" || isFullPreview ? "flex" : "hidden"} ${isFullPreview ? 'xl:flex' : 'xl:hidden'} min-h-0 flex-col bg-white/80 p-3 shadow-sm`}>
                                        <div className={`${isFullPreview ? 'max-w-5xl' : 'max-w-4xl'} mx-auto w-full h-full  text-black overflow-y-auto custom-scrollbar flex flex-col min-h-0 transition-all`}>
                                            <div className="flex-shrink-0 px-8 py-4 border-b flex items-center justify-between bg-transparent select-none">
                                                <div className="flex items-center gap-2">
                                                    {isFullPreview && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsFullPreview(false)}
                                                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition mr-2"
                                                        >
                                                            <ArrowLeft className="w-3.5 h-3.5" />
                                                            Studio
                                                        </button>
                                                    )}
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-green-300" />
                                                        <div className="w-2 h-2 rounded-full bg-yellow-300" />
                                                        <div className="w-2 h-2 rounded-full bg-rose-300" />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400">Word Preview</span>
                                                </div>
                                                {isRefreshingPreview ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                                        <span className="text-[10px] font-bold text-primary animate-pulse italic">syncing changes...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-green-600">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold">Ready to download</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 sm:p-8 xl:p-10 docx-preview-wrapper flex-1">
                                                <div ref={previewContainerRef} className="w-full" />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Overlay styles for docx-preview */}
                                <style>{`
                                    .docx-preview-output {
                                        box-shadow: none !important;
                                        margin: 0 !important;
                                        padding: 0 !important;
                                        width: 100% !important;
                                        border: none !important;
                                        background: white !important;
                                        color: black !important;
                                    }
                                    .docx-preview-output p {
                                        line-height: 1.45 !important;
                                    }
                                    .docx-preview-output table td {
                                        vertical-align: top !important;
                                        padding: 8px 10px !important;
                                    }
                                    .docx-preview-wrapper {
                                        border-radius: 2px;
                                        min-height: 100%;
                                        background-color: white;
                                        overflow-y: auto;
                                        -webkit-overflow-scrolling: touch;
                                        scrollbar-width: thin;
                                        scrollbar-color: rgba(0,0,0,0.1) transparent;
                                    }
                                    .docx-preview-wrapper table {
                                        width: 100% !important;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar {
                                        width: 6px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb {
                                        background: rgba(0,0,0,0.1);
                                        border-radius: 10px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background: rgba(0,0,0,0.2);
                                    }
                                `}</style>
                            </div>

                            {/* Mobile Floating Segmented Control */}
                            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border shadow-2xl rounded-full p-1.5 gap-1.5 z-50 w-[85%] max-w-[300px]">
                                <button
                                    onClick={() => setActiveTab("edit")}
                                    className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full transition-all flex-1 ${activeTab === "edit" ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("preview")}
                                    className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full transition-all flex-1 ${activeTab === "preview" ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border flex items-center justify-center shadow-lg animate-bounce duration-[2000ms]">
                                <FileText className="w-10 h-10 text-primary opacity-50" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">No Response Selected</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    Pick a respondent from the sidebar to view and edit their Word export preview.
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
