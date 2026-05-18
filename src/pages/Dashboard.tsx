import React, { useState, useEffect } from "react";
import { base44 } from "@/api/foreform";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, BarChart3, Bot, LayoutTemplate, LayoutGrid, List, Monitor, BookMarked, Sparkles, BrainCircuit, ShieldCheck, ChevronsUpIcon, ChevronsDownIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "@/components/Header/AppHeader";

import { toast } from "sonner";
import FormCard from "@/components/forms/FormCard";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import TemplateGallery from "@/components/forms/TemplateGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function generateId() {
  return "q_" + Math.random().toString(36).substring(2, 9);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFormsVisible, setIsFormsVisible] = useState(true);
  const isMobile = useIsMobile();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: () => base44.entities.Form.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Form.delete(String(id)),
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


  const totalResponses = forms.reduce((sum: any, f: any) => sum + (f.response_count || 0), 0);
  const publishedCount = forms.filter((f: any) => f.status === "published").length;

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(forms);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    queryClient.setQueryData(["forms"], items);
  };

  // Listen for sidebar's "open-templates" event
  useEffect(() => {
    const handler = () => setShowTemplates(true);
    window.addEventListener("open-templates", handler);
    return () => window.removeEventListener("open-templates", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Dashboard" />
      {showTemplates && (
        <TemplateGallery
          onUseTemplate={createFromTemplate}
          onClose={() => setShowTemplates(false)}
          onStartFromScratch={() => { setShowTemplates(false); createForm(); }}
        />
      )}
      <AppHeader onCreateForm={createForm} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {/* form */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Start New Form</h2>
            <Select defaultValue="all">
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <button onClick={createForm} className="bg-card border border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.15)] hover:border-primary/60 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/form.png" alt="New Form" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">New Form</span>
            </button>
            <button onClick={() => setShowTemplates(true)} className="bg-card border border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.15)] hover:border-primary/60 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <img src="/layout.png" alt="Browse Templates" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
              <span className="text-xs sm:text-sm font-medium">Browse Templates</span>
            </button>
            <button onClick={() => setIsGeneratorOpen(true)} className="col-span-2 sm:col-span-1 bg-card border border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.15)] hover:border-primary/60 transition-all rounded p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <img src="/icons/ai.svg" alt="Generate Form" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs sm:text-sm font-medium">Ask ForeForm AI </span>
            </button>
          </div>
        </div>

        {/* Forms list header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setIsFormsVisible(!isFormsVisible)}
            className="text-base font-semibold flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group"
          >
            <span>Recent Created</span>
            <motion.div
              animate={{ rotate: isFormsVisible ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronsDownIcon className="text-primary w-5 h-5 group-hover:scale-110 transition-transform" />
            </motion.div>
          </button>
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
        <AnimatePresence initial={false}>
          {isFormsVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {isLoading ? (
                <div className="grid gap-4 pt-2 pb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-20 pt-2 pb-6">
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
                <div className="pt-2 pb-6">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="forms" direction={viewMode === "grid" ? "horizontal" : "vertical"}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "grid gap-4"}
                        >
                          {forms.map((form: any, index: number) => (
                            <Draggable key={form.id} draggableId={form.id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className={viewMode === "grid" ? "h-full" : ""}>
                                  <FormCard
                                    form={form}
                                    view={viewMode}
                                    onDelete={(id: string) => deleteMutation.mutate(id)}
                                    onCopyLink={copyLink}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <GeneratorSelection
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        isMobile={isMobile}
        onSelect={(path) => {
          setIsGeneratorOpen(false);
          navigate(path);
        }}
      />
    </div>
  );
}

function GeneratorSelection({ isOpen, onClose, isMobile, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onSelect: (path: string) => void;
}) {
  const content = (
    <div className="grid gap-4 p-4 sm:p-0">
      <button
        onClick={() => onSelect("/agent")}
        className="flex items-center gap-4 p-4 rounded border border-border/20 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
      >
        <div className="w-12 h-12  flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">ForeForm Agent</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intelligent & iterative. Chat with AI to build complex, multi-section forms exactly how you want.
          </p>
        </div>
      </button>

      <button
        onClick={() => onSelect("/complex-ai")}
        className="flex items-center gap-4 p-4 rounded border border-border/20 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">ForeForm Assistant</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fast & direct. Generate a complete form instantly from a single prompt or document.
          </p>
        </div>
      </button>
    </div>
  );

  const title = "Choose your AI power";
  const description = "Select the best AI experience for your form creation needs.";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="pb-8 px-4 bg-card">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}