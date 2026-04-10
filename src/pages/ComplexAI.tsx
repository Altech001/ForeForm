import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OpenAI from "openai";
import { base44 } from "@/api/foreform";

// Import local components and types
import { Phase, Question, Message, EXAMPLES } from "./complex-ai/types";
import { PromptPhase } from "./complex-ai/PromptPhase";
import { EditorPhase } from "./complex-ai/EditorPhase";

/* ─── AI Client ────────────────────────────────────────────── */
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const client = apiKey
    ? new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true,
          baseURL: "https://api.groq.com/openai/v1",
      })
    : null;

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
        { id: "0", role: "ai", text: "Hi! Tell me what kind of form you need and I'll generate it instantly." },
    ]);
    const [inputVal, setInputVal] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    /* ── AI logic ── */
    async function callAI(prompt: string, refine = "") {
        setIsGen(true);
        setQuestions([]);
        
        if (!client) {
            toast.error("AI features not configured. Please set VITE_GROQ_API_KEY environment variable.");
            setIsGen(false);
            setPhase("editor");
            setQuestions(getSampleQuestions(prompt));
            setCurrentPrompt(prompt);
            return;
        }
        
        try {
            const response = await client.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert form creator. Output ONLY valid JSON with a 'questions' array.
Each question: { id, type, label, required, options }.
Types: short_text | long_text | multiple_choice | checkbox | dropdown | date | email | number.
For multiple_choice/checkbox/dropdown include 3-4 options. Generate 6-10 questions.`,
                    },
                    {
                        role: "user",
                        content: `Form for: "${prompt}". ${refine ? "Additional instruction: " + refine : ""}`,
                    },
                ],
                response_format: { type: "json_object" },
            });

            const text = response.choices[0]?.message?.content || "";
            const parsed = JSON.parse(text);

            if (Array.isArray(parsed.questions)) {
                let acc: Question[] = [];
                for (const q of parsed.questions) {
                    await new Promise((r) => setTimeout(r, 120));
                    if (!q.options) q.options = [];
                    if (q.title && !q.label) q.label = q.title;
                    const finalQ = { ...q, id: String(q.id || uid()) };
                    acc = [...acc, finalQ];
                    setQuestions([...acc]);
                }
                toast.success("Form generated!");
            } else {
                throw new Error("Bad shape");
            }
        } catch {
            toast.error("AI failed — showing sample questions.");
            const samples = getSampleQuestions(prompt);
            for (const q of samples) {
                await new Promise((r) => setTimeout(r, 100));
                setQuestions((prev) => [...prev, q]);
            }
        } finally {
            setIsGen(false);
        }
    }

    async function handleSend() {
        const val = inputVal.trim();
        if (!val || isGenerating) return;

        setCurrentPrompt(val);
        setMessages((m) => [
            ...m,
            { id: uid(), role: "user", text: val },
            { id: uid(), role: "ai", text: "Got it! Generating your form now — switching to the editor…" },
        ]);
        setInputVal("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        await new Promise((r) => setTimeout(r, 700));
        setPhase("editor");
        callAI(val);
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
            />
        );
    }

    return (
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
        />
    );
}