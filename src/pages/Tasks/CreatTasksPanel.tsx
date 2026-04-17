import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, X, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Comment {
    id: string;
    text: string;
    user: string;
    createdAt: string;
}

export interface Activity {
    id: string;
    action: string;
    user: string;
    createdAt: string;
    created_at?: string;
}

export interface TaskAssignee {
    id: string;
    email: string;
    assigned_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "medium" | "high";
    dueDate: string;
    due_date?: string;
    createdAt: string;
    created_at?: string;
    assigneeEmail?: string;
    assignee_email?: string;
    attachmentUrl?: string;
    attachment_url?: string;
    attachmentUrls?: { id: string, name: string, url: string }[];
    reviewNote?: string;
    comments?: Comment[];
    activities?: Activity[];
    // Multi-assignee support
    assignees?: TaskAssignee[];
    assignee_emails?: string[];
}

interface CreateTasksPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (task: any) => void;
}

export default function CreateTasksPanel({ open, onOpenChange, onSave }: CreateTasksPanelProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [assigneeEmails, setAssigneeEmails] = useState<string[]>([]);
    const [currentEmail, setCurrentEmail] = useState("");

    const addEmail = () => {
        const email = currentEmail.trim().toLowerCase();
        if (email && !assigneeEmails.includes(email) && email.includes("@")) {
            setAssigneeEmails([...assigneeEmails, email]);
            setCurrentEmail("");
        }
    };

    const removeEmail = (email: string) => {
        setAssigneeEmails(assigneeEmails.filter(e => e !== email));
    };

    const handleEmailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addEmail();
        }
    };

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            title,
            description,
            status,
            priority,
            assignee_emails: assigneeEmails.length > 0 ? assigneeEmails : undefined,
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now as default
        });

        // reset form
        setTitle("");
        setDescription("");
        setAssigneeEmails([]);
        setCurrentEmail("");
        setStatus("todo");
        setPriority("medium");
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto w-full md:w-[450px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold">Create New Task</SheetTitle>
                    <SheetDescription>
                        Add a new task to your workspace to keep track of your goals.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title" className="text-sm font-medium">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="E.g. Review user feedback"
                            className="col-span-3 transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details about this task..."
                            className="resize-none h-24 transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="assignees" className="text-sm font-medium">
                            Assign Collaborators (Optional)
                        </Label>

                        {/* Email chips */}
                        {assigneeEmails.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-1">
                                {assigneeEmails.map((email) => (
                                    <Badge
                                        key={email}
                                        variant="secondary"
                                        className="pl-2 pr-1 py-1 gap-1 bg-primary/10 text-primary border-none text-xs font-medium"
                                    >
                                        <User className="w-3 h-3" />
                                        <span className="truncate max-w-[160px]">{email}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeEmail(email)}
                                            className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Input
                                id="assignees"
                                type="email"
                                value={currentEmail}
                                onChange={(e) => setCurrentEmail(e.target.value)}
                                onKeyDown={handleEmailKeyDown}
                                placeholder="collaborator@example.com"
                                className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={addEmail}
                                disabled={!currentEmail.trim() || !currentEmail.includes("@")}
                                className="shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Press Enter or comma to add multiple people
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">Status</Label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-6 sm:justify-start flex-row-reverse sm:flex-row gap-2">
                    <Button type="submit" onClick={handleSave} className="w-full sm:w-auto  transition-all" disabled={!title.trim()}>
                        Create Task
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
