import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Link2, BarChart3, Trash2, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { base44 } from "@/api/foreform";
import { useQuery } from "@tanstack/react-query";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-primary/10 text-primary" },
  closed: { label: "Closed", className: "bg-destructive/10 text-destructive" },
};

export default function FormCard({ form, onDelete, onCopyLink, view = "list" }) {
  const config = statusConfig[form.status] || statusConfig.draft;

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", form.id],
    queryFn: () => base44.entities.FormSection.list(form.id),
    enabled: !!form.id,
    staleTime: 60000,
  });

  const flatQuestionCount = form.questions?.length || 0;
  const sectionQuestionCount = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const totalQuestions = flatQuestionCount + sectionQuestionCount;
  const sectionCount = sections.length;

  if (view === "grid") {
    return (
      <Card className="rounded p-6 shadow-none hover:shadow-xl transition-all duration-300 group border-border/60 flex flex-col h-full bg-card hover:border-primary/40 relative">
        <div className="absolute top-4 right-4 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-50">
              <DropdownMenuItem asChild>
                <Link to={`/forms/${form.id}/edit`} className="cursor-pointer"><Pencil className="w-4 h-4 mr-2" />Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/forms/${form.id}/responses`} className="cursor-pointer"><BarChart3 className="w-4 h-4 mr-2" />Responses</Link>
              </DropdownMenuItem>
              {form.status === "published" && (
                <DropdownMenuItem onClick={() => onCopyLink(form.id)} className="cursor-pointer">
                  <Link2 className="w-4 h-4 mr-2" />Copy Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(form.id)} className="text-destructive cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link to={`/forms/${form.id}/edit`} className="flex flex-col flex-1 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded border border-border/30 flex items-center justify-center bg-muted/20">
              <img src="/form.png" alt="Form icon" className="w-7 h-7 object-contain drop-shadow-sm" />
            </div>
            <Badge className={config.className} variant="secondary">{config.label}</Badge>
          </div>

          <h3 className="font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">{form.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
            {form.description || "No description provided"}
          </p>

          <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{totalQuestions} Questions</span>
                {sectionCount > 0 && (
                  <span className="flex items-center gap-0.5 text-primary/70"><Layers className="w-3 h-3" />{sectionCount} Sections</span>
                )}
              </div>
              <span className="text-rose-500">{form.response_count || 0} Responses</span>
            </div>
            <span className="text-[11px] text-muted-foreground/70">
              Created {format(new Date(form.created_date), "MMM d, yyyy")}
            </span>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="rounded p-5 shadow-none hover:shadow-lg transition-all duration-300 group border-border/60 bg-card">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/forms/${form.id}/edit`} className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded border border-border/30 flex shrink-0 items-center justify-center bg-muted/20">
            <img src="/form.png" alt="Form icon" className="w-8 h-8 object-contain drop-shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={config.className} variant="secondary">{config.label}</Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {format(new Date(form.created_date), "MMM d, yyyy")}
              </span>
            </div>
            <h3 className="font-semibold text-lg truncate mt-2 group-hover:text-primary transition-colors">{form.title}</h3>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{form.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm font-medium">
              <span className="text-primary/80">{totalQuestions} questions</span>
              {sectionCount > 0 && (
                <span className="text-primary/60 flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{sectionCount} sections</span>
              )}
              <span className="text-rose-500/80">{form.response_count || 0} responses</span>
            </div>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuItem asChild>
              <Link to={`/forms/${form.id}/edit`} className="cursor-pointer"><Pencil className="w-4 h-4 mr-2" />Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/forms/${form.id}/responses`} className="cursor-pointer"><BarChart3 className="w-4 h-4 mr-2" />Responses</Link>
            </DropdownMenuItem>
            {form.status === "published" && (
              <DropdownMenuItem onClick={() => onCopyLink(form.id)} className="cursor-pointer">
                <Link2 className="w-4 h-4 mr-2" />Copy Link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(form.id)} className="text-destructive cursor-pointer">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}