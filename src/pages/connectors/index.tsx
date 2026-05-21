/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/Header/AppHeader";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/foreform";
import { CheckCircle2, Loader2, PlugZap, RefreshCw, Settings2, Unplug, X } from "lucide-react";
import { toast } from "sonner";

type ConnectionStatus = {
    provider: string;
    is_connected: boolean;
    connected_email?: string;
    connected_at?: string;
    scopes?: string;
    setup_required?: boolean;
    message?: string;
};

type Connector = {
    id: string;
    provider: string;
    name: string;
    group: "Google" | "Social";
    description: string;
    iconUrl: string;
    auth: "google" | "twitter";
};

const TWITTER_VERIFIER_KEY = "foreform:twitter-oauth-verifier";
const TWITTER_REDIRECT_URI_KEY = "foreform:twitter-oauth-redirect-uri";

const connectorsData: Connector[] = [
    {
        id: "twitter",
        provider: "twitter",
        name: "Twitter X",
        group: "Social",
        description: "Publish form links and coordinate response campaigns from ForeForm.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Twitter_X.png/960px-Twitter_X.png",
        auth: "twitter",
    },
    {
        id: "youtube",
        provider: "youtube",
        name: "YouTube",
        group: "Google",
        description: "Connect a YouTube channel for AI-assisted video and campaign workflows.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
        auth: "google",
    },
    {
        id: "gdrive",
        provider: "google_drive",
        name: "Google Drive",
        group: "Google",
        description: "Export, back up, and browse app-generated files from your Drive.",
        iconUrl: "/google-drive.svg",
        auth: "google",
    },
    {
        id: "gsheets",
        provider: "google_sheets",
        name: "Google Sheets",
        group: "Google",
        description: "Sync form responses into spreadsheets without manual CSV work.",
        iconUrl: "/google-sheets.svg",
        auth: "google",
    },
    {
        id: "gmail",
        provider: "gmail",
        name: "Gmail",
        group: "Google",
        description: "Enable email sending and inbox-aware workflows for forms and tasks.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
        auth: "google",
    },
];

function providerStatus(statuses: ConnectionStatus[], provider: string) {
    return statuses.find((item) => item.provider === provider);
}

