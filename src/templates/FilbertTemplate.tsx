import React from "react";
import type { DocxTemplateDefinition, FormContext } from "./templateTypes";

function FilbertPreview({ form }: { form?: FormContext } = {}) {
  const branding = form?.branding || {};
  const org = branding.organization || "Office of the Registrar";
  const title = form?.title || "Academic Records Survey";
  const subtitle = branding.appendix_label || "Student Records & Enrollment Assessment";
  const description = form?.description;
  const consent = branding.consent_text;
  const ethics = branding.ethics_statement;
  const logoUrl = branding.logo_url;
  const questionCount = form?.questions?.length || 0;

  const metaLabels = ['Respondent', 'Date Submitted', 'Programme', 'Academic Year'];

  return (
    <div className="h-full rounded-2xl border border-amber-200 bg-[#fffaf0] p-4 shadow-[0_18px_55px_-30px_rgba(180,83,9,0.35)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500">{org}</p>
          <h3 className="mt-1 text-sm font-bold text-amber-950">{title}</h3>
          <p className="text-[9px] text-amber-700 mt-0.5 italic">{subtitle}</p>
        </div>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
        ) : (
          <img src="/letter-m.png" alt="Logo" className="w-7 h-7 object-contain rounded opacity-80" />
        )}
      </div>
      {description && (
        <p className="text-[8px] text-amber-800 mb-2 leading-relaxed line-clamp-2">{description}</p>
      )}
      {consent && (
        <div className="border-l-2 border-amber-400 pl-2 mb-2">
          <p className="text-[7px] text-amber-700 leading-snug line-clamp-2">
            <span className="font-semibold">Consent: </span>{consent}
          </p>
        </div>
      )}
      {ethics && (
        <div className="border-l-2 border-orange-300 pl-2 mb-2">
          <p className="text-[7px] text-amber-700 leading-snug line-clamp-2">
            <span className="font-semibold">Ethics: </span>{ethics}
          </p>
        </div>
      )}
      <div className="h-px bg-amber-200 mb-3" />
      <div className="grid grid-cols-[1fr_auto] gap-2 text-[10px] text-amber-900">
        {metaLabels.map((label) => (
          <React.Fragment key={label}>
            <div className="rounded-lg bg-white/80 px-2 py-1 font-medium">{label}</div>
            <div className="rounded-lg border border-amber-200 px-2 py-1">__________</div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded-full bg-amber-200" />
        <div className="h-2 w-5/6 rounded-full bg-amber-200" />
        <div className="h-2 w-3/4 rounded-full bg-amber-200" />
      </div>
      {questionCount > 0 && (
        <p className="text-[8px] text-amber-600 text-center pt-2">{questionCount} questions</p>
      )}
    </div>
  );
}

const FilbertTemplate: DocxTemplateDefinition = {
  id: "filbert",
  name: "Filbert Ledger",
  description: "Tabular records layout for academic archives, student enrollment data, and document-heavy appendices.",
  accent: "#b45309",
  surface: "#fffbeb",
  border: "#fcd34d",
  text: "#78350f",
  previewTitle: "Academic Records Assessment",
  previewSubtitle: "Grid-style metadata fields with orderly sections for structured data submissions.",
  tags: ["archive", "records", "appendix"],
  Preview: FilbertPreview,
};

export default FilbertTemplate;
