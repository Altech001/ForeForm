import React, { useState } from "react";
import { base44 } from "@/api/foreform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, BarChart3, Bot, LayoutTemplate, LayoutGrid, List, Monitor } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";
import FormCard from "@/components/forms/FormCard";
import TemplateGallery from "@/components/forms/TemplateGallery";

function generateId() {
  return "q_" + Math.random().toString(36).substring(2, 9);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: () => base44.entities.Form.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Form.delete(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted");
    },
  });

  const createForm = async () => {
    const form = await base44.entities.Form.create({
      title: "Untitled Form",
      description: "",
      questions: [],
      status: "draft",
      response_count: 0,
    });
    navigate(`/forms/${form.id}/edit`);
  };

  const createFromTemplate = async (template) => {
    const questions = template.questions.map((q) => ({
      ...q,
      id: generateId(),
    }));
    const form = await base44.entities.Form.create({
      title: template.title,
      description: template.description,
      questions,
      status: "draft",
      response_count: 0,
      branding: template.branding || {},
    });
    setShowTemplates(false);
    toast.success(`Created from "${template.title}" template`);
    navigate(`/forms/${form.id}/edit`);
  };

  const copyLink = (formId) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const totalResponses = forms.reduce((sum, f) => sum + (f.response_count || 0), 0);
  const publishedCount = forms.filter((f) => f.status === "published").length;

  return (
    <div className="min-h-screen bg-background">
      {showTemplates && (
        <TemplateGallery
          onUseTemplate={createFromTemplate}
          onClose={() => setShowTemplates(false)}
          onStartFromScratch={() => { setShowTemplates(false); createForm(); }}
        />
      )}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img src="/letter-m.png" alt="FormFlow Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-lg sm:text-xl font-black tracking-tight">ForeForm</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" asChild className="gap-2 h-9 sm:h-10 px-3 sm:px-4">
              <Link to="/ai-respondents">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Respondents</span>
              </Link>
            </Button>
            <Button onClick={createForm} className="gap-2 h-9 sm:h-10 px-3 sm:px-4">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Form</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Tools */}
        <div className="mb-8">
          <h2 className="text-sm font-bold mb-4">Quick Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button onClick={createForm} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/form.png" alt="New Form" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">New Form</span>
            </button>
            <button onClick={() => setShowTemplates(true)} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/layout.png" alt="Browse Templates" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">Browse Templates</span>
            </button>
            <button onClick={() => navigate('/complex-ai')} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/star.png" alt="Generate Form" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">Generate Form</span>
            </button>
            <button onClick={() => navigate('/docx-preview')} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/docx.png" alt="Import CSV" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">Preview Word</span>
            </button>
          </div>
        </div>

        {/* Forms list header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold flex gap-2"><span><Monitor className="w-5 h-5" /> </span>All</h2>
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border border-border/20">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === "grid"
                ? "bg-background text-primary shadow border border-border/40"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === "list"
                ? "bg-background text-primary shadow border border-border/40"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>

        {/* Forms list */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/forms.png" alt="No forms" className="w-12 h-12 object-contain opacity-70" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
            <p className="text-muted-foreground mb-6">Start from a template or build from scratch</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2 w-full sm:w-auto">
                <LayoutTemplate className="w-4 h-4" /> Browse Templates
              </Button>
              <Button onClick={createForm} className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Start from Scratch
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "grid gap-4"}>
            {forms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                view={viewMode}
                onDelete={(id) => deleteMutation.mutate(id)}
                onCopyLink={copyLink}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}