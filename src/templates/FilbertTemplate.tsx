import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function FilbertPreview() {
  return (
    <div className="h-full rounded-2xl border border-amber-200 bg-[#fffaf0] p-4 shadow-[0_18px_55px_-30px_rgba(180,83,9,0.35)]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700">Filbert Ledger</p>
      <h3 className="mt-2 text-sm font-bold text-amber-950">Archive-minded summary</h3>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 text-[10px] text-amber-900">
        {['Respondent','Submitted','Location','Status'].map((label) => (
          <React.Fragment key={label}>
            <div className="rounded-lg bg-white/80 px-2 py-1 font-medium">{label}</div>
            <div className="rounded-lg border border-amber-200 px-2 py-1">Value</div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded-full bg-amber-200" />
        <div className="h-2 w-5/6 rounded-full bg-amber-200" />
        <div className="h-2 w-3/4 rounded-full bg-amber-200" />
      </div>
    </div>
  );
}

const FilbertTemplate: DocxTemplateDefinition = {
  id: "filbert",
  name: "Filbert Ledger",
  description: "Warm archival layout for records, appendices, and document-heavy submissions.",
  accent: "#b45309",
  surface: "#fffbeb",
  border: "#fcd34d",
  text: "#78350f",
  previewTitle: "Archive ledger export",
  previewSubtitle: "Warm paper tones with grid-like metadata and orderly sections.",
  tags: ["archive", "records", "appendix"],
  Preview: FilbertPreview,
};

export default FilbertTemplate;
