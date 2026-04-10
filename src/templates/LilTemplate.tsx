import React from "react";
import type { DocxTemplateDefinition } from "./templateTypes";

function LilPreview() {
  return (
    <div className="h-full rounded-2xl border border-violet-200 bg-white p-4 shadow-[0_18px_55px_-30px_rgba(109,40,217,0.28)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-500">Lil Compact</p>
          <h3 className="text-sm font-bold text-slate-900">Tight response sheet</h3>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="h-3 w-3 rounded-sm bg-violet-200" />
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-2">
            <span className="h-4 w-4 rounded border border-violet-300 bg-white" />
            <span className="h-2 flex-1 rounded-full bg-violet-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

const LilTemplate: DocxTemplateDefinition = {
  id: "lil",
  name: "Lil Compact",
  description: "Compact checklist export optimized for fast review and high-density response documents.",
  accent: "#7c3aed",
  surface: "#f5f3ff",
  border: "#c4b5fd",
  text: "#4c1d95",
  previewTitle: "Compact checklist layout",
  previewSubtitle: "Dense but readable rows for short-response and operational forms.",
  tags: ["compact", "checklist", "dense"],
  Preview: LilPreview,
};

export default LilTemplate;
