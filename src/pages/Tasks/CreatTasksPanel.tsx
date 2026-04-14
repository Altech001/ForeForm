import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";

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
    assignees?: string[];
}

interface CreateTasksPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (task: Omit<Task, "id" | "createdAt">) => void;
}

export default function CreateTasksPanel({ open, onOpenChange, onSave }: CreateTasksPanelProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [assigneeEmail, setAssigneeEmail] = useState("");

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            title,
            description,
            status,
            priority,
            assigneeEmail: assigneeEmail.trim() || undefined,
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now as default
        });

        // reset form
        setTitle("");
        setDescription("");
        setAssigneeEmail("");
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
                        <Label htmlFor="assignee" className="text-sm font-medium">Assign Collaborator (Optional)</Label>
                        <Input
                            id="assignee"
                            type="email"
                            value={assigneeEmail}
                            onChange={(e) => setAssigneeEmail(e.target.value)}
                            placeholder="collaborator@example.com"
                            className="col-span-3 transition-all focus:ring-2 focus:ring-primary/20"
                        />
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
