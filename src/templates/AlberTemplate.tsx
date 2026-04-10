import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function AlberPreview() {
  const sections = ["Consent", "Section A: Demographics", "Section B-J: Likert & open-ended blocks"];

  return (
    <div className="h-full rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)]">
      <div className="mx-auto mb-4 w-24 rounded-full border border-slate-200 px-3 py-1 text-center text-[9px] font-bold uppercase tracking-[0.28em] text-slate-500">
        Victoria University
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Research Questionnaire</p>
        <h3 className="text-sm font-bold leading-snug text-slate-900">
          Innovating Public Service Delivery Through E-Government Platforms
        </h3>
        <p className="text-[11px] italic text-slate-500">Formal academic instrument with cover page, sections, Likert blocks, and response lines</p>
      </div>
      <div className="my-4 h-px bg-slate-200" />
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">{section}</div>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 w-5/6 rounded-full bg-slate-200" />
              <div className="h-2 w-4/6 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AlberTemplate: DocxTemplateDefinition = {
  id: "alber",
  name: "Alber Research",
  description: "Formal multi-section academic questionnaire styled for university research instruments.",
  accent: "#1e3a8a",
  surface: "#eff6ff",
  border: "#bfdbfe",
  text: "#172554",
  previewTitle: "University research questionnaire",
  previewSubtitle: "Cover page, consent block, sections A-J, Likert rows, and open-ended response lines.",
  tags: ["academic", "questionnaire", "formal"],
  Preview: AlberPreview,
};

export default AlberTemplate;
