import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function AniPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "Faculty of Social Sciences";
  const title = form?.title || "Campus Services Satisfaction Assessment";
  const subtitle = branding.research_title || "Confidential — For research purposes only";
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  return (
    <div className="h-full rounded-2xl border border-cyan-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(8,145,178,0.35)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase  text-cyan-400">{org}</p>
          <p className="text-[10px] font-semibold text-cyan-700 mt-0.5">{branding.appendix_label || "Student Experience Survey"}</p>
        </div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <img src="/letter-m.png" alt="Logo" className="w-7 h-7 object-contain rounded opacity-80" />
        )}
      </div>
      <div className="rounded bg-[linear-gradient(135deg,#083344,#155e75,#67e8f9)] p-3 text-white mt-2">
        <p className="text-[9px] uppercase  text-cyan-200">Respondent Report</p>
        <h3 className="mt-1 text-xs font-bold">{title}</h3>
        <p className="mt-0.5 text-[10px] text-cyan-100 italic">{subtitle}</p>
      </div>
      {description && (
        <p className="text-[8px] text-slate-500 mt-2 leading-relaxed line-clamp-2">{description}</p>
      )}
      {consent && (
        <div className="border-l-2 border-cyan-300 pl-2 mt-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-cyan-600">Consent: </span>{consent}
          </p>
        </div>
      )}
      {ethics && (
        <div className="border-l-2 border-amber-300 pl-2 mt-1.5">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-amber-600">Ethics: </span>{ethics}
          </p>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <div className="rounded-xl bg-cyan-50 p-3">
          <div className="mb-2 flex gap-2">
            <span className="h-5 w-16 rounded-full bg-cyan-200" />
            <span className="h-5 w-20 rounded-full bg-cyan-100" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-cyan-200" />
            <div className="h-2 w-4/5 rounded-full bg-cyan-200" />
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-cyan-200 p-3">
          <div className="h-2 rounded-full bg-slate-200" />
          <div className="mt-2 h-2 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-5 w-5 rounded border border-cyan-300 bg-white" />
            ))}
          </div>
        </div>
      </div>
      {questionCount > 0 && (
        <p className="text-[8px] text-cyan-500 text-center pt-2">{questionCount} questions</p>
      )}
    </div>
  );
}

const AniTemplate: DocxTemplateDefinition = {
  id: "ani",
  name: "Ani Pulse",
  description: "Clean respondent report format for campus satisfaction assessments, service evaluations, and structured interview data.",
  accent: "#0891b2",
  surface: "#ecfeff",
  border: "#a5f3fc",
  text: "#164e63",
  previewTitle: "Student Experience Report",
  previewSubtitle: "Compact respondent metadata with clean answer cards for survey analysis.",
  tags: ["modern", "clean", "presentation"],
  Preview: AniPreview,
};

export default AniTemplate;
