import React from "react";
import { User, Mail, Clock } from "lucide-react";
import { format } from "date-fns";
import { getQuestionTypeLabel } from "./QuestionTypeIcon";

export default function ResponseDetail({ response }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{response.respondent_name || "Anonymous"}</p>
          {response.respondent_email && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />{response.respondent_email}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {format(new Date(response.created_date), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {(response.answers || []).map((a, i) => (
          <div key={i} className="p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {getQuestionTypeLabel(a.question_type)}
              </span>
            </div>
            <p className="font-medium text-sm mb-1">{a.question_label}</p>
            <p className="text-foreground">{a.answer || <span className="text-muted-foreground italic">No answer</span>}</p>
          </div>
        ))}
      </div>
    </div>
  );
}