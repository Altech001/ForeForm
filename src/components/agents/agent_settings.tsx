import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Settings, User, Shield, CreditCard,
    Zap, Link, MessageSquare, Mic,
    Monitor, Moon, Sun, Key,
    Github, Mail, Calendar, HardDrive,
    Info, Check, ChevronRight, Plus,
    Trash2, Eye, EyeOff, Globe,
    Share2, Star, AlertTriangle, Loader2,
    RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { base44 } from "@/api/foreform";

interface AgentSettingsProps {
    onClose: () => void;
}

interface ApiKeyEntry {
    id: string;
    provider: string;
    label: string | null;
    api_key_masked: string;
    is_shared: boolean;
    is_active: boolean;
    is_default: boolean;
    usage_count: string;
    last_used_at: string | null;
    created_at: string;
}

const PROVIDERS = [
    { id: "gemini", label: "Google Gemini", icon: "✦", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "openai", label: "OpenAI", icon: "◎", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "anthropic", label: "Anthropic (Claude)", icon: "◈", color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "deepseek", label: "DeepSeek", icon: "◇", color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function AgentSettings({ onClose }: AgentSettingsProps) {
    const [activeTab, setActiveTab] = useState("general");
    const [chatFont, setChatFont] = useState("default");
    const [voice, setVoice] = useState("buttery");

    // API Key management state
    const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);
    const [showAddKey, setShowAddKey] = useState(false);
    const [newKeyProvider, setNewKeyProvider] = useState("gemini");
    const [newKeyLabel, setNewKeyLabel] = useState("");
    const [newKeyValue, setNewKeyValue] = useState("");
    const [newKeyShared, setNewKeyShared] = useState(true);
    const [newKeyDefault, setNewKeyDefault] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [showKeyValue, setShowKeyValue] = useState(false);

    // Agent settings state
    const [autoSaveChats, setAutoSaveChats] = useState(() => localStorage.getItem("foreform_auto_save_chats") !== "false");
    const [streamResponses, setStreamResponses] = useState(() => localStorage.getItem("foreform_stream_responses") !== "false");
    const [showToolSteps, setShowToolSteps] = useState(() => localStorage.getItem("foreform_show_tool_steps") !== "false");
    const [memoryEnabled, setMemoryEnabled] = useState(() => localStorage.getItem("foreform_memory_enabled") !== "false");
    const [defaultModel, setDefaultModel] = useState(() => localStorage.getItem("foreform_default_model") || "fast");
    const [maxOutputTokens, setMaxOutputTokens] = useState(() => localStorage.getItem("foreform_max_tokens") || "8192");
    const [temperature, setTemperature] = useState(() => localStorage.getItem("foreform_temperature") || "0.7");

    // Load API keys from backend
    useEffect(() => {
        loadApiKeys();
    }, []);

    const loadApiKeys = async () => {
        setIsLoadingKeys(true);
        try {
            const keys = await base44.entities.ApiKey.list();
            setApiKeys(keys);
        } catch (err) {
            // Backend may not be accessible
            console.warn("Failed to load API keys:", err);
        } finally {
            setIsLoadingKeys(false);
        }
    };

    const handleAddKey = async () => {
        if (!newKeyValue.trim()) {
            toast.error("API key cannot be empty");
            return;
        }
        setIsSavingKey(true);
        try {
            await base44.entities.ApiKey.create({
                provider: newKeyProvider,
                label: newKeyLabel.trim() || `${PROVIDERS.find(p => p.id === newKeyProvider)?.label} Key`,
                api_key: newKeyValue.trim(),
                is_shared: newKeyShared,
                is_default: newKeyDefault,
            });
            toast.success("API Key added", { description: "Your key is now available for use." });
            setShowAddKey(false);
            setNewKeyValue("");
            setNewKeyLabel("");
            setNewKeyShared(true);
            setNewKeyDefault(false);
            // Clear session cache so the new key is picked up
            sessionStorage.removeItem("_resolved_gemini_key");
            await loadApiKeys();
        } catch (err: any) {
            toast.error("Failed to add key", { description: err.message || "Check your key and try again." });
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        try {
            await base44.entities.ApiKey.delete(keyId);
            toast.success("API Key removed");
            sessionStorage.removeItem("_resolved_gemini_key");
            await loadApiKeys();
        } catch (err: any) {
            toast.error("Failed to delete key");
        }
    };

    const handleToggleKey = async (keyId: string, field: "is_active" | "is_shared" | "is_default", value: boolean) => {
        try {
            await base44.entities.ApiKey.update(keyId, { [field]: value });
            sessionStorage.removeItem("_resolved_gemini_key");
            await loadApiKeys();
        } catch {
            toast.error("Failed to update key");
        }
    };

    const handleSaveSetting = (key: string, value: string | boolean) => {
        localStorage.setItem(key, String(value));
        toast.success("Setting saved");
    };

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "apikeys", label: "API Keys", icon: Key },
        { id: "capabilities", label: "Capabilities", icon: Zap },
        { id: "account", label: "Account", icon: User },
        { id: "privacy", label: "Privacy", icon: Shield },
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
                                    {tab.id === "apikeys" && apiKeys.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 h-4 font-bold">
                                            {apiKeys.length}
                                        </Badge>
                                    )}
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
                            {/* ═══ General ═══ */}
                            {activeTab === "general" && (
                                <div className="space-y-8">
                                    <header className="space-y-1.5">
                                        <h3 className="text font-bold">General settings</h3>
                                        <p className="text-sm text-muted-foreground">Manage your AI core configuration and visual preferences.</p>
                                    </header>

                                    <section className="space-y-6">
                                        {/* ── Default Model ── */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                Default Intelligence Level
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {[
                                                    { id: "auto", label: "Auto", desc: "Smart routing" },
                                                    { id: "fast", label: "Fast", desc: "Quick & light" },
                                                    { id: "expert", label: "Expert", desc: "Deep thinking" },
                                                    { id: "heavy", label: "Heavy", desc: "Max power" },
                                                ].map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => { setDefaultModel(m.id); handleSaveSetting("foreform_default_model", m.id); }}
                                                        className={`flex flex-col items-center gap-2 p-4 rounded border transition-all ${defaultModel === m.id
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-card border-border/50 hover:border-border hover:bg-muted/20"
                                                            }`}
                                                    >
                                                        <span className="text-sm font-bold">{m.label}</span>
                                                        <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Temperature ── */}
                                        <div className="pt-6 border-t border-border/40 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold">Creativity (Temperature)</h4>
                                                    <p className="text-[11px] text-muted-foreground">Higher = more creative, lower = more precise</p>
                                                </div>
                                                <span className="text-sm font-mono font-bold text-primary">{temperature}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={temperature}
                                                onChange={(e) => { setTemperature(e.target.value); handleSaveSetting("foreform_temperature", e.target.value); }}
                                                className="w-full accent-primary"
                                            />
                                        </div>

                                        {/* ── Max Tokens ── */}
                                        <div className="pt-6 border-t border-border/40 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold">Max Output Length</h4>
                                                    <p className="text-[11px] text-muted-foreground">Maximum tokens per response</p>
                                                </div>
                                                <span className="text-sm font-mono font-bold text-primary">{maxOutputTokens}</span>
                                            </div>
                                            <select
                                                value={maxOutputTokens}
                                                onChange={(e) => { setMaxOutputTokens(e.target.value); handleSaveSetting("foreform_max_tokens", e.target.value); }}
                                                className="w-full px-4 py-2.5 rounded border border-border/50 bg-muted/30 text-sm font-medium"
                                            >
                                                <option value="2048">Short (2,048 tokens)</option>
                                                <option value="4096">Medium (4,096 tokens)</option>
                                                <option value="8192">Long (8,192 tokens)</option>
                                                <option value="16384">Very Long (16,384 tokens)</option>
                                            </select>
                                        </div>

                                        {/* ── Behavior Toggles ── */}
                                        <div className="pt-6 border-t border-border/40 space-y-4">
                                            <h4 className="text-sm font-bold">Agent Behavior</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-4 rounded border border-border/50 bg-muted/10">
                                                    <div className="space-y-0.5 pr-4">
                                                        <h5 className="text-sm font-bold">Auto-save conversations</h5>
                                                        <p className="text-[11px] text-muted-foreground">Automatically persist chat history to the cloud</p>
                                                    </div>
                                                    <Switch
                                                        checked={autoSaveChats}
                                                        onCheckedChange={(v) => { setAutoSaveChats(v); handleSaveSetting("foreform_auto_save_chats", v); }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded border border-border/50 bg-muted/10">
                                                    <div className="space-y-0.5 pr-4">
                                                        <h5 className="text-sm font-bold">Show tool steps</h5>
                                                        <p className="text-[11px] text-muted-foreground">Display which tools the AI uses during generation</p>
                                                    </div>
                                                    <Switch
                                                        checked={showToolSteps}
                                                        onCheckedChange={(v) => { setShowToolSteps(v); handleSaveSetting("foreform_show_tool_steps", v); }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded border border-border/50 bg-muted/10">
                                                    <div className="space-y-0.5 pr-4">
                                                        <h5 className="text-sm font-bold">Stream responses</h5>
                                                        <p className="text-[11px] text-muted-foreground">Show responses as they generate (real-time)</p>
                                                    </div>
                                                    <Switch
                                                        checked={streamResponses}
                                                        onCheckedChange={(v) => { setStreamResponses(v); handleSaveSetting("foreform_stream_responses", v); }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Chat Font ── */}
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

                            {/* ═══ API Keys ═══ */}
                            {activeTab === "apikeys" && (
                                <div className="space-y-8">
                                    <header className="space-y-1 flex items-start justify-between">
                                        <div className="space-y-1.5">
                                            <h3 className="text font-bold">API Keys</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Add your own API keys to bypass shared quotas. Keys you add are shared with all users by default.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setShowAddKey(true)}
                                            size="sm"
                                            className="rounded px-4 text-xs font-bold gap-2 shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Key
                                        </Button>
                                    </header>

                                    {/* Info Banner */}
                                    <div className="flex items-start gap-3 p-4 rounded border border-primary/20 bg-primary/5">
                                        <Share2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-foreground">Shared by Default</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                Your API keys are shared with all ForeForm users by default, contributing to the community pool.
                                                You can toggle this off for any key. Your own keys always take priority when you use the AI.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Add Key Form */}
                                    <AnimatePresence>
                                        {showAddKey && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 rounded border border-border/50 bg-muted/10 space-y-5">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-bold">Add New API Key</h4>
                                                        <button onClick={() => setShowAddKey(false)} className="text-muted-foreground hover:text-foreground">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Provider Selection */}
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-muted-foreground ">Provider</label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                            {PROVIDERS.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => setNewKeyProvider(p.id)}
                                                                    className={`flex items-center gap-2 p-3 rounded border text-xs font-bold transition-all ${newKeyProvider === p.id
                                                                        ? "bg-primary/10 border-primary"
                                                                        : "bg-card border-border/50 hover:bg-muted/20"
                                                                        }`}
                                                                >
                                                                    <span className={`text-lg ${p.color}`}>{p.icon}</span>
                                                                    <span className="truncate">{p.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Key Label */}
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-muted-foreground ">Label (optional)</label>
                                                        <Input
                                                            placeholder="e.g. My work key, Project Alpha..."
                                                            value={newKeyLabel}
                                                            onChange={(e) => setNewKeyLabel(e.target.value)}
                                                            className="bg-card border-border/50"
                                                        />
                                                    </div>

                                                    {/* Key Value */}
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-muted-foreground ">API Key</label>
                                                        <div className="relative">
                                                            <Input
                                                                type={showKeyValue ? "text" : "password"}
                                                                placeholder={newKeyProvider === "gemini" ? "AIza..." : "sk-..."}
                                                                value={newKeyValue}
                                                                onChange={(e) => setNewKeyValue(e.target.value)}
                                                                className="bg-card border-border/50 pr-10"
                                                            />
                                                            <button
                                                                onClick={() => setShowKeyValue(!showKeyValue)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                {showKeyValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Options */}
                                                    <div className="flex items-center gap-6">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <Switch checked={newKeyShared} onCheckedChange={setNewKeyShared} />
                                                            <span className="text-xs font-medium">Share with everyone</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <Switch checked={newKeyDefault} onCheckedChange={setNewKeyDefault} />
                                                            <span className="text-xs font-medium">Set as default</span>
                                                        </label>
                                                    </div>

                                                    <Button
                                                        onClick={handleAddKey}
                                                        disabled={!newKeyValue.trim() || isSavingKey}
                                                        className="w-full rounded px-6 font-bold gap-2"
                                                    >
                                                        {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                                        {isSavingKey ? "Saving..." : "Save API Key"}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Keys List */}
                                    <div className="space-y-3">
                                        {isLoadingKeys ? (
                                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                <span className="text-sm font-medium">Loading keys...</span>
                                            </div>
                                        ) : apiKeys.length === 0 ? (
                                            <div className="text-center py-12 space-y-3">
                                                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                                                    <Key className="w-7 h-7 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-bold text-muted-foreground">No API keys yet</p>
                                                <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                                                    Add your own Gemini, OpenAI, or Anthropic key to get unlimited AI access and contribute to the community pool.
                                                </p>
                                            </div>
                                        ) : (
                                            apiKeys.map((key) => {
                                                const provider = PROVIDERS.find(p => p.id === key.provider);
                                                return (
                                                    <motion.div
                                                        key={key.id}
                                                        layout
                                                        className={`p-4 rounded border transition-all ${key.is_active
                                                            ? "border-border/50 bg-card hover:bg-muted/10"
                                                            : "border-border/30 bg-muted/10 opacity-60"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div className={`w-10 h-10 rounded-lg ${provider?.bg || "bg-muted"} flex items-center justify-center shrink-0`}>
                                                                    <span className={`text-lg ${provider?.color || ""}`}>{provider?.icon || "🔑"}</span>
                                                                </div>
                                                                <div className="min-w-0 space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold truncate">{key.label || provider?.label}</span>
                                                                        {key.is_default && (
                                                                            <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] px-1.5 py-0 h-4">
                                                                                <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Default
                                                                            </Badge>
                                                                        )}
                                                                        {key.is_shared && (
                                                                            <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] px-1.5 py-0 h-4">
                                                                                <Globe className="w-2.5 h-2.5 mr-0.5" /> Shared
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground font-mono">{key.api_key_masked}</p>
                                                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                                        <span>Used {key.usage_count}×</span>
                                                                        <span>•</span>
                                                                        <span>{new Date(key.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-amber-500"
                                                                    onClick={() => handleToggleKey(key.id, "is_default", !key.is_default)}
                                                                    title={key.is_default ? "Remove default" : "Set as default"}
                                                                >
                                                                    <Star className={`w-3.5 h-3.5 ${key.is_default ? "fill-amber-500 text-amber-500" : ""}`} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-blue-500"
                                                                    onClick={() => handleToggleKey(key.id, "is_shared", !key.is_shared)}
                                                                    title={key.is_shared ? "Stop sharing" : "Share with everyone"}
                                                                >
                                                                    {key.is_shared ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Globe className="w-3.5 h-3.5" />}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleDeleteKey(key.id)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Local Key (Legacy) */}
                                    <div className="pt-6 border-t border-border/40 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <h4 className="text-xs font-bold text-muted-foreground ">Browser-Only Key (Legacy)</h4>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            This key is stored only in your browser and not synced to the server. Use the "Add Key" above instead for cloud-synced keys.
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                type="password"
                                                placeholder="sk-..."
                                                value={localStorage.getItem("foreform_api_key") || ""}
                                                onChange={(e) => localStorage.setItem("foreform_api_key", e.target.value)}
                                                className="bg-muted/30 border-border/50"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    localStorage.removeItem("foreform_api_key");
                                                    sessionStorage.removeItem("_resolved_gemini_key");
                                                    toast.success("Local key cleared");
                                                }}
                                                className="px-4 text-xs font-bold shrink-0"
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ Capabilities ═══ */}
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
                                            <Switch
                                                checked={memoryEnabled}
                                                onCheckedChange={(v) => { setMemoryEnabled(v); handleSaveSetting("foreform_memory_enabled", v); }}
                                            />
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

                            {/* ═══ Connectors ═══ */}
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

                            {/* ═══ Account ═══ */}
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

                            {/* ═══ Privacy ═══ */}
                            {activeTab === "privacy" && (
                                <div className="space-y-8">
                                    <header className="space-y-1.5">
                                        <h3 className="text font-bold">Privacy & Data</h3>
                                        <p className="text-sm text-muted-foreground">Control how your data is stored and used.</p>
                                    </header>

                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between p-6 rounded border border-border/50 bg-muted/10">
                                            <div className="space-y-1.5 pr-8">
                                                <h4 className="text-sm font-bold">Use conversations for training</h4>
                                                <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                    Allow ForeForm to learn from your conversations to improve the AI.
                                                </p>
                                            </div>
                                            <Switch defaultChecked={false} />
                                        </div>

                                        <div className="flex items-start justify-between p-6 rounded border border-border/50 bg-muted/10">
                                            <div className="space-y-1.5 pr-8">
                                                <h4 className="text-sm font-bold">Data retention</h4>
                                                <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                    Chat data is retained for 90 days then auto-deleted.
                                                </p>
                                            </div>
                                            <select className="px-3 py-1.5 rounded border border-border/50 bg-card text-xs font-bold">
                                                <option>30 days</option>
                                                <option>90 days</option>
                                                <option>1 year</option>
                                                <option>Forever</option>
                                            </select>
                                        </div>

                                        <div className="pt-6 border-t border-border/40">
                                            <Button variant="destructive" size="sm" className="rounded px-4 text-xs font-bold gap-2">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete all conversation data
                                            </Button>
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
