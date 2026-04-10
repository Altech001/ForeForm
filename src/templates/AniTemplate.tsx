import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function AniPreview() {
  return (
    <div className="h-full rounded-2xl border border-cyan-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(8,145,178,0.35)]">
      <div className="rounded-2xl bg-[linear-gradient(135deg,#083344,#155e75,#67e8f9)] p-4 text-white">
        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100">Ani Pulse</p>
        <h3 className="mt-2 text-sm font-bold">Modern respondent report</h3>
        <p className="mt-1 text-[11px] text-cyan-50">Bright section chips, bold respondent metadata, clean answer blocks.</p>
      </div>
      <div className="mt-4 grid gap-2">
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
    </div>
  );
}

const AniTemplate: DocxTemplateDefinition = {
  id: "ani",
  name: "Ani Pulse",
  description: "Modern bright DOCX styling for presentations, reports, and polished interview exports.",
  accent: "#0891b2",
  surface: "#ecfeff",
  border: "#a5f3fc",
  text: "#164e63",
  previewTitle: "Modern presentation-style report",
  previewSubtitle: "Cyan accents, compact metadata, and clean answer cards.",
  tags: ["modern", "clean", "presentation"],
  Preview: AniPreview,
};

export default AniTemplate;
