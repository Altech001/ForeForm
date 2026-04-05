/**
 * Central theme registry for form header styles & colour tokens.
 * Used in both TemplateGallery preview and FormFill rendering.
 */

export const THEMES = {
    default: { primary: "#6d59e8", bg: "#f5f3ff", text: "#4c3d9e", gradient: "from-violet-500 to-purple-600" },
    violet: { primary: "#7c3aed", bg: "#f5f3ff", text: "#5b21b6", gradient: "from-violet-600 to-fuchsia-600" },
    blue: { primary: "#2563eb", bg: "#eff6ff", text: "#1e40af", gradient: "from-sky-500 to-blue-600" },
    emerald: { primary: "#059669", bg: "#ecfdf5", text: "#065f46", gradient: "from-teal-500 to-emerald-600" },
    rose: { primary: "#e11d48", bg: "#fff1f2", text: "#9f1239", gradient: "from-rose-500 to-red-600" },
    amber: { primary: "#d97706", bg: "#fffbeb", text: "#92400e", gradient: "from-amber-500 to-orange-500" },
    indigo: { primary: "#4f46e5", bg: "#eef2ff", text: "#3730a3", gradient: "from-indigo-500 to-violet-600" },
    slate: { primary: "#475569", bg: "#f8fafc", text: "#1e293b", gradient: "from-slate-600 to-slate-800" },
};

// Unsplash cover images keyed by template id
export const COVER_IMAGES = {
    research_consent: "https://images.unsplash.com/photo-1532094349884-543559a8f9da?w=1200&q=80",
    employee_satisfaction: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80",
    health_screening: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
    student_feedback: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    event_registration: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    customer_feedback: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=1200&q=80",
    product_survey: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80",
    community_needs: "https://images.unsplash.com/photo-1593113630400-ea4288922497?w=1200&q=80",
};