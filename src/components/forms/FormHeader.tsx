/**
 * FormHeader — renders the intro card header based on branding.header_style + branding.theme.
 * Used inside FormFill's INTRO step.
 */
import React from "react";
import { FileText, PenLine, MapPin } from "lucide-react";
import { THEMES } from "@/lib/formThemes";

function LogoOrIcon({ branding, size = "md", light = false }) {
  const sz = size === "lg" ? "h-16" : "h-10";
  if (branding.logo_url) {
    return <img src={branding.logo_url} alt="logo" className={`${sz} object-contain`} />;
  }
  const iconSz = size === "lg" ? "w-8 h-8" : "w-5 h-5";
  const wrap = size === "lg" ? "w-16 h-16 rounded" : "w-10 h-10 rounded";
  const bg = light ? "bg-white/20" : "bg-primary";
  const fg = light ? "text-white" : "text-primary-foreground";
  return (
    <div className={`${wrap} flex items-center justify-center flex-shrink-0`}>
      <img src="/form.png" alt="logo" className="h-10 object-contain" />
    </div>
  );
}

function OrgLabel({ branding, light = false }) {
  if (!branding.organization) return null;
  const cls = light ? "text-white/80 font-semibold text-xs " : "text-primary font-bold text-xs ";
  return <p className={cls}>{branding.organization}</p>;
}

