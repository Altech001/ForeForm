import { useState, useEffect } from "react";

export type AIModel = "base44" | "gemini-flash-latest" | "gemini-3-flash" | "openai";

export interface AgentSettings {
    model: AIModel;
    geminiApiKey: string;
    openAIApiKey: string;
    systemPrompt: string;
    temperature: number;
}

const DEFAULT_SETTINGS: AgentSettings = {
    model: "base44",
    geminiApiKey: "",
    openAIApiKey: "",
    systemPrompt: `You are an interactive AI form builder like Claude. The user will converse with you to build a form. Ask clarifying questions until you know enough. You can formulate the title of the form instead of relying strictly on the prompt. If you need more details from the user, set type to "message". When generating the form, set type to "form". Do NOT output markdown block around JSON. Output ONLY a raw JSON object with the following schema:
{
  "type": "message" | "form",
  "text": "Your textual response to the user",
  "title": "Only if type=form. Autogenerate a descriptive title.",
  "questions": [ { "id": "uid", "type": "short_text|long_text|multiple_choice|checkbox|dropdown|date|email|number", "label": "...", "required": true, "options": ["opt1"] } ]
}
Always return strictly valid JSON matching this schema.`,
    temperature: 0.7,
};

export function useAgentSettings() {
    const [settings, setSettings] = useState<AgentSettings>(() => {
        const saved = localStorage.getItem("form_agent_settings");
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem("form_agent_settings", JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (updates: Partial<AgentSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
    };

    return { settings, updateSettings };
}
