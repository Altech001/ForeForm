import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LayoutDashboard, Sun, Moon, Settings, Paperclip, X, Loader2 } from "lucide-react";
import { Message, EXAMPLES } from "./types";
import { AgentSettingsDialog } from "./AgentSettingsDialog";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PromptPhaseProps {
    isDark: boolean;
    navigate: (path: string) => void;
    messages: Message[];
    inputVal: string;
    setInputVal: (val: string) => void;
    isGenerating: boolean;
    handleSend: (val?: any) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    autoResize: (el: HTMLTextAreaElement) => void;
    toggleTheme: () => void;
    attachedFile: File | null;
    setAttachedFile: (file: File | null) => void;
}

export const PromptPhase: React.FC<PromptPhaseProps> = ({
    isDark,
    navigate,
    messages,
    inputVal,
    setInputVal,
    isGenerating,
    handleSend,
    messagesEndRef,
    textareaRef,
    autoResize,
    toggleTheme,
    attachedFile,
    setAttachedFile,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachedFile(file);
    };
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-colors duration-500 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]"}`}
            style={{
                background: isDark
                    ? "radial-gradient(ellipse 80% 60% at 50% 0%, #1a1235 0%, #0a0a0f 70%)"
                    : "radial-gradient(ellipse 80% 60% at 50% 0%, #e0e7ff 0%, #f8fafc 70%)"
            }}>
            {/* Responsive Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
                <button
                    onClick={() => navigate("/")}
                    className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded transition-all ${isDark ? "bg-[#13131a] text-[#8888a0] border-white/10 hover:text-white" : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
                        } border text-xs font-medium shadow-sm active:scale-95`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? "bg-[#13131a] text-[#8888a0] border-white/10 hover:text-white" : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
                            } border shadow-sm active:scale-95`}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? "bg-[#13131a] text-yellow-400 border-white/10 hover:text-yellow-300" : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
                            } border shadow-sm active:scale-95`}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <AgentSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isDark={isDark}
            />

            {/* Headline & Chips */}
            {messages.length === 0 && (
                <div className="flex flex-col items-center mb-8">
                    <div className={`w-16 h-16 mb-6 rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-violet-600/20 text-violet-400 group-hover:bg-violet-600/30" : ""}`}>
                        <img src="/letter-m.png" alt="Logo" className="w-10 h-10 object-contain " style={{ filter: isDark ? 'none' : '' }} />
                    </div>
                    <h1 className="text-2xl md:text-4xl text-center font-bold tracking-tight leading-tight mb-4"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg,#fff 30%,#a78bfa 100%)"
                                : "linear-gradient(135deg,#0f172a 30%,#7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                        }}>
                        Build forms in<br /><span className="italic font-serif text-violet-600">seconds</span>
                    </h1>
                    <p className={`text-center text-sm italic font-inter max-w-md mx-auto leading-relaxed mb-8 ${isDark ? "text-[#8888a0]" : "text-slate-500"}`}>
                        Describe your form in plain language and our AI will craft the perfect structure for you.
                    </p>

                    {/* Example chips */}
                    <div className="flex flex-wrap gap-2 justify-center max-w-[660px]">
                        {EXAMPLES.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => {
                                    setInputVal(ex);
                                    handleSend(ex);
                                }}
                                className={`px-4 py-2 rounded-full border transition-all text-xs font-medium ${isDark
                                    ? "border-white/[0.09] bg-[#13131a] text-[#8888a0] hover:text-[#f0f0f5] hover:border-violet-500/40 hover:bg-[#1c1c26]"
                                    : "border-slate-200 bg-white text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50"
                                    }`}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat box */}
            <div className={`w-full max-w-[660px] rounded-2xl border ${isDark ? "border-white/[0.09] bg-[#13131a]" : "border-slate-200 bg-white"
                } overflow-hidden transition-all flex-1 md:flex-none flex flex-col md:block justify-end pb-safe`}>
                {/* Messages */}
                <div className="px-5 py-5 flex flex-col gap-3 min-h-[90px] max-h-64 md:max-h-[500px] overflow-y-auto no-scrollbar">
                    <AnimatePresence initial={false}>
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-[13px] font-inter leading-relaxed max-w-[80%] break-words whitespace-pre-wrap ${m.role === "user"
                                    ? "px-4 py-2.5 bg-violet-600 text-white self-end rounded-2xl rounded-br-sm"
                                    : isDark
                                        ? "px-5 py-4 rounded-3xl overflow-hidden bg-[#1c1c26] text-[#8888a0] self-start rounded-tl-sm"
                                        : "px-5 py-4 rounded-3xl overflow-hidden bg-transparent text-slate-700 self-start rounded-tl-sm"
                                    }`}
                            >
                                {m.role === "user" ? (
                                    m.text
                                ) : (
                                    <div className={`prose prose-sm max-w-none ${isDark ? "prose-invert" : "prose-slate"}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Modern Agent-Style Input Area */}
                <div className={`p-4 ${isDark ? "" : "bg-slate-50/50"} border-t ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
                    <div className="relative group">
                        {/* Decorative Background for Input */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-violet-500/20 to-violet-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity`} />

                        <div className={`flex flex-col gap-2 p-2 ${isDark ? "bg-[#1a1a24] border-white/10" : "bg-white border-slate-200"} border rounded-xl focus-within:border-violet-500/50 transition-all relative`}>
                            {/* File Previews */}
                            {attachedFile && (
                                <div className="flex flex-wrap gap-2 px-1 pt-1">
                                    <div className={`group/file relative rounded-xl overflow-hidden border flex items-center gap-3 px-3 py-2 ${isDark ? "bg-[#13131a] border-white/10" : "bg-slate-50 border-slate-200"}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-white border border-slate-100"}`}>
                                            <Paperclip className={`w-4 h-4 ${isDark ? "text-violet-400" : "text-violet-500"}`} />
                                        </div>
                                        <div className="min-w-0 pr-6">
                                            <p className={`text-xs font-semibold truncate max-w-[150px] ${isDark ? "text-slate-200" : "text-slate-700"}`}>{attachedFile.name}</p>
                                            <p className={`text-[10px] ${isDark ? "text-[#8888a0]" : "text-slate-500"}`}>{(attachedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button
                                            onClick={() => setAttachedFile(null)}
                                            className={`absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity ${isDark ? "bg-white/10 text-white hover:bg-red-500/80" : "bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-600"}`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-end gap-3 px-2 min-h-[50px]">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt,.csv,.json,.md,.xml,.docx,.doc,.pdf,image/*"
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex-shrink-0 w-10 h-10 rounded-full mb-1 flex items-center justify-center transition-all ${isDark ? "text-[#8888a0] hover:text-violet-400 hover:bg-violet-900/30" : "text-slate-400 hover:text-violet-600 hover:bg-violet-50"}`}
                                    title="Upload context file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    value={inputVal}
                                    onChange={(e) => { setInputVal(e.target.value); autoResize(e.target); }}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder="Describe your form…"
                                    rows={1}
                                    className={`flex-1 bg-transparent border-none outline-none resize-none text-[15px] font-medium leading-relaxed min-h-[24px] max-h-[140px] py-3.5 no-scrollbar ${isDark ? "text-[#f0f0f5] placeholder:text-[#8888a0]" : "text-slate-900 placeholder:text-slate-400"
                                        }`}
                                    style={{ fontFamily: "inherit" }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!inputVal.trim() && !attachedFile) || isGenerating}
                                    className={`flex-shrink-0 w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center mb-0.5 ${inputVal.trim() || attachedFile ? "bg-violet-600 text-white active:scale-95" : (isDark ? "bg-white/5 text-white/20" : "bg-slate-100 text-slate-400")} `}
                                >
                                    {isGenerating ? (
                                        <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-violet-400" : "text-violet-600"}`} />
                                    ) : (
                                        <Send className={`w-5 h-5 ${inputVal.trim() || attachedFile ? "ml-0.5" : ""}`} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
