import React from "react";
import { toast } from "sonner";
import {
    ArrowLeft,
    Upload,
    GripVertical,
    Trash2,
    Wand2,
    X,
    FileText,
    Plus,
    RotateCcw,
    Zap,
    Eye,
    Download as DownloadIcon,
    LayoutDashboard,
    ChevronDown,
    ChevronUp,
    Sun,
    Moon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Phase, Question, QUESTION_TYPES, TYPE_MAP, HAS_OPTS } from "./types";
import ConditionalLogicEditor from "@/components/forms/ConditionalLogicEditor";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

interface EditorPhaseProps {
    isDark: boolean;
    setPhase: (phase: Phase) => void;
    setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    currentPrompt: string;
    setCurrentPrompt: React.Dispatch<React.SetStateAction<string>>;
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;
    handlePublish: () => void;
    refineVal: string;
    setRefineVal: (val: string) => void;
    isGenerating: boolean;
    handleRefine: () => void;
    file: File | null;
    setFile: (file: File | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    questions: Question[];
    reqCount: number;
    typeCounts: Record<string, number>;
    onDragEnd: (result: any) => void;
    updateQ: (i: number, q: Question) => void;
    deleteQ: (i: number) => void;
    addOpt: (q: Question, i: number) => void;
    updateOpt: (q: Question, i: number, oi: number, v: string) => void;
    removeOpt: (q: Question, i: number, oi: number) => void;
    addQuestion: () => void;
    toggleTheme: () => void;
}

export const EditorPhase: React.FC<EditorPhaseProps> = (props) => {
    const {
        isDark,
        setPhase,
        setQuestions,
        currentPrompt,
        setCurrentPrompt,
        showPreview,
        setShowPreview,
        handlePublish,
        questions,
        isGenerating,
        toggleTheme,
    } = props;

    const [showAllTypes, setShowAllTypes] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const typeEntries = Object.entries(props.typeCounts);
    const displayedTypes = showAllTypes ? typeEntries : typeEntries.slice(0, 2);
    const hasMoreTypes = typeEntries.length > 2;

    const settingsProps = {
        ...props,
        showAllTypes,
        setShowAllTypes,
        typeEntries,
        displayedTypes,
        hasMoreTypes,
    };

    return (
        <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#0a0a0f] text-[#f0f0f5]" : "bg-[#f8fafc] text-slate-900"}`}>

            {/* ── Header ── */}
            <header className={`sticky top-0 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 border-b ${isDark ? "border-white/[0.07] bg-[#13131a]" : "border-slate-200 bg-white shadow-sm"
                }`}>
                <button
                    onClick={() => { setPhase("prompt"); setQuestions([]); }}
                    className={`flex-shrink-0 flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded border transition-all text-xs font-medium ${isDark ? "border-white/[0.09] text-[#8888a0] hover:text-[#f0f0f5] hover:bg-[#1c1c26]" : "border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                >
                    <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Back</span>
                </button>

                <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <DrawerTrigger asChild>
                        <button
                            className={`lg:hidden flex items-center justify-center w-8 h-8 rounded transition-all ${isDark ? "border-white/10 text-white/70" : " text-slate-600"
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className={isDark ? "bg-[#13131a] border-white/10" : "bg-white border-slate-200"}>
                        <div className="mx-auto w-full max-w-sm">
                            <DrawerHeader>
                                <DrawerTitle className={isDark ? "text-white" : "text-slate-900"}>Form Settings</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-5 pb-10 max-h-[70vh] overflow-y-auto">
                                <SettingsContent {...settingsProps} />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="flex flex-col overflow-hidden w-full">
                        <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-violet-400/70" : "text-violet-600/70"}`}>Drafting</span>
                        <input
                            value={currentPrompt}
                            onChange={(e) => setCurrentPrompt(e.target.value)}
                            className={`text-xs sm:text-sm font-semibold truncate bg-transparent border-none outline-none focus-visible:ring-0 p-0 w-full ${isDark ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-300"
                                }`}
                            placeholder="Untitled Form"
                        />
                    </div>
                </div>

                <div className="flex-shrink-0 ml-auto flex items-center gap-2 sm:gap-3">
                    {/* Mobile: Single Toggle Button */}
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`sm:hidden flex flex-shrink-0 items-center justify-center w-8 h-8 rounded transition-all ${isDark ? "border-white/10 text-white/70 bg-white/5" : " text-slate-600 bg-transparent"
                            }`}
                        title={showPreview ? "Return to Editor" : "Preview Form"}
                    >
                        {showPreview ? <LayoutDashboard className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Desktop: Segmented Control */}
                    <div className={`hidden sm:flex items-center rounded-full border p-1 ${isDark ? "bg-[#0a0a0f] border-white/10" : "bg-transparent border-slate-200"}`}>
                        <button
                            onClick={() => setShowPreview(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!showPreview
                                ? isDark ? "bg-violet-600 text-white shadow" : "bg-white text-slate-900 shadow shadow-slate-200 border border-slate-200"
                                : isDark ? "text-[#8888a0] hover:text-white" : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" /> Editor
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showPreview
                                ? isDark ? "bg-violet-600 text-white shadow" : "bg-white text-slate-900 shadow shadow-slate-200 border border-slate-200"
                                : isDark ? "text-[#8888a0] hover:text-white" : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>

                    <div className="hidden sm:block w-[1px] h-6 bg-current opacity-10 mx-1" />
                    <button
                        onClick={handlePublish}
                        disabled={questions.length === 0}
                        className="px-3 sm:px-5 py-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] sm:text-sm font-semibold transition-all active:scale-95 flex-shrink-0"
                    >
                        Publish <span className="hidden sm:inline">Form</span>
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Desktop Left Panel ── */}
                <aside className={`hidden lg:flex w-80 flex-shrink-0 border-r overflow-y-auto flex-col gap-6 p-5 ${isDark ? "border-white/[0.07] bg-[#13131a]" : "border-slate-200 bg-white"
                    }`}>
                    <SettingsContent {...settingsProps} />
                </aside>

                {/* ── Right Panel ── */}
                <main className={`flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-12 ${isDark ? "bg-[#0a0a0f]" : "bg-slate-50/50"}`}>
                    <div className="max-w-2xl mx-auto w-full pb-20">

                        {showPreview ? (
                            <div className={`rounded p-6 sm:p-8 transition-all animate-in zoom-in-95 duration-300 ${isDark ? "bg-[#13131a] border-white/10" : "bg-white border-slate-200 shadow-sm"
                                }`}>
                                <h2 className="text-xl sm:text-xl font-inter font-bold mb-2">{currentPrompt || "Untitled Form"}</h2>
                                <p className={`text-xs sm:text-sm mb-10 ${isDark ? "text-[#8888a0]" : "text-slate-500"}`}>Review how your respondents will see this form.</p>

                                <div className="space-y-8">
                                    {questions.map((q, i) => (
                                        <div key={q.id} className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <p className="text-xs font-semibold pt-0.5">{i + 1}.</p>
                                                <p className="text-xs sm:text-base font-medium leading-relaxed">
                                                    {q.label}
                                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                                </p>
                                            </div>

                                            {HAS_OPTS.includes(q.type) ? (
                                                <div className="flex flex-col gap-2 pl-6">
                                                    {q.options?.map((opt, oi) => (
                                                        <div key={oi} className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border ${isDark ? "border-white/20" : "border-slate-300"}`} />
                                                            <span className={`text-xs ${isDark ? "text-[#f0f0f5]" : "text-slate-700"}`}>{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="pl-6">
                                                    <div className={`w-full h-10 rounded border border-dotted transition-colors ${isDark ? "border-white/10 " : "border-slate-200 "
                                                        }`} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className={`mt-12 pt-8 border-t flex justify-end ${isDark ? "border-white/10" : "border-slate-100"}`}>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className={`px-6 py-2.5 rounded font-bold text-sm transition-all ${isDark ? "bg-white text-black hover:bg-slate-200" : "bg-[#0f172a] text-white hover:bg-slate-800 shadow-slate-200"
                                            }`}
                                    >
                                        Return to Editor
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Empty / generating state */}
                                {questions.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-28 text-[#8888a0] text-center gap-4">
                                        <div className={`w-16 h-16 rounded-full border border-dashed flex items-center justify-center ${isDark ? "border-white/[0.12]" : "border-slate-200"
                                            }`}>
                                            {isGenerating
                                                ? <RotateCcw className="w-6 h-6 animate-spin text-violet-500" />
                                                : <FileText className={`w-6 h-6 ${isDark ? "text-white/20" : "text-slate-300"}`} />}
                                        </div>
                                        <p className="text-sm font-medium">{isGenerating ? "AI is crafting your questions…" : "Start by describing your form."}</p>
                                    </div>
                                )}

                                {/* Questions drag list */}
                                <DragDropContext onDragEnd={props.onDragEnd}>
                                    <Droppable droppableId="editor">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3">
                                                <AnimatePresence>
                                                    {questions.map((q, i) => (
                                                        <Draggable key={q.id} draggableId={String(q.id)} index={i}>
                                                            {(drag, snap) => (
                                                                <motion.div
                                                                    layout
                                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.96 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    ref={drag.innerRef}
                                                                    {...drag.draggableProps}
                                                                    className={`rounded-2xl border p-4 sm:p-5 transition-all ${snap.isDragging
                                                                        ? isDark ? "border-violet-500 bg-[#1c1c26] shadow-2xl scale-105 z-[100]" : "border-violet-300 bg-white shadow-2xl scale-105 z-[100]"
                                                                        : isDark ? "border-white/[0.08] bg-[#13131a] hover:border-white/[0.15]" : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                                                                        }`}
                                                                >
                                                                    {/* Card header */}
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                                                                            <div {...drag.dragHandleProps} className={`${isDark ? "text-white/20 hover:text-white/50" : "text-slate-300 hover:text-slate-500"} transition-colors cursor-grab active:cursor-grabbing`}>
                                                                                <GripVertical className="w-4 h-4" />
                                                                            </div>

                                                                            <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full ${isDark ? "text-violet-400 bg-violet-500/15 border border-violet-500/25" : "text-violet-600 bg-violet-50 border border-violet-100"
                                                                                }`}>
                                                                                Q{i + 1}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1 sm:gap-3 pl-2 flex-wrap sm:flex-nowrap justify-end">
                                                                            <Select value={q.type} onValueChange={(v) => {
                                                                                const opts = HAS_OPTS.includes(v) && (!q.options || q.options.length === 0)
                                                                                    ? ["Option 1", "Option 2", "Option 3"] : q.options;
                                                                                props.updateQ(i, { ...q, type: v, options: opts });
                                                                            }}>
                                                                                <SelectTrigger className={`w-28 sm:w-40 h-7 sm:h-8 text-[10px] sm:text-xs rounded transition-all ${isDark ? "bg-[#1c1c26] border-white/10 text-[#f0f0f5]" : "bg-slate-50 border-slate-200 text-slate-700"
                                                                                    }`}>
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent className={isDark ? "bg-[#1c1c26] border-white/10 text-[#f0f0f5]" : "bg-white border-slate-200 text-slate-900"}>
                                                                                    {QUESTION_TYPES.map((t) => (
                                                                                        <SelectItem key={t.value} value={t.value} className="text-[10px] sm:text-xs transition-colors focus:bg-violet-600 focus:text-white">
                                                                                            {t.label}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>

                                                                            {/* Required toggle */}
                                                                            <button
                                                                                onClick={() => props.updateQ(i, { ...q, required: !q.required })}
                                                                                className={`flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] font-bold transition-colors ${isDark ? "text-[#8888a0] hover:text-[#f0f0f5]" : "text-slate-500 hover:text-slate-900"
                                                                                    }`}
                                                                            >
                                                                                <div className={`w-6 sm:w-8 h-3.5 sm:h-4 rounded-full transition-all relative flex items-center shadow-inner ${q.required ? "bg-violet-600" : isDark ? "bg-white/10" : "bg-slate-200"}`}
                                                                                    style={{ width: "auto", height: "auto" }}>
                                                                                    {/* Force internal dimensions for standard appearance */}
                                                                                    <div className="w-[28px] sm:w-[32px] h-[14px] sm:h-[18px]"></div>
                                                                                    <div className={`w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-white absolute top-1/2 -translate-y-1/2 transition-transform shadow-sm ${q.required ? "translate-x-[14px] sm:translate-x-4" : "translate-x-[2px] sm:translate-x-0.5"}`} />
                                                                                </div>
                                                                            </button>

                                                                            <button
                                                                                onClick={() => props.deleteQ(i)}
                                                                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? "text-white/20 hover:text-red-400 hover:bg-red-400/10" : "text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                                                    }`}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <Input
                                                                        value={q.label || ""}
                                                                        onChange={(e) => props.updateQ(i, { ...q, label: e.target.value })}
                                                                        placeholder="Enter question text…"
                                                                        className={`border-0 border-b rounded-none px-0 py-1.5 h-auto bg-transparent transition-all text-sm sm:text-base font-semibold shadow-none focus-visible:ring-0 focus-visible:border-violet-500 ${isDark ? "border-white/10 text-[#f0f0f5] placeholder:text-white/10" : "border-slate-200 text-slate-900 placeholder:text-slate-300"
                                                                            }`}
                                                                    />

                                                                    {i > 0 && (
                                                                        <div className="mt-3">
                                                                            <ConditionalLogicEditor
                                                                                question={q}
                                                                                allQuestions={questions}
                                                                                currentIndex={i}
                                                                                onChange={(cond) => props.updateQ(i, { ...q, condition: cond })}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Options */}
                                                                    {HAS_OPTS.includes(q.type) && (
                                                                        <div className="mt-5 flex flex-col gap-2 pl-1">
                                                                            {(q.options || []).map((opt, oi) => (
                                                                                <div key={oi} className="flex items-center gap-2 group/opt animate-in fade-in slide-in-from-left-2 duration-200">
                                                                                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${isDark ? "border-white/20" : "border-slate-200"}`} />
                                                                                    <Input
                                                                                        value={opt}
                                                                                        onChange={(e) => props.updateOpt(q, i, oi, e.target.value)}
                                                                                        className={`h-9 text-xs sm:text-sm bg-transparent border-transparent px-2 shadow-none rounded-lg focus-visible:border-violet-500 transition-all ${isDark ? "text-[#f0f0f5] hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                                                                            }`}
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => props.removeOpt(q, i, oi)}
                                                                                        className={`opacity-0 group-hover/opt:opacity-100 transition-all ${isDark ? "text-white/30 hover:text-red-400" : "text-slate-300 hover:text-red-500"}`}
                                                                                    >
                                                                                        <X className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            <button
                                                                                onClick={() => props.addOpt(q, i)}
                                                                                className={`inline-flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-bold transition-all px-2 py-1 rounded-md w-fit ${isDark ? "text-violet-400 hover:bg-violet-500/10" : "text-violet-600 hover:bg-violet-50"
                                                                                    }`}
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" /> Add another option
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                </AnimatePresence>
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                                {/* Add Question Button */}
                                {!isGenerating && (
                                    <button
                                        onClick={props.addQuestion}
                                        className={`w-full group mt-6 flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed transition-all ${isDark
                                            ? "border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 text-[#8888a0]"
                                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 text-slate-400"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? "bg-white/5 group-hover:bg-violet-500/20 group-hover:text-violet-400" : "bg-slate-50 group-hover:bg-violet-100 group-hover:text-violet-600"}`}>
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Add a new question</span>
                                    </button>
                                )}

                                {/* Loading skeleton dots */}
                                {isGenerating && questions.length > 0 && (
                                    <div className={`flex items-center gap-3 px-6 py-5 mt-4 rounded-2xl border transition-all animate-pulse ${isDark ? "border-white/10 bg-[#13131a] text-[#8888a0]" : "border-slate-100 bg-white text-slate-500 shadow-sm"
                                        }`}>
                                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce delay-75" />
                                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce delay-150" />
                                        <span className="text-xs font-bold uppercase tracking-wider ml-1">AI is creating more questions…</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

interface SettingsContentProps extends EditorPhaseProps {
    showAllTypes: boolean;
    setShowAllTypes: (val: boolean) => void;
    typeEntries: [string, number][];
    displayedTypes: [string, number][];
    hasMoreTypes: boolean;
}

const SettingsContent: React.FC<SettingsContentProps> = ({
    isDark,
    refineVal,
    setRefineVal,
    handleRefine,
    isGenerating,
    fileInputRef,
    setFile,
    file,
    typeEntries,
    showAllTypes,
    setShowAllTypes,
    hasMoreTypes,
    displayedTypes,
    currentPrompt,
    questions,
    setPhase,
    setQuestions,
    setCurrentPrompt,
    toggleTheme,
}) => (
    <>
        {/* Theme Toggle (Mobile Only) */}
        <div className="sm:hidden flex items-center justify-between mb-2">
            <span className={`text-[12px] font-bold uppercase tracking-widest ${isDark ? "text-[#8888a0]" : "text-slate-400"}`}>Theme</span>
            <button
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all ${isDark ? "border-white/10 bg-[#1c1c26] text-yellow-400" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
            >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
        </div>

        {/* AI Controls */}
        <div className="space-y-4">
            <div>
                <p className={`text-[12px] font-bold tracking mb-3 ${isDark ? "text-violet-400/80" : "text-violet-600/80"}`}>Refine with AI</p>
                <div className={`rounded-xl border transition-all ${isDark ? "border-white/10 bg-[#1c1c26]" : "border-slate-200 bg-slate-50 focus-within:border-violet-300"
                    } overflow-hidden`}>
                    <Textarea
                        value={refineVal}
                        onChange={(e) => setRefineVal(e.target.value)}
                        placeholder="Add 3 questions about work history..."
                        className={`w-full bg-transparent border-none text-sm min-h-[90px] resize-none p-4 focus-visible:ring-0 leading-relaxed ${isDark ? "bg-[#1c1c26] text-[#f0f0f5]" : "text-slate-900 bg-white"
                            }`}
                    />
                    <div className={`flex items-center justify-between px-3 py-2 border-t ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
                        <span className="text-[10px] text-muted-foreground ml-1">Iterate on form</span>
                        <button
                            onClick={handleRefine}
                            disabled={!refineVal.trim() || isGenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[11px] font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Wand2 className="w-3 h-3" />
                            Apply AI
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <p className={`text-[10px] font-bold tracking mb-3 ${isDark ? "text-[#8888a0]" : "text-slate-400"}`}>Context Document</p>
                <input ref={fileInputRef} type="file" className="hidden" accept=".docx,.pdf,.txt,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all text-center ${file
                        ? isDark ? "border-violet-500/40 bg-violet-500/5" : "border-violet-300 bg-violet-50/50"
                        : isDark ? "border-white/[0.09] hover:border-white/[0.18] hover:bg-[#1c1c26]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                >
                    {file ? (
                        <div className="flex items-center gap-2 text-violet-500 font-medium">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs truncate max-w-[180px]">{file.name}</span>
                            <X className="w-3 h-3 ml-1 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setFile(null); }} />
                        </div>
                    ) : (
                        <>
                            <Upload className={`w-4 h-4 ${isDark ? "text-[#8888a0]" : "text-slate-400"}`} />
                            <span className={`text-xs ${isDark ? "text-[#8888a0]" : "text-slate-500"}`}>Upload reference file</span>
                        </>
                    )}
                </div>
            </div>
        </div>

        <div className={`h-[1px] w-full ${isDark ? "bg-white/5" : "bg-slate-100"}`} />

        {/* Stats & Structure */}
        <div className="flex flex-col gap-6">
            {typeEntries.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`text-[10px] font-bold ${isDark ? "text-[#8888a0]" : "text-slate-400"}`}>Field Types</p>
                        {hasMoreTypes && (
                            <button
                                onClick={() => setShowAllTypes(!showAllTypes)}
                                className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${isDark ? "text-violet-400 hover:text-violet-300" : "text-violet-600 hover:text-violet-500"}`}
                            >
                                {showAllTypes ? (
                                    <>Show Less <ChevronUp className="w-2.5 h-2.5" /></>
                                ) : (
                                    <>Show All ({typeEntries.length}) <ChevronDown className="w-2.5 h-2.5" /></>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {displayedTypes.map(([type, count]) => {
                            const typeInfo = QUESTION_TYPES.find(t => t.value === type);
                            const Icon = typeInfo?.icon || Zap;
                            return (
                                <div key={type} className={`flex items-center justify-between px-3 py-2 rounded border transition-all text-xs font-medium ${isDark ? "bg-[#1c1c26] border-white/5 hover:border-white/10" : "bg-white border-slate-100"
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                                            <Icon className="w-3 h-3" />
                                        </div>
                                        {TYPE_MAP[type] || type}
                                    </div>
                                    <span className={isDark ? "text-[#8888a0]" : "text-slate-400"}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 border-t border-transparent space-y-2">
            <button
                onClick={() => {
                    const data = JSON.stringify({ title: currentPrompt, questions }, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const slug = (currentPrompt || "form").toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
                    link.href = url;
                    link.download = `${slug || 'form'}-config.json`;
                    link.click();
                    toast.success("JSON exported successfully!");
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded border text-xs font-bold transition-all ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
            >
                <DownloadIcon className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
                onClick={() => {
                    if (confirm("This will clear all questions and return to the prompt phase. Continue?")) {
                        setPhase("prompt");
                        setQuestions([]);
                        setCurrentPrompt("");
                    }
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded border text-xs font-bold transition-all ${isDark ? "border-rose-500 bg-white/5 hover:bg-rose-500 hover:text-rose-500" : "border-rose-200 bg-white hover:bg-rose-50 text-rose-500"
                    }`}
            >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
        </div>
    </>
);
