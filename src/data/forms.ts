export type FormFieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "email" | "number";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  fields: FormField[];
  createdAt: string;
  status: "active" | "draft" | "archived";
  responseCount: number;
}

export const categories = ["All", "HR", "IT", "Finance", "Marketing", "Operations", "Health & Safety"];

export const formTemplates: FormTemplate[] = [
  {
    id: "1",
    title: "Employee Satisfaction Survey",
    description: "Annual survey to measure employee happiness and engagement across departments.",
    category: "HR",
    status: "active",
    responseCount: 142,
    createdAt: "2026-03-15",
    fields: [
      { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
      { id: "f2", label: "Department", type: "select", required: true, options: ["Engineering", "Marketing", "Sales", "HR", "Finance"] },
      { id: "f3", label: "How satisfied are you with your role?", type: "radio", required: true, options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
      { id: "f4", label: "What could we improve?", type: "textarea", required: false, placeholder: "Share your thoughts..." },
      { id: "f5", label: "Would you recommend this company?", type: "radio", required: true, options: ["Definitely", "Probably", "Not Sure", "Probably Not", "Definitely Not"] },
    ],
  },
  {
    id: "2",
    title: "IT Equipment Request",
    description: "Request new hardware or software for your workstation.",
    category: "IT",
    status: "active",
    responseCount: 67,
    createdAt: "2026-02-20",
    fields: [
      { id: "f1", label: "Requester Name", type: "text", required: true, placeholder: "Jane Smith" },
      { id: "f2", label: "Email", type: "email", required: true, placeholder: "jane@company.com" },
      { id: "f3", label: "Equipment Type", type: "select", required: true, options: ["Laptop", "Monitor", "Keyboard", "Mouse", "Software License", "Other"] },
      { id: "f4", label: "Justification", type: "textarea", required: true, placeholder: "Explain why you need this equipment..." },
      { id: "f5", label: "Urgency", type: "radio", required: true, options: ["Low", "Medium", "High", "Critical"] },
      { id: "f6", label: "Preferred Delivery Date", type: "date", required: false },
    ],
  },
  {
    id: "3",
    title: "Budget Approval Form",
    description: "Submit budget requests for departmental expenses and projects.",
    category: "Finance",
    status: "active",
    responseCount: 23,
    createdAt: "2026-01-10",
    fields: [
      { id: "f1", label: "Project Name", type: "text", required: true, placeholder: "Q2 Marketing Campaign" },
      { id: "f2", label: "Department", type: "select", required: true, options: ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"] },
      { id: "f3", label: "Requested Amount ($)", type: "number", required: true, placeholder: "5000" },
      { id: "f4", label: "Budget Category", type: "radio", required: true, options: ["Capital", "Operational", "Travel", "Training", "Other"] },
      { id: "f5", label: "Description & Justification", type: "textarea", required: true, placeholder: "Describe the expense and why it's needed..." },
    ],
  },
  {
    id: "4",
    title: "Marketing Campaign Feedback",
    description: "Collect feedback on recent marketing campaigns and initiatives.",
    category: "Marketing",
    status: "draft",
    responseCount: 0,
    createdAt: "2026-03-28",
    fields: [
      { id: "f1", label: "Campaign Name", type: "text", required: true },
      { id: "f2", label: "Overall Effectiveness", type: "radio", required: true, options: ["Excellent", "Good", "Average", "Below Average", "Poor"] },
      { id: "f3", label: "Target Audience Reach", type: "radio", required: true, options: ["Exceeded", "Met", "Below", "Significantly Below"] },
      { id: "f4", label: "Suggestions for Improvement", type: "textarea", required: false },
    ],
  },
  {
    id: "5",
    title: "Workplace Safety Inspection",
    description: "Monthly safety checklist for workplace environment assessment.",
    category: "Health & Safety",
    status: "active",
    responseCount: 89,
    createdAt: "2026-03-01",
    fields: [
      { id: "f1", label: "Inspector Name", type: "text", required: true },
      { id: "f2", label: "Inspection Date", type: "date", required: true },
      { id: "f3", label: "Location", type: "select", required: true, options: ["Building A", "Building B", "Warehouse", "Parking", "Cafeteria"] },
      { id: "f4", label: "Fire Exits Clear?", type: "radio", required: true, options: ["Yes", "No", "Partially"] },
      { id: "f5", label: "First Aid Kit Stocked?", type: "radio", required: true, options: ["Yes", "No", "Needs Refill"] },
      { id: "f6", label: "Additional Notes", type: "textarea", required: false, placeholder: "Any hazards or concerns observed..." },
    ],
  },
  {
    id: "6",
    title: "Vendor Onboarding Questionnaire",
    description: "Collect necessary information from new vendors and suppliers.",
    category: "Operations",
    status: "archived",
    responseCount: 31,
    createdAt: "2025-11-05",
    fields: [
      { id: "f1", label: "Company Name", type: "text", required: true },
      { id: "f2", label: "Contact Email", type: "email", required: true },
      { id: "f3", label: "Services Provided", type: "textarea", required: true },
      { id: "f4", label: "Tax ID / EIN", type: "text", required: true },
      { id: "f5", label: "Payment Terms", type: "select", required: true, options: ["Net 15", "Net 30", "Net 60", "Net 90"] },
    ],
  },
];
