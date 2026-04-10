import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { useAgentSettings, AgentSettings, AIModel } from "@/hooks/useAgentSettings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export const AgentSettingsDialog: React.FC<Props> = ({ isOpen, onClose, isDark }) => {
    const { settings, updateSettings } = useAgentSettings();
    const [localSettings, setLocalSettings] = React.useState<AgentSettings>(settings);

    React.useEffect(() => {
        if (isOpen) setLocalSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    className={`w-full max-w-md p-6 rounded shadow-xl flex flex-col gap-4 ${isDark ? "bg-[#13131a] text-white border border-white/10" : "bg-white text-slate-900"}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold">Agent Settings</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">AI Model Provider</label>
                        <select
                            value={localSettings.model}
                            onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value as AIModel })}
                            className={`w-full p-2 rounded border text-sm ${isDark ? "bg-[#1c1c26] border-white/10" : "bg-slate-50 border-slate-200"}`}
                        >
                            <option value="base44">ForeForm Model (Default)</option>
                            <option value="gemini-flash-latest">Google Gemini Flash</option>
                            <option value="gemini-3-flash">Google Gemini 3</option>
                            <option value="openai">OpenAI</option>
                        </select>
                    </div>

                    {localSettings.model.startsWith("gemini") && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Gemini API Key</label>
                            <Input
                                type="password"
                                placeholder="AIzaSy..."
                                value={localSettings.geminiApiKey}
                                onChange={(e) => setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })}
                                className={`w-full p-2 rounded border text-sm ${isDark ? "bg-[#1c1c26] border-white/10" : "bg-slate-50 border-slate-200"}`}
                            />
                        </div>
                    )}

                    {localSettings.model === "openai" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">OpenAI API Key</label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={localSettings.openAIApiKey}
                                onChange={(e) => setLocalSettings({ ...localSettings, openAIApiKey: e.target.value })}
                                className={`w-full p-2 rounded border text-sm ${isDark ? "bg-[#1c1c26] border-white/10" : "bg-slate-50 border-slate-200"}`}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">System Prompt</label>
                        <Textarea
                            rows={3}
                            value={localSettings.systemPrompt}
                            onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                            className={`w-full p-2 rounded border text-sm ${isDark ? "bg-[#1c1c26] border-white/10" : "bg-transparent border-slate-200"}`}
                        />
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <button onClick={onClose} className={`px-4 py-2 text-sm font-medium rounded ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"} transition-colors`}>
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-violet-500/20">
                            <Save className="w-4 h-4" /> Save Settings
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
