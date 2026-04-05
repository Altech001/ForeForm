import { LucideIcon, Type, AlignLeft, List, CheckSquare, Calendar, Mail, Hash } from "lucide-react";

export type Phase = "prompt" | "editor";

export interface Message {
    id: string;
    role: "user" | "ai";
    text: string;
}

export interface Question {
    id: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
}

export interface QuestionTypeInfo {
    value: string;
    label: string;
    icon: LucideIcon;
}

export const QUESTION_TYPES: QuestionTypeInfo[] = [
    { value: "short_text", label: "Short Text", icon: Type },
    { value: "long_text", label: "Long Text", icon: AlignLeft },
    { value: "multiple_choice", label: "Multiple Choice", icon: List },
    { value: "checkbox", label: "Checkboxes", icon: CheckSquare },
    { value: "dropdown", label: "Dropdown", icon: List },
    { value: "date", label: "Date", icon: Calendar },
    { value: "email", label: "Email", icon: Mail },
    { value: "number", label: "Number", icon: Hash },
];

export const TYPE_MAP: Record<string, string> = Object.fromEntries(
    QUESTION_TYPES.map((t) => [t.value, t.label])
);

export const HAS_OPTS = ["multiple_choice", "checkbox", "dropdown"];

export const EXAMPLES = [
    "Employee onboarding survey",
    "Customer satisfaction form",
    "Job application form",
    "Event registration",
    "Product feedback + NPS",
];
