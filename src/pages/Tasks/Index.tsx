import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    const queryClient = useQueryClient();

    const { data: tasksData, isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: base44.entities.Task.list
    });
    const tasks: Task[] = tasksData || [];

    const createTaskMut = useMutation({
        mutationFn: base44.entities.Task.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success("Task created successfully!");
        }
    });

    const updateTaskMut = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => base44.entities.Task.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const deleteTaskMut = useMutation({
        mutationFn: base44.entities.Task.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success("Task deleted");
        }
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [completionFile, setCompletionFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleCreateTask = (newTaskData: any) => {
        const payload: any = {
            title: newTaskData.title,
            description: newTaskData.description,
            status: newTaskData.status,
            priority: newTaskData.priority,
            due_date: newTaskData.dueDate,
        };
        // Support multi-assignee
        if (newTaskData.assignee_emails && newTaskData.assignee_emails.length > 0) {
            payload.assignee_emails = newTaskData.assignee_emails;
        } else if (newTaskData.assigneeEmail) {
            payload.assignee_emails = [newTaskData.assigneeEmail];
        }
        createTaskMut.mutate(payload);
        if (payload.assignee_emails?.length) {
            toast.success(`Task assigned to ${payload.assignee_emails.length} person(s).`);
        }
    };

    const handleDeleteTask = (id: string) => {
        deleteTaskMut.mutate(id);
    };

    const toggleTaskStatus = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task?.status !== "done") {
            setCompletingTaskId(id);
            setCompletionFile(null);
        } else {
            // Unmark done
            updateTaskMut.mutate({ id, data: { status: "todo", attachment_url: null } });
        }
    };

    const handleConfirmCompletion = async () => {
        if (!completingTaskId) return;

        let url;
        if (completionFile) {
            setIsUploading(true);
            try {
                const res = await base44.integrations.Core.UploadFile({ file: completionFile });
                url = res.file_url;
                toast.success("Document uploaded successfully!");
            } catch (e) {
                toast.error("Failed to upload document");
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        updateTaskMut.mutate({
            id: completingTaskId,
            data: { status: "done", attachment_url: url }
        });
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
                                            {new Date(task.created_at || task.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        {/* Multi-assignee display */}
                                        {(() => {
                                            const emails = task.assignee_emails && task.assignee_emails.length > 0
                                                ? task.assignee_emails
                                                : (task.assignee_email || task.assigneeEmail)
                                                    ? [task.assignee_email || task.assigneeEmail]
                                                    : [];
                                            if (emails.length === 0) return null;
                                            return (
                                                <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[160px] sm:max-w-[200px]" title={emails.join(', ')}>
                                                    <User className="w-3 h-3 mr-1 shrink-0" />
                                                    <span className="truncate">
                                                        {emails.length === 1 ? emails[0] : `${emails.length} people`}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                        {(task.attachment_url || task.attachmentUrl) && (
                                            <div
                                                className="flex items-center text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md truncate cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); window.open(task.attachment_url || task.attachmentUrl, '_blank'); }}
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
