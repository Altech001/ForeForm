import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileText, Sheet, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { exportCSV, exportPDF } from "@/lib/exportResponses";

export default function ExportPanel({ form, responses }) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = responses.filter((r) => {
    const d = r.created_date ? new Date(r.created_date) : null;
    if (!d) return true;
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="border border-border rounded bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <img src="/form.png" alt="Download" className="w-8 h-8" />
          Export Responses
          {(dateFrom || dateTo) && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Filtered</span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Date filter */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2.5">
              Date Range Filter
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-rose-500">From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-rose-500">To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filtered.length} of {responses.length} response{responses.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded text-green-600 bg-green-600/10 border-green-600 hover:text-green-600 hover:bg-green-600/20"
              onClick={() => exportCSV(form, filtered)}
              disabled={filtered.length === 0}
              
            >
              <Sheet className="w-4 h-4 text-green-600" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded text-red-500 bg-red-500/10 border-red-500 hover:text-red-500 hover:bg-red-500/20"
              onClick={() => exportPDF(form, filtered)}
              disabled={filtered.length === 0}
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export PDF
            </Button>
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">No responses match the selected date range.</p>
          )}
        </div>
      )}
    </div>
  );
}