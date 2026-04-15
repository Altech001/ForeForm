---
name: foreform-ai-agent
description: >
  System skill defining the ForeForm AI Agent architecture. This agent uses the Gemini API
  (gemini-flash-latest) with function/tool-calling to help users build forms, generate surveys,
  create .docx research instruments, and analyze existing questionnaires. The agent has access
  to tools for: generating form questions, creating multi-section surveys, improving question
  wording, generating survey DOCX code, analyzing forms, and extracting questions from text.
---

# ForeForm AI Agent — Architecture & Usage

## Overview

The ForeForm AI Agent (`src/lib/ai_agent.tsx`) is a Gemini-powered assistant that supports the form-building workflow. It uses **function calling** to perform structured actions and maintains **conversation history** for multi-turn interactions.

---

## API Configuration

| Setting | Value |
|---|---|
| Model | `gemini-flash-latest` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent` |
| API Key | Stored in `ai_agent.tsx` constant |
| Temperature | 0.7 (default) |
| Max Tokens | 8192 (default) |

---

## Available Tools

The agent has 6 registered tools:

### 1. `generate_form_questions`
Generate structured form questions from a topic.
- **Input**: `topic` (required), `num_questions`, `question_style` (academic/simple/likert/mixed)
- **Output**: Array of question objects `{ id, label, type, required, options }`

### 2. `generate_form_sections`
Create a multi-section survey structure with organized questions.
- **Input**: `topic` (required), `num_sections`, `include_demographics`, `include_consent`
- **Output**: Array of section objects `{ title, description, order, questions[] }`

### 3. `improve_question`
Rewrite or improve a single form question.
- **Input**: `original_label` (required), `original_type`, `context`, `improvement_goal`
- **Output**: Improved question object

### 4. `generate_survey_docx_code`
Generate JavaScript code for creating a .docx survey document.
- **Input**: `title` (required), `institution`, `sections[]`, `color_palette`
- **Output**: Complete JS code using the `docx` npm library

### 5. `analyze_form`
Review existing form questions and suggest improvements.
- **Input**: `questions[]` (required), `form_purpose`
- **Output**: Structured analysis with suggestions

### 6. `extract_questions_from_text`
Extract questions from raw text (pasted PDF/doc content).
- **Input**: `text` (required), `target_format` (form/docx)
- **Output**: Structured question array

---

## Usage Patterns

### Pattern 1: Multi-Turn Chat (with tools)

```typescript
import { getAgent } from "@/lib/ai_agent";

const agent = getAgent();

// First message — agent may call tools
const response1 = await agent.chat("Create a 5-section survey about e-learning satisfaction");
console.log(response1.text);
console.log(response1.functionCalls); // tools that were called

// Follow-up — agent remembers context
const response2 = await agent.chat("Add more Likert scale questions to section 3");
console.log(response2.text);

// Clear when done
agent.clearHistory();
```

### Pattern 2: Quick One-Shot (no tools, no history)

```typescript
import { quickPrompt } from "@/lib/ai_agent";

const answer = await quickPrompt("Explain the difference between Likert and semantic differential scales");
console.log(answer);
```

### Pattern 3: Generate Questions Directly

```typescript
import { generateQuestions } from "@/lib/ai_agent";

const questions = await generateQuestions("customer satisfaction", 8, "likert");
// Returns parsed JSON array ready to inject into form state
```

### Pattern 4: Generate Sections Directly

```typescript
import { generateSections } from "@/lib/ai_agent";

const sections = await generateSections("mobile banking usability", 5, {
  demographics: true,
  consent: true,
});
// Returns parsed section array ready for FormSection API
```

### Pattern 5: Custom Tool Registration

```typescript
import { getAgent } from "@/lib/ai_agent";

const agent = getAgent();

// Add a custom tool
agent.registerTool("search_templates", async (args) => {
  const results = await fetch(`/api/templates?q=${args.query}`);
  return await results.json();
});
```

---

## Integration Points

| Component | How it uses the agent |
|---|---|
| `ImportPanel.tsx` | Can use `extract_questions_from_text` to parse pasted content |
| `FormBuilder.tsx` | Can use `generateQuestions()` to add AI-generated questions |
| `FormSectionsPanel.tsx` | Can use `generateSections()` to populate sections |
| `ComplexAI.tsx` | Full chat interface with multi-turn conversation |
| DOCX export | Can use `generate_survey_docx_code` to create printable surveys |

---

## Related Skills

| Skill File | Purpose |
|---|---|
| `tools/DocSkills.md` | DOCX creation, editing, and XML manipulation |
| `tools/reference/Skills.md` | Fillable survey DOCX generation patterns |
| `tools/Skills.md` | PDF processing (read, merge, split, OCR) |
| `tools/reference/question_type.md` | Survey question type patterns for DOCX |
| `tools/reference/acdemic_color_palette.md` | Color schemes for academic documents |

---

## Error Handling

The agent wraps all tool executions in try/catch blocks. If a tool fails, the error is returned as a `functionResponse` with an `error` field, allowing Gemini to explain the failure to the user gracefully.

```typescript
try {
  const response = await agent.chat("Generate survey questions");
} catch (err) {
  // Network error or Gemini API failure
  console.error("Agent error:", err.message);
}
```

---

## Architecture

```
User Input
    │
    ▼
┌──────────────────┐
│  ForeFormAgent    │
│  (ai_agent.tsx)  │
├──────────────────┤
│ • history[]      │ ◄── conversation memory
│ • config         │ ◄── system prompt + tools
│ • toolHandlers   │ ◄── registered functions
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Gemini API      │
│  (Flash Latest)  │
├──────────────────┤
│ • generateContent│
│ • functionCalling│
└──────┬───────────┘
       │
       ▼
  ┌────┴────┐
  │ Text    │ ──► Direct response to user
  │ or      │
  │ Tool    │ ──► Execute handler ──► Feed result back to Gemini ──► Final response
  └─────────┘
```
