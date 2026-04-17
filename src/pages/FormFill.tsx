import React, { useState, useEffect } from "react";
import { base44 } from "@/api/foreform";
import SEO from "@/components/SEO";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText, AlertCircle, ArrowRight, ArrowLeft, Send, Download, MapPin, Loader2, VerifiedIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import QuestionRenderer from "@/components/forms/QuestionRenderer";
import SignaturePad from "@/components/forms/SignaturePad";
import FormHeader from "@/components/forms/FormHeader";
import { downloadDocx, generateDocxBlob } from "@/lib/generateDocx";
import { savePendingResponse } from "@/lib/offlineDB";
import { requestBackgroundSync } from "@/lib/serviceWorker";
import OfflineBanner from "@/components/forms/OfflineBanner";

const INTRO_STEP = "intro";
const SIGN_STEP = "sign";
const DONE_STEP = "done";

export default function FormFill() {
  const { id: formId } = useParams();

  const { data: form, isLoading } = useQuery({
    queryKey: ["public-form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (data) => data[0],
    enabled: !!formId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", formId],
    queryFn: () => base44.entities.FormSection.list(formId!),
    enabled: !!formId,
  });

  const [step, setStep] = useState<string | number>(INTRO_STEP);
  const [answers, setAnswers] = useState({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [signature, setSignature] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [direction, setDirection] = useState(1);
  const [savedResponse, setSavedResponse] = useState(null);

  const branding = form?.branding || {};
  const allQuestions = form?.questions || [];

  // Evaluate conditional logic — a question is visible if it has no condition or the condition passes
  const evaluateCondition = (condition, currentAnswers) => {
    if (!condition || !condition.source_question_id) return true;
    const sourceAnswer = currentAnswers[condition.source_question_id] || "";
    switch (condition.operator) {
      case "equals": return sourceAnswer === condition.value;
      case "not_equals": return sourceAnswer !== condition.value;
      case "contains": return sourceAnswer.toLowerCase().includes((condition.value || "").toLowerCase());
      case "not_empty": return sourceAnswer.trim() !== "";
      default: return true;
    }
  };

  const questions = allQuestions.filter((q) => evaluateCondition(q.condition, answers));
  const hasSections = sections.length > 0;

  const currentQuestion = !hasSections && typeof step === "number" ? questions[step] : null;
  const currentSection = hasSections && typeof step === "number" ? sections[step] : null;

  const isLastQuestion = !hasSections && typeof step === "number" && step === questions.length - 1;
  const isLastSection = hasSections && typeof step === "number" && step === sections.length - 1;

  const totalSteps = hasSections ? sections.length : questions.length;
  const progress = typeof step === "number" ? ((step + 1) / totalSteps) * 100 : step === DONE_STEP ? 100 : 0;

  // Auto-fetch GPS if form requires it
  useEffect(() => {
    if (form && branding.collect_gps && !gps) {
      setGpsLoading(true);
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          setGpsLoading(false);
        },
        () => setGpsLoading(false),
        { timeout: 10000 }
      );
    }
  }, [form]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formattedAnswers = hasSections
        ? sections.flatMap(s => s.questions).map(q => ({
          question_id: q.id,
          question_label: q.label,
          question_type: q.type,
          answer: answers[q.id] || "",
        }))
        : questions.map((q) => ({
          question_id: q.id,
          question_label: q.label,
          question_type: q.type,
          answer: answers[q.id] || "",
        }));

      const responsePayload = {
        form_id: formId,
        respondent_name: respondentName,
        respondent_email: respondentEmail,
        answers: formattedAnswers,
        ...(signature ? { signature_data_url: signature } : {}),
        ...(gps ? { gps_latitude: gps.lat, gps_longitude: gps.lng, gps_accuracy: gps.accuracy } : {}),
      };

      // If offline, save to IndexedDB and queue for background sync
      if (!navigator.onLine) {
        await savePendingResponse("/api/responses", responsePayload);
        await requestBackgroundSync();
        return { ...responsePayload, _offline: true };
      }

      const response = await base44.entities.FormResponse.create(responsePayload);
      await base44.entities.Form.update(formId, { response_count: (form.response_count || 0) + 1 });

      const fullResponse = { ...response, ...responsePayload };

      if (respondentEmail) {
        await base44.integrations.Core.SendEmail({
          to: respondentEmail,
          subject: `Your response to "${form.title}"`,
          body: `
Hi ${respondentName || "there"},<br/><br/>
Thank you for completing <b>${form.title}</b>${branding.research_title ? ` — <i>${branding.research_title}</i>` : ""}.<br/><br/>
<b>Summary of your responses:</b><br/><br/>
${formattedAnswers.map((a, i) => `<b>${i + 1}. ${a.question_label}</b><br/>${a.answer || "—"}`).join("<br/><br/>")}
${gps ? `<br/><br/><b>Location recorded:</b> ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : ""}
<br/><br/>Best regards,<br/>${branding.organization || "FormFlow"}
          `.trim(),
        });
      }

      return fullResponse;
    },
    onSuccess: (response) => {
      setSavedResponse(response);
      setDirection(1);
      setStep(DONE_STEP);
    },
  });

  const goNext = () => {
    if (step === INTRO_STEP) {
      if (!respondentName.trim()) { setValidationError("Please enter your name"); return; }
      if (branding.consent_text && !consentChecked) { setValidationError("Please accept the consent statement to continue"); return; }
      setValidationError(""); setDirection(1); setStep(0); return;
    }
    if (typeof step === "number") {
      if (hasSections && currentSection) {
        const requiredUnanswered = currentSection.questions.find(q => q.required && !answers[q.id]);
        if (requiredUnanswered) {
          setValidationError(`Please answer: ${requiredUnanswered.label}`);
          return;
        }
      } else if (!hasSections && currentQuestion?.required && !answers[currentQuestion.id]) {
        setValidationError("This question is required"); return;
      }

      setValidationError("");
      const isLast = hasSections ? isLastSection : isLastQuestion;

      if (isLast) {
        if (branding.require_signature) { setDirection(1); setStep(SIGN_STEP); }
        else submitMutation.mutate();
      } else {
        setDirection(1); setStep(step + 1);
      }
      return;
    }
    if (step === SIGN_STEP) {
      if (branding.require_signature && !signature) { setValidationError("Please provide your signature"); return; }
      setValidationError("");
      submitMutation.mutate();
    }
  };

  const goBack = () => {
    setValidationError(""); setDirection(-1);
    if (step === 0) setStep(INTRO_STEP);
    else if (step === SIGN_STEP) setStep(totalSteps - 1);
    else if (typeof step === "number") setStep(step - 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); goNext(); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!form || form.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Form not available</h2>
          <p className="text-muted-foreground">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={form?.title || "Form"} description={form?.description || undefined} path={`/f/${formId}`} />
      <OfflineBanner />
      {/* Top bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt="logo" className="h-8 object-contain" />
          ) : (
            <div className="w-7 h-7 rounded flex items-center justify-center">

              <img src="/letter-m.png" alt="logo" className="h-8 object-contain" />
            </div>
          )}
          <span className="text-sm font-semibold">{branding.organization || "ForeForm"}</span>
        </div>
        <div className="flex items-center gap-2">
          {branding.collect_gps && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${gps ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {gps ? "Location captured" : gpsLoading ? "Getting location…" : "Location pending"}
            </span>
          )}
          {typeof step === "number" && (
            <span className="text-sm text-muted-foreground">{step + 1} / {totalSteps}</span>
          )}
        </div>
      </div>

      {/* Progress */}
      {step !== INTRO_STEP && step !== DONE_STEP && (
        <div className="w-full px-6 max-w-3xl mx-auto mb-2">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>

            {/* INTRO */}
            {step === INTRO_STEP && (
              <motion.div key="intro" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <FormHeader form={form} questions={questions} />

                <div className="bg-card border border-border rounded p-8 shadow-none space-y-5" onKeyDown={handleKeyDown}>
                  <h2 className="font-semibold">Participant Details</h2>
                  <div className="space-y-1.5">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input value={respondentName} onChange={(e) => { setRespondentName(e.target.value); setValidationError(""); }} placeholder="Your full name" className="h-11" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address <span className="text-muted-foreground text-xs">(response copy sent here)</span></Label>
                    <Input type="email" value={respondentEmail} onChange={(e) => setRespondentEmail(e.target.value)} placeholder="prpt@foreform.com" className="h-11" />
                  </div>
                  {branding.consent_text && (
                    <div className="flex items-start gap-3 p-4 bg-transparent rounded border border-primary/40">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consentChecked}
                        onChange={(e) => { setConsentChecked(e.target.checked); setValidationError(""); }}
                        className="mt-1 w-4 h-4 accent-primary flex-shrink-0"
                      />
                      <label htmlFor="consent" className="text-sm text-primary/50 leading-relaxed cursor-pointer">{branding.consent_text}</label>
                    </div>
                  )}
                  {validationError && <p className="text-sm text-destructive">{validationError}</p>}
                  <Button onClick={goNext} className="w-full h-12 text-base gap-2 rounded">
                    Start Survey <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* QUESTION / SECTION */}
            {typeof step === "number" && (currentQuestion || currentSection) && (
              <motion.div key={`step-${step}`} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card rounded-none p-6 sm:p-10 shadow-sm space-y-8" onKeyDown={handleKeyDown}>

                {hasSections && currentSection ? (
                  <div className="space-y-8">
                    <div className="space-y-1 pb-4">
                      <p className="text-[12px] font-bold text-primary">Section {step + 1} of {sections.length}</p>
                      <h2 className="text-xl font-bold">{currentSection.title}</h2>
                      {currentSection.description && <p className="text-sm text-muted-foreground">{currentSection.description}</p>}
                    </div>

                    <div className="space-y-10">
                      {(currentSection.questions || []).map((q, idx) => (
                        <div key={q.id} className="space-y-2">
                          <QuestionRenderer
                            question={q}
                            value={answers[q.id]}
                            onChange={(val) => { setAnswers({ ...answers, [q.id]: val }); setValidationError(""); }}
                          />
                          {idx < currentSection.questions.length - 1 && <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">Question {step! as number + 1} of {questions.length}</span>
                    </div>
                    <QuestionRenderer
                      question={currentQuestion!}
                      value={answers[currentQuestion!.id]}
                      onChange={(val) => { setAnswers({ ...answers, [currentQuestion!.id]: val }); setValidationError(""); }}
                    />
                  </div>
                )}

                {validationError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 p-3 bg-destructive/10 rounded border border-destructive/20"><AlertCircle className="w-3.5 h-3.5" />{validationError}</p>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <Button variant="ghost" onClick={goBack} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={goNext} disabled={submitMutation.isPending} className="gap-2 px-8 py-6 text-base">
                    {(hasSections ? isLastSection : isLastQuestion) && !branding.require_signature ? (
                      submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit Response</>
                    ) : (
                      <>Continue <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold opacity-50">Press Enter for next step</p>
              </motion.div>
            )}

            {/* SIGNATURE STEP */}
            {step === SIGN_STEP && (
              <motion.div key="sign" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-card border border-border rounded p-8 shadow-none space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Participant Signature</h2>
                  <p className="text-sm text-muted-foreground">By signing below, you confirm that all information provided is accurate and that you consent to participate in this study.</p>
                </div>
                <SignaturePad value={signature} onChange={setSignature} />
                {validationError && <p className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{validationError}</p>}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={goBack} className="gap-1.5"><ArrowLeft className="w-4 h-4" />Back</Button>
                  <Button onClick={goNext} disabled={submitMutation.isPending} className="gap-2 px-6">
                    {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* DONE */}
            {step === DONE_STEP && (
              <motion.div key="done" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <VerifiedIcon className="w-10 h-10 text-primary" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{savedResponse?._offline ? "Saved Offline!" : "Thank You!"}</h2>
                  <p className="text-muted-foreground">
                    {savedResponse?._offline
                      ? "You're currently offline. Your response has been saved and will be automatically submitted when you reconnect."
                      : <>Your response to <span className="font-medium text-foreground">{form.title}</span> has been recorded.</>}
                  </p>
                  {!savedResponse?._offline && respondentEmail && <p className="text-sm text-muted-foreground mt-2">A copy has been sent to <span className="font-medium text-foreground">{respondentEmail}</span></p>}
                  {gps && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />Location recorded: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                {savedResponse && (
                  <Button variant="outline" className="gap-2 border-indigo-600 rounded text-indigo-600" onClick={() => downloadDocx(form, savedResponse)}>
                    <Download className="w-4 h-4" /> Download My Response (.docx)
                  </Button>
                )}
                {branding.organization && <p className="text-xs text-muted-foreground pt-4">{branding.organization}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}