import { base44 } from "@/api/foreform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AgentSettings from "./agent_settings";
import { Input } from "@/components/ui/input";
import type { AgentResponse } from "@/lib/ai_agent";
import { getAgent } from "@/lib/ai_agent";
import { useAuth } from "@/lib/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bot,
    CheckCircle2,
    ChevronDown,
    Copy,
    Download,
    File,
    FileText,
    Globe,
    Layers,
    LayoutGrid,
    Lightbulb,
    Loader2,
    LucideChevronsLeft,
    Paperclip,
    Plus,
    Rocket,
    RotateCcw,
    Send,
    Settings,
    Share2,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    Wrench,
    X,
    Zap
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    toolCalls?: { name: string; args: Record<string, any> }[];
    toolResults?: any;
    artifacts?: ChatArtifact[];
    timestamp: Date;
    isStreaming?: boolean;
}

interface ChatArtifact {
    type: "questions" | "sections" | "form_created" | "code";
    title: string;
    data: any;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Tool Name Labels ────────────────────────────────────────────

const TOOL_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    generate_form_questions: { label: "Thinking about questions...", icon: FileText, color: "text-blue-500" },
    generate_form_sections: { label: "Structuring sections...", icon: Layers, color: "text-purple-500" },
    improve_question: { label: "Polishing wording...", icon: Sparkles, color: "text-amber-500" },
    generate_survey_docx_code: { label: "Drafting document...", icon: Download, color: "text-emerald-500" },
    analyze_form: { label: "Analyzing structure...", icon: Zap, color: "text-rose-500" },
    extract_questions_from_text: { label: "Parsing input...", icon: FileText, color: "text-cyan-500" },
};

// ─── Quick Prompt Suggestions ────────────────────────────────────

const QUICK_PROMPTS = [
    { icon: "🎓", text: "Create a student course feedback survey" },
    { icon: "🏥", text: "Generate a patient intake questionnaire" },
];

// ─── Main Component ──────────────────────────────────────────────

