import { Type, AlignLeft, CircleDot, CheckSquare, ChevronDown, Calendar, Hash, Mail } from "lucide-react";

const iconMap = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: CircleDot,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  date: Calendar,
  number: Hash,
  email: Mail,
};

const labelMap = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  date: "Date",
  number: "Number",
  email: "Email",
};

export function getQuestionTypeLabel(type) {
  return labelMap[type] || type;
}

export default function QuestionTypeIcon({ type, className = "w-4 h-4" }) {
  const Icon = iconMap[type] || Type;
  return <Icon className={className} />;
}