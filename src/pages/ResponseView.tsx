import React from "react";
import { base44 } from "@/api/foreform";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, FileDown, User, Mail, Clock, MapPin, PenLine,
  ChevronRight, Hash, Calendar, AlignLeft, CheckSquare, List, Type, AtSign
} from "lucide-react";
import { format } from "date-fns";
import { downloadDocx } from "@/lib/generateDocx";

const TYPE_ICONS = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: List,
  checkbox: CheckSquare,
  dropdown: List,
  date: Calendar,
  number: Hash,
  email: AtSign,
};

const TYPE_LABELS = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  date: "Date",
  number: "Number",
  email: "Email",
};

export default function ResponseView() {
  const { formId, responseId } = useParams();

  const { data: form } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (d) => d[0],
    enabled: !!formId,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["response", responseId],
    queryFn: () => base44.entities.FormResponse.filter({ id: responseId }),
    select: (d) => d[0],
    enabled: !!responseId,
  });

  const { data: geoData } = useQuery({
    queryKey: ["geo", response?.gps_latitude, response?.gps_longitude],
    queryFn: async () => {
      const res = await fetch(`https://api.3geonames.org/${response.gps_latitude},${response.gps_longitude}`);
      if (!res.ok) throw new Error("Failed to fetch geo data");
      const text = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const nearest = xmlDoc.getElementsByTagName("nearest")[0];
      if (!nearest) return null;
      return {
        city: nearest.getElementsByTagName("city")[0]?.textContent,
        name: nearest.getElementsByTagName("name")[0]?.textContent,
        prov: nearest.getElementsByTagName("prov")[0]?.textContent,
        region: nearest.getElementsByTagName("region")[0]?.textContent,
        state: nearest.getElementsByTagName("state")[0]?.textContent,
      };
    },
    enabled: !!response?.gps_latitude && !!response?.gps_longitude,
    staleTime: Infinity,
  });

  const branding = form?.branding || {};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!response) return null;

  const submittedAt = response.created_date
    ? format(new Date(response.created_date), "MMMM d, yyyy 'at' h:mm a")
    : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with breadcrumb */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/forms/${formId}/responses`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
              {form?.title || "Form"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate max-w-[160px]">
              {response.respondent_name || "Anonymous"}
            </span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="-ml-2">
                <Link to={`/forms/${formId}/responses`}><ArrowLeft className="w-4 h-4" /></Link>
              </Button>
              <h1 className="font-semibold">Response Detail</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadDocx(form, response)} className="gap-1.5">
              <FileDown className="w-4 h-4" /> Download DOCX
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Research / Branding header */}
        {(branding.organization || branding.logo_url || branding.research_title) && (
          <div className="bg-card border border-border rounded p-5 flex items-center gap-4">
            {branding.logo_url && (
              <img src={branding.logo_url} alt="logo" className="h-12 object-contain flex-shrink-0" />
            )}
            <div>
              {branding.organization && (
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{branding.organization}</p>
              )}
              {branding.research_title && (
                <p className="text-sm text-muted-foreground italic mt-0.5">{branding.research_title}</p>
              )}
              {branding.appendix_label && (
                <p className="text-xs text-muted-foreground mt-0.5">{branding.appendix_label}</p>
              )}
            </div>
          </div>
        )}

        {/* Respondent info card */}
        <div className="bg-card shadow-none border border-border rounded p-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-4">Participant Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg  flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-sm mt-0.5">{response.respondent_name || "Anonymous"}</p>
              </div>
            </div>

            {response.respondent_email && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg  flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-xs mt-0.5 break-all">{response.respondent_email}</p>
                </div>
              </div>
            )}
            {/* 
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg  flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium text-sm mt-0.5">{submittedAt}</p>
              </div>
            </div> */}

            {(response.gps_latitude && response.gps_longitude) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPS Location</p>
                  {geoData ? (
                    <>
                      <p className="font-medium text-sm mt-0.5">
                        {geoData.name || geoData.city || "Unknown Location"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[geoData.region, geoData.prov, geoData.state].filter(Boolean).join(", ")}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-sm mt-0.5">Retrieving location...</p>
                  )}
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {response.gps_latitude.toFixed(5)}, {response.gps_longitude.toFixed(5)}
                  </p>

                </div>
              </div>
            )}
          </div>

          {/* Signature */}
          {response.signature_data_url && (
            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-bold text-muted-foreground">Participant Signature</p>
              </div>
              <div className="bg-white border border-border rounded-lg p-3 inline-block">
                <img src={response.signature_data_url} alt="Signature" className="h-20 object-contain" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Electronically signed on {submittedAt}</p>
            </div>
          )}
        </div>

        {/* Answers */}
        <div className="bg-card border border-separate shadow-none rounded p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-muted-foreground">
              Survey Responses
            </h2>
            <Badge variant="secondary" className="text-primary">{response.answers?.length || 0} answers</Badge>
          </div>

          <div className="space-y-0 divide-y divide-border/70 ">
            {(response.answers || []).map((a, i) => {
              const Icon = TYPE_ICONS[a.question_type] || Type;
              return (
                <div key={i} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold text-primary/70">Q{i + 1}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {TYPE_LABELS[a.question_type] || a.question_type}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-foreground mb-2">{a.question_label}</p>
                      <div className={`rounded-lg px-4 py-3 text-sm ${a.answer ? "bg-accent/50 text-foreground" : "bg-muted/50 text-muted-foreground italic"}`}>
                        {a.answer || "No answer provided"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ethics footer */}
        {branding.ethics_statement && (
          <div className="border border-border/60 rounded-xl p-5 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ethics Statement</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{branding.ethics_statement}</p>
          </div>
        )}
      </main>
    </div>
  );
}