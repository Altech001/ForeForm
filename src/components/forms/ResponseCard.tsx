import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Clock, FileDown, Eye } from "lucide-react";
import { format } from "date-fns";

export default function ResponseCard({ response, onView, onDownload }) {
  return (
    <Card className="p-5 shadow-none rounded cursor-alias hover:shadow-md transition-all border-border/60">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/user.png" alt="User" className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-sm">{response.respondent_name || "Anonymous"}</p>
              {response.respondent_email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />{response.respondent_email}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-primary">{response.answers?.length || 0} answers</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(response)} className="rounded text-rose-500 border-rose-500 hover:bg-rose-500 hover:text-white bg-inherit">
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload(response)} className="text-primary rounded border-primary hover:bg-primary hover:text-white bg-inherit">
              <FileDown className="w-4 h-4 mr-1 " /> DOCX
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(response.created_date), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </div>
    </Card>
  );
}