function formatDate(value?: string) {
    if (!value) return "Not connected yet";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function ConnectorsPage() {
    const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyProvider, setBusyProvider] = useState<string | null>(null);

    const selected = useMemo(
        () => connectorsData.find((connector) => connector.id === selectedId) || null,
        [selectedId]
    );
    const selectedStatus = selected ? providerStatus(statuses, selected.provider) : undefined;
    const connectedCount = connectorsData.filter((connector) => providerStatus(statuses, connector.provider)?.is_connected).length;

    const fetchStatuses = async () => {
        setLoading(true);
        try {
            const data = await base44.integrations.Connections.status();
            setStatuses(data);
        } catch (err: any) {
            toast.error(err?.message || "Failed to load connection status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    const handleConnect = async (connector: Connector) => {
        setBusyProvider(connector.provider);
        try {
            if (connector.auth === "twitter") {
                const { auth_url, code_verifier, redirect_uri } = await base44.integrations.Twitter.getAuthUrl();
                localStorage.setItem(TWITTER_VERIFIER_KEY, code_verifier);
                if (redirect_uri) {
                    localStorage.setItem(TWITTER_REDIRECT_URI_KEY, redirect_uri);
                }
                window.location.href = auth_url;
                return;
            }

            const { auth_url } = await base44.integrations.Google.getAuthUrl(connector.provider);
            window.location.href = auth_url;
        } catch (err: any) {
            toast.error(err?.message || `Failed to start ${connector.name} connection`);
            setBusyProvider(null);
        }
    };

    const handleDisconnect = async (connector: Connector) => {
        setBusyProvider(connector.provider);
        try {
            if (connector.auth === "twitter") {
                await base44.integrations.Twitter.disconnect();
            } else {
                await base44.integrations.Google.disconnect(connector.provider);
            }
            toast.success(`${connector.name} disconnected`);
            await fetchStatuses();
        } catch (err: any) {
            toast.error(err?.message || `Failed to disconnect ${connector.name}`);
        } finally {
            setBusyProvider(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <SEO title="Connectors - ForeForm" />
            <AppHeader />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 lg:py-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                            Connectors
                        </h1>
                        <p className="text-xs font-medium text-muted-foreground mt-2">
                            Connect ForeForm to real external accounts. Connection records are loaded from your database.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="rounded">
                            {connectedCount} connected
                        </Badge>
                        <Button variant="outline" size="sm" onClick={fetchStatuses} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {connectorsData.map((connector) => {
                        const status = providerStatus(statuses, connector.provider);
                        const isConnected = Boolean(status?.is_connected);
                        const isBusy = busyProvider === connector.provider;
                        const isSelected = selected?.id === connector.id;

                        return (
                            <button
                                key={connector.id}
                                type="button"
                                onClick={() => setSelectedId(connector.id)}
                                className={`group text-left bg-card border rounded p-6 flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden min-h-[250px] ${
                                    isSelected ? "border-primary/60 shadow-lg shadow-primary/5" : "border-border/50"
                                }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex items-start justify-between gap-3 z-10">
                                    <div className="w-12 h-12 rounded border border-border/40 bg-transparent flex items-center justify-center transition-all duration-300">
                                        <img
                                            src={connector.iconUrl}
                                            alt={`${connector.name} icon`}
                                            className="w-7 h-7 object-contain drop-shadow-sm"
                                            onError={(event) => {
                                                (event.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${connector.name}&background=111827&color=fff&rounded=true`;
                                            }}
                                        />
                                    </div>
                                    <Badge variant={isConnected ? "default" : "outline"} className="rounded z-10">
                                        {isConnected ? "Connected" : status?.setup_required ? "Setup needed" : "Available"}
                                    </Badge>
                                </div>

                                <h3 className="font-bold text-lg mt-5 mb-2 z-10 group-hover:text-primary transition-colors">
                                    {connector.name}
                                </h3>

                                <p className="text-sm text-muted-foreground mb-6 flex-1 z-10 leading-relaxed">
                                    {connector.description}
                                </p>

                                <div className="mt-auto flex gap-2 z-10">
                                    {isConnected ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            disabled={isBusy}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDisconnect(connector);
                                            }}
                                        >
                                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-medium"
                                            disabled={isBusy || status?.setup_required}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleConnect(connector);
                                            }}
                                        >
                                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </section>

                {selected && (
                    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[390px] border-l border-border bg-white shadow-2xl">
                        <div className="h-full overflow-y-auto p-5 pt-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded flex items-center justify-center">
                                        <img src={selected.iconUrl} alt="" className="w-7 h-7 object-contain" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">{selected.name}</h2>
                                        <p className="text-xs text-muted-foreground">{selected.group}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Close connection details">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="mt-6 flex items-center gap-2">
                                {selectedStatus?.is_connected ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Settings2 className="w-5 h-5 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">
                                    {selectedStatus?.is_connected ? "Connected" : selectedStatus?.setup_required ? "Server setup required" : "Not connected"}
                                </p>
                            </div>

                            <div className="mt-6 space-y-5 text-sm">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">Account</p>
                                    <p className="mt-1 font-medium break-words">{selectedStatus?.connected_email || "No account connected"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">Connected At</p>
                                    <p className="mt-1 font-medium">{formatDate(selectedStatus?.connected_at)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">Scopes</p>
                                    <p className="mt-1 text-muted-foreground leading-relaxed break-words">
                                        {selectedStatus?.scopes || "Scopes will appear after the provider status is loaded."}
                                    </p>
                                </div>
                                {selectedStatus?.message && (
                                    <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded p-3 text-xs leading-relaxed">
                                        {selectedStatus.message}
                                    </div>
                                )}
                            </div>

                            <div className="mt-7">
                                {selectedStatus?.is_connected ? (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={busyProvider === selected.provider}
                                        onClick={() => handleDisconnect(selected)}
                                    >
                                        {busyProvider === selected.provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                                        Disconnect {selected.name}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        disabled={busyProvider === selected.provider || selectedStatus?.setup_required}
                                        onClick={() => handleConnect(selected)}
                                    >
                                        {busyProvider === selected.provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
                                        Connect {selected.name}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </main>
        </div>
    );
}
