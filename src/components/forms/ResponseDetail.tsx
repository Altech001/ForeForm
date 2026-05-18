import React from "react";
import { FileDown, User, Mail, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import { getQuestionTypeLabel } from "./QuestionTypeIcon";

function renderAnswer(answer) {
  if (answer.question_type === "file_upload" && answer.answer) {
    try {
      const file = JSON.parse(answer.answer);
      return (
        <span className="flex items-center gap-2">
          <FileDown className="h-4 w-4 shrink-0 text-primary" />
          <a href={file.file_url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-medium text-primary hover:underline">
            {file.file_name || "Uploaded file"}
          </a>
        </span>
      );
    } catch {
      return answer.answer;
    }
  }
  if (answer.question_type === "rating" && answer.answer) {
    const rating = Number(answer.answer || 0);
    return (
      <span className="flex items-center gap-1 text-primary">
        {[1, 2, 3, 4, 5].map((score) => (
          <Star key={score} className={`h-4 w-4 ${score <= rating ? "fill-current" : "fill-transparent"}`} />
        ))}
        <span className="ml-2 text-sm font-medium text-foreground">{rating} / 5</span>
      </span>
    );
  }
  return answer.answer || <span className="text-muted-foreground italic">No answer</span>;
}

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
            <p className="text-foreground break-words">{renderAnswer(a)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