export default function FormHeader({ form, questions }) {
  const branding = form?.branding || {};
  const theme = THEMES[branding.theme] || THEMES.default;
  const style = branding.header_style || "minimal";
  const logoPos = branding.logo_position || "left";
  const coverUrl = branding.cover_image_url;

  const logoAlign =
    logoPos === "center" ? "justify-center" :
      logoPos === "right" ? "justify-end" : "justify-start";

  const meta = (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-4 mt-4 border-t border-border">
      <span>{questions.length} questions · ~{Math.ceil(questions.length * 0.5)} min</span>
      {branding.require_signature && <span className="flex items-center gap-1"><PenLine className="w-3 h-3" />Signature required</span>}
      {branding.collect_gps && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Location recorded</span>}
    </div>
  );

  // ── MINIMAL ──────────────────────────────────────────────────────────────
  if (style === "minimal") {
    return (
      <div className="bg-card border border-border rounded p-8">
        <div className={`flex ${logoAlign} mb-5`}>
          <LogoOrIcon branding={branding} size="md" />
        </div>
        <OrgLabel branding={branding} />
        {branding.appendix_label && <p className="text-xs text-muted-foreground mb-1 mt-1">{branding.appendix_label}</p>}
        <h1 className="text-xl font-bold mb-2 mt-1">{form.title}</h1>
        {branding.research_title && <p className="text-sm text-muted-foreground italic mb-3">{branding.research_title}</p>}
        {form.description && <p className="text-muted-foreground leading-relaxed">{form.description}</p>}
        {branding.ethics_statement && (
          <div className="mt-4 p-3 bg-muted/60 rounded-none border-l-2 border-primary/50 text-sm text-muted-foreground">
            {branding.ethics_statement}
          </div>
        )}
        {meta}
      </div>
    );
  }

  // ── BANNER SOLID ─────────────────────────────────────────────────────────
  if (style === "banner_solid") {
    return (
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-8 py-7 flex flex-col gap-3" style={{ background: theme.primary }}>
          <div className={`flex ${logoAlign}`}>
            <LogoOrIcon branding={branding} size="md" light />
          </div>
          <OrgLabel branding={branding} light />
          <h1 className="text-xl font-bold text-white">{form.title}</h1>
          {branding.research_title && <p className="text-sm text-white/70 italic">{branding.research_title}</p>}
        </div>
        <div className="p-8">
          {branding.appendix_label && <p className="text-xs text-muted-foreground mb-2">{branding.appendix_label}</p>}
          {form.description && <p className="text-muted-foreground leading-relaxed">{form.description}</p>}
          {branding.ethics_statement && (
            <div className="mt-4 p-3 bg-muted/60 rounded-none border-l-2 border-primary/30 text-sm text-muted-foreground">
              {branding.ethics_statement}
            </div>
          )}
          {meta}
        </div>
      </div>
    );
  }

  // ── BANNER GRADIENT ───────────────────────────────────────────────────────
  if (style === "banner_gradient") {
    return (
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className={`px-8 py-7 flex flex-col gap-3 bg-gradient-to-br ${theme.gradient}`}>
          <div className={`flex ${logoAlign}`}>
            <LogoOrIcon branding={branding} size="md" light />
          </div>
          <OrgLabel branding={branding} light />
          <h1 className="text-xl font-bold text-white">{form.title}</h1>
          {branding.research_title && <p className="text-sm text-white/70 italic">{branding.research_title}</p>}
        </div>
        <div className="p-8">
          {form.description && <p className="text-muted-foreground leading-relaxed">{form.description}</p>}
          {branding.ethics_statement && (
            <div className="mt-4 p-3 bg-muted/60 rounded-none border-l-2 border-primary/30 text-sm text-muted-foreground">
              {branding.ethics_statement}
            </div>
          )}
          {meta}
        </div>
      </div>
    );
  }

  // ── COVER IMAGE ────────────────────────────────────────────────────────────
  if (style === "cover_image" && coverUrl) {
    return (
      <div className="bg-card border border-border rounded overflow-hidden shadow-sm">
        <div className="relative h-44 sm:h-56">
          <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className={`absolute inset-0 flex flex-col ${logoAlign === "justify-center" ? "items-center" : logoPos === "right" ? "items-end" : "items-start"} justify-end p-6 gap-2`}>
            <LogoOrIcon branding={branding} size="md" light />
            <OrgLabel branding={branding} light />
            <h1 className="text-2xl font-bold text-white drop-shadow">{form.title}</h1>
            {branding.research_title && <p className="text-sm text-white/80 italic">{branding.research_title}</p>}
          </div>
        </div>
        <div className="p-8">
          {form.description && <p className="text-muted-foreground leading-relaxed">{form.description}</p>}
          {branding.ethics_statement && (
            <div className="mt-4 p-3 bg-muted/60 rounded-lg border-l-2 border-primary/30 text-sm text-muted-foreground">
              {branding.ethics_statement}
            </div>
          )}
          {meta}
        </div>
      </div>
    );
  }

  // ── SPLIT ─────────────────────────────────────────────────────────────────
  if (style === "split") {
    return (
      <div className="bg-card border border-border rounded overflow-hidden shadow-sm flex flex-col sm:flex-row">
        {/* Coloured left panel */}
        <div className={`sm:w-2/5 flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br ${theme.gradient}`}>
          <LogoOrIcon branding={branding} size="lg" light />
          {branding.organization && <p className="text-white/80 font-semibold text-xs uppercase  text-center">{branding.organization}</p>}
          {coverUrl && <img src={coverUrl} alt="cover" className="w-full rounded-xl object-cover mt-2 opacity-80 h-28" />}
        </div>
        {/* Right text panel */}
        <div className="sm:w-3/5 p-8 flex flex-col justify-center">
          {branding.appendix_label && <p className="text-xs text-muted-foreground mb-1">{branding.appendix_label}</p>}
          <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
          {branding.research_title && <p className="text-sm text-muted-foreground italic mb-3">{branding.research_title}</p>}
          {form.description && <p className="text-muted-foreground leading-relaxed text-sm">{form.description}</p>}
          {branding.ethics_statement && (
            <div className="mt-4 p-3 bg-muted/60 rounded-lg border-l-2 border-primary/30 text-sm text-muted-foreground">
              {branding.ethics_statement}
            </div>
          )}
          {meta}
        </div>
      </div>
    );
  }

  // fallback → minimal
  return (
    <div className="bg-card border border-border rounded p-8 shadow-sm">
      <OrgLabel branding={branding} />
      <h1 className="text-2xl font-bold mb-2 mt-1">{form.title}</h1>
      {form.description && <p className="text-muted-foreground leading-relaxed">{form.description}</p>}
      {meta}
    </div>
  );
}