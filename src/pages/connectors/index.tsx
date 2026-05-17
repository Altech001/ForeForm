import React from "react";
import AppHeader from "@/components/Header/AppHeader";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const connectorsData = [
    {
        id: "notion",
        name: "Notion",
        description: "Organize and sync knowledge or project data.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    },
    {
        id: "chatgpt",
        name: "Chatgpt",
        description: "Integrate Chatgpt for advanced AI capabilities.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    },
    {
        id: "gcal",
        name: "Google Calendar",
        description: "Manage your schedule and calendar events.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
    },
    {
        id: "gdrive",
        name: "Google Drive",
        description: "Export and back up app-generated files.",
        iconUrl: "/google-drive.svg",
    },
    {
        id: "gmail",
        name: "Gmail",
        description: "Automate email sending and inbox management.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
    },
    {
        id: "gsheets",
        name: "Google Sheets",
        description: "Sync and manage spreadsheet data.",
        iconUrl: "/google-sheets.svg",
    },
    {
        id: "gslides",
        name: "Google Slides",
        description: "Generate and manage presentations.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg",
    },
    {
        id: "gdocs",
        name: "Google Docs",
        description: "Manage and automate document creation.",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg",
    },
];

export default function ConnectorsPage() {
    return (
        <div className="min-h-screen bg-background">
            <SEO title="Connectors - ForeForm" />
            <AppHeader />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-2 lg:py-2">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3 text-foreground">
                        Connectors
                    </h1>
                    <p className="text-xs font-medium">Connect with your favorite tools and automate your workflows seamlessly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {connectorsData.map((connector) => (
                        <div
                            key={connector.id}
                            className="group bg-card border border-border/50 rounded p-6 flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden cursor-cell"
                        >
                            {/* Subtle background gradient on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="w-12 h-12 rounded border border-border/40 bg-transparent flex items-center justify-center mb-5 transition-all duration-300 z-10">
                                <img
                                    src={connector.iconUrl}
                                    alt={`${connector.name} icon`}
                                    className="w-7 h-7 object-contain drop-shadow-sm"
                                    onError={(e) => {
                                        // Fallback if image fails to load
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${connector.name}&background=random&color=fff&rounded=true`;
                                    }}
                                />
                            </div>

                            <h3 className="font-bold text-lg mb-2 z-10 group-hover:text-primary transition-colors">
                                {connector.name}
                            </h3>

                            <p className="text-sm text-muted-foreground mb-6 flex-1 z-10 leading-relaxed">
                                {connector.description}
                            </p>

                            <Button
                                variant="outline"
                                className="w-full border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 z-10 font-medium"
                            >
                                How to use
                            </Button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
