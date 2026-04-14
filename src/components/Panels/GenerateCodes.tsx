import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function GenerateCodesDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
    const [count, setCount] = useState("10");

    useEffect(() => {
        if (open) setCount("10");
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ count: parseInt(count, 10) || 10 });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Codes</DialogTitle>
                    <DialogDescription>
                        Generate random voucher codes for this plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="count">Number of Codes</Label>
                        <Input
                            id="count"
                            type="number"
                            min="1"
                            max="1000"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Generate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
