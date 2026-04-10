import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function GracPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "Graduate School of Education";
  const title = form?.title || "Dissertation Interview Schedule";
  const subtitle = branding.appendix_label || "Appendix C — Semi-Structured Interview Guide";
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  return (
    <div className="h-full rounded-2xl border border-rose-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(190,24,93,0.32)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="border-l-4 border-rose-400 pl-3 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-400">{org}</p>
          <h3 className="mt-1 text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-[9px] text-rose-500 mt-0.5 italic">{subtitle}</p>
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
        <div className="border-l-2 border-rose-300 pl-2 mb-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-rose-500">Consent: </span>{consent}
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
      <div className="mt-3 rounded-2xl bg-rose-50 p-4">
        <div className="space-y-2">
          <div className="h-2 w-2/3 rounded-full bg-rose-200" />
          <div className="h-2 rounded-full bg-rose-100" />
          <div className="h-2 w-5/6 rounded-full bg-rose-100" />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-rose-100 p-3">
            <div className="mb-2 h-2 w-20 rounded-full bg-rose-200" />
            <div className="h-2 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      {questionCount > 0 && (
        <p className="text-[8px] text-rose-500 text-center pt-2">{questionCount} questions</p>
      )}
    </div>
  );
}

const GracTemplate: DocxTemplateDefinition = {
  id: "grac",
  name: "Grac Narrative",
  description: "Elegant long-form layout for thesis interviews, reflective narratives, and qualitative research appendices.",
  accent: "#be185d",
  surface: "#fff1f2",
  border: "#fda4af",
  text: "#881337",
  previewTitle: "Thesis Interview Schedule",
  previewSubtitle: "Spacious serif typography with narrative blocks for semi-structured interview data.",
  tags: ["thesis", "elegant", "long-form"],
  Preview: GracPreview,
};

export default GracTemplate;
