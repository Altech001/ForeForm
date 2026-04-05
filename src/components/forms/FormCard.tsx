import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Link2, BarChart3, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-primary/10 text-primary" },
  closed: { label: "Closed", className: "bg-destructive/10 text-destructive" },
};

export default function FormCard({ form, onDelete, onCopyLink }) {
  const config = statusConfig[form.status] || statusConfig.draft;

  return (
    <Card className="p-5 shadow-none cursor-alias hover:shadow-lg transition-all duration-300 group border-border/60">
      <div className="flex items-start justify-between gap-4">
        <div className="w-14 h-14 rounded-xl border border-border/30 flex shrink-0 items-center justify-center">
          <img src="/form.png" alt="Form icon" className="w-8 h-8 object-contain drop-shadow-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={config.className} variant="secondary">{config.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(form.created_date), "MMM d, yyyy")}
            </span>
          </div>
          <h3 className="font-semibold text-lg truncate mt-2">{form.title}</h3>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{form.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="text-primary">{form.questions?.length || 0} questions</span>
            <span className="text-rose-500">{form.response_count || 0} responses</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/forms/${form.id}/edit`}><Pencil className="w-4 h-4 mr-2" />Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/forms/${form.id}/responses`}><BarChart3 className="w-4 h-4 mr-2" />Responses</Link>
            </DropdownMenuItem>
            {form.status === "published" && (
              <DropdownMenuItem onClick={() => onCopyLink(form.id)}>
                <Link2 className="w-4 h-4 mr-2" />Copy Link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(form.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}