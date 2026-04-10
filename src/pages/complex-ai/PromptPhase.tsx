import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LayoutDashboard, Sun, Moon } from "lucide-react";
import { Message, EXAMPLES } from "./types";

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
}) => {
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

                <button
                    onClick={toggleTheme}
                    className={`pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? "bg-[#13131a] text-yellow-400 border-white/10 hover:text-yellow-300" : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
                        } border shadow-sm active:scale-95`}
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </header>

            {/* Headline */}
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
                <p className={`text-center text-sm italic font-inter max-w-md mx-auto leading-relaxed ${isDark ? "text-[#8888a0]" : "text-slate-500"}`}>
                    Describe your form in plain language and our AI will craft the perfect structure for you.
                </p>
            </div>

            {/* Chat box */}
            <div className={`w-full max-w-[660px] rounded-2xl border ${isDark ? "border-white/[0.09] bg-[#13131a]" : "border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                } overflow-hidden transition-all`}>
                {/* Messages */}
                <div className="px-5 py-5 flex flex-col gap-3 min-h-[90px] max-h-64 overflow-y-auto overflow-auto">
                    <AnimatePresence initial={false}>
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`px-4 py-3 rounded-full text-xs overflow-hidden font-inter leading-relaxed max-w-[85%] ${m.role === "user"
                                    ? "bg-violet-600 text-white self-end shadow-md"
                                    : isDark
                                        ? "bg-[#1c1c26] text-[#8888a0] self-start overflow-hidden"
                                        : "bg-slate-50 text-slate-600 self-start overflow-hidden"
                                    }`}
                            >
                                {m.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input row */}
                <div className={`flex items-end gap-3 px-4 py-3 border-t ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
                    <textarea
                        ref={textareaRef}
                        value={inputVal}
                        onChange={(e) => { setInputVal(e.target.value); autoResize(e.target); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Describe your form…"
                        rows={1}
                        className={`flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed min-h-[36px] max-h-[140px] py-2 ${isDark ? "text-[#f0f0f5] placeholder:text-[#8888a0]" : "text-slate-900 placeholder:text-slate-400"
                            }`}
                        style={{ fontFamily: "inherit" }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputVal.trim() || isGenerating}
                        className={`flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-lg ${isDark ? 'shadow-violet-900/40' : 'shadow-violet-200'}`}
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-[660px]">
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
    );
};
