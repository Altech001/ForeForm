/**
 * ForeForm AI Agent
 * 
 * Gemini-powered AI assistant with tool-calling capabilities
 * for form building, survey generation, and document creation.
 */

const GEMINI_API_KEY = "AIzaSyC_K6gypZtwpCXTKMyWN55NWk01qaDXENA";
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Types ───────────────────────────────────────────────────────

export interface AgentMessage {
    role: "user" | "model";
    parts: AgentPart[];
}

export interface AgentPart {
    text?: string;
    functionCall?: { name: string; args: Record<string, any> };
    functionResponse?: { name: string; response: Record<string, any> };
    fileData?: { mimeType: string; fileUri?: string; data?: string };
    /** Raw part forwarded verbatim to the API (preserves thought_signature etc.) */
    _raw?: any;
}

export interface ToolDeclaration {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface AgentConfig {
    systemInstruction?: string;
    tools?: ToolDeclaration[];
    temperature?: number;
    maxOutputTokens?: number;
}

export interface AgentResponse {
    text: string;
    functionCalls?: { name: string; args: Record<string, any> }[];
    raw: any;
}

// ─── Built-in Tool Definitions ───────────────────────────────────

export const FOREFORM_TOOLS: ToolDeclaration[] = [
    {
        name: "generate_form_questions",
        description:
            "Generate structured form questions from a topic/description. Returns an array of question objects with id, label, type, required, and options fields. Types: short_text, long_text, multiple_choice, checkbox, dropdown, date, number, email.",
        parameters: {
            type: "object",
            properties: {
                topic: {
                    type: "string",
                    description: "The topic or description of the form/survey to generate questions for.",
                },
                num_questions: {
                    type: "number",
                    description: "Approximate number of questions to generate (default 10).",
                },
                question_style: {
                    type: "string",
                    description:
                        'Style of questions: "academic" for research surveys, "simple" for general forms, "likert" for rating scales.',
                    enum: ["academic", "simple", "likert", "mixed"],
                },
            },
            required: ["topic"],
        },
    },
    {
        name: "generate_form_sections",
        description:
            "Generate a multi-section form structure with organized questions grouped into logical sections. Each section has a title, description, and questions array.",
        parameters: {
            type: "object",
            properties: {
                topic: {
                    type: "string",
                    description: "The research topic or survey subject.",
                },
                num_sections: {
                    type: "number",
                    description: "Number of sections to create (default 4).",
                },
                include_demographics: {
                    type: "boolean",
                    description: "Whether to include a demographics section (default true).",
                },
                include_consent: {
                    type: "boolean",
                    description: "Whether to include a consent/intro section (default true for academic).",
                },
            },
            required: ["topic"],
        },
    },
    {
        name: "improve_question",
        description:
            "Improve or rewrite a single form question to be clearer, more professional, or better suited for academic research.",
        parameters: {
            type: "object",
            properties: {
                original_label: {
                    type: "string",
                    description: "The current question text.",
                },
                original_type: {
                    type: "string",
                    description: "The current question type.",
                },
                context: {
                    type: "string",
                    description: "Context about the form/survey this question belongs to.",
                },
                improvement_goal: {
                    type: "string",
                    description:
                        'What to improve: "clarity", "academic_tone", "add_options", "make_required", "simplify".',
                },
            },
            required: ["original_label"],
        },
    },
    {
        name: "generate_survey_docx_code",
        description:
            "Generate JavaScript code that creates a professional academic survey/questionnaire as a .docx file using the docx npm library. The code produces a complete, print-ready Word document with sections, Likert tables, demographic checkboxes, consent blocks, and open-ended questions.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The survey/study title.",
                },
                institution: {
                    type: "string",
                    description: "Institution or organization name.",
                },
                sections: {
                    type: "array",
                    description:
                        "Array of section objects with title, type (demographics/likert/open_ended/multiple_choice), and questions.",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            type: { type: "string" },
                            questions: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                    },
                },
                color_palette: {
                    type: "string",
                    description:
                        'Color scheme: "classic_blue" (default), "government_green", "warm_professional", "minimal_clean".',
                    enum: ["classic_blue", "government_green", "warm_professional", "minimal_clean"],
                },
            },
            required: ["title"],
        },
    },
    {
        name: "analyze_form",
        description:
            "Analyze an existing form's questions and provide suggestions for improvement, missing question types, better ordering, or accessibility issues.",
        parameters: {
            type: "object",
            properties: {
                questions: {
                    type: "array",
                    description: "Array of question objects from the form.",
                    items: {
                        type: "object",
                        properties: {
                            label: { type: "string" },
                            type: { type: "string" },
                            required: { type: "boolean" },
                            options: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                    },
                },
                form_purpose: {
                    type: "string",
                    description: "The purpose or goal of the form.",
                },
            },
            required: ["questions"],
        },
    },
    {
        name: "extract_questions_from_text",
        description:
            "Extract and structure form questions from raw text (e.g., pasted from a PDF or document). Returns structured question objects.",
        parameters: {
            type: "object",
            properties: {
                text: {
                    type: "string",
                    description: "Raw text content containing questions.",
                },
                target_format: {
                    type: "string",
                    description:
                        'Output format: "form" for ForeForm questions, "docx" for document code.',
                    enum: ["form", "docx"],
                },
            },
            required: ["text"],
        },
    },
    {
        name: "create_form_template",
        description:
            "Create a complete, ready-to-use form template with title, description, branding, and structured questions. Templates are professionally designed and immediately usable. Use this when the user asks to create, build, make, or generate a form, survey, or questionnaire.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The title of the form template.",
                },
                description: {
                    type: "string",
                    description: "A brief description of the form's purpose.",
                },
                category: {
                    type: "string",
                    description: "Category of the template.",
                    enum: ["HR", "Health", "Education", "Events", "Business", "Research", "Government", "Other"],
                },
                branding: {
                    type: "object",
                    description: "Branding options for the form.",
                    properties: {
                        organization: { type: "string", description: "Organization name." },
                        theme: { type: "string", description: "Color theme.", enum: ["blue", "rose", "amber", "emerald", "indigo", "slate"] },
                        ethics_statement: { type: "string", description: "Ethics or privacy statement." },
                    },
                },
                questions: {
                    type: "array",
                    description: "Array of form questions.",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            type: { type: "string", enum: ["short_text", "long_text", "multiple_choice", "checkbox", "dropdown", "date", "number", "email"] },
                            label: { type: "string" },
                            required: { type: "boolean" },
                            options: { type: "array", items: { type: "string" } },
                        },
                        required: ["label", "type"],
                    },
                },
            },
            required: ["title", "questions"],
        },
    },
];

