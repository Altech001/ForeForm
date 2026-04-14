import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const DURATIONS = ["1h", "2h", "4h", "8h", "12h", "24h", "2d", "3d", "7d", "14d", "30d"];

export default function PlanFormDialog({ open, onOpenChange, plan, onSubmit, isSubmitting }) {
    const [form, setForm] = useState({ name: "", description: "", price: "", duration: "24h", is_active: true });

    useEffect(() => {
        if (plan) {
            setForm({
                name: plan.name || "",
                description: plan.description || "",
                price: String(plan.price || ""),
                duration: plan.duration || "24h",
                is_active: plan.is_active ?? true,
            });
        } else {
            setForm({ name: "", description: "", price: "", duration: "24h", is_active: true });
        }
    }, [plan, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...form, price: parseInt(form.price) || 0 });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{plan ? "Edit Plan" : "Create Plan"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (DA)</Label>
                            <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                        <Label>Active</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {plan ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}