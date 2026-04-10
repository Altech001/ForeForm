import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function AlberPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "Department of Information Technology";
  const title = form?.title || "Research Questionnaire";
  const subtitle = branding.research_title || "Academic Survey Instrument — Confidential";
  const appendix = branding.appendix_label;
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  const fallbackSections = ["Consent", "Section A: Demographics", "Section B-J: Likert & open-ended blocks"];
  const hasSections = questionCount > 0;

  return (
    <div className="h-full rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">{appendix || org}</p>
          {appendix && <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 mt-0.5">{org}</p>}
        </div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <img src="/letter-m.png" alt="Logo" className="w-7 h-7 object-contain rounded opacity-80" />
        )}
      </div>
      <div className="h-px bg-slate-200 mb-2" />
      <div className="text-center mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">{title}</p>
        <p className="text-[9px] text-slate-400 mt-0.5 italic">{subtitle}</p>
      </div>
      {description && (
        <p className="text-[8px] text-slate-500 mb-2 leading-relaxed line-clamp-2">{description}</p>
      )}
      {consent && (
        <div className="border-l-2 border-blue-300 pl-2 mb-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-slate-500">Consent: </span>{consent}
          </p>
        </div>
      )}
      {ethics && (
        <div className="border-l-2 border-amber-300 pl-2 mb-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-slate-500">Ethics: </span>{ethics}
          </p>
        </div>
      )}
      <div className="h-px bg-slate-200 mb-3" />
      <div className="space-y-2">
        {(hasSections
          ? form!.questions!.slice(0, 3).map((q: any, i: number) => q.label || `Question ${i + 1}`)
          : fallbackSections
        ).map((section: string) => (
          <div key={section} className="rounded-xl  bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">{section}</div>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 w-5/6 rounded-full bg-slate-200" />
              <div className="h-2 w-4/6 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
        {hasSections && questionCount > 3 && (
          <p className="text-[8px] text-slate-400 text-center pt-1">+{questionCount - 3} more questions</p>
        )}
      </div>
    </div>
  );
}

const AlberTemplate: DocxTemplateDefinition = {
  id: "alber",
  name: "Alber Research",
  description: "Formal multi-section academic questionnaire layout for university survey instruments and structured data collection.",
  accent: "#1e3a8a",
  surface: "#eff6ff",
  border: "#bfdbfe",
  text: "#172554",
  previewTitle: "Academic Research Questionnaire",
  previewSubtitle: "Structured sections with consent, demographics, Likert scales, and open-ended response blocks.",
  tags: ["academic", "questionnaire", "formal"],
  Preview: AlberPreview,
};

export default AlberTemplate;