// ─── System Instruction ──────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are ForeForm AI — an intelligent, conversational assistant built into the ForeForm survey and form builder platform.

## Your Core Capabilities
1. **Form & Survey Creation**: Generate professional forms and surveys with structured questions. You can create flat question lists OR multi-section surveys.
2. **Template Building**: Produce complete, ready-to-use form templates with branding, categories, and well-crafted questions. Use the create_form_template tool for this.
3. **Question Generation**: Create individual questions or batches for any domain — academic research, business, health, education, events.
4. **Survey Design**: Design academic-quality research instruments with: consent sections, demographics, Likert scales, open-ended questions.
5. **Form Analysis**: Review and improve existing forms.
6. **Document Generation**: Produce .docx survey documents.

## CRITICAL OUTPUT RULES
When you generate questions or sections, you MUST include them as a JSON code block in your response so the UI can parse and display them. Format:

For questions:
\`\`\`json
[
  { "id": "q_xxx", "label": "Question text", "type": "short_text", "required": true, "options": [] },
  ...
]
\`\`\`

For sections:
\`\`\`json
[
  { "title": "Section Title", "description": "Description", "order": 0, "questions": [{ "id": "q_xxx", "label": "Q", "type": "short_text", "required": true, "options": [] }] },
  ...
]
\`\`\`

## Question Types Available
short_text, long_text, multiple_choice, checkbox, dropdown, date, number, email

## Academic Survey Best Practices
- Consent/introduction section first
- Demographics early (gender, age, education, occupation)
- Likert scales for agreement/satisfaction (use multiple_choice with 5-point scale options)
- Open-ended questions at the end
- Clear, unbiased, non-leading question wording
- 3-6 questions per section for optimal respondent focus

## Conversation Style
- Be concise but thorough
- Remember previous messages in the conversation — refer back to earlier context naturally
- If the request is vague, ask ONE focused clarifying question before generating
- After generating, offer next steps (e.g., "Want me to add more questions?" or "Should I reorganize into sections?")
- Use a warm, professional tone`;

