import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function LilPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "Quality Assurance Unit";
  const title = form?.title || "Course Evaluation Checklist";
  const subtitle = branding.appendix_label || "End-of-Semester Student Feedback Form";
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  return (
    <div className="h-full rounded-2xl border border-violet-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(109,40,217,0.28)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-400">{org}</p>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{title}</h3>
          <p className="text-[9px] text-violet-500 mt-0.5 italic">{subtitle}</p>
        </div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <img src="/letter-m.png" alt="Logo" className="w-7 h-7 object-contain rounded opacity-80" />
        )}
      </div>
      {description && (
        <p className="text-[8px] text-slate-500 mb-2 leading-relaxed line-clamp-2">{description}</p>
      )}
      {consent && (
        <div className="border-l-2 border-violet-300 pl-2 mb-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-violet-500">Consent: </span>{consent}
          </p>
        </div>
      )}
      {ethics && (
        <div className="border-l-2 border-amber-300 pl-2 mb-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-amber-600">Ethics: </span>{ethics}
          </p>
        </div>
      )}
      <div className="h-px bg-violet-100 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-2">
            <span className="h-4 w-4 rounded border border-violet-300 bg-white" />
            <span className="h-2 flex-1 rounded-full bg-violet-200" />
          </div>
        ))}
      </div>
      {questionCount > 0 && (
        <p className="text-[8px] text-violet-500 text-center pt-2">{questionCount} questions</p>
      )}
    </div>
  );
}

const LilTemplate: DocxTemplateDefinition = {
  id: "lil",
  name: "Lil Compact",
  description: "Dense checklist format for course evaluations, operational checklists, and short-response student feedback forms.",
  accent: "#7c3aed",
  surface: "#f5f3ff",
  border: "#c4b5fd",
  text: "#4c1d95",
  previewTitle: "Course Evaluation Checklist",
  previewSubtitle: "High-density rows for quick-response evaluations and operational feedback.",
  tags: ["compact", "checklist", "dense"],
  Preview: LilPreview,
};

export default LilTemplate;
