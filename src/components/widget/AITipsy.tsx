import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Maximize2, Minimize2, Mic, Plus, MoreHorizontal, Send, Gem, Brain, RotateCcw, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "react-router-dom";

export default function ForeFormAIWidget() {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    const [isChatStarted, setIsChatStarted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

    const [extendedThinking, setExtendedThinking] = useState(false);
    const [isMemoryOpen, setIsMemoryOpen] = useState(false);
    const [memoryText, setMemoryText] = useState("My name is Abaasa Albert. I use this product for school to help me conduct research. I'm primarily looking for support with finding, understanding, and synthesizing information, organizing notes and sources, and turning research into clear summaries or drafts.");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!isAuthenticated || !user) return null;

    // Don't show on login/signup pages
    const excludedPatterns = [
        "/login",
        "/signup",
        "/agent",
        "/complex-ai",
        "/bookmark-tasks",
        "/bookmark-documents",
        "/connectors",
        "/forms/:id/edit"
    ];

    const isExcludedPage = excludedPatterns.some(pattern => {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (patternParts.length !== pathParts.length) return false;
        return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
    });

    if (isExcludedPage) return null;

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (!isChatStarted) {
            setIsChatStarted(true);
        }

        const newMessages = [...messages, { role: 'user', content: inputText }] as { role: 'user' | 'assistant', content: string }[];
        setMessages(newMessages);
        setInputText("");

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Hi ${user.full_name || 'there'}. I can help you build or edit ForeForm forms, set up automations, manage contacts, or answer questions about ForeForm features. What would you like to do?`
            }]);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRestart = () => {
        setMessages([]);
        setIsChatStarted(false);
        setIsExpanded(false);
        setInputText("");
    };

    // Reusable Input Area for both small and full states
    const inputAreaNode = (
        <div className={`bg-white rounded-2xl border-2 border-primary/50 p-1 shadow transition-all ${isChatStarted ? '' : 'w-[320px]'}`}>
            <div className="flex items-center gap-2 border border-primary/40 rounded-2xl px-3 py-4 bg-white">
                <button className="text-gray-400 hover:text-gray-700 transition-colors">
                    <Mic className="w-5 h-5" />
                </button>

                {isChatStarted && (
                    <button className="text-gray-400 hover:text-gray-700 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                )}

                {isChatStarted && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-700 transition-colors focus:outline-none">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 p-2 rounded-xl border-gray-100 shadow-xl z-[60]">
                            <div className="flex items-center justify-between px-2 py-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                    <Gem className="w-4 h-4 text-emerald-500" />
                                    <span>Extended Thinking</span>
                                    <span className="w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 ml-1">?</span>
                                </div>
                                <Switch
                                    checked={extendedThinking}
                                    onCheckedChange={setExtendedThinking}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                            <DropdownMenuItem
                                onClick={() => setIsMemoryOpen(true)}
                                className="px-2 py-2 cursor-pointer gap-2 text-gray-700 focus:bg-gray-50 rounded-lg"
                            >
                                <Brain className="w-4 h-4" />
                                <span className="font-medium text-sm">ForeForm AI memory</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleRestart}
                                className="px-2 py-2 cursor-pointer gap-2 text-gray-700 focus:bg-gray-50 rounded-lg"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="font-medium text-sm">Restart chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask ForeForm AI"
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 font-medium ml-1"
                />

                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`transition-colors ${inputText.trim() ? 'text-purple-600 hover:text-purple-700' : 'text-gray-300'}`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
                <AnimatePresence mode="wait">
                    {!isChatStarted ? (
                        <motion.div
                            key="input-only"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                            className="shadow-xl rounded-2xl"
                        >
                            {inputAreaNode}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-panel"
                            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                width: isExpanded ? 480 : 380,
                                height: isExpanded ? 700 : 550
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                            className="bg-white rounded-xl shadow-2xl border border-purple-100/60 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white z-10">
                                <div className="flex items-center gap-2">
                                    <img src="/icons/ai.svg" className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-gray-800 text-sm">ForeForm AI</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-md hover:bg-gray-100"
                                    >
                                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setIsChatStarted(false)}
                                        className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-md hover:bg-gray-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-gray-50 text-gray-800 rounded-2xl rounded-tr-sm border border-gray-100'
                                                : 'bg-purple-50/50 text-gray-800 rounded-2xl rounded-tl-sm border border-purple-100/50'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-50">
                                {inputAreaNode}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Memory Modal */}
            <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-white border-gray-200 font-sans z-[70]">
                    <div className="px-6 py-5">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-800">ForeForm AI memory</DialogTitle>
                            <p className="text-sm text-gray-500 mt-1.5">Manage the information ForeForm AI uses to personalize your experience.</p>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-2">
                        <Textarea
                            value={memoryText}
                            onChange={(e) => setMemoryText(e.target.value)}
                            className="min-h-[220px] resize-none border-gray-200 focus-visible:ring-purple-500 text-gray-700 bg-white text-[15px] p-4 leading-relaxed rounded-xl shadow-sm"
                        />
                    </div>

                    <DialogFooter className="px-6 py-5 mt-2 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsMemoryOpen(false)} className="text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900 px-5">
                            Cancel
                        </Button>
                        <Button onClick={() => setIsMemoryOpen(false)} className="bg-[#3A3541] hover:bg-[#2A2631] text-white font-medium px-6 rounded-lg shadow-md transition-all">
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
