import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function BenicoPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "School of Public Health";
  const title = form?.title || "Community Health Assessment";
  const subtitle = branding.appendix_label || "Field Data Collection Form — Serial No. ___";
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  return (
    <div className="h-full rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(5,150,105,0.35)]">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-emerald-100 pb-3">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">{org}</p>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{title}</h3>
          <p className="text-[9px] text-emerald-600 mt-0.5 italic">{subtitle}</p>
        </div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <img src="/letter-m.png" alt="Logo" className="w-7 h-7 object-contain rounded opacity-80" />
        )}
      </div>
      {description && (
        <p className="text-[8px] text-slate-500 mt-2 leading-relaxed line-clamp-2">{description}</p>
      )}
      {consent && (
        <div className="border-l-2 border-emerald-300 pl-2 mt-2">
          <p className="text-[7px] text-slate-400 leading-snug line-clamp-2">
            <span className="font-semibold text-emerald-600">Consent: </span>{consent}
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
      <div className="mt-3 flex items-center gap-2">
        <div className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-semibold text-emerald-700">Enumerator Copy</div>
        <div className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] text-emerald-500">Field-ready</div>
        {questionCount > 0 && (
          <div className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] text-emerald-600 font-medium">{questionCount} Qs</div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
            <div className="mb-2 h-2 w-24 rounded-full bg-emerald-200" />
            <div className="h-2 rounded-full bg-slate-200" />
            <div className="mt-2 h-2 w-3/4 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

const BenicoTemplate: DocxTemplateDefinition = {
  id: "benico",
  name: "Benico Field",
  description: "Field data collection layout for community surveys, health assessments, and enumerator-based research instruments.",
  accent: "#059669",
  surface: "#ecfdf5",
  border: "#a7f3d0",
  text: "#065f46",
  previewTitle: "Field Survey Data Sheet",
  previewSubtitle: "Readable rows with generous spacing designed for print-based field data collection.",
  tags: ["field", "operations", "print"],
  Preview: BenicoPreview,
};

export default BenicoTemplate;
