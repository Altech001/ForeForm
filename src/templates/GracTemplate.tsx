import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function GracPreview() {
  return (
    <div className="h-full rounded-2xl border border-rose-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(190,24,93,0.32)]">
      <div className="border-l-4 border-rose-400 pl-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-500">Grac Narrative</p>
        <h3 className="mt-1 text-sm font-bold text-slate-900">Serif-inspired thesis export</h3>
      </div>
      <div className="mt-4 rounded-2xl bg-rose-50 p-4">
        <div className="space-y-2">
          <div className="h-2 w-2/3 rounded-full bg-rose-200" />
          <div className="h-2 rounded-full bg-rose-100" />
          <div className="h-2 w-5/6 rounded-full bg-rose-100" />
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-rose-100 p-3">
            <div className="mb-2 h-2 w-20 rounded-full bg-rose-200" />
            <div className="h-2 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

const GracTemplate: DocxTemplateDefinition = {
  id: "grac",
  name: "Grac Narrative",
  description: "Elegant long-form layout for dissertations, reflective interviews, and academic appendices.",
  accent: "#be185d",
  surface: "#fff1f2",
  border: "#fda4af",
  text: "#881337",
  previewTitle: "Elegant long-form narrative",
  previewSubtitle: "Soft rose accents and spacious typography for thesis-style reading.",
  tags: ["thesis", "elegant", "long-form"],
  Preview: GracPreview,
};

export default GracTemplate;