// ─── Core Agent Class ────────────────────────────────────────────

export class ForeFormAgent {
    private history: AgentMessage[] = [];
    private config: AgentConfig;
    private toolHandlers: Map<string, (args: Record<string, any>) => Promise<any>>;

    constructor(config?: Partial<AgentConfig>) {
        this.config = {
            systemInstruction: config?.systemInstruction || SYSTEM_INSTRUCTION,
            tools: config?.tools || FOREFORM_TOOLS,
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxOutputTokens ?? 8192,
        };
        this.toolHandlers = new Map();
        this.registerDefaultHandlers();
    }

    // Register a custom tool handler
    registerTool(name: string, handler: (args: Record<string, any>) => Promise<any>) {
        this.toolHandlers.set(name, handler);
    }

    // Clear conversation history
    clearHistory() {
        this.history = [];
    }

    // Get conversation history
    getHistory(): AgentMessage[] {
        return [...this.history];
    }

    // ─── Main Chat Method ────────────────────────────────────────

    async chat(userMessage: string, options?: { files?: { mimeType: string; data: string }[], search?: boolean, model?: string }): Promise<AgentResponse> {
        // Add user message to history
        const parts: AgentPart[] = [{ text: userMessage }];

        if (options?.files) {
            options.files.forEach(f => {
                parts.push({ fileData: { mimeType: f.mimeType, data: f.data } });
            });
        }

        this.history.push({
            role: "user",
            parts,
        });

        // Call Gemini
        const response = await this.callGemini(options?.search, options?.model);

        // Check for function calls
        const candidate = response?.candidates?.[0];
        const parts_res = candidate?.content?.parts || [];

        const functionCalls = parts_res
            .filter((p: any) => p.functionCall)
            .map((p: any) => ({
                name: p.functionCall.name,
                args: p.functionCall.args,
            }));

        // If there are function calls, execute them and continue
        if (functionCalls.length > 0) {
            // Store raw parts verbatim — this preserves thought_signature and other
            // metadata that the API requires on subsequent turns.
            this.history.push({
                role: "model",
                parts: parts_res.map((p: any) => ({ _raw: p })),
            });

            // Execute each function call
            const functionResponses: AgentPart[] = [];
            for (const fc of functionCalls) {
                const result = await this.executeTool(fc.name, fc.args);
                functionResponses.push({
                    functionResponse: {
                        name: fc.name,
                        response: result,
                    },
                });
            }

            // Add function responses to history
            this.history.push({
                role: "user",
                parts: functionResponses,
            });

            // Call Gemini again with the function results
            const followUp = await this.callGemini(options?.search, options?.model);
            const followUpParts = followUp?.candidates?.[0]?.content?.parts || [];
            const text = followUpParts.map((p: any) => p.text || "").join("");

            // Add final response to history
            this.history.push({
                role: "model",
                parts: [{ text }],
            });

            return { text, functionCalls, raw: followUp };
        }

        // No function calls — just a text response
        const text = parts_res.map((p: any) => p.text || "").join("");
        this.history.push({
            role: "model",
            parts: [{ text }],
        });

        return { text, raw: response };
    }

