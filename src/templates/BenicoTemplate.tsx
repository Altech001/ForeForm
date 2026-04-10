import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function BenicoPreview() {
  return (
    <div className="h-full rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(5,150,105,0.35)]">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Benico Field</p>
          <h3 className="text-sm font-bold text-slate-900">Enumerator packet</h3>
        </div>
        <div className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Offline-ready</div>
      </div>
      <div className="mt-4 space-y-2">
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
  description: "Practical export style for field surveys, monitoring sheets, and operational packets.",
  accent: "#059669",
  surface: "#ecfdf5",
  border: "#a7f3d0",
  text: "#065f46",
  previewTitle: "Fieldwork export pack",
  previewSubtitle: "Readable rows, generous spacing, and print-friendly blocks.",
  tags: ["field", "operations", "print"],
  Preview: BenicoPreview,
};

export default BenicoTemplate;
