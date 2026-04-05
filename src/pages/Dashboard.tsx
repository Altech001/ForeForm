import React, { useState } from "react";
import { base44 } from "@/api/foreform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, BarChart3, Bot, LayoutTemplate } from "lucide-react";
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/letter-m.png" alt="FormFlow Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold tracking-tight">FormFlow</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/ai-respondents"><Bot className="w-4 h-4" /> AI Respondents</Link>
            </Button>
            <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2">
              <LayoutTemplate className="w-4 h-4" /> Templates
            </Button>
            <Button onClick={createForm} className="gap-2">
              <Plus className="w-4 h-4" /> New Form
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Forms", value: forms.length, icon: "/forms.png", color: "text-primary" },
            { label: "Published", value: publishedCount, icon: BarChart3, color: "text-chart-3" },
            { label: "Total Responses", value: totalResponses, icon: Users, color: "text-chart-2" },
          ].map((stat) => (
            <div key={stat.label} className=" border border-border/60 rounded-xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden">
                {typeof stat.icon === 'string' ? (
                  <img src={stat.icon} alt={stat.label} className="w-6 h-6 object-contain" />
                ) : (
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button onClick={createForm} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/form.png" alt="New Form" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-sm font-medium">New Form</span>
            </button>
            <button onClick={() => setShowTemplates(true)} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/forms.png" alt="Browse Templates" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-sm font-medium">Browse Templates</span>
            </button>
            <button onClick={() => navigate('/complex-ai')} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/user.png" alt="Generate Form" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-sm font-medium">Generate Form</span>
            </button>
            <button onClick={() => navigate('/docx-preview')} className="bg-card border border-border/60 hover:border-primary/50 transition-all rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/docx.png" alt="Import CSV" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-sm font-medium">Preview Word Files</span>
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
            <div className="flex items-center gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2">
                <LayoutTemplate className="w-4 h-4" /> Browse Templates
              </Button>
              <Button onClick={createForm} className="gap-2">
                <Plus className="w-4 h-4" /> Start from Scratch
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
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