    // ─── Gemini API Call ─────────────────────────────────────────

    private async callGemini(useSearch: boolean = false, modelOverride?: string): Promise<any> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelOverride || GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const body: any = {
            contents: this.history.map((msg) => ({
                role: msg.role,
                parts: msg.parts.map((p) => {
                    // If we stored a raw part, forward it verbatim to preserve
                    // thought_signature and other API-required fields.
                    if (p._raw !== undefined) return p._raw;
                    if (p.functionCall) return { functionCall: p.functionCall };
                    if (p.functionResponse) return { functionResponse: p.functionResponse };
                    if (p.fileData) {
                        return {
                            inline_data: {
                                mime_type: p.fileData.mimeType,
                                data: p.fileData.data,
                            }
                        };
                    }
                    return { text: p.text || "" };
                }),
            })),
            generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxOutputTokens,
            },
        };

        if (this.config.systemInstruction) {
            body.systemInstruction = {
                parts: [{ text: this.config.systemInstruction }],
            };
        }

        const tools: any[] = [];
        if (this.config.tools && this.config.tools.length > 0) {
            tools.push({
                functionDeclarations: this.config.tools,
            });
        }

        if (useSearch) {
            tools.push({
                google_search_retrieval: {
                    dynamic_retrieval_config: {
                        mode: "unspecified",
                        dynamic_threshold: 0.06
                    }
                }
            });
        }

        if (tools.length > 0) {
            body.tools = tools;
        }

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
        }

        return await res.json();
    }

    // ─── Tool Execution ──────────────────────────────────────────

    private async executeTool(name: string, args: Record<string, any>): Promise<any> {
        const handler = this.toolHandlers.get(name);
        if (handler) {
            try {
                return await handler(args);
            } catch (err: any) {
                return { error: err.message || "Tool execution failed" };
            }
        }
        return { error: `No handler registered for tool: ${name}` };
    }

    // ─── Default Tool Handlers ───────────────────────────────────

    private registerDefaultHandlers() {
        // generate_form_questions: Use Gemini itself to generate
        this.registerTool("generate_form_questions", async (args) => {
            const { topic, num_questions = 10, question_style = "mixed" } = args;
            // The agent will use its own knowledge to generate — we return a prompt result
            return {
                status: "success",
                message: `Generate ${num_questions} ${question_style}-style questions about: ${topic}`,
                instruction:
                    "Return the questions as a JSON array with fields: id (string), label (string), type (string), required (boolean), options (string array).",
            };
        });

        // generate_form_sections: Structured section generation
        this.registerTool("generate_form_sections", async (args) => {
            const {
                topic,
                num_sections = 4,
                include_demographics = true,
                include_consent = true,
            } = args;
            return {
                status: "success",
                message: `Create ${num_sections} sections for a survey about: ${topic}`,
                include_demographics,
                include_consent,
                instruction:
                    "Return as JSON array of objects with: title, description, order, questions (each with id, label, type, required, options).",
            };
        });

        // improve_question
        this.registerTool("improve_question", async (args) => {
            return {
                status: "success",
                original: args.original_label,
                goal: args.improvement_goal || "clarity",
                instruction: "Return improved question as JSON with: label, type, required, options.",
            };
        });

        // generate_survey_docx_code
        this.registerTool("generate_survey_docx_code", async (args) => {
            return {
                status: "success",
                title: args.title,
                institution: args.institution || "Research Institution",
                palette: args.color_palette || "classic_blue",
                sections: args.sections || [],
                instruction:
                    "Generate complete JavaScript code using the docx npm library following the fillable-survey-docx skill patterns. Include proper imports, page setup, headers/footers, and all sections.",
            };
        });

        // analyze_form
        this.registerTool("analyze_form", async (args) => {
            const { questions, form_purpose } = args;
            return {
                status: "success",
                question_count: questions?.length || 0,
                purpose: form_purpose || "general",
                instruction:
                    "Analyze the questions for: clarity, bias, missing question types, ordering, accessibility. Return suggestions as structured JSON.",
            };
        });

        // extract_questions_from_text
        this.registerTool("extract_questions_from_text", async (args) => {
            return {
                status: "success",
                text_length: args.text?.length || 0,
                target_format: args.target_format || "form",
                instruction:
                    "Parse the text and extract all questions. Return as JSON array with: label, type, required, options.",
            };
        });

        // create_form_template — returns the structured template for the UI to create
        this.registerTool("create_form_template", async (args) => {
            const questions = (args.questions || []).map((q: any, i: number) => ({
                id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
                type: q.type || "short_text",
                label: q.label || `Question ${i + 1}`,
                required: q.required !== undefined ? q.required : false,
                options: Array.isArray(q.options) ? q.options : [],
            }));

            return {
                status: "success",
                template: {
                    title: args.title,
                    description: args.description || "",
                    category: args.category || "Other",
                    branding: args.branding || {},
                    questions,
                    question_count: questions.length,
                },
                instruction: `Template "${args.title}" created with ${questions.length} questions. Present the questions as a JSON code block so the UI can render them.`,
            };
        });
    }
}

