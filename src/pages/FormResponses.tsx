import React from "react";
import { base44 } from "@/api/foreform";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ResponseCard from "@/components/forms/ResponseCard";
import { downloadDocx } from "@/lib/generateDocx";
import ExportPanel from "@/components/forms/ExportPanel";

export default function FormResponses() {
  const { id: formId } = useParams();
  const navigate = useNavigate();

  const { data: form } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (data) => data[0],
    enabled: !!formId,
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["responses", formId],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: formId }),
    enabled: !!formId,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="font-semibold text-sm">{form?.title || "Form"}</h1>
              <p className="text-xs text-muted-foreground">{responses.length} responses</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Export panel — always shown when there are responses */}
        {responses.length > 0 && (
          <ExportPanel form={form} responses={responses} />
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No responses yet</h2>
            <p className="text-muted-foreground">Share your form to start collecting responses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((r) => (
              <ResponseCard
                key={r.id}
                response={r}
                onView={() => navigate(`/forms/${formId}/responses/${r.id}`)}
                onDownload={() => downloadDocx(form, r)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}