import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, MoreVertical, Trash2, Calendar, LayoutList, GripVertical, User, Paperclip, File } from "lucide-react";
import CreateTasksPanel, { Task } from "./CreatTasksPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";

export default function TasksIndex() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem("foreform_tasks");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [
            {
                id: "1",
                title: "Analyze Q3 User Feedback",
                description: "Review all the negative feedback from the Q3 survey and categorize them.",
                status: "todo",
                priority: "high",
                dueDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            },
            {
                id: "2",
                title: "Prepare Marketing Form Template",
                description: "Create a standard template for the marketing team's weekly check-ins.",
                status: "in_progress",
                priority: "medium",
                dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                createdAt: new Date().toISOString(),
            }
        ];
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [completionFile, setCompletionFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        localStorage.setItem("foreform_tasks", JSON.stringify(tasks));
    }, [tasks]);

    const handleCreateTask = (newTaskData: Omit<Task, "id" | "createdAt">) => {
        const newTask: Task = {
            ...newTaskData,
            id: Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString(),
        };
        setTasks(prev => [newTask, ...prev]);
        toast.success("Task created successfully!");
        toast.info("Task data is used as knowledge base for AI", { icon: "🤖" });
        if (newTaskData.assigneeEmail) {
            toast.success(`Task assigned to ${newTaskData.assigneeEmail} via email.`);
        }
    };

    const handleDeleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success("Task deleted");
    };

    const toggleTaskStatus = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task?.status !== "done") {
            setCompletingTaskId(id);
            setCompletionFile(null);
        } else {
            // Unmark done
            setTasks(prev => prev.map(t => {
                if (t.id === id) {
                    return { ...t, status: "todo", attachmentUrl: undefined };
                }
                return t;
            }));
        }
    };

    const handleConfirmCompletion = async () => {
        let url;
        if (completionFile) {
            setIsUploading(true);
            try {
                const res = await base44.integrations.Core.UploadFile({ file: completionFile });
                url = res.file_url;
                toast.success("Document uploaded successfully!");
            } catch (e) {
                toast.error("Failed to upload document");
            }
            setIsUploading(false);
        }

        setTasks(prev => prev.map(t => {
            if (t.id === completingTaskId) {
                return { ...t, status: "done", attachmentUrl: url || t.attachmentUrl, activities: [{ id: Math.random().toString(36).substring(7), action: "marked task as done and uploaded a file", user: "You", createdAt: new Date().toISOString() }, ...(t.activities || [])] };
            }
            return t;
        }));
        toast.success("Task marked as done! 🎉");
        setCompletingTaskId(null);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            case "medium": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
            case "low": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
            default: return "";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <CreateTasksPanel
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSave={handleCreateTask}
            />

            <Dialog open={!!completingTaskId} onOpenChange={(open) => !open && !isUploading && setCompletingTaskId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Task</DialogTitle>
                        <DialogDescription>
                            You can optionally attach a document or file before marking this task as complete.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input type="file" onChange={(e) => setCompletionFile(e.target.files?.[0] || null)} disabled={isUploading} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompletingTaskId(null)} disabled={isUploading}>Cancel</Button>
                        <Button onClick={handleConfirmCompletion} disabled={isUploading}>
                            {isUploading ? "Uploading..." : "Mark as Complete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header aligned with Dashboard design */}
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-1 -ml-2 rounded-full hover:bg-muted">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <LayoutList className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight">Tasks</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 sm:h-10 px-3 sm:px-4 shadow-sm hover:shadow transition-all">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Task</span>
                        </Button>
                        <Button onClick={() => navigate('/bookmark-documents')} className="gap-2 h-9 sm:h-10 px-3 sm:px-4 shadow-sm hover:shadow transition-all">
                            <File className="w-4 h-4" />
                            <span className="hidden sm:inline">Documents</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {tasks.length === 0 ? (
                    <div className="text-center py-24 px-4 border border-dashed rounded-xl bg-card/50">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-primary/60" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">You're all caught up!</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create tasks to manage your forms, surveys, or general workflow inside ForeForm.</p>
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" /> Create First Task
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tasks.map(task => (
                            <Card
                                key={task.id}
                                className={`group relative rounded bg-card transition-all duration-200 hover:shadow border-border/50 cursor-pointer ${task.status === 'done' ? 'opacity-60' : ''}`}
                                onClick={() => navigate(`/bookmark-tasks/${task.id}`)}
                            >
                                <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between space-y-0">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
                                            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                        >
                                            {task.status === 'done' ? (
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Circle className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className="space-y-1">
                                            <CardTitle className={`text-sm font-semibold leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.title}
                                            </CardTitle>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                                                <Trash2 className="w-4 h-4" /> Delete Task
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-5 pt-0 pl-14">
                                    <p className={`text-sm ${task.status === 'done' ? 'text-muted-foreground/60' : 'text-muted-foreground'} line-clamp-2 mb-4`}>
                                        {task.description || 'No description provided.'}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className={`text-xs font-medium ${getPriorityColor(task.priority)} border-none`}>
                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                        </Badge>
                                        <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        {task.assigneeEmail && (
                                            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[120px] sm:max-w-[160px] truncate" title={task.assigneeEmail}>
                                                <User className="w-3 h-3 mr-1 shrink-0" />
                                                <span className="truncate">{task.assigneeEmail}</span>
                                            </div>
                                        )}
                                        {task.attachmentUrl && (
                                            <div
                                                className="flex items-center text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md truncate cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); window.open(task.attachmentUrl, '_blank'); }}
                                            >
                                                <Paperclip className="w-3 h-3 mr-1 shrink-0" />
                                                <span className="truncate">Attached File</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div >
    );
}
