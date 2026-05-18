import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { base44 } from "@/api/foreform";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    BarChart3,
    BookOpen,
    FileText,
    Maximize2,
    Mic,
    Minimize2,
    Navigation,
    RotateCcw,
    Search,
    Send,
    Sparkles,
    Volume2,
    VolumeX,
    Wand2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useNavigate } from "react-router-dom";

type WidgetMessage = {
    role: "user" | "assistant";
    content: string;
};

const HELP_ACTIONS = [
    { label: "Find forms", prompt: "Search through all my forms and show me the most important ones to review.", icon: Search },
    { label: "Analyze forms", prompt: "Analyze my forms and tell me patterns, risks, missing fields, and next actions.", icon: BarChart3 },
    { label: "Teach me", prompt: "Teach me how to use ForeForm step by step with clickable places to go.", icon: BookOpen },
    { label: "Fix grammar", prompt: "Correct the grammar and wording of this text: ", icon: Wand2 },
];

const ROUTE_GUIDES = [
    { label: "Dashboard", path: "/" },
    { label: "AI Builder", path: "/complex-ai" },
    { label: "Agent", path: "/agent" },
    { label: "AI Respondents", path: "/ai-respondents" },
    { label: "Profile", path: "/profile" },
];

function stripHtml(value = "") {
    const el = document.createElement("div");
    el.innerHTML = value;
    return el.textContent || el.innerText || "";
}

function findMatchingForms(forms: any[], query: string) {
    const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
    if (terms.length === 0) return forms.slice(0, 6);

    return forms
        .map((form) => {
            const questions = (form.questions || []).map((q: any) => q.label).join(" ");
            const haystack = `${form.title || ""} ${stripHtml(form.description || "")} ${questions}`.toLowerCase();
            const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
            return { form, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.form)
        .slice(0, 8);
}



export default function ForeFormAIWidget() {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isChatStarted, setIsChatStarted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<WidgetMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [readAloud, setReadAloud] = useState(false);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: forms = [] } = useQuery({
        queryKey: ["forms", "aitipsy"],
        queryFn: () => base44.entities.Form.list(),
        enabled: isAuthenticated,
        staleTime: 60000,
    });

    const excludedPatterns = ["/login", "/signup", "/agent", "/complex-ai", "/bookmark-tasks", "/bookmark-documents", "/connectors"];
    const isExcludedPage = excludedPatterns.some((pattern) => {
        const patternParts = pattern.split("/").filter(Boolean);
        const pathParts = location.pathname.split("/").filter(Boolean);
        if (patternParts.length !== pathParts.length) return false;
        return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
    });

    const suggestedForms = useMemo(() => findMatchingForms(forms, inputText || "published active response").slice(0, 3), [forms, inputText]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    if (!isAuthenticated || !user || isExcludedPage) return null;

    const speak = (text: string) => {
        if (!readAloud || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`>-]/g, ""));
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Speech to text is not available in this browser yet. You can still type, and I can correct grammar or rewrite it." }]);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join("");
            setInputText(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const handleNavigate = (path: string) => {
        setIsChatStarted(false);
        navigate(path);
    };

    const handleSend = async (overridePrompt?: string) => {
        const prompt = (overridePrompt ?? inputText).trim();
        if (!prompt || isLoading) return;

        setIsChatStarted(true);
        setMessages((prev) => [...prev, { role: "user", content: prompt }]);
        setInputText("");
        setIsLoading(true);

        try {
            // Backend now handles all context (forms, responses, analytics) from the DB
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Current route: ${location.pathname}\n\n${prompt}`,
            });

            const content = typeof result === "string" ? result : result?.text || "I could not produce a response.";
            setMessages((prev) => [...prev, { role: "assistant", content }]);
            speak(content);
        } catch (error: any) {
            const fallback = `I could not reach Maxxie right now. You can still use these shortcuts:\n\n- Open **Dashboard** to find forms.\n- Open **AI Respondents** to generate synthetic responses.\n- Open **AI Builder** to create a form from a prompt.\n\nError: ${error?.message || "Unknown error"}`;
            setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRestart = () => {
        window.speechSynthesis?.cancel();
        setMessages([]);
        setIsChatStarted(false);
        setIsExpanded(false);
        setInputText("");
        setIsLoading(false);
    };

    const inputAreaNode = (
        <div className={`rounded border border-primary/30 bg-white p-2 shadow-sm ${isChatStarted ? "" : "w-[340px]"}`}>
            <div className="flex items-end gap-2">
                <Button type="button" variant="ghost" size="icon" className={isListening ? "text-primary" : "text-muted-foreground"} onClick={isListening ? stopListening : startListening} title="Speech to text">
                    <Mic className="h-4 w-4" />
                </Button>
                <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Maxxie AI"
                    className="min-h-10 flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
                    rows={1}
                />
                <Button type="button" size="icon" disabled={!inputText.trim() || isLoading} onClick={() => handleSend()} title="Send">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans sm:bottom-6 sm:right-6">
            <AnimatePresence mode="wait">
                {!isChatStarted ? (
                    <motion.div key="launcher" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <div className="hidden rounded shadow-xl sm:block">{inputAreaNode}</div>
                        <Button onClick={() => setIsChatStarted(true)} className="h-14 w-14 rounded-full shadow-2xl sm:hidden" size="icon">
                            <img src='/icons/ai.svg' alt="AI" className="h-10 w-10 object-contain invert saturate-200" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, width: isExpanded ? 520 : 400, height: isExpanded ? 720 : 590 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="flex max-h-[86dvh] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded border border-border bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center">
                                    <img src='/icons/ai.svg' alt="AI" className="h-10 w-10 object-contain" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Maxxie</p>
                                    <p className="text-[11px] text-muted-foreground">ForeForm AI</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReadAloud((value) => !value)} title="Read answers aloud">
                                    {readAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded((value) => !value)}>
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRestart}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatStarted(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="border-b border-border/60 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                                {HELP_ACTIONS.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <Button key={action.label} variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleSend(action.prompt)}>
                                            <Icon className="h-3.5 w-3.5" />
                                            {action.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {ROUTE_GUIDES.map((route) => (
                                    <Button key={route.path} variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={() => handleNavigate(route.path)}>
                                        <Navigation className="h-3 w-3" />
                                        {route.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4">
                            {messages.length === 0 && (
                                <div className="rounded border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">What I can do</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        <li>Search and summarize forms in your workspace.</li>
                                        <li>Analyze question quality, missing fields, response patterns, and next actions.</li>
                                        <li>Guide you through ForeForm pages with quick navigation.</li>
                                        <li>Listen to speech, clean grammar, and read answers aloud.</li>
                                    </ul>
                                </div>
                            )}

                            {suggestedForms.length > 0 && messages.length === 0 && (
                                <div className="rounded border border-border bg-white p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent form shortcuts</p>
                                    <div className="space-y-2">
                                        {suggestedForms.map((form: any) => (
                                            <button key={form.id} onClick={() => handleNavigate(`/forms/${form.id}/edit`)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-muted">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="min-w-0 flex-1 truncate text-sm font-medium">{form.title}</span>
                                                <span className="text-xs text-muted-foreground">{form.response_count || 0} responses</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[88%] rounded px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-white text-foreground"}`}>
                                        {message.role === "assistant" ? (
                                            <div className="prose prose-sm max-w-none prose-a:text-primary prose-ul:my-2 prose-ol:my-2">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 rounded border border-border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
                                        <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                                        Maxxie is thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-border bg-white p-3">{inputAreaNode}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