export default function FormAgent() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const agent = useRef(getAgent());
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [selectedModel, setSelectedModel] = useState("fast"); // UI label: auto, fast, expert, heavy
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(",")[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // ─── Send Message ────────────────────────────────────────────

    const sendMessage = useCallback(async (text?: string, isRegeneration = false) => {
        const msg = (text || input).trim();
        if ((!msg && selectedFiles.length === 0 && !isRegeneration) || isLoading) return;

        let filesToProcess: File[] = [];

        if (!isRegeneration) {
            setInput("");
            filesToProcess = [...selectedFiles];
            setSelectedFiles([]);

            const userMessage: ChatMessage = {
                id: uid(), role: "user", text: msg || (filesToProcess.length > 0 ? "Analyzed files" : ""), timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);
        } else {
            // Remove the last turn from agent history to allow re-chatting the same prompt
            agent.current.popHistory(2);
        }

        const loadingId = uid();
        setMessages(prev => [...prev, {
            id: loadingId, role: "assistant", text: "", timestamp: new Date(), isStreaming: true,
        }]);
        setIsLoading(true);

        try {
            // Process files
            const processedFiles = await Promise.all(
                filesToProcess.map(async f => ({
                    mimeType: f.type,
                    data: await fileToBase64(f)
                }))
            );

            const response: AgentResponse = await agent.current.chat(msg, {
                files: processedFiles,
                search: isWebSearchEnabled,
                model: selectedModel === "expert" || selectedModel === "heavy" ? "gemini-3-pro-preview" : "gemini-flash-latest"
            });
            const artifacts: ChatArtifact[] = [];
            let questions: any[] = [];
            let sections: any[] = [];

            const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/) ||
                response.text.match(/\[[\s\S]*\]/) ||
                response.text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        if (parsed[0]?.questions) {
                            sections = parsed;
                            artifacts.push({ type: "sections", title: `${sections.length} Sections`, data: sections });
                        } else if (parsed[0]?.label || parsed[0]?.type) {
                            questions = parsed.map(q => ({ ...q, id: q.id || `q_${uid()}`, options: q.options || [] }));
                            artifacts.push({ type: "questions", title: `${questions.length} Questions`, data: questions });
                        }
                    }
                } catch { /* ignore parsing errors */ }
            }

            setMessages(prev => prev.map(m =>
                m.id === loadingId ? {
                    ...m,
                    text: response.text,
                    toolCalls: response.functionCalls,
                    artifacts,
                    isStreaming: false,
                } : m
            ));
        } catch (err: any) {
            const isQuotaError = err.message?.includes("429");
            const isSecurityError = err.message?.includes("403") || err.message?.includes("leaked");

            const quotaMessage = "### 🚀 Quota Reached\nYou've reached the free tier limit for today. \n\nTo continue building without interruption:\n*   **Upgrade to ForeForm Premium** for unlimited AI power.\n*   **Enter your own API Key** in settings to skip our shared limits.\n*   Or wait 24 hours for your free credits to reset.\n\n[Upgrade to Pro](/pricing) &nbsp; | &nbsp; [Settings](/settings)";

            const securityMessage = "### 🔒 Security Alert\nYour Google AI key has been flagged as **leaked** or **revoked** by Google for your safety.\n\n**To continue:**\n1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).\n2.  Create a **new API key**.\n3.  Click the **Settings** icon here and paste your new key.\n\n*Using a leaked key is blocked by Google to protect your account.*";

            let displayMessage = `⚠️ Error: ${err.message || "Something went wrong."}`;
            if (isQuotaError) displayMessage = quotaMessage;
            if (isSecurityError) displayMessage = securityMessage;

            setMessages(prev => prev.map(m =>
                m.id === loadingId ? {
                    ...m,
                    text: displayMessage,
                    isStreaming: false,
                } : m
            ));

            if (isQuotaError) {
                toast.error("Daily quota reached");
            } else if (isSecurityError) {
                toast.error("API Key Security Alert", {
                    description: "Your key is leaked and blocked by Google.",
                });
            } else {
                toast.error("Agent error");
            }
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedFiles, isWebSearchEnabled, selectedModel]);

    const createFormFromQuestions = async (questions: any[], title?: string) => {
        try {
            const sanitized = questions.map(q => ({
                id: q.id || `q_${uid()}`,
                type: q.type || "short_text",
                label: q.label || "Untitled",
                required: !!q.required,
                options: Array.isArray(q.options) ? q.options : [],
            }));

            const form = await base44.entities.Form.create({
                title: title || "AI Generated Form",
                description: "Created by ForeForm AI Agent",
                questions: sanitized as any,
                status: "draft",
                response_count: 0,
            });

            toast.success("Form created!");
            setTimeout(() => navigate(`/forms/${form.id}/edit`), 1000);
        } catch (err: any) {
            toast.error(err.message || "Failed to create form");
        }
    };

    const createFormFromSections = async (sections: any[], title?: string) => {
        try {
            const form = await base44.entities.Form.create({
                title: title || "AI Generated Survey",
                description: "Created by ForeForm AI Agent with sections",
                questions: [] as any,
                status: "draft",
                response_count: 0,
            });

            for (let i = 0; i < sections.length; i++) {
                const s = sections[i];
                await base44.entities.FormSection.create(form.id, {
                    title: s.title || `Section ${i + 1}`,
                    description: s.description || "",
                    order: i,
                    questions: (s.questions || []).map((q: any) => ({
                        id: q.id || `q_${uid()}`,
                        type: q.type || "short_text",
                        label: q.label || "Untitled",
                        required: !!q.required,
                        options: Array.isArray(q.options) ? q.options : [],
                    })),
                });
            }

            toast.success("Survey created!");
            setTimeout(() => navigate(`/forms/${form.id}/edit`), 1000);
        } catch (err: any) {
            toast.error(err.message || "Failed to create survey");
        }
    };

    const clearChat = () => {
        agent.current.clearHistory();
        setMessages([]);
        toast("Chat cleared");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

            {/* Sidebar (Optional/Thin) */}
            <aside className="w-16 border-r border-border/40 flex flex-col items-center py-6 gap-6 z-10 bg-card/30 backdrop-blur-xl">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
                    <LucideChevronsLeft className="w-10 h-10 text-muted-foreground" />
                </Button>

                <div className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-xl text-muted-foreground hover:text-primary transition-colors">
                    <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-5 h-5" />
                </Button>
            </aside>

            {/* Chat Container */}
            <main className="flex-1 flex flex-col relative z-20">
                {/* Header */}
                <header className="h-16 px-8 flex items-center justify-between border-b border-border/30 bg-background/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <h1 className="font-semibold text-lg tracking-tight">ForeForm AI</h1>
                        <Badge variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary">Beta</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-2">
                            <Share2 className="w-4 h-4" /> Share
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-xl text-muted-foreground hover:text-primary transition-colors">
                            <Settings className="w-5 h-5" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <AnimatePresence>
                    {isSettingsOpen && <AgentSettings onClose={() => setIsSettingsOpen(false)} />}
                </AnimatePresence>

                <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    {messages.length === 0 ? (
                        /* ─── Empty State ──────────────────────────────── */
                        <div className="h-full max-w-2xl mx-auto flex flex-col justify-center px-6 py-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold  leading-none tracking-tight">
                                        Hello, <span className="text-primary font-mono">{user?.full_name}</span>.
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-medium max-w-lg italic">
                                        I can help you build beautiful forms, structure surveys, and automate your research workflow.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {QUICK_PROMPTS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(p.text)}
                                            className="group flex flex-col justify-between p-5 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left space-y-3"
                                        >
                                            <span className="text-2xl">{p.icon}</span>
                                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                {p.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        /* ─── Message List ─────────────────────────────── */
                        <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
                            <AnimatePresence mode="popLayout">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                        className={`group flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div className={`flex-1 space-y-4 ${msg.role === "user" ? "max-w-[80%]" : ""}`}>
                                            {msg.role === "user" ? (
                                                <div className="bg-primary/10 text-foreground px-5 py-3 rounded-2xl rounded-tr-sm text-base font-medium inline-block float-right">
                                                    {msg.text}
                                                </div>
                                            ) : (
                                                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                                    {msg.isStreaming ? (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                            <span className="text-sm font-medium animate-pulse">Assistant is thinking...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-base leading-relaxed text-foreground/90 space-y-4">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text.replace(/```json[\s\S]*?```/g, "").trim() || "*Generating...*"}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}

                                                    {/* Tool Progress Indicators */}
                                                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {msg.toolCalls.map((tc, i) => {
                                                                const info = TOOL_LABELS[tc.name] || { label: tc.name, icon: Wrench, color: "text-muted-foreground" };
                                                                const Icon = info.icon;
                                                                return (
                                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/50 text-[11px] font-semibold">
                                                                        <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                                                                        <span className="text-secondary-foreground">{info.label}</span>
                                                                        <CheckCircle2 className="w-3 h-3 text-green-500 ml-1" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Artifacts visualization */}
                                                    {msg.artifacts?.map((artifact, ai) => (
                                                        <motion.div
                                                            key={ai}
                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="mt-6 border border-border/40 rounded overflow-hidden bg-card/80 backdrop-blur-sm  "
                                                        >
                                                            {artifact.type === "questions" && (
                                                                <>
                                                                    <div className="px-5 py-4 bg-primary/5 border-b border-border/40 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 flex items-center justify-center">
                                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-sm font-bold block leading-tight">{artifact.title}</span>
                                                                                <span className="text-[10px] text-muted-foreground font-bold">Draft Template</span>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => createFormFromQuestions(artifact.data)}
                                                                            className="rounded px-4 h-8 text-xs font-bold   gap-2"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5" /> Create Form
                                                                        </Button>
                                                                    </div>
                                                                    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                                                                        {artifact.data.map((q: any, qi: number) => (
                                                                            <div key={qi} className="group/q flex items-start gap-3 p-3 rounded hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                                                <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover/q:bg-primary group-hover/q:text-primary-foreground transition-colors">
                                                                                    {qi + 1}
                                                                                </span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium text-foreground">{q.label}</p>
                                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold uppercase tracking-tight bg-muted-foreground/10 text-muted-foreground border-none">
                                                                                            {q.type?.replace("_", " ")}
                                                                                        </Badge>
                                                                                        {q.required && <span className="text-[9px] font-bold text-rose-500 uppercase">Required</span>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}

                                                            {artifact.type === "sections" && (
                                                                <>
                                                                    <div className="px-5 py-4 bg-primary/5 border-b border-border/40 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                                <Layers className="w-4 h-4 text-purple-500" />
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-sm font-bold block leading-tight">{artifact.title}</span>
                                                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Multi-Phase Survey</span>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            onClick={() => createFormFromSections(artifact.data)}
                                                                            className="rounded-full px-4 h-8 text-xs font-bold border border-primary/20 hover:bg-primary hover:text-white group transition-all"
                                                                        >
                                                                            <Layers className="w-3.5 h-3.5 mr-2 group-hover:rotate-12 transition-transform" /> Build Survey
                                                                        </Button>
                                                                    </div>
                                                                    <div className="p-5 grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto no-scrollbar bg-accent/5">
                                                                        {artifact.data.map((s: any, si: number) => (
                                                                            <div key={si} className="p-4 rounded-xl border border-border/40 bg-card  space-y-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Section {si + 1}</span>
                                                                                    <Badge className="bg-primary/10 text-primary border-none text-[9px]">{s.questions?.length || 0} Qs</Badge>
                                                                                </div>
                                                                                <h4 className="text-sm font-bold text-foreground">{s.title}</h4>
                                                                                {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ))}

                                                    {/* Message Actions */}
                                                    {!msg.isStreaming && (
                                                        <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(msg.text);
                                                                    toast.success("Text copied to clipboard");
                                                                }}
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                onClick={() => toast.success("Feedback submitted")}
                                                            >
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                onClick={() => toast.success("Feedback submitted")}
                                                            >
                                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                onClick={() => {
                                                                    const msgIndex = messages.findIndex(m => m.id === msg.id);
                                                                    const lastUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === "user");
                                                                    if (lastUserMsg) {
                                                                        // Remove the current assistant message from UI
                                                                        setMessages(prev => prev.slice(0, msgIndex));
                                                                        sendMessage(lastUserMsg.text, true);
                                                                    }
                                                                }}
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ─── Floating Input Area ────────────────────────────── */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-background via-background/95 to-transparent z-40">
                    <div className="max-w-3xl mx-auto relative group">
                        {/* Decorative Background for Input */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/20 to-primary/20 rounded opacity-0 group-focus-within:opacity-100 transition-opacity" />

                        <div className="relative flex flex-col gap-2 p-3 bg-card border border-border/80 rounded  focus-within:border-primary/50 transition-all backdrop-blur-2xl">
                            {/* File Previews */}
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-3 pt-2">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-muted/50 border border-border/50 px-3 py-1.5 rounded group/file">
                                            <File className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3 px-3 min-h-[50px]">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden "
                                    multiple
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-full text-muted-foreground hover:bg-muted shrink-0"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                    className={`rounded-full shrink-0 transition-colors ${isWebSearchEnabled ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"
                                        }`}
                                >
                                    <Globe className="w-5 h-5" />
                                </Button>



                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Lets Create something new?"
                                    className="border-none shadow-none focus-visible:ring-0 text-base py-6 bg-transparent placeholder:text-muted-foreground/60 placeholder:font-medium"
                                    disabled={isLoading}
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 gap-2.5 px-4 text-xs font-bold bg-muted/40 text-muted-foreground rounded hover:bg-muted hover:text-foreground transition-all"
                                        >
                                            {selectedModel === "auto" && <Rocket className="w-4 h-4 text-purple-500 fill-current" />}
                                            {selectedModel === "fast" && <Zap className="w-4 h-4 text-amber-500 fill-current" />}
                                            {selectedModel === "expert" && <Lightbulb className="w-4 h-4 text-primary fill-current" />}
                                            {selectedModel === "heavy" && <LayoutGrid className="w-4 h-4 text-rose-500 fill-current" />}
                                            <span className="capitalize">{selectedModel}</span>
                                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        side="top"
                                        sideOffset={12}
                                        className="w-72 p-2 bg-white backdrop-blur-2xl border-border/50 animate-in fade-in slide-in-from-bottom-3 rounded-xl"
                                    >
                                        {[
                                            { id: "auto", name: "Auto", desc: "Chooses Fast or Expert", icon: Rocket, color: "text-purple-500", bg: "bg-purple-500/10" },
                                            { id: "fast", name: "Fast", desc: "Quick responses - 1.5 Flash", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                                            { id: "expert", name: "Expert", desc: "Thinks hard - 1.5 Pro", icon: Lightbulb, color: "text-primary", bg: "bg-primary/10" },
                                            { id: "heavy", name: "Heavy", desc: "Powered by 1.5 Pro", icon: LayoutGrid, color: "text-rose-500", bg: "bg-rose-500/10" }
                                        ].map((m) => (
                                            <DropdownMenuItem
                                                key={m.id}
                                                onClick={() => setSelectedModel(m.id)}
                                                className={`flex items-start gap-4 p-3 rounded cursor-pointer transition-all mb-1 last:mb-0 focus:bg-accent/50 ${selectedModel === m.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                            >
                                                <div className={`mt-0.5 p-2 rounded-lg ${m.bg} ${m.color} shrink-0`}>
                                                    <m.icon className="w-4 h-4 fill-current" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm">{m.name}</span>
                                                        {selectedModel === m.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground font-medium leading-tight mt-1 truncate">{m.desc}</p>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}

                                        <div className="mt-2 pt-2 border-t border-border/40">
                                            <div className="px-3 py-1.5 flex items-center gap-2.5  justify-between text-[10px] font-bold text-muted-foreground/60">
                                                ForeForm Models
                                                <div className="p-1 rounded bg-muted/50">
                                                    <Settings className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        size="icon"
                                        onClick={() => sendMessage()}
                                        disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                                        className={`rounded-full w-12 h-12 transition-all duration-300 ${input.trim() || selectedFiles.length > 0 ? "bg-primary text-white scale-100" : "bg-muted text-muted-foreground scale-95"
                                            }`}
                                    >
                                        {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Send className="w-12 h-12 ml-0.5" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[10px] text-muted-foreground/60 mt-4 font-medium tracking-wide flex items-center justify-center gap-1.5 capitalize">
                            <Bot className="w-3 h-3" /> ForeForm AI can make mistakes. Check important info.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
