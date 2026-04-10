import React, { useState, useEffect } from "react";
import { base44 } from "@/api/foreform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, Send, Link2, Eye, Upload, Settings2, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import QuestionEditor from "@/components/forms/QuestionEditor";
import ImportQuestionsDialog from "@/components/forms/ImportQuestionsDialog";
import FormBrandingPanel from "@/components/forms/FormBrandingPanel";
import TeamAccessPanel from "@/components/forms/TeamAccessPanel";

function generateId() {
  return "q_" + Math.random().toString(36).substring(2, 9);
}

export default function FormBuilder() {
  const { id: formId } = useParams();
  const queryClient = useQueryClient();
  const [showImport, setShowImport] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (data) => data[0],
    enabled: !!formId,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("draft");
  const [branding, setBranding] = useState<any>({});
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => { });
  }, []);

  useEffect(() => {
    if (form) {
      setTitle(form.title || "");
      setDescription(form.description || "");
      setQuestions(form.questions || []);
      setStatus(form.status || "draft");
      setBranding(form.branding || {});
    }
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Form.update(formId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form saved!");
    },
  });

  const handleSave = (newStatus?: string) => {
    const s = newStatus || status;
    saveMutation.mutate({ title, description, questions, status: s, branding });
    if (newStatus) setStatus(newStatus);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: generateId(), type: "short_text", label: "", required: false, options: [] }]);
  };

  const updateQuestion = (index, updated) => {
    const q = [...questions];
    q[index] = updated;
    setQuestions(q);
  };

  const deleteQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQuestions(items);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/f/${formId}`);
    toast.success("Link copied!");
  };

  const handleImport = (newQuestions) => {
    setQuestions([...questions, ...newQuestions]);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10 pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button variant="ghost" size="icon" asChild className="shrink-0"><Link to="/"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <Badge variant="secondary" className={status === "published" ? "bg-primary/10 text-primary shrink-0" : "shrink-0"}>{status}</Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {status === "published" && (
              <>
                <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 px-2.5 sm:px-3"><Link2 className="w-4 h-4" /> <span className="hidden sm:inline">Copy Link</span></Button>
                <Button variant="outline" size="sm" asChild className="px-2.5 sm:px-3">
                  <Link to={`/f/${formId}`} target="_blank"><Eye className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Preview</span></Link>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saveMutation.isPending} className="gap-1.5 px-2.5 sm:px-3">
              <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
            </Button>
            {status !== "published" && (
              <Button size="sm" onClick={() => handleSave("published")} disabled={saveMutation.isPending} className="gap-1.5 px-2.5 sm:px-3">
                <Send className="w-4 h-4" /> <span className="hidden sm:inline">Publish</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="questions">
          <div className="overflow-x-auto pb-2 sm:pb-0 mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="sm:w-auto inline-flex justify-start sm:justify-center min-w-max">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5"><Settings2 className="w-3.5 h-3.5" /> R & B</TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Teams</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="questions" className="space-y-4 sm:space-y-6">
            {/* Form meta */}
            <div className="bg-card border border-border rounded p-4 sm:p-6 space-y-3">
              {branding.logo_url && (
                <img src={branding.logo_url} alt="logo" className="h-12 object-contain mb-2" />
              )}
              {branding.organization && <p className="text-xs font-semibold text-primary uppercase tracking-wider">{branding.organization}</p>}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form title"
                className="text-2xl font-bold border-none px-0 shadow-none focus-visible:ring-0 h-auto"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description or abstract (optional)"
                className="border-none px-0 shadow-none focus-visible:ring-0 resize-none text-muted-foreground"
                rows={2}
              />
              {branding.research_title && (
                <p className="text-sm text-muted-foreground italic">{branding.appendix_label || "Research Instrument"}: {branding.research_title}</p>
              )}
            </div>

            {/* Import bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Import Questions
              </Button>
            </div>

            {/* Questions list */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {questions.map((q, i) => (
                      <Draggable key={q.id} draggableId={q.id} index={i}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <QuestionEditor
                              question={q}
                              onUpdate={(updated) => updateQuestion(i, updated)}
                              onDelete={() => deleteQuestion(i)}
                              dragHandleProps={provided.dragHandleProps}
                              allQuestions={questions}
                              questionIndex={i}
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

            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full mt-2 border-dashed border-2 h-14 text-muted-foreground hover:text-foreground hover:border-primary/30 gap-2"
            >
              <Plus className="w-5 h-5" /> Add Question
            </Button>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card rounded p-4 sm:p-6">
              <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" /> Research & Branding Settings
              </h2>
              <FormBrandingPanel branding={branding} onChange={setBranding} />
              <Button onClick={() => handleSave()} disabled={saveMutation.isPending} className="mt-6 gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="bg-card  rounded p-4 sm:p-6">
              <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Team Access
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Share this form with other registered users. Editors can modify questions; Viewers can only view and export responses.</p>
              <TeamAccessPanel formId={formId} currentUserEmail={currentUser?.email || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ImportQuestionsDialog open={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  );
}