import React, { useState } from "react";
import { base44 } from "@/api/foreform";
import SEO from "@/components/SEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bot, Sparkles, MapPin, PenLine, Users, CheckCircle2,
  AlertCircle, ChevronRight, Loader2, Play, RotateCcw,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { randomUgandanName, randomUgandaLocation, generateSimpleSignature, UGANDA_DISTRICTS } from "@/lib/ugandaLocations";


const REGION_OPTIONS = ["All Regions", "Central", "Eastern", "Northern", "Western"];

function StatusBadge({ status }) {
  if (status === "pending") return <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Pending</span>;
  if (status === "generating") return <span className="text-xs text-primary flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" />Generating…</span>;
  if (status === "submitting") return <span className="text-xs text-yellow-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Submitting…</span>;
  if (status === "done") return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Submitted</span>;
  if (status === "error") return <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />Failed</span>;
  return null;
}

export default function AIRespondents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFormId, setSelectedFormId] = useState("");
  const [count, setCount] = useState(5);
  const [region, setRegion] = useState("All Regions");
  const [respondents, setRespondents] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: forms = [] } = useQuery({
    queryKey: ["forms"],
    queryFn: () => base44.entities.Form.list(),
  });

  const publishedForms = forms.filter(f => f.status === "published");
  const selectedForm = forms.find(f => f.id === selectedFormId);

  const buildRespondents = () => {
    const list = [];
    for (let i = 0; i < count; i++) {
      let loc = randomUgandaLocation();
      if (region !== "All Regions") {
        const filtered = UGANDA_DISTRICTS.filter(d => d.region === region);
        const base = filtered[Math.floor(Math.random() * filtered.length)];
        const jitter = () => (Math.random() - 0.5) * 0.02;
        loc = { ...base, lat: parseFloat((base.lat + jitter()).toFixed(6)), lng: parseFloat((base.lng + jitter()).toFixed(6)), accuracy: parseFloat((Math.random() * 30 + 5).toFixed(1)) };
      }
      const name = randomUgandanName();
      list.push({
        id: `ai_${i}_${Date.now()}`,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.ug`,
        location: loc,
        status: "pending",
        answers: [],
      });
    }
    setRespondents(list);
  };

  const updateRespondent = (id, patch) => {
    setRespondents(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const runGeneration = async () => {
    if (!selectedForm || respondents.length === 0) return;
    setIsRunning(true);

    for (const respondent of respondents) {
      // Step 1: Generate AI answers
      updateRespondent(respondent.id, { status: "generating" });

      let resultJson = { answers: [] };
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a research participant from ${respondent.location.locality}, ${respondent.location.name} District, Uganda (${respondent.location.region} Region).
Your name is ${respondent.name}. Answer the following survey questions naturally and realistically, drawing on the context of living in Uganda. Keep answers concise but meaningful.

Form Title: ${selectedForm.title}
${selectedForm.description ? `Description: ${selectedForm.description}` : ""}

Questions:
${(selectedForm.questions || []).map((q, i) => `${i + 1}. [${q.type}] ${q.label}${q.options?.length ? `\n   Options: ${q.options.join(", ")}` : ""}`).join("\n")}

Return ONLY a JSON object with this EXACT structure:
{
  "answers": [
    { "question_id": "...", "answer": "..." }
  ]
}`,
        });

        // The bridge might return a double-stringified JSON or an object
        let data = typeof result === "string" ? JSON.parse(result) : result;
        if (typeof data === "string") data = JSON.parse(data);

        resultJson = data;
      } catch (e) {
        console.error("Failed to generate or parse AI response:", e);
        updateRespondent(respondent.id, { status: "error" });
        continue; // Skip this respondent and continue with the next one
      }

      const answersMap = {};
      (resultJson.answers || []).forEach(a => { answersMap[a.question_id] = a.answer; });

      const formattedAnswers = (selectedForm.questions || []).map(q => ({
        question_id: q.id,
        question_label: q.label,
        question_type: q.type,
        answer: answersMap[q.id] || (q.options?.length ? q.options[0] : "N/A"),
      }));

      // Step 2: Generate signature
      const signatureDataUrl = generateSimpleSignature(respondent.name);

      updateRespondent(respondent.id, { status: "submitting", answers: formattedAnswers });

      // Step 3: Submit response
      await base44.entities.FormResponse.create({
        form_id: selectedForm.id,
        respondent_name: respondent.name,
        respondent_email: respondent.email,
        answers: formattedAnswers,
        signature_data_url: signatureDataUrl,
        gps_latitude: respondent.location.lat,
        gps_longitude: respondent.location.lng,
        gps_accuracy: respondent.location.accuracy,
        gps_address: respondent.location.locality,
      });

      await base44.entities.Form.update(selectedForm.id, {
        response_count: (selectedForm.response_count || 0) + 1,
      });

      updateRespondent(respondent.id, { status: "done", signature: signatureDataUrl });
    }

    queryClient.invalidateQueries({ queryKey: ["forms"] });
    queryClient.invalidateQueries({ queryKey: ["responses", selectedFormId] });
    toast.success(`${respondents.length} AI respondents submitted successfully!`);
    setIsRunning(false);
  };

  const doneCount = respondents.filter(r => r.status === "done").length;
  const allDone = respondents.length > 0 && doneCount === respondents.length;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="AI Respondents Generator" path="/ai-respondents" />
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">AI Respondents Generator</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="-ml-2">
                <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8  flex items-center justify-center">
                  <img src="/star.png" alt="ForeForm" className="w-5 h-5" />
                </div>
                <h1 className="font-semibold">AI Respondents Generator</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Uganda</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Config panel */}
        <div className="bg-card rounded p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Form selector */}
            <div className="sm:col-span-1 space-y-1.5">
              <Label>Target Form</Label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a published form…" />
                </SelectTrigger>
                <SelectContent>
                  {publishedForms.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">No published forms</div>
                  )}
                  {publishedForms.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="space-y-1.5">
              <Label>Number of Respondents</Label>
              <Input
                type="number"
                min={1} max={20}
                value={count}
                onChange={e => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Max 20 per run</p>
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Uganda Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedForm && (
            <div className="flex items-center gap-3 p-3 bg-accent/40 rounded text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span><span className="font-medium">{selectedForm.title}</span> — {selectedForm.questions?.length || 0} questions
                {selectedForm.branding?.require_signature && <span className="ml-2 text-muted-foreground">· Signature required ✓</span>}
                {selectedForm.branding?.collect_gps && <span className="ml-2 text-muted-foreground">· GPS ✓</span>}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={buildRespondents}
              disabled={!selectedFormId || isRunning}
              className="gap-2"
            >
              <Users className="w-4 h-4" /> Preview Respondents
            </Button>
            <Button
              onClick={runGeneration}
              disabled={!selectedFormId || respondents.length === 0 || isRunning || allDone}
              className="gap-2"
            >
              {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Play className="w-4 h-4" />Run Generation</>}
            </Button>
            {allDone && (
              <Button variant="outline" onClick={() => { setRespondents([]); }} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Progress overview */}
        {respondents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: respondents.length, color: "text-foreground" },
              { label: "Generating", value: respondents.filter(r => r.status === "generating" || r.status === "submitting").length, color: "text-primary" },
              { label: "Submitted", value: doneCount, color: "text-green-600" },
              { label: "Failed", value: respondents.filter(r => r.status === "error").length, color: "text-destructive" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Respondents table */}
        {respondents.length > 0 && (
          <div className="bg-card rounded overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Respondent Queue</p>
            </div>
            <div className="divide-y divide-border/60">
              {respondents.map((r, i) => (
                <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{r.location.locality} · {r.location.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}</span>
                      {r.status === "done" && <span title="Signature captured"><PenLine className="w-3 h-3 text-green-600" /></span>}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post-run CTA */}
        {allDone && (
          <div className="bg-green-50 border border-green-200 rounded p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">{doneCount} AI respondents submitted!</p>
                <p className="text-sm text-green-700">All responses include GPS coordinates, signatures, and AI-generated answers.</p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-green-300 text-green-800 hover:bg-green-100 flex-shrink-0 w-full sm:w-auto">
              <Link to={`/forms/${selectedFormId}/responses`}>View Responses →</Link>
            </Button>
          </div>
        )}

        {/* Empty state */}
        {respondents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Configure and preview respondents above</p>
            <p className="text-sm mt-1">AI will generate realistic Ugandan names, GPS locations, and answers</p>
          </div>
        )}
      </main>
    </div>
  );
}