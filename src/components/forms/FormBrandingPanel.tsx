import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Building2, MapPin, PenLine, BookOpen, Palette, LayoutTemplate, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";
import { THEMES } from "@/lib/formThemes";

export interface FormBranding {
  logo_url?: string;
  organization?: string;
  research_title?: string;
  appendix_label?: string;
  ethics_statement?: string;
  consent_text?: string;
  header_style?: string;
  theme?: string;
  logo_position?: string;
  cover_image_url?: string;
  require_signature?: boolean;
  collect_gps?: boolean;
}

interface FormBrandingPanelProps {
  branding?: FormBranding;
  onChange: (branding: FormBranding) => void;
}

export default function FormBrandingPanel({ branding = {}, onChange }: FormBrandingPanelProps) {
  const logoRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const update = (field, value) => onChange({ ...branding, [field]: value });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("logo_url", file_url);
    toast.success("Logo uploaded");
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("cover_image_url", file_url);
    toast.success("Cover image uploaded");
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Organization / Institution Logo</Label>
        {branding.logo_url ? (
          <div className="flex items-center gap-3">
            <img src={branding.logo_url} alt="Logo" className="h-14 max-w-[200px] object-contain rounded border border-border bg-white p-1" />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => update("logo_url", "")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div onClick={() => logoRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Click to upload logo</p>
          </div>
        )}
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </div>

      {/* Org name */}
      <div className="space-y-1.5">
        <Label>Organization / Institution Name</Label>
        <Input value={branding.organization || ""} onChange={e => update("organization", e.target.value)} placeholder="e.g. University of Cape Town" />
      </div>

      {/* Research title */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Research / Study Title</Label>
        <Input value={branding.research_title || ""} onChange={e => update("research_title", e.target.value)} placeholder="e.g. Study on Urban Water Usage Patterns" />
      </div>

      {/* Appendix label */}
      <div className="space-y-1.5">
        <Label>Appendix Label</Label>
        <Input value={branding.appendix_label || ""} onChange={e => update("appendix_label", e.target.value)} placeholder="e.g. Appendix A — Data Collection Instrument" />
      </div>

      {/* Ethics / consent */}
      <div className="space-y-1.5">
        <Label>Ethics Statement (shown to respondents)</Label>
        <Textarea value={branding.ethics_statement || ""} onChange={e => update("ethics_statement", e.target.value)} placeholder="e.g. This study has been approved by the Research Ethics Committee (Ref: REC/2024/001). All data is confidential and anonymous." rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label>Informed Consent Text</Label>
        <Textarea value={branding.consent_text || ""} onChange={e => update("consent_text", e.target.value)} placeholder="By completing this form I confirm that I have read and understood the study information and consent to participate." rows={3} />
      </div>

      {/* ── Visual Design ── */}
      <div className="pt-2 border-t border-border space-y-4">
        <p className="text-sm font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Visual Design</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5" /> Header Style</Label>
            <Select value={branding.header_style || "minimal"} onValueChange={v => update("header_style", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="banner_solid">Solid Banner</SelectItem>
                <SelectItem value="banner_gradient">Gradient Banner</SelectItem>
                <SelectItem value="cover_image">Cover Image</SelectItem>
                <SelectItem value="split">Split Panel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Colour Theme</Label>
            <Select value={branding.theme || "default"} onValueChange={v => update("theme", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: t.primary }} />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Logo Position</Label>
          <div className="flex gap-2">
            {[
              { pos: "left", Icon: AlignLeft },
              { pos: "center", Icon: AlignCenter },
              { pos: "right", Icon: AlignRight },
            ].map(({ pos, Icon }) => (
              <button
                key={pos}
                type="button"
                onClick={() => update("logo_position", pos)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded border text-sm transition-all ${branding.logo_position === pos || (!branding.logo_position && pos === "left") ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <Icon className="w-4 h-4" />
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {(branding.header_style === "cover_image" || branding.header_style === "split") && (
          <div className="space-y-1.5">
            <Label>Cover / Background Image URL</Label>
            <div className="flex gap-2">
              <Input value={branding.cover_image_url || ""} onChange={e => update("cover_image_url", e.target.value)} placeholder="https://images.unsplash.com/..." className="flex-1" />
              <Button type="button" variant="outline" size="icon" onClick={() => coverImageRef.current?.click()} title="Upload Cover Image" className="shrink-0">
                <Upload className="w-4 h-4" />
              </Button>
              <input ref={coverImageRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
            {branding.cover_image_url && (
              <img src={branding.cover_image_url} alt="preview" className="mt-2 w-full h-24 object-cover border border-border rounded" />
            )}
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-4 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <Label className="flex items-center gap-2"><PenLine className="w-4 h-4" /> Require Respondent Signature</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Respondent draws their signature before submitting</p>
          </div>
          <Switch checked={!!branding.require_signature} onCheckedChange={v => update("require_signature", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Collect GPS Location</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Records respondent's coordinates at time of submission</p>
          </div>
          <Switch checked={!!branding.collect_gps} onCheckedChange={v => update("collect_gps", v)} />
        </div>
      </div>
    </div>
  );
}