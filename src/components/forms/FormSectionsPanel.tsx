import React, { useState, useEffect } from "react";
import { base44 } from "@/api/foreform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Layers, Save } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import QuestionEditor from "./QuestionEditor";

function generateId() {
    return "q_" + Math.random().toString(36).substring(2, 9);
}

export default function FormSectionsPanel({ formId }) {
    const queryClient = useQueryClient();
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [localSections, setLocalSections] = useState<any[]>([]);
    const [dirty, setDirty] = useState(false);

    // Fetch sections from server (read-only source of truth on load)
    const { data: serverSections = [], isLoading } = useQuery({
        queryKey: ["sections", formId],
        queryFn: () => base44.entities.FormSection.list(formId),
    });

    // Seed local state from server data
    useEffect(() => {
        if (serverSections.length > 0 || !isLoading) {
            setLocalSections(serverSections);
            setDirty(false);
        }
    }, [serverSections]);

    // --- Mutations (only triggered on explicit Save) ---

    const createMutation = useMutation({
        mutationFn: (data: any) => base44.entities.FormSection.create(formId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sections", formId] });
            toast.success("Section added");
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (sections: any[]) => {
            // Save all sections in parallel
            await Promise.all(
                sections.map((s) =>
                    base44.entities.FormSection.update(s.id, {
                        title: s.title,
                        description: s.description,
                        questions: s.questions,
                        order: s.order,
                    })
                )
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sections", formId] });
            toast.success("Sections saved!");
            setDirty(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => base44.entities.FormSection.delete(id),
        onSuccess: (_, deletedId) => {
            setLocalSections((prev) => prev.filter((s) => s.id !== deletedId));
            queryClient.invalidateQueries({ queryKey: ["sections", formId] });
            toast.success("Section deleted");
        },
    });

    const reorderMutation = useMutation({
        mutationFn: (sectionIds: string[]) => base44.entities.FormSection.reorder(formId, sectionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sections", formId] });
        },
    });

    // --- Pure local state handlers (instant, no API calls) ---

    const addSection = () => {
        createMutation.mutate({
            title: `Section ${localSections.length + 1}`,
            description: "",
            order: localSections.length,
            questions: [],
        });
    };

    const toggleSection = (id: string) => {
        setExpandedSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const updateSection = (index: number, updates: any) => {
        const updated = [...localSections];
        updated[index] = { ...updated[index], ...updates };
        setLocalSections(updated);
        setDirty(true);
    };

    const updateQuestion = (sectionIndex: number, qIndex: number, updatedQ: any) => {
        const updated = [...localSections];
        const qs = [...updated[sectionIndex].questions];
        qs[qIndex] = updatedQ;
        updated[sectionIndex] = { ...updated[sectionIndex], questions: qs };
        setLocalSections(updated);
        setDirty(true);
    };

    const deleteQuestion = (sectionIndex: number, qIndex: number) => {
        const updated = [...localSections];
        updated[sectionIndex] = {
            ...updated[sectionIndex],
            questions: updated[sectionIndex].questions.filter((_: any, i: number) => i !== qIndex),
        };
        setLocalSections(updated);
        setDirty(true);
    };

    const addQuestion = (sectionIndex: number) => {
        const updated = [...localSections];
        const newQ = { id: generateId(), type: "short_text", label: "", required: false, options: [] };
        updated[sectionIndex] = {
            ...updated[sectionIndex],
            questions: [...(updated[sectionIndex].questions || []), newQ],
        };
        setLocalSections(updated);
        setDirty(true);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        if (result.type === "SECTION") {
            const items = Array.from(localSections);
            const [moved] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, moved);
            setLocalSections(items);
            setDirty(true);
            reorderMutation.mutate(items.map((s: any) => s.id));
            return;
        }

        if (result.type === "QUESTION") {
            const sectionId = result.source.droppableId;
            const sectionIndex = localSections.findIndex((s: any) => s.id === sectionId);
            if (sectionIndex === -1) return;

            const items = Array.from(localSections[sectionIndex].questions);
            const [moved] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, moved);

            const updated = [...localSections];
            updated[sectionIndex] = { ...updated[sectionIndex], questions: items };
            setLocalSections(updated);
            setDirty(true);
        }
    };

    const handleSave = () => {
        saveMutation.mutate(localSections);
    };

    if (isLoading && localSections.length === 0) {
        return <div className="p-10 text-center opacity-50 italic">Loading sections...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Multi-Section Builder
                </h2>
                <div className="flex items-center gap-2">
                    {dirty && (
                        <Button onClick={handleSave} disabled={saveMutation.isPending} size="sm" className="gap-1.5">
                            <Save className="w-4 h-4" /> {saveMutation.isPending ? "Saving…" : "Save Sections"}
                        </Button>
                    )}
                    <Button onClick={addSection} disabled={createMutation.isPending} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Section
                    </Button>
                </div>
            </div>

            {localSections.length === 0 ? (
                <div className="border-2 border-dashed rounded p-12 text-center bg-slate-50/50">
                    <Layers className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-primary">No sections yet</h3>
                    <p className="text-xs text-primary/50 mt-1 max-w-[200px] mx-auto">
                        Break your form into logical parts to improve respondent experience.
                    </p>
                    <Button variant="outline" size="sm" onClick={addSection} className="mt-4">
                        Get Started
                    </Button>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sections-main" type="SECTION">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {localSections.map((section: any, index: number) => (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className="group">
                                                <div className="bg-card border border-border rounded shadow-sm overflow-hidden transition-all hover:shadow-md">
                                                    {/* Section Header */}
                                                    <div className="p-4 bg-slate-50/50 flex items-center gap-3">
                                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-400">
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <Input
                                                                value={section.title}
                                                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                                                className="h-7 text-sm font-bold border-none bg-transparent p-0 focus-visible:ring-0 shadow-none"
                                                                placeholder="Section Title"
                                                            />
                                                            <Input
                                                                value={section.description}
                                                                onChange={(e) => updateSection(index, { description: e.target.value })}
                                                                className="h-5 text-[11px] border-none bg-transparent p-0 focus-visible:ring-0 shadow-none text-muted-foreground"
                                                                placeholder="Section Description (optional)"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => toggleSection(section.id)}
                                                                className="h-8 w-8"
                                                            >
                                                                {expandedSections.includes(section.id) ? (
                                                                    <ChevronUp className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    if (confirm("Delete this section? Questions inside will be lost.")) {
                                                                        deleteMutation.mutate(section.id);
                                                                    }
                                                                }}
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Questions in Section */}
                                                    {expandedSections.includes(section.id) && (
                                                        <div className="p-4 bg-white space-y-4">
                                                            <Droppable droppableId={section.id} type="QUESTION">
                                                                {(qProvided) => (
                                                                    <div {...qProvided.droppableProps} ref={qProvided.innerRef} className="space-y-4">
                                                                        {(section.questions || []).map((q: any, qIndex: number) => (
                                                                            <Draggable key={q.id} draggableId={q.id} index={qIndex}>
                                                                                {(qDraggableProvided) => (
                                                                                    <div ref={qDraggableProvided.innerRef} {...qDraggableProvided.draggableProps}>
                                                                                        <QuestionEditor
                                                                                            question={q}
                                                                                            onUpdate={(updated) => updateQuestion(index, qIndex, updated)}
                                                                                            onDelete={() => deleteQuestion(index, qIndex)}
                                                                                            dragHandleProps={qDraggableProvided.dragHandleProps}
                                                                                            allQuestions={section.questions}
                                                                                            questionIndex={qIndex}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {qProvided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => addQuestion(index)}
                                                                className="w-full border-dashed py-6 text-muted-foreground"
                                                            >
                                                                <Plus className="w-4 h-4 mr-2" /> Add Question to {section.title}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
    );
}
