import { base44 } from "@/api/foreform";

export interface AIProviderContext {
    messages: { role: "user" | "ai"; text: string }[];
    systemPrompt?: string;
    temperature?: number;
    fileContent?: string;
    apiKey?: string;
    refinePrompt?: string;
}

export const AIService = {
    async invoke(model: string, ctx: AIProviderContext) {
        // Deep copy messages so we don't mutate frontend React state implicitly
        const preparedMessages = ctx.messages.map(m => ({ ...m }));
        let base64Image = "";

        if (ctx.fileContent && preparedMessages.length > 0) {
            const last = preparedMessages[preparedMessages.length - 1];
            if (last.role === "user") {
                if (ctx.fileContent.startsWith("[IMAGE_BASE64]")) {
                    base64Image = ctx.fileContent.replace("[IMAGE_BASE64]", "");
                } else if (!last.text.includes("[Context from uploaded document]")) {
                    last.text += `\n\n[Context from uploaded document]:\n${ctx.fileContent.substring(0, 15000)}`;
                }
            }
        }

        if (model.startsWith("gemini")) {
            return this.invokeGemini(model, { ...ctx, messages: preparedMessages }, base64Image);
        } else if (model.startsWith("openai")) {
            return this.invokeOpenAI({ ...ctx, messages: preparedMessages }, base64Image);
        } else {
            return this.invokeBase44({ ...ctx, messages: preparedMessages }, base64Image);
        }
    },

    async invokeBase44(ctx: AIProviderContext, base64Image: string) {
        const flatPrompt = ctx.messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n");
        const prompt = flatPrompt + (ctx.refinePrompt ? `\nAdditional instruction: ${ctx.refinePrompt}` : "");
        // Base44 API directly cannot read images inside text efficiently unless it supports image urls.
        // We'll just pass a textual note if it's an image.
        const finalPrompt = base64Image ? `[User supplied an image. Image context not fully supported by this model]\n${prompt}` : prompt;
        const result = await base44.integrations.Core.InvokeLLM({ prompt: finalPrompt });
        let data = typeof result === "string" ? JSON.parse(result) : result;
        if (typeof data === "string") data = JSON.parse(data);
        return data;
    },

    async invokeGemini(model: string, ctx: AIProviderContext, base64Image: string) {
        if (!ctx.apiKey) throw new Error("Gemini API key is missing. Please add it in settings.");
        
        // Gemini expects either  typically.
        const targetModel = model.replace("gemini", "gemini-flash-latest"); // default fallback if just 'gemini'
        const safeModel = targetModel === "gemini-3" || targetModel === "gemini-flash-latest" ? targetModel : "gemini-flash-latest";

        let inlineData = undefined;
        if (base64Image) {
            // base64Image looks like data:image/png;base64,iVBORw0KGgo...
            const match = base64Image.match(/^data:(.+);base64,(.*)$/);
            if (match) {
                inlineData = { mime_type: match[1], data: match[2] };
            }
        }

        const contents = ctx.messages.map((m, i) => {
            const parts: any[] = [{ text: m.text + (m.role === "user" && ctx.refinePrompt && i === ctx.messages.length - 1 ? `\nAdditional instruction: ${ctx.refinePrompt}` : "") }];
            // Attach image only to the last user message
            if (m.role === "user" && inlineData && i === ctx.messages.length - 1) {
                parts.push({ inline_data: inlineData });
            }
            return {
                role: m.role === "ai" ? "model" : "user",
                parts
            };
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${ctx.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: ctx.systemPrompt || "You are an interactive AI form builder. Always return valid JSON." }]
                },
                contents,
                generationConfig: {
                    temperature: ctx.temperature || 0.7,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Gemini API error");
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Invalid response from Gemini");

        return JSON.parse(textResponse);
    },

    async invokeOpenAI(ctx: AIProviderContext, base64Image: string) {
        if (!ctx.apiKey) throw new Error("OpenAI API key is missing. Please add it in settings.");

        const messages = [
            { role: "system", content: ctx.systemPrompt || "You are an interactive AI form builder. Always return valid JSON." },
            ...ctx.messages.map((m, i) => {
                const textWithRefine = m.text + (m.role === "user" && ctx.refinePrompt && i === ctx.messages.length - 1 ? `\nAdditional instruction: ${ctx.refinePrompt}` : "");
                
                if (m.role === "user" && base64Image && i === ctx.messages.length - 1) {
                    return {
                        role: "user",
                        content: [
                            { type: "text", text: textWithRefine },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    };
                }

                return {
                    role: m.role === "ai" ? "assistant" : "user",
                    content: textWithRefine
                };
            })
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ctx.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // fallback to gpt-4o-mini but it supports images too
                messages,
                temperature: ctx.temperature || 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "OpenAI API error");
        }

        const data = await response.json();
        const textResponse = data.choices?.[0]?.message?.content;
        if (!textResponse) throw new Error("Invalid response from OpenAI");

        return JSON.parse(textResponse);
    }
};
