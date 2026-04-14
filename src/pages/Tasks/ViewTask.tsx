import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Circle, Paperclip, MessageSquare, Activity as ActivityIcon, Send, User, Plus } from "lucide-react";
import { toast } from "sonner";
import { Task, Comment } from "./CreatTasksPanel";
import { base44 } from "@/api/foreform";

export default function ViewTask() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const { data: taskArray, isLoading } = useQuery({
        queryKey: ['tasks', taskId],
        queryFn: () => base44.entities.Task.filter({ id: taskId })
    });
    const task: Task | undefined = taskArray?.[0];

    const updateTaskMut = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => base44.entities.Task.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
        }
    });

    const addCommentMut = useMutation({
        mutationFn: ({ id, text }: { id: string, text: string }) => base44.entities.Task.comment(id, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
            setNewComment("");
        }
    });

    const [newComment, setNewComment] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    if (isLoading || !task) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto w-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading task details...</p>
                <Button variant="ghost" onClick={() => navigate('/bookmark-tasks')} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tasks
                </Button>
            </div>
        );
    }

    const toggleStatus = () => {
        const newStatus = task.status === "done" ? "todo" : "done";
        updateTaskMut.mutate({ id: task.id, data: { status: newStatus } });
        toast.success(`Task marked as ${newStatus === 'done' ? 'complete! 🎉' : 'todo'}`);
    };

    const handleAddComment = () => {
        if (!newComment.trim() || !task) return;
        addCommentMut.mutate({ id: task.id, text: newComment });
        toast.info("Adding comment...", { icon: "📝" });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await base44.integrations.Core.UploadFile({ file });
            updateTaskMut.mutate({
                id: task.id,
                data: { attachment_url: res.file_url, status: task.status }
            });
            toast.success("File uploaded and attached!");
        } catch (err) {
            toast.error("Failed to upload document");
        }
        setIsUploading(false);
    };

    return (
        <div className="min-h-screen bg-background overflow-x-hidden w-full relative">
            {/* Header */}
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10 w-full max-w-full">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/bookmark-tasks')} className="mr-1 -ml-2 rounded-full hover:bg-muted shrink-0">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <h1 className="text-lg font-bold truncate">Task Overview</h1>
                    </div>
                    <Button onClick={toggleStatus} variant={task.status === 'done' ? 'outline' : 'default'} className="gap-2 shadow-sm shrink-0">
                        {task.status === 'done' ? <><Circle className="w-4 h-4 hidden sm:block" /> Reopen<span className="hidden sm:inline"> Task</span></> : <><CheckCircle2 className="w-4 h-4 hidden sm:block" /> Mark Complete</>}
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8 gap-6 w-full">
                    {/* Left Column (Main Info, Comments) */}
                    <div className="md:col-span-2 space-y-6 min-w-0 w-full">
                        <div className="space-y-4 max-w-full">
                            <h2 className={`text-2xl font-black tracking-tight break-words ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground max-w-full">
                                <Badge variant="secondary" className={`${task.status === 'done' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20'} border-none uppercase text-[10px] tracking-wider shrink-0`}>
                                    {task.status.replace("_", " ")}
                                </Badge>
                                <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md text-xs font-medium shrink-0">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Created {new Date(task.created_at || task.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <Card className="rounded shadow-none border-border/30 bg-card/50 max-w-full">
                            <CardHeader className="py-4 pb-0">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground max-w-full overflow-hidden">
                                {task.description || "No description provided."}
                            </CardContent>
                        </Card>

                        {/* Files Section */}
                        <div className="space-y-3 max-w-full">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 shrink-0" /> Attached Files
                                </h3>
                                <div>
                                    <Input type="file" id="file-upload" className="sr-only" onChange={handleFileUpload} disabled={isUploading} />
                                    <Label htmlFor="file-upload" className="cursor-pointer text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap">
                                        {isUploading ? "Uploading..." : "+ Attach File"}
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2 max-w-full overflow-hidden">
                                {task.attachment_url || task.attachmentUrl ? (
                                    <>
                                        {(task.attachment_url || task.attachmentUrl) && (
                                            <div className="flex items-center justify-between p-3 border rounded bg-card/60 shadow-sm transition hover:shadow cursor-pointer max-w-full overflow-hidden" onClick={() => window.open(task.attachment_url || task.attachmentUrl, '_blank')}>
                                                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                                                        <Paperclip className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-medium truncate">Document uploaded</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap pl-4 shrink-0">View</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-sm text-primary bg-primary/5 border border-dashed border-primary/40 rounded p-6 text-center break-words">
                                        No files attached yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="pt-2 space-y-4 max-w-full">
                            <h3 className="text-xs font-semibold flex items-center gap-2">
                                Comments
                            </h3>

                            <div className="space-y-4 mb-4 max-w-full overflow-hidden">
                                {(task.activities || []).filter(a => a.action.startsWith("commented: ")).length > 0 ? (
                                    (task.activities || []).filter(a => a.action.startsWith("commented: ")).map((comment) => (
                                        <div key={comment.id} className="flex gap-3 max-w-full break-words">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center uppercase font-bold text-xs">
                                                {comment.user.charAt(0)}
                                            </div>
                                            <div className="bg-muted/40 border border-border/50 rounded-2xl rounded-tl-sm p-3 px-4 flex-1 min-w-0 overflow-hidden">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-xs truncate mr-2">{comment.user}</span>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{new Date(comment.created_at || comment.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-sm text-foreground/90 leading-relaxed break-words">{comment.action.replace("commented: ", "")}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-4 break-words">No comments yet. Start the conversation!</p>
                                )}
                            </div>

                            <div className="flex items-end gap-2 relative max-w-full">
                                <Textarea
                                    className="resize-none min-h-[50px] shadow-sm pr-12 focus:ring-1 transition-all p-3 w-full max-w-full text-base"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    // Make sure text length doesn't break input
                                    style={{ wordBreak: 'break-word' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <Button size="icon" onClick={handleAddComment} className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shrink-0" disabled={!newComment.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Meta info, Assignees, Activity) */}
                    <div className="space-y-6 min-w-0 w-full max-w-full">
                        <Card className="rounded-none shadow-none border-primary/50 bg-primary/5 max-w-full overflow-hidden">
                            <CardHeader className="py-4 pb-2 border-b border-border/40">
                                <CardTitle className="text-xs text-primary font-semibold truncate">
                                    People Assigned
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-4 space-y-3 p-4">
                                {task.assignee_email || task.assigneeEmail ? (
                                    <div className="flex items-center gap-3 relative group w-full overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="overflow-hidden flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">Primary Assignee</p>
                                            <p className="text-xs text-primary truncate max-w-full block" title={task.assignee_email || task.assigneeEmail}>{task.assignee_email || task.assigneeEmail}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-primary break-words">Unassigned</p>
                                )}

                                <Button variant="outline" size="sm" className="w-full mt-2 border-dashed border-primary text-primary shadow-none whitespace-nowrap" onClick={() => {
                                    const email = window.prompt("Enter teammate's email to assign:");
                                    if (email && email.trim() !== '') {
                                        updateTaskMut.mutate({ id: task.id, data: { assignee_email: email.trim() } });
                                        toast.success("Assigned successfully!");
                                    }
                                }}>
                                    <Plus className="w-4 h-4 mr-2 shrink-0" /> Add Assignee
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="pt-2 max-w-full overflow-hidden">
                            <h3 className="text-xs text-primary font-semibold mb-4 flex items-center gap-2">
                                Recent Activity
                            </h3>
                            <div className="ml-2.5 border-l-2 border-border/40 space-y-6 pt-1 pb-2">
                                {(task.activities?.slice(0, 5) || []).map((activity, idx) => (
                                    <div key={activity.id} className="relative pl-6 max-w-full pr-2">
                                        <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-background border-2 ring-4 ring-background ${idx === 0 ? 'border-primary' : 'border-muted-foreground/30'}`}></span>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-xs leading-relaxed break-words text-muted-foreground/80">
                                                <span className="font-medium text-foreground">{activity.user}</span>{" "}
                                                {activity.action}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap">
                                                {new Date(activity.created_at || activity.createdAt || Date.now()).toLocaleDateString()} at {new Date(activity.created_at || activity.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="relative pl-6 max-w-full pr-2">
                                    <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-background border-2 ring-4 ring-background ${(task.activities?.length || 0) === 0 ? 'border-primary' : 'border-muted-foreground/30'}`}></span>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-xs leading-relaxed break-words text-muted-foreground/80">
                                            <span className="font-medium text-foreground">You</span>{" "}
                                            created this task
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap">
                                            {new Date(task.created_at || task.createdAt || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Needed because Label doesn't import cleanly without checking
function Label({ htmlFor, className, children }: { htmlFor: string; className: string; children: React.ReactNode }) {
    return <label htmlFor={htmlFor} className={className}>{children}</label>;
}
