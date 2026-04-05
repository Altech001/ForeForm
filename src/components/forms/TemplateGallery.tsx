import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, HeartPulse, GraduationCap, Users, Star, Briefcase, MessageSquare, ShoppingBag, Microscope, ChevronRight, Image, Columns2, Minus, Layers, Layout } from "lucide-react";
import { THEMES, COVER_IMAGES } from "@/lib/formThemes";

// ─── Template Data ────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "employee_satisfaction",
    category: "HR",
    icon: Briefcase,
    title: "Employee Satisfaction Survey",
    description: "Anonymous pulse survey to measure workplace engagement, culture, and improvement areas.",
    questions: [
      { id: "q1", type: "multiple_choice", label: "How satisfied are you with your overall work experience?", required: true, options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
      { id: "q2", type: "multiple_choice", label: "How would you rate your work-life balance?", required: true, options: ["Excellent", "Good", "Fair", "Poor"] },
      { id: "q3", type: "multiple_choice", label: "Do you feel valued and recognized for your contributions?", required: true, options: ["Always", "Often", "Sometimes", "Rarely", "Never"] },
      { id: "q4", type: "multiple_choice", label: "How effective is communication from senior leadership?", required: true, options: ["Very Effective", "Effective", "Somewhat Effective", "Ineffective"] },
      { id: "q5", type: "multiple_choice", label: "Do you have the tools and resources needed to do your job?", required: true, options: ["Yes, fully", "Mostly yes", "Somewhat", "No"] },
      { id: "q6", type: "long_text", label: "What do you enjoy most about working here?", required: false },
      { id: "q7", type: "long_text", label: "What single change would most improve your work experience?", required: false },
      { id: "q8", type: "multiple_choice", label: "Would you recommend this organization as a great place to work?", required: true, options: ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"] },
    ],
    branding: {
      organization: "Foreform",
      research_title: "Annual Employee Satisfaction Survey",
      ethics_statement: "Your responses are completely anonymous. Results will be used to improve workplace conditions.",
      theme: "blue",
      header_style: "banner_gradient",
      cover_image_url: COVER_IMAGES.employee_satisfaction,
      logo_position: "left",
    },
  },
  {
    id: "health_screening",
    category: "Health",
    icon: HeartPulse,
    title: "Community Health Screening",
    description: "Collect patient health history, vitals, symptoms, and lifestyle data for public health assessments.",
    questions: [
      { id: "q1", type: "short_text", label: "Patient Full Name", required: true },
      { id: "q2", type: "number", label: "Age", required: true },
      { id: "q3", type: "multiple_choice", label: "Gender", required: true, options: ["Male", "Female", "Other"] },
      { id: "q4", type: "multiple_choice", label: "Do you currently smoke or use tobacco products?", required: true, options: ["Yes", "No", "Occasionally"] },
      { id: "q5", type: "multiple_choice", label: "How would you describe your physical activity level?", required: true, options: ["Very Active", "Moderately Active", "Lightly Active", "Sedentary"] },
      { id: "q6", type: "checkbox", label: "Do you have any of the following conditions? (select all that apply)", required: false, options: ["Hypertension", "Diabetes", "Asthma", "Heart Disease", "None of the above"] },
      { id: "q7", type: "long_text", label: "Describe any current symptoms or health concerns", required: false },
      { id: "q8", type: "multiple_choice", label: "When did you last visit a healthcare provider?", required: false, options: ["Within 6 months", "6–12 months ago", "1–2 years ago", "More than 2 years ago"] },
    ],
    branding: {
      organization: "Health Authority",
      research_title: "Community Health Assessment",
      ethics_statement: "All health information collected is strictly confidential.",
      consent_text: "I consent to the collection and use of my health information for this screening program.",
      require_signature: true,
      collect_gps: true,
      theme: "rose",
      header_style: "cover_image",
      cover_image_url: COVER_IMAGES.health_screening,
      logo_position: "left",
    },
  },
  {
    id: "student_feedback",
    category: "Education",
    icon: GraduationCap,
    title: "Student Course Feedback",
    description: "End-of-term course evaluation to gather student feedback on teaching quality and experience.",
    questions: [
      { id: "q1", type: "short_text", label: "Course Name / Code", required: true },
      { id: "q2", type: "multiple_choice", label: "Overall, how would you rate this course?", required: true, options: ["Excellent", "Very Good", "Good", "Fair", "Poor"] },
      { id: "q3", type: "multiple_choice", label: "How would you rate the instructor's teaching effectiveness?", required: true, options: ["Excellent", "Very Good", "Good", "Fair", "Poor"] },
      { id: "q4", type: "multiple_choice", label: "Was the course content relevant to your studies?", required: true, options: ["Very Relevant", "Relevant", "Somewhat Relevant", "Not Relevant"] },
      { id: "q5", type: "multiple_choice", label: "Was the workload appropriate for the course level?", required: true, options: ["Too Heavy", "About Right", "Too Light"] },
      { id: "q6", type: "multiple_choice", label: "How accessible was the instructor outside of class?", required: false, options: ["Very Accessible", "Accessible", "Somewhat Accessible", "Not Accessible"] },
      { id: "q7", type: "long_text", label: "What aspects of this course worked best?", required: false },
      { id: "q8", type: "long_text", label: "What would you suggest to improve this course?", required: false },
    ],
    branding: {
      organization: "University",
      research_title: "Course Evaluation Survey",
      ethics_statement: "Your feedback is anonymous and will be reviewed after grades are finalized.",
      theme: "amber",
      header_style: "banner_solid",
      cover_image_url: COVER_IMAGES.student_feedback,
      logo_position: "center",
    },
  },
  {
    id: "event_registration",
    category: "Events",
    icon: Users,
    title: "Event Registration",
    description: "Streamlined event sign-up collecting attendee details, dietary needs, and session preferences.",
    questions: [
      { id: "q1", type: "short_text", label: "Full Name", required: true },
      { id: "q2", type: "email", label: "Email Address", required: true },
      { id: "q3", type: "short_text", label: "Organization / Institution", required: false },
      { id: "q4", type: "short_text", label: "Job Title / Role", required: false },
      { id: "q5", type: "multiple_choice", label: "Which sessions will you attend?", required: true, options: ["Morning Keynote", "Workshop A", "Workshop B", "Panel Discussion", "Networking Lunch", "All Day"] },
      { id: "q6", type: "multiple_choice", label: "Dietary requirements", required: false, options: ["None", "Vegetarian", "Vegan", "Halal", "Gluten-Free", "Other"] },
      { id: "q7", type: "multiple_choice", label: "How did you hear about this event?", required: false, options: ["Email Newsletter", "Social Media", "Colleague Referral", "Website", "Other"] },
      { id: "q8", type: "long_text", label: "Any special accommodations or questions?", required: false },
    ],
    branding: {
      organization: "Events Team",
      research_title: "Event Registration Form",
      theme: "emerald",
      header_style: "cover_image",
      cover_image_url: COVER_IMAGES.event_registration,
      logo_position: "center",
    },
  },
  {
    id: "customer_feedback",
    category: "Business",
    icon: Star,
    title: "Customer Satisfaction (CSAT)",
    description: "Post-purchase satisfaction survey measuring NPS, product quality, and support experience.",
    questions: [
      { id: "q1", type: "multiple_choice", label: "How satisfied are you with your recent experience?", required: true, options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
      { id: "q2", type: "multiple_choice", label: "On a scale of 1–10, how likely are you to recommend us? (NPS)", required: true, options: ["1–3 (Not likely)", "4–6 (Neutral)", "7–8 (Likely)", "9–10 (Very likely)"] },
      { id: "q3", type: "multiple_choice", label: "How would you rate the quality of the product/service?", required: true, options: ["Excellent", "Good", "Average", "Below Average", "Poor"] },
      { id: "q4", type: "multiple_choice", label: "How would you rate the customer support you received?", required: false, options: ["Excellent", "Good", "Average", "Below Average", "Poor", "Did not contact support"] },
      { id: "q5", type: "multiple_choice", label: "Was your issue or query resolved?", required: false, options: ["Yes, fully", "Partially", "No"] },
      { id: "q6", type: "long_text", label: "What did we do well?", required: false },
      { id: "q7", type: "long_text", label: "What can we improve?", required: false },
      { id: "q8", type: "multiple_choice", label: "Would you purchase from us again?", required: true, options: ["Definitely", "Probably", "Not sure", "Probably not", "No"] },
    ],
    branding: {
      theme: "indigo",
      header_style: "banner_gradient",
      cover_image_url: COVER_IMAGES.customer_feedback,
      logo_position: "left",
    },
  },
  {
    id: "product_survey",
    category: "Business",
    icon: ShoppingBag,
    title: "Product Discovery Survey",
    description: "Understand user needs, preferences, and pain points to guide product roadmap decisions.",
    questions: [
      { id: "q1", type: "multiple_choice", label: "How often do you use our product?", required: true, options: ["Daily", "Several times a week", "Once a week", "A few times a month", "Rarely"] },
      { id: "q2", type: "checkbox", label: "Which features do you use most? (select all that apply)", required: false, options: ["Core Feature A", "Analytics", "Integrations", "Reporting", "Collaboration", "Mobile App"] },
      { id: "q3", type: "long_text", label: "What is the primary problem our product helps you solve?", required: true },
      { id: "q4", type: "long_text", label: "What features are you missing that would make the biggest impact?", required: false },
      { id: "q5", type: "multiple_choice", label: "How does our product compare to alternatives you've used?", required: false, options: ["Much better", "Somewhat better", "About the same", "Somewhat worse", "Much worse"] },
      { id: "q6", type: "multiple_choice", label: "What best describes your role?", required: false, options: ["Product / Design", "Engineering", "Marketing", "Operations", "Leadership", "Other"] },
      { id: "q7", type: "long_text", label: "Any other feedback or suggestions?", required: false },
    ],
    branding: {
      theme: "slate",
      header_style: "minimal",
      cover_image_url: COVER_IMAGES.product_survey,
      logo_position: "left",
    },
  },
  {
    id: "community_needs",
    category: "Research",
    icon: MessageSquare,
    title: "Community Needs Assessment",
    description: "Map local community needs, priorities, and access to services for NGO and policy planning.",
    questions: [
      { id: "q1", type: "short_text", label: "Village / Sub-county / District", required: true },
      { id: "q2", type: "number", label: "Number of people in household", required: true },
      { id: "q3", type: "multiple_choice", label: "Primary source of household income", required: true, options: ["Farming", "Small business", "Formal employment", "Casual labour", "No income", "Other"] },
      { id: "q4", type: "checkbox", label: "What are the top challenges in your community? (select up to 3)", required: true, options: ["Clean water access", "Healthcare", "Education", "Road infrastructure", "Food insecurity", "Unemployment", "Safety/Security"] },
      { id: "q5", type: "multiple_choice", label: "Access to nearest health facility", required: true, options: ["Less than 5km", "5–10km", "10–20km", "More than 20km"] },
      { id: "q6", type: "multiple_choice", label: "Do children in your household attend school regularly?", required: true, options: ["Yes", "No", "Some do"] },
      { id: "q7", type: "long_text", label: "What intervention would most benefit your community?", required: false },
    ],
    branding: {
      organization: "NGO / Local Government",
      research_title: "Community Needs Assessment",
      appendix_label: "Tool B",
      ethics_statement: "Your responses help local government and NGOs allocate resources more effectively.",
      collect_gps: true,
      theme: "emerald",
      header_style: "cover_image",
      cover_image_url: COVER_IMAGES.community_needs,
      logo_position: "left",
    },
  },
];

const CATEGORIES = ["All", "Research", "HR", "Health", "Education", "Events", "Business"];

const HEADER_STYLE_META = {
  minimal: { label: "Minimal", Icon: Minus },
  cover_image: { label: "Cover Image", Icon: Image },
  split: { label: "Split Panel", Icon: Columns2 },
  banner_solid: { label: "Solid Banner", Icon: Layout },
  banner_gradient: { label: "Gradient Banner", Icon: Layers },
};

// ─── Mini header preview (inside card) ───────────────────────────────────────
function HeaderPreview({ template }) {
  const theme = THEMES[template.branding?.theme] || THEMES.default;
  const style = template.branding?.header_style || "minimal";
  const cover = template.branding?.cover_image_url;
  const Icon = template.icon;

  if (style === "cover_image" && cover) {
    return (
      <div className="relative h-28 overflow-hidden">
        <img src={cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-end p-3">
          <div>
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center mb-1">
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white text-xs font-semibold leading-tight line-clamp-1">{template.title}</p>
          </div>
        </div>
      </div>
    );
  }

  if (style === "split") {
    return (
      <div className="h-28 flex overflow-hidden">
        <div className={`w-2/5 flex flex-col items-center justify-center bg-gradient-to-br ${theme.gradient} p-2`}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="w-3/5 flex items-center p-3 bg-card">
          <p className="text-xs font-semibold leading-tight line-clamp-2">{template.title}</p>
        </div>
      </div>
    );
  }

  if (style === "banner_gradient") {
    return (
      <div className={`h-28 flex flex-col justify-end p-4 bg-gradient-to-br ${theme.gradient}`}>
        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center mb-1.5">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-white text-xs font-semibold line-clamp-1">{template.title}</p>
      </div>
    );
  }

  if (style === "banner_solid") {
    return (
      <div className="h-28 flex flex-col justify-end p-4" style={{ background: theme.primary }}>
        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center mb-1.5">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-white text-xs font-semibold line-clamp-1">{template.title}</p>
      </div>
    );
  }

  // minimal
  return (
    <div className="h-28 flex flex-col justify-center p-4" style={{ background: theme.bg }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: theme.primary }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs font-semibold line-clamp-2" style={{ color: theme.text }}>{template.title}</p>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export default function TemplateGallery({ onUseTemplate, onClose, onStartFromScratch }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hovered, setHovered] = useState(null);

  const filtered = activeCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl  flex items-center justify-center">
            <img src="/form.png" alt="Logo" className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Form Templates</h2>
            <p className="text-xs text-muted-foreground">Each template has a unique design theme, pick one and customise</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onStartFromScratch || onClose} className="gap-2 hover:border-primary hover:text-primary hover:bg-transparent">
            Start from Scratch <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:border-primary hover:text-primary">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 py-4 border-b border-border/40 bg-card/50">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((tpl) => {
            const theme = THEMES[tpl.branding?.theme] || THEMES.default;
            const styleInfo = HEADER_STYLE_META[tpl.branding?.header_style] || HEADER_STYLE_META.minimal;
            const StyleIcon = styleInfo.Icon;

            return (
              <div
                key={tpl.id}
                onMouseEnter={() => setHovered(tpl.id)}
                onMouseLeave={() => setHovered(null)}
                className="group relative bg-card border border-border/60 rounded overflow-hidden cursor-pointer hover:shadow-xl hover:border-primary/40 transition-all duration-200 flex flex-col"
                onClick={() => onUseTemplate(tpl)}
              >
                {/* Mini header preview */}
                <HeaderPreview template={tpl} />

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm leading-tight mb-1">{tpl.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">{tpl.description}</p>

                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    {/* Category badge */}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      {tpl.category}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Header style badge */}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground border border-border/60 px-1.5 py-0.5 rounded-md">
                        <StyleIcon className="w-3 h-3" />
                        {styleInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{tpl.questions.length} Qs</span>
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hovered === tpl.id ? "opacity-100" : "opacity-0"}`}
                  style={{ background: "rgba(0,0,0,0.18)" }}
                >
                  <div
                    className="text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl"
                    style={{ background: theme.primary }}
                  >
                    Use Template
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}