import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/billapi";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Code2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PlanFormDialog from "@/components/Panels/PlanForm";

export default function Plans() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<any>(null);
    const qc = useQueryClient();

    const { data: plans, isLoading } = useQuery({
        queryKey: ["plans"],
        queryFn: api.plans.list,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.plans.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); setFormOpen(false); toast.success("Plan created"); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: any; data: any }) => api.plans.update(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); setFormOpen(false); setEditingPlan(null); toast.success("Plan updated"); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: any) => api.plans.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); setDeleteId(null); toast.success("Plan deleted"); },
    });

    const handleSubmit = (data: any) => {
        if (editingPlan) {
            updateMutation.mutate({ id: editingPlan.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-2xl font-semibold tracking-tight">Plans</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage subscription plans and their codes</p>
                </div>
                <Button onClick={() => { setEditingPlan(null); setFormOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> New Plan
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 border-0 shadow-sm"><Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-20" /></Card>
                    ))}
                </div>
            ) : plans?.length === 0 ? (
                <Card className="border-0 shadow-sm p-12 text-center">
                    <Code2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">No plans yet. Create your first plan to get started.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans?.map((plan) => (
                        <Card key={plan.id} className="rounded border shadow-none hover:shadow-md transition-shadow p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                                    {plan.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>}
                                </div>
                                <Badge variant={plan.is_active ? "default" : "secondary"}>
                                    {plan.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>

                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                                <span className="text-sm text-muted-foreground">DA</span>
                                <span className="text-sm text-muted-foreground ml-2">/ {plan.duration}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-5 text-sm text-primary">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>{plan.available_codes_count || 0} codes available</span>
                            </div>

                            <div className="mt-auto flex items-center gap-2">
                                <Link to={`/plans/${plan.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full gap-2 text-sm">
                                        Manage Codes <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setFormOpen(true); }}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <PlanFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                plan={editingPlan}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this plan and all its codes.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}