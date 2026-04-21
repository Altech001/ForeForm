import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileText, Sheet, ChevronDown, ChevronUp, Filter, Loader2, ExternalLink } from "lucide-react";
import { exportCSV, exportPDF } from "@/lib/exportResponses";
import { base44 } from "@/api/foreform";
import { toast } from "sonner";

export default function ExportPanel({ form, responses }) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pushingSheets, setPushingSheets] = useState(false);
  const [pushingDrive, setPushingDrive] = useState(false);

  const filtered = responses.filter((r) => {
    const d = r.created_date ? new Date(r.created_date) : null;
    if (!d) return true;
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const handlePushToSheets = async () => {
    if (!form?.id) return;
    setPushingSheets(true);
    try {
      const result = await base44.integrations.Sheets.push(form.id, `${form.title || 'Form'} — Responses`);
      if (result.success && result.url) {
        toast.success(result.message, {
          action: { label: "Open Sheet", onClick: () => window.open(result.url, "_blank") },
        });
      } else {
        toast.success(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to push to Google Sheets. Is it connected?");
    } finally {
      setPushingSheets(false);
    }
  };

  const handlePushToDrive = async () => {
    if (!form?.id) return;
    setPushingDrive(true);
    try {
      const result = await base44.integrations.Google.pushToDrive(form.id);
      if (result.success && result.url) {
        toast.success(result.message, {
          action: { label: "Open Drive", onClick: () => window.open(result.url, "_blank") },
        });
      } else {
        toast.success(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to push to Google Drive. Is it connected?");
    } finally {
      setPushingDrive(false);
    }
  };

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

          {/* Google integrations */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2.5">
              Google Integrations
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 rounded text-emerald-600 bg-emerald-600/10 border-emerald-600/50 hover:text-emerald-600 hover:bg-emerald-600/20"
                onClick={handlePushToSheets}
                disabled={pushingSheets || filtered.length === 0}
              >
                {pushingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#21A366" d="M28 2H10c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V14L28 2z" /><path fill="#185C37" d="M42 14H32c-2.2 0-4-1.8-4-4V2l14 12z" /><path fill="#FFF" d="M12 22h24v2H12zm0 6h24v2H12zm0 6h24v2H12z" /></svg>
                )}
                Push to Sheets
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 rounded text-blue-600 bg-blue-600/10 border-blue-600/50 hover:text-blue-600 hover:bg-blue-600/20"
                onClick={handlePushToDrive}
                disabled={pushingDrive || filtered.length === 0}
              >
                {pushingDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M30.3 32.5l-6-10.4 8.2-14.1h12l-6 10.4z" /><path fill="#1976D2" d="M17.5 32.5l-6.2-10.7 6.2-10.7 12.4 21.4z" /><path fill="#4CAF50" d="M30.3 32.5H4.7l6-10.4 25.6 0z" /></svg>
                )}
                Push to Drive
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Connect Google Sheets or Drive in Settings to enable these exports.
            </p>
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">No responses match the selected date range.</p>
          )}
        </div>
      )}
    </div>
  );
}