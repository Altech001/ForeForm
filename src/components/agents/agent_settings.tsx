import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Settings, User, Shield, CreditCard,
    Zap, Link, MessageSquare, Mic,
    Monitor, Moon, Sun, Key,
    Github, Mail, Calendar, HardDrive,
    Info, Check, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AgentSettingsProps {
    onClose: () => void;
}

export default function AgentSettings({ onClose }: AgentSettingsProps) {
    const [activeTab, setActiveTab] = useState("general");
    const [apiKey, setApiKey] = useState(() => localStorage.getItem("foreform_api_key") || "");
    const [chatFont, setChatFont] = useState("default");
    const [voice, setVoice] = useState("buttery");

    const handleSaveKey = () => {
        localStorage.setItem("foreform_api_key", apiKey);
        toast.success("API Key saved", {
            description: "Your settings have been updated.",
        });
    };

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "account", label: "Account", icon: User },
        { id: "privacy", label: "Privacy", icon: Shield },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "capabilities", label: "Capabilities", icon: Zap },
        { id: "connectors", label: "Connectors", icon: Link },
    ];

    const fontOptions = [
        { id: "default", label: "Default", sample: "Aa" },
        { id: "sans", label: "Sans", sample: "Aa" },
        { id: "system", label: "System", sample: "Aa" },
        { id: "dyslexic", label: "Dyslexic friendly", sample: "Aa" },
    ];

    const voiceOptions = [
        { id: "buttery", label: "Buttery" },
        { id: "airy", label: "Airy" },
        { id: "mellow", label: "Mellow" },
        { id: "glassy", label: "Glassy" },
        { id: "rounded", label: "Rounded" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-0"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-5xl h-[80vh] bg-card border border-border/50 rounded-2xl shadow-none overflow-hidden flex"
            >
                {/* Sidebar */}
                <aside className="w-64 border-r border-border/40 bg-muted/20 p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2 mb-8">
                        <div className="w-8 h-8 text-primary flex items-center justify-center">
                            <Settings className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Settings</h2>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-all ${activeTab === tab.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-border/40">
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                            <Info className="w-4 h-4" />
                            Help & Support
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto no-scrollbar relative p-10">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="max-w-3xl"
                        >
                            {activeTab === "general" && (
                                <div className="space-y-8">
                                    <header className="space-y-1.5">
                                        <h3 className="text font-bold">General settings</h3>
                                        <p className="text-sm text-muted-foreground">Manage your AI core configuration and visual preferences.</p>
                                    </header>

                                    <section className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <Key className="w-4 h-4 text-primary" />
                                                Personal API Key
                                            </h4>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="password"
                                                    placeholder="sk-..."
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    className="bg-muted/30 border-border/50"
                                                />
                                                <Button onClick={handleSaveKey} className=" px-6">Save Key</Button>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                By adding your own Gemini API key, you skip the shared daily quota. Your key is stored locally in your browser and never sent to our servers.
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-border/40 space-y-4">
                                            <h4 className="text-sm font-bold">Chat font</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {fontOptions.map((f) => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => setChatFont(f.id)}
                                                        className={`flex flex-col items-center gap-3 p-5 rounded border transition-all ${chatFont === f.id
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-card border-border/50 hover:border-border hover:bg-muted/20"
                                                            }`}
                                                    >
                                                        <div className={`text font-medium ${f.id === "dyslexic" ? "font-serif" : ""}`}>
                                                            {f.sample}
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === "capabilities" && (
                                <div className="space-y-8">
                                    <header className="space-y-1.5">
                                        <h3 className="text font-bold">Memory</h3>
                                        <p className="text-sm text-muted-foreground">Control how the agent remembers and references past interactions.</p>
                                    </header>

                                    <div className="space-y-6">
                                        <div className="flex items-start justify-between p-6 rounded border border-border/50 bg-muted/10">
                                            <div className="space-y-1.5 pr-8">
                                                <h4 className="text-sm font-bold">Generate memory from chat history</h4>
                                                <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                    Allow the agent to remember relevant context from your chats. This setting controls memory for both chats and projects.
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between p-6 rounded border border-border/50 bg-muted/10">
                                            <div className="space-y-1.5 pr-8">
                                                <h4 className="text-sm font-bold">Import memory from other AI providers</h4>
                                                <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                    Bring relevant context and data from another AI provider.
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded px-4 text-xs font-bold shrink-0">Start import</Button>
                                        </div>

                                        <div className="pt-8 border-t border-border/40 space-y-6">
                                            <h4 className="text-sm font-bold">Tool access</h4>
                                            <div className="space-y-4">
                                                <div className="p-4 rounded border border-border/50 bg-card hover:bg-muted/10 transition-colors cursor-pointer group">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-4 h-4 rounded-full border-2 border-primary mt-1 shrink-0 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h5 className="text-sm font-bold">Load tools when needed</h5>
                                                            <p className="text-xs text-muted-foreground">Chats consume less context since tools aren't pre-loaded.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded border border-border/50 bg-card hover:bg-muted/10 transition-colors cursor-pointer group opacity-60">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-4 h-4 rounded-full border-2 border-border mt-1 shrink-0" />
                                                        <div className="space-y-1">
                                                            <h5 className="text-sm font-bold">Tools already loaded</h5>
                                                            <p className="text-xs text-muted-foreground">Chats have more context available since tools are always there.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "connectors" && (
                                <div className="space-y-8">
                                    <header className="space-y-1.5 flex items-center justify-between">
                                        <div className="space-y-1.5">
                                            <h3 className="text font-bold">Connectors</h3>
                                            <p className="text-sm text-muted-foreground">Allow the agent to reference other apps and services for more context.</p>
                                        </div>
                                        <Button variant="secondary" size="sm" className="rounded px-4 text-xs font-bold">Browse connectors</Button>
                                    </header>

                                    <div className="space-y-3">
                                        {[
                                            { id: "github", label: "GitHub Integration", icon: Github, color: "text-foreground" },
                                            { id: "gmail", label: "Gmail", icon: Mail, color: "text-red-500" },
                                            { id: "calendar", label: "Google Calendar", icon: Calendar, color: "text-blue-500" },
                                            { id: "drive", label: "Google Drive", icon: HardDrive, color: "text-amber-500" },
                                        ].map((connector) => {
                                            const Icon = connector.icon;
                                            return (
                                                <div key={connector.id} className="flex items-center justify-between p-4 rounded border border-border/40 bg-muted/5 hover:bg-muted/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center ${connector.color}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-sm font-bold">{connector.label}</span>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="rounded px-4 text-xs font-bold">Connect</Button>
                                                </div>
                                            );
                                        })}
                                        <button className="w-full py-4 rounded border border-dashed border-border/60 text-sm font-medium text-muted-foreground hover:bg-muted/10 transition-colors">
                                            Add custom connector
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "account" && (
                                <div className="space-y-8 pt-10 text-center">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                        <Mic className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text font-bold">Voice settings</h3>
                                            <p className="text-sm text-muted-foreground">Choose a voice that fits your workflow.</p>
                                        </div>

                                        <div className="space-y-4 text-left">
                                            <h4 className="text-xs font-bold text-muted-foreground px-1">Selected voice</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {voiceOptions.map((v) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setVoice(v.id)}
                                                        className={`px-6 py-4 rounded border text-sm font-bold transition-all min-w-[120px] ${voice === v.id
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-card border-border/50 hover:bg-muted/20"
                                                            }`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </motion.div>
        </motion.div>
    );
}
