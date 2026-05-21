/* eslint-disable @typescript-eslint/no-explicit-any */
import { base44 } from "@/api/foreform";
import AppHeader from "@/components/Header/AppHeader";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, ExternalLink, Loader2, Pencil, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type FormRecord = {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published" | "closed" | string;
  response_count?: number;
  branding?: {
    schedule_date?: string;
    schedule_start?: string;
    schedule_end?: string;
    [key: string]: unknown;
  };
  created_date?: string;
  updated_date?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    form: FormRecord;
    isScheduled: boolean;
  };
};

function toDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getFormScheduleDate(form: FormRecord) {
  return (
    form.branding?.schedule_date ||
    form.branding?.schedule_start ||
    form.updated_date ||
    form.created_date ||
    new Date().toISOString()
  );
}

function formatShortDate(value?: string) {
  const dateValue = toDateInput(value);
  if (!dateValue) return "Unscheduled";
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SchedulerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const { data: forms = [], isLoading } = useQuery<FormRecord[]>({
    queryKey: ["forms"],
    queryFn: () => base44.entities.Form.list(),
  });

  const publishedForms = useMemo(
    () => forms.filter((form) => form.status === "published"),
    [forms]
  );

  const selectedForm = useMemo(
    () => publishedForms.find((form) => form.id === selectedFormId) || publishedForms[0],
    [publishedForms, selectedFormId]
  );

  const [scheduleDate, setScheduleDate] = useState("");

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      publishedForms.map((form) => {
        const scheduledDate = getFormScheduleDate(form);
        const hasExplicitSchedule = Boolean(form.branding?.schedule_date || form.branding?.schedule_start);
        const start = toDateInput(scheduledDate) || new Date().toISOString().slice(0, 10);

        return {
          id: form.id,
          title: form.title || "Untitled form",
          start,
          allDay: true,
          backgroundColor: hasExplicitSchedule ? "hsl(var(--primary))" : "#64748b",
          borderColor: hasExplicitSchedule ? "hsl(var(--primary))" : "#64748b",
          textColor: "#ffffff",
          extendedProps: {
            form,
            isScheduled: hasExplicitSchedule,
          },
        };
      }),
    [publishedForms]
  );

  const scheduleMutation = useMutation({
    mutationFn: ({ form, date }: { form: FormRecord; date: string }) =>
      base44.entities.Form.update(form.id, {
        branding: {
          ...(form.branding || {}),
          schedule_date: date,
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setSelectedFormId(variables.form.id);
      toast.success("Form scheduled");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to schedule form"),
  });

  const activeDate = scheduleDate || toDateInput(selectedForm ? getFormScheduleDate(selectedForm) : undefined);

  const handleSchedule = () => {
    if (!selectedForm) {
      toast.error("Select a published form first");
      return;
    }
    if (!activeDate) {
      toast.error("Choose a date");
      return;
    }
    scheduleMutation.mutate({ form: selectedForm, date: activeDate });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Schedules" />
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedules</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Published forms appear on the calendar by their scheduled date. Forms without a schedule use their last updated date until you assign one.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm">
            <span className="font-semibold">{publishedForms.length}</span>
            <span className="text-muted-foreground">published forms</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-h-[720px]  bg-card p-3 shadow-sm">
            {isLoading ? (
              <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading calendar
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                  
                }}
                height="680px"
                events={calendarEvents}
                eventClick={(info) => {
                  const form = info.event.extendedProps.form as FormRecord;
                  setSelectedFormId(form.id);
                  setScheduleDate(toDateInput(getFormScheduleDate(form)));
                }}
                dateClick={(info) => {
                  setScheduleDate(info.dateStr);
                }}
                
                eventClassNames="cursor-alias"
                nowIndicator
              />
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">Schedule form</h2>
                  <p className="text-xs text-muted-foreground">Assign a date to a published form.</p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>

              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Published form</label>
              <select
                value={selectedForm?.id || ""}
                onChange={(event) => {
                  const nextForm = publishedForms.find((form) => form.id === event.target.value);
                  setSelectedFormId(event.target.value);
                  setScheduleDate(toDateInput(nextForm ? getFormScheduleDate(nextForm) : undefined));
                }}
                className="mb-3 h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              >
                {publishedForms.length === 0 ? (
                  <option value="">No published forms</option>
                ) : (
                  publishedForms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.title || "Untitled form"}
                    </option>
                  ))
                )}
              </select>

              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Date</label>
              <Input
                type="date"
                value={activeDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className="mb-3 rounded"
              />

              <Button
                onClick={handleSchedule}
                disabled={!selectedForm || scheduleMutation.isPending}
                className="w-full gap-2 rounded"
              >
                {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Save schedule
              </Button>
            </section>

            <section className="rounded bg-card p-4">
              <h2 className="mb-3 text-sm font-bold">Selected form</h2>
              {selectedForm ? (
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-tight">{selectedForm.title || "Untitled form"}</h3>
                      <Badge variant="outline" className="rounded border-emerald-500/50 text-emerald-600">
                        Published
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {selectedForm.description || "No description"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded border border-border  p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Schedule</p>
                      <p className="mt-1 font-bold">{formatShortDate(getFormScheduleDate(selectedForm))}</p>
                    </div>
                    <div className="rounded border border-border  p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Responses</p>
                      <p className="mt-1 font-bold">{selectedForm.response_count || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded"
                      onClick={() => navigate(`/forms/${selectedForm.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Publish a form to start scheduling.</p>
              )}
            </section>

            {/* <section className="rounded bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Published forms</h2>
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {publishedForms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setSelectedFormId(form.id);
                      setScheduleDate(toDateInput(getFormScheduleDate(form)));
                    }}
                    className={`w-full rounded border p-3 text-left transition-colors ${
                      selectedForm?.id === form.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold">{form.title || "Untitled form"}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{form.response_count || 0}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(getFormScheduleDate(form))}</p>
                  </button>
                ))}
                {!isLoading && publishedForms.length === 0 && (
                  <p className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No published forms yet.
                  </p>
                )}
              </div>
            </section> */}
          </aside>
        </div>
      </main>
    </div>
  );
}