// ─── Singleton Instance ──────────────────────────────────────────

let _agentInstance: ForeFormAgent | null = null;

export function getAgent(): ForeFormAgent {
    if (!_agentInstance) {
        _agentInstance = new ForeFormAgent();
    }
    return _agentInstance;
}

// ─── Convenience Functions ───────────────────────────────────────

/**
 * Quick one-shot prompt to Gemini (no tools, no history).
 */
export async function quickPrompt(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 4096,
        },
    };

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Generate structured form questions from a topic.
 */
export async function generateQuestions(
    topic: string,
    count: number = 10,
    style: "academic" | "simple" | "likert" | "mixed" = "mixed"
): Promise<any[]> {
    const prompt = `Generate exactly ${count} survey questions about "${topic}" in ${style} style.

Return ONLY valid JSON — no markdown, no explanation. Format:
[
  {
    "id": "q_xxx",
    "label": "Question text here",
    "type": "short_text|long_text|multiple_choice|checkbox|dropdown|date|number|email",
    "required": true,
    "options": ["Option 1", "Option 2"]
  }
]

For multiple_choice/checkbox/dropdown types, include 3-5 options. For other types, options should be an empty array.`;

    const text = await quickPrompt(prompt, { temperature: 0.6 });

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");

    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate multi-section form structure.
 */
export async function generateSections(
    topic: string,
    numSections: number = 4,
    options?: { demographics?: boolean; consent?: boolean }
): Promise<any[]> {
    const prompt = `Create a ${numSections}-section academic survey structure about "${topic}".
${options?.consent !== false ? "Include a consent/introduction section first." : ""}
${options?.demographics !== false ? "Include a demographics section." : ""}

Return ONLY valid JSON — no markdown. Format:
[
  {
    "title": "Section Title",
    "description": "Brief section description",
    "order": 0,
    "questions": [
      {
        "id": "q_xxx",
        "label": "Question text",
        "type": "short_text|long_text|multiple_choice|checkbox|dropdown|date|number|email",
        "required": true,
        "options": []
      }
    ]
  }
]

Include 3-6 questions per section. Use appropriate types for each question.`;

    const text = await quickPrompt(prompt, { temperature: 0.6 });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const sections = JSON.parse(jsonMatch[0]);
    // Ensure all questions have IDs
    return sections.map((s: any, si: number) => ({
        ...s,
        order: si,
        questions: (s.questions || []).map((q: any) => ({
            ...q,
            id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
            options: q.options || [],
        })),
    }));
}

export default {
    ForeFormAgent,
    getAgent,
    quickPrompt,
    generateQuestions,
    generateSections,
    FOREFORM_TOOLS,
};
