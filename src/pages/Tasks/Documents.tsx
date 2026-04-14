import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    File,
    Plus,
    ArrowLeft,
    MoreVertical,
    Trash2,
    Download,
    Edit2,
    GripVertical,
    Search,
    FileText,
    FileImage,
    FileArchive,
    FileCode,
    Share2,
    Link as LinkIcon,
    FolderPlus,
    Layers,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { base44 } from "@/api/foreform";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Document {
    id: string;
    name: string;
    originalName?: string;
    original_name?: string;
    url: string;
    type: string;
    size: number;
    createdAt: string;
    created_at?: string;
    isJoint?: boolean;
    is_joint?: boolean;
}

export default function Documents() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: documentsData, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: base44.entities.Document.list
    });

    // Fallback document list and type mapping
    const documents: Document[] = (documentsData || []).map((doc: any) => ({
        ...doc,
        createdAt: doc.created_at || doc.createdAt || new Date().toISOString()
    }));

    const createDocMut = useMutation({
        mutationFn: base44.entities.Document.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success("Document uploaded successfully!");
            setIsUploadOpen(false);
            setUploadFile(null);
            setCustomName("");
        }
    });

    const updateDocMut = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => base44.entities.Document.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const deleteDocMut = useMutation({
        mutationFn: base44.entities.Document.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success("Document deleted");
        }
    });

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [customName, setCustomName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [activeFilter, setActiveFilter] = useState<"all" | "joint" | "image" | "pdf">("all");


    const handleUpload = async () => {
        if (!uploadFile) return;

        setIsUploading(true);
        try {
            const res = await base44.integrations.Core.UploadFile({ file: uploadFile });
            const payload = {
                name: customName || uploadFile.name,
                original_name: uploadFile.name,
                url: res.file_url,
                type: uploadFile.type,
                size: uploadFile.size,
                is_joint: activeFilter === "joint"
            };
            createDocMut.mutate(payload);
        } catch (error) {
            toast.error("Failed to upload document");
            setIsUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        deleteDocMut.mutate(id);
    };

    const handleRename = () => {
        if (!editingDoc || !customName) return;
        updateDocMut.mutate({ id: editingDoc.id, data: { name: customName } });
        toast.success("Document renamed");
        setIsEditOpen(false);
        setEditingDoc(null);
        setCustomName("");
    };

    const toggleJoint = (id: string) => {
        const doc = documents.find(d => d.id === id);
        if (doc) {
            const newIsJoint = !doc.is_joint && !doc.isJoint;
            updateDocMut.mutate({ id, data: { is_joint: newIsJoint } });
            toast.success(doc.isJoint || doc.is_joint ? "Removed from Joints" : "Added to Joints", {
                icon: <LinkIcon className="w-4 h-4 text-primary" />
            });
        }
    };

    const onDragEnd = (result: DropResult) => {
        // Drag and drop ordering disabled since list uses React query and order is sorted by creation date on server
        if (!result.destination || isDnDDisabled) return;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <FileImage className="w-5 h-5 text-blue-500" />;
        if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        if (type.includes('zip') || type.includes('archive')) return <FileArchive className="w-5 h-5 text-yellow-500" />;
        if (type.includes('javascript') || type.includes('json') || type.includes('html')) return <FileCode className="w-5 h-5 text-green-500" />;
        return <File className="w-5 h-5 text-slate-500" />;
    };

    const filteredDocuments = documents.filter((doc: any) => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isJoint = doc.is_joint || doc.isJoint;
        const matchesFilter =
            activeFilter === "all" ? true :
                activeFilter === "joint" ? isJoint :
                    activeFilter === "image" ? doc.type?.includes("image") :
                        activeFilter === "pdf" ? doc.type?.includes("pdf") : true;
        return matchesSearch && matchesFilter;
    });

    const isDnDDisabled = searchQuery.length > 0 || activeFilter !== "all";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/bookmark-tasks')} className="mr-1 -ml-2 rounded-full hover:bg-muted">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight">Documents</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsUploadOpen(true)} className="gap-2 h-9 sm:h-10 px-3 sm:px-4 shadow-sm hover:shadow transition-all font-bold">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload File</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Search and Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-10 bg-card/50 border-border/50 focus-visible:ring-primary/20 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                        <Badge
                            variant={activeFilter === "all" ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 whitespace-nowrap ${activeFilter !== "all" ? "hover:bg-primary/5 border-primary/20 text-primary" : ""}`}
                            onClick={() => setActiveFilter("all")}
                        >All Files</Badge>
                        <Badge
                            variant={activeFilter === "joint" ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 whitespace-nowrap ${activeFilter !== "joint" ? "hover:bg-muted/50 border-border/50 text-muted-foreground" : ""}`}
                            onClick={() => setActiveFilter("joint")}
                        >Joints</Badge>
                        <Badge
                            variant={activeFilter === "image" ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 whitespace-nowrap ${activeFilter !== "image" ? "hover:bg-muted/50 border-border/50 text-muted-foreground" : ""}`}
                            onClick={() => setActiveFilter("image")}
                        >Images</Badge>
                        <Badge
                            variant={activeFilter === "pdf" ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 whitespace-nowrap ${activeFilter !== "pdf" ? "hover:bg-muted/50 border-border/50 text-muted-foreground" : ""}`}
                            onClick={() => setActiveFilter("pdf")}
                        >PDFs</Badge>
                    </div>
                </div>

                {isDnDDisabled && documents.length > 0 && searchQuery.length === 0 && (
                    <p className="text-[10px] text-muted-foreground mb-4 italic ml-2">Reordering is disabled while filters are active.</p>
                )}
                {searchQuery.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mb-4 italic ml-2">Reordering is disabled during search.</p>
                )}

                {/* Documents List */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="documents-list" isDropDisabled={isDnDDisabled}>
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredDocuments.length === 0 ? (
                                        <motion.div
                                            key="empty-state"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-center py-24 border border-dashed rounded bg-card/30"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                                <File className="w-8 h-8 text-muted-foreground/50" />
                                            </div>
                                            <h2 className="text-lg font-semibold mb-1">No documents found</h2>
                                            <p className="text-muted-foreground text-sm mb-6">Start by uploading your first document.</p>
                                            <Button variant="outline" onClick={() => setIsUploadOpen(true)} className="gap-2">
                                                <Plus className="w-3.5 h-3.5" /> Upload Now
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        filteredDocuments.map((doc, index) => (
                                            <Draggable key={doc.id} draggableId={doc.id} index={index} isDragDisabled={isDnDDisabled}>
                                                {(provided, snapshot) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`group flex items-center gap-4 p-4 rounded border transition-all duration-200 ${snapshot.isDragging
                                                            ? "bg-card border-primary ring-1 ring-primary/5 shadow-xl"
                                                            : "bg-card/50 border-border/50 hover:border-primary/40 hover:bg-card hover:shadow-md"
                                                            }`}
                                                    >
                                                        <div {...provided.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>

                                                        <div className={`p-2.5 rounded flex items-center justify-center`}>
                                                            {getFileIcon(doc.type || "")}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                                                                    {doc.name}
                                                                </h3>
                                                                {(doc.is_joint || doc.isJoint) && (
                                                                    <Badge className="bg-primary hover:bg-primary h-4 px-1 text-[8px] ">Joint</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium ">
                                                                <span>{formatSize(doc.size)}</span>
                                                                <span>•</span>
                                                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:inline lowercase">{(doc.type || 'File').split('/')[1] || 'File'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                                                onClick={() => window.open(doc.url, '_blank')}
                                                                title="View Original"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                                                onClick={() => toggleJoint(doc.id)}
                                                                title={(doc.isJoint || doc.is_joint) ? "Remove Joint" : "Add File Joint"}
                                                            >
                                                                <LinkIcon className={`w-4 h-4 ${(doc.isJoint || doc.is_joint) ? "text-primary fill-current" : ""}`} />
                                                            </Button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setEditingDoc(doc);
                                                                        setCustomName(doc.name);
                                                                        setIsEditOpen(true);
                                                                    }} className="gap-2 cursor-pointer">
                                                                        <Edit2 className="w-4 h-4" /> Rename File
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')} className="gap-2 cursor-pointer">
                                                                        <Download className="w-4 h-4" /> Download
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => toggleJoint(doc.id)} className="gap-2 cursor-pointer">
                                                                        <Share2 className="w-4 h-4" /> {(doc.isJoint || doc.is_joint) ? "Detach Joint" : "Add the File Joint"}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(doc.id)}
                                                                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Delete Permanently
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                </AnimatePresence>
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </main>

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>
                            Select a file to upload and give it a professional name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold  text-muted-foreground ml-1">File Source</label>
                            <Input
                                type="file"
                                className="bg-muted/50 border-dashed cursor-pointer"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setUploadFile(file);
                                    if (file && !customName) {
                                        setCustomName(file.name.split('.')[0]);
                                    }
                                }}
                                disabled={isUploading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold  text-muted-foreground ml-1">Custom Filename</label>
                            <Input
                                placeholder="Enter a descriptive name..."
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                disabled={isUploading}
                            />
                            <p className="text-[10px] text-muted-foreground ml-1 italic">Extracted filename will be used if left blank.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={isUploading || !uploadFile} className="gap-2 font-bold px-6">
                            {isUploading ? "Uploading..." : "Confirm Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Document</DialogTitle>
                        <DialogDescription>
                            Update the name for this file.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold  text-muted-foreground ml-1">New Filename</label>
                            <Input
                                placeholder="Enter new name..."
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename} className="font-bold">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

