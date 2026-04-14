import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ImportCodesDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
    const [codesInput, setCodesInput] = useState("");

    useEffect(() => {
        if (open) setCodesInput("");
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const codes = codesInput.split(/[\n,]+/).map(c => c.trim()).filter(Boolean);
        onSubmit({ codes });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Codes</DialogTitle>
                    <DialogDescription>
                        Paste your codes here, separated by commas or new lines.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="codes">Codes</Label>
                        <Textarea
                            id="codes"
                            rows={6}
                            value={codesInput}
                            onChange={(e) => setCodesInput(e.target.value)}
                            required
                            placeholder="CODE1&#10;CODE2&#10;CODE3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !codesInput.trim()}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Import
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
