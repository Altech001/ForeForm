import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/billapi";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Wand2, Upload, Trash2, Code2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import GenerateCodesDialog from "@/components/Panels/GenerateCodes";
import ImportCodesDialog from "@/components/Panels/ImportCodes";
import CreateCodeDialog from "@/components/Panels/CreateCode";

export default function PlanDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = window.location.pathname.split("/plans/")[1];

    const [selected, setSelected] = useState<string[]>([]);
    const [genOpen, setGenOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const qc = useQueryClient();

    const { data: plan, isLoading: loadingPlan } = useQuery({
        queryKey: ["plan", planId],
        queryFn: () => api.plans.get(planId),
        enabled: !!planId,
    });

    const { data: codes, isLoading: loadingCodes } = useQuery({
        queryKey: ["codes", planId],
        queryFn: () => api.codes.list(planId),
        enabled: !!planId,
    });

    const generateMutation = useMutation({
        mutationFn: (data: any) => api.codes.generate(planId, data),
        onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["codes", planId] }); qc.invalidateQueries({ queryKey: ["plans"] }); setGenOpen(false); toast.success(`${data.length} codes generated`); },
    });

    const importMutation = useMutation({
        mutationFn: (data: any) => api.codes.import(planId, data),
        onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["codes", planId] }); qc.invalidateQueries({ queryKey: ["plans"] }); setImportOpen(false); toast.success(`${data.length} codes imported`); },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.codes.create(planId, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["codes", planId] }); qc.invalidateQueries({ queryKey: ["plans"] }); setCreateOpen(false); toast.success(`Code created`); },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.codes.bulkDelete(ids),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["codes", planId] }); qc.invalidateQueries({ queryKey: ["plans"] }); setSelected([]); setBulkDeleteOpen(false); toast.success("Codes deleted"); },
    });

    const toggleSelect = (id: string) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selected.length === codes?.length) {
            setSelected([]);
        } else {
            setSelected(codes?.map((c) => c.id) || []);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 min-h-screen">
            <div className="flex items-center gap-3">
                <Link to="/plans">
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div className="flex-1">
                    {loadingPlan ? (
                        <Skeleton className="h-8 w-48" />
                    ) : (
                        <>
                            <h1 className="text-2xl md:text-2xl font-bold tracking-tight">{plan?.name}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">{plan?.price} DA / {plan?.duration}</p>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setGenOpen(true)} className="gap-2">
                    <Wand2 className="w-4 h-4" /> Generate
                </Button>
                <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" /> Import
                </Button>
                <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create
                </Button>
                {selected.length > 0 && (
                    <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="gap-2">
                        <Trash2 className="w-4 h-4" /> Delete ({selected.length})
                    </Button>
                )}
            </div>

            <Card className="border-0 shadow-sm overflow-hidden rounded-none">
                {loadingCodes ? (
                    <div className="p-6 space-y-3">
                        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : codes?.length === 0 ? (
                    <div className="p-12 text-center">
                        <Code2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground">No codes yet. Generate or import codes to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-12">
                                        <Checkbox checked={selected.length === codes?.length && codes?.length > 0} onCheckedChange={toggleAll} />
                                    </TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Used By</TableHead>
                                    <TableHead>Used At</TableHead>
                                    <TableHead>Expires At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes?.map((code) => (
                                    <TableRow key={code.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <Checkbox checked={selected.includes(code.id)} onCheckedChange={() => toggleSelect(code.id)} />
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-medium">{code.value}</TableCell>
                                        <TableCell>
                                            {code.is_expired ? (
                                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                                            ) : code.is_used ? (
                                                <Badge variant="secondary" className="text-xs">Used</Badge>
                                            ) : (
                                                <Badge className="text-xs bg-primary/10 text-primary border-0">Available</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{code.used_by_phone || "—"}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {code.used_at ? format(new Date(code.used_at), "MMM d, HH:mm") : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {code.expires_at ? format(new Date(code.expires_at), "MMM d, HH:mm") : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selected.length} codes?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkDeleteMutation.mutate(selected)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <GenerateCodesDialog open={genOpen} onOpenChange={setGenOpen} onSubmit={(data) => generateMutation.mutate(data)} isSubmitting={generateMutation.isPending} />
            <ImportCodesDialog open={importOpen} onOpenChange={setImportOpen} onSubmit={(data) => importMutation.mutate(data)} isSubmitting={importMutation.isPending} />
            <CreateCodeDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={(data) => createMutation.mutate(data)} isSubmitting={createMutation.isPending} />
        </div>
    );
}