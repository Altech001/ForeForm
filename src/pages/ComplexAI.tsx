import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { base44 } from "@/api/foreform";

// Import local components and types
import { Phase, Question, Message, EXAMPLES } from "./complex-ai/types";
import { PromptPhase } from "./complex-ai/PromptPhase";
import { EditorPhase } from "./complex-ai/EditorPhase";
import { useAgentSettings } from "@/hooks/useAgentSettings";
import { ForeFormAgent } from "@/lib/ai_agent";

/* ─── AI Client ────────────────────────────────────────────── */
// We now use the backend InvokeLLM bridge

/* ─── Helpers ────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 8);

function getSampleQuestions(prompt: string): Question[] {
    return [
        { id: "q1", type: "short_text", label: "Full name", required: true, options: [] },
        { id: "q2", type: "email", label: "Email address", required: true, options: [] },
        { id: "q3", type: "multiple_choice", label: `How did you hear about ${prompt.slice(0, 20)}?`, required: false, options: ["Social media", "Referral", "Search engine", "Advertisement"] },
        { id: "q4", type: "long_text", label: "Please describe your experience", required: false, options: [] },
        { id: "q5", type: "number", label: "Rate us from 1 to 10", required: true, options: [] },
        { id: "q6", type: "date", label: "Preferred date", required: false, options: [] },
    ];
}

export default function ComplexAI() {
    const navigate = useNavigate();

    /* Shared state */
    const [phase, setPhase] = useState<Phase>("prompt");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isGenerating, setIsGen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [isDark, setIsDark] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    /* Prompt-phase state */
    const [messages, setMessages] = useState<Message[]>([
        { id: "0", role: "ai", text: "Hi! Tell me what kind of form you need." },
    ]);
    const [inputVal, setInputVal] = useState("");
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { settings } = useAgentSettings();
    const agentRef = useRef(new ForeFormAgent());

    const fileToBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
        });
    };

    /* Editor-phase state */
    const [refineVal, setRefineVal] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* Auto-scroll chat */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* Auto-resize textarea */
    const autoResize = (el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
    };

    const addQuestion = () => {
        const newQ: Question = {
            id: uid(),
            type: "short_text",
            label: "",
            required: false,
            options: [],
        };
        setQuestions((prev) => [...prev, newQ]);
    };

    async function handleAIResponseData(questionsList: any[]) {
        setQuestions([]);
        let acc: Question[] = [];
        for (const q of questionsList) {
            await new Promise((r) => setTimeout(r, 120));
            if (!q.options) q.options = [];
            if (q.title && !q.label) q.label = q.title;
            const finalQ = { ...q, id: String(q.id || uid()) };
            acc = [...acc, finalQ];
            setQuestions([...acc]);
        }
        toast.success("Form generated!");
    }

    async function callAI(prompt: string, refine = "") {
        setIsGen(true);
        try {
            const p = refine ? `Refine the form:\n${prompt}\n\nUser request: ${refine}\nOutput valid JSON array of questions.` : prompt;
            const data = await agentRef.current.chat(p, {
                model: settings.model
            });

            let qs: any[] = [];
            const jsonMatch = data.text.match(/```json\s*([\s\S]*?)```/) ||
                data.text.match(/\[[\s\S]*\]/) ||
                data.text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    if (Array.isArray(parsed)) qs = parsed[0]?.questions || (parsed[0]?.label ? parsed : []);
                } catch { }
            }

            if (qs.length) {
                await handleAIResponseData(qs);
            } else {
                throw new Error("No questions returned for refinement.");
            }
        } catch (e: any) {
            console.error("AI Error:", e);
            toast.error("AI failed — showing sample questions.");
            await handleAIResponseData(getSampleQuestions(prompt));
        } finally {
            setIsGen(false);
        }
    }

    async function handleSend(overridePrompt?: any) {
        const val = (typeof overridePrompt === "string" ? overridePrompt : inputVal).trim();
        if (!val || isGenerating) return;

        setIsGen(true);
        const userMsg: Message = { id: uid(), role: "user", text: val };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setInputVal("");

        try {
            let filesOpt = undefined;
            if (attachedFile) {
                const b64 = await fileToBase64(attachedFile);
                filesOpt = [{ mimeType: attachedFile.type, data: b64 }];
            }

            const response = await agentRef.current.chat(val, {
                files: filesOpt,
                model: settings.model
            });

            let qList: any[] = [];
            const jsonMatch = response.text.match(/```json\s*([\s\S]*?)```/) ||
                response.text.match(/\[[\s\S]*\]/) ||
                response.text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        qList = parsed[0]?.questions || (parsed[0]?.label ? parsed : []);
                    }
                } catch { }
            }

            if (!qList.length) {
                // Interactive conversation fallback
                setMessages(prev => [...prev, { id: uid(), role: "ai", text: response.text.replace(/```json[\s\S]*?```/g, "").trim() || "Can you provide more details?" }]);
            } else {
                // Form Generated
                if (!currentPrompt) setCurrentPrompt(val);

                const scrapedStr = qList.map((q: any) => `- ${q.label || q.title} (${q.type})`).join("\n");
                const cleanText = response.text.replace(/```json[\s\S]*?```/g, "").trim();
                const aiMessageResponseText = `${cleanText ? cleanText + "\n\n" : ""}I've drafted the form. Here are the questions I scraped:\n${scrapedStr}\n\nSwitching to Editor...`;

                setMessages(prev => [...prev, { id: uid(), role: "ai", text: aiMessageResponseText }]);

                // wait to show indicator
                setTimeout(() => {
                    handleAIResponseData(qList);
                    setPhase("editor");
                    setAttachedFile(null);
                }, 3500);
            }
        } catch (e: any) {
            console.error("AI Error:", e);
            toast.error("AI failed. Creating sample questions...");
            const samples = getSampleQuestions(val);
            setMessages(prev => [...prev, { id: uid(), role: "ai", text: "I encountered an error connecting to the model API. I've formulated a sample template instead. Switching to Editor..." }]);
            setTimeout(() => {
                handleAIResponseData(samples);
                setPhase("editor");
            }, 3000);
        } finally {
            setIsGen(false);
        }
    }

    async function handleRefine() {
        const val = refineVal.trim();
        if (!val || isGenerating) return;
        setRefineVal("");
        toast("Refining questions…");
        await callAI(currentPrompt, val);
    }

    async function handlePublish() {
        if (questions.length === 0) { toast.error("No questions to publish."); return; }
        const sanitized = questions.map((q) => ({
            id: q.id,
            type: q.type,
            label: q.label || "Untitled",
            required: !!q.required,
            options: Array.isArray(q.options) ? q.options : [],
            condition: q.condition || null,
        }));
        try {
            const form = await base44.entities.Form.create({
                title: currentPrompt.slice(0, 50) || "AI Generated Form",
                description: "Generated by FormAI",
                questions: sanitized as any,
                status: "draft",
                response_count: 0,
            });
            toast.success("Transferred to editor!");
            navigate(`/forms/${form.id}/edit`);
        } catch (e: any) {
            toast.error(e.message || "Failed to publish.");
        }
    }

    /* ── Question state handlers ── */
    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = [...questions];
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setQuestions(items);
    };

    const updateQ = (i: number, q: Question) => setQuestions((p) => p.map((x, j) => j === i ? q : x));
    const deleteQ = (i: number) => setQuestions((p) => p.filter((_, j) => j !== i));
    const addOpt = (q: Question, i: number) => updateQ(i, { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] });
    const updateOpt = (q: Question, i: number, oi: number, v: string) => { const o = [...(q.options || [])]; o[oi] = v; updateQ(i, { ...q, options: o }); };
    const removeOpt = (q: Question, i: number, oi: number) => updateQ(i, { ...q, options: (q.options || []).filter((_, j) => j !== oi) });

    const reqCount = questions.filter((q) => q.required).length;
    const typeCounts = questions.reduce<Record<string, number>>((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});

    /* ── Render ── */
    if (phase === "prompt") {
        return (
            <>
                <SEO title="AI Assistant" path="/complex-ai" />
                <PromptPhase
                    isDark={isDark}
                    navigate={navigate}
                    messages={messages}
                    inputVal={inputVal}
                    setInputVal={setInputVal}
                    isGenerating={isGenerating}
                    handleSend={handleSend}
                    messagesEndRef={messagesEndRef}
                    textareaRef={textareaRef}
                    autoResize={autoResize}
                    toggleTheme={() => setIsDark(!isDark)}
                    attachedFile={attachedFile}
                    setAttachedFile={setAttachedFile}
                />
            </>
        );
    }

    return (
        <>
            <SEO title="AI Assistant" path="/complex-ai" />
            <EditorPhase
                isDark={isDark}
                setPhase={setPhase}
                setQuestions={setQuestions}
                currentPrompt={currentPrompt}
                setCurrentPrompt={setCurrentPrompt}
                showPreview={showPreview}
                setShowPreview={setShowPreview}
                handlePublish={handlePublish}
                refineVal={refineVal}
                setRefineVal={setRefineVal}
                isGenerating={isGenerating}
                handleRefine={handleRefine}
                file={file}
                setFile={setFile}
                fileInputRef={fileInputRef}
                questions={questions}
                reqCount={reqCount}
                typeCounts={typeCounts}
                onDragEnd={onDragEnd}
                updateQ={updateQ}
                deleteQ={deleteQ}
                addOpt={addOpt}
                updateOpt={updateOpt}
                removeOpt={removeOpt}
                addQuestion={addQuestion}
                toggleTheme={() => setIsDark(!isDark)}
            />
        </>
    );
}
