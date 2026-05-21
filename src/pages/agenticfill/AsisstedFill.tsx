import SEO from "@/components/SEO";
import { base44 } from "@/api/foreform";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronRight,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { GeminiLiveVoice } from "./GeminiLiveVoice";

type CallStatus = "idle" | "connecting" | "active" | "speaking" | "ended";

export default function AsisstedFill() {
  const { id: formId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [currentField, setCurrentField] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aiResponse, setAiResponse] = useState("Hello. Tap the call button and I will help fill this form by voice.");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const liveRef = useRef<GeminiLiveVoice | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["public-form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (data) => data[0],
    enabled: !!formId,
  });

  const questions = useMemo(() => form?.questions || [], [form]);
  const draftStorageKey = formId ? `foreform:assisted-draft:${formId}` : "";

  const saveDraft = (nextAnswers: Record<string, string>) => {
    if (!draftStorageKey) return;
    sessionStorage.setItem(
      draftStorageKey,
      JSON.stringify({ answers: nextAnswers, updatedAt: new Date().toISOString() }),
    );
  };

  const getQuestionLabel = (questionId?: string) => {
    if (!questionId) return "";
    return questions.find((question: any) => question.id === questionId)?.label || "";
  };

  useEffect(() => {
    if (!draftStorageKey) return;
    const savedDraft = sessionStorage.getItem(draftStorageKey);
    if (!savedDraft) return;
    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
        answersRef.current = parsed.answers;
      }
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (status === "active" || status === "speaking") {
      audioIntervalRef.current = setInterval(() => {
        const base = status === "speaking" ? 45 : 16;
        setAudioLevel(base + Math.random() * 35);
      }, 100);
      return () => {
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      };
    }
    setAudioLevel(0);
    return undefined;
  }, [status]);

  useEffect(() => {
    return () => {
      liveRef.current?.stop();
      liveRef.current = null;
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  const applyFieldUpdates = (updates: Array<{ field_id: string; value: string }>) => {
    if (!updates.length) return;

    const nextAnswers = { ...answersRef.current };
    for (const update of updates) {
      if (!questions.some((question: any) => question.id === update.field_id)) continue;
      nextAnswers[update.field_id] = update.value;
    }

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    saveDraft(nextAnswers);

    const lastUpdate = updates[updates.length - 1];
    setCurrentField(getQuestionLabel(lastUpdate.field_id));
  };

  const toggleCall = async () => {
    if (!formId) return;

    if (liveRef.current) {
      liveRef.current.stop();
      liveRef.current = null;
      setStatus("ended");
      setIsMuted(false);
      setIsUserSpeaking(false);
      setTranscript("");
      setAiResponse("Call ended. Your draft is saved for review.");
      return;
    }

    const liveVoice = new GeminiLiveVoice({
      formId,
      draftAnswers: answersRef.current,
      onConnecting: () => {
        setStatus("connecting");
        setAiResponse("Connecting to the live voice agent...");
      },
      onReady: () => {
        setStatus("active");
        setIsMuted(false);
      },
      onDisconnect: () => {
        liveRef.current = null;
        setIsUserSpeaking(false);
        setStatus("idle");
      },
      onError: (message) => {
        toast.error(message);
        setAiResponse(message);
        setStatus("idle");
        setIsUserSpeaking(false);
        liveRef.current = null;
      },
      onInputTranscript: (text) => setTranscript(text),
      onOutputTranscript: (text) => {
        setAssistantTranscript(text);
        setAiResponse(text);
      },
      onFormUpdate: applyFieldUpdates,
      onAgentSpeaking: (isSpeaking) => setStatus((current) => {
        if (current === "idle" || current === "connecting" || current === "ended") return current;
        return isSpeaking ? "speaking" : "active";
      }),
      onUserSpeaking: setIsUserSpeaking,
    });

    liveVoice.setOutputEnabled(isSpeakerOn);
    liveVoice.setInputEnabled(!isMuted);
    liveRef.current = liveVoice;
    await liveVoice.start();
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    liveRef.current?.setInputEnabled(!nextMuted);
    toast.info(nextMuted ? "Microphone muted" : "Microphone active");
  };

  const handleSpeakerToggle = () => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    liveRef.current?.setOutputEnabled(nextSpeaker);
  };

  if (formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
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

  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6 font-sans relative overflow-hidden select-none"
      style={{
        backgroundColor: "#f9fafb",
        backgroundImage: "repeating-linear-gradient(45deg, #f3f4f6 0px, #f3f4f6 1px, transparent 1px, transparent 10px)",
        backgroundSize: "20px 20px",
      }}
    >
      <SEO title={`Voice Fill - ${form?.title || "Form"}`} path={`/f/${formId}/assisted`} />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg z-10 py-8 space-y-8">
        <div className="text-center space-y-1.5 h-16 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-slate-800">
            {status === "idle" && "Voice Assistant"}
            {status === "connecting" && "Connecting..."}
            {status === "active" && (isUserSpeaking ? "Listening..." : (form?.title || "Form Assistant"))}
            {status === "speaking" && "Assistant Speaking"}
            {status === "ended" && "Call Ended"}
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            {status === "idle" && "Live speech-to-text, voice replies, and form filling"}
            {status === "connecting" && "Opening the live agent..."}
            {(status === "active" || status === "speaking") && (isMuted ? "Muted" : isUserSpeaking ? "I hear you..." : "Listening for your voice...")}
            {status === "ended" && "Your draft responses are saved"}
          </p>
        </div>

        <div className="relative flex items-center justify-center w-80 h-80">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-700 bg-cyan-400"
            style={{
              transform: `scale(${1 + audioLevel * 0.005})`,
              opacity: status === "active" || status === "speaking" ? 0.3 + audioLevel * 0.002 : 0.08,
            }}
          />

          <AnimatePresence>
            {(status === "active" || status === "speaking") && !isMuted && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border border-cyan-400/30"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-blue-500/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </>
            )}
          </AnimatePresence>

          <div
            className="w-64 h-64 rounded-full relative overflow-hidden shadow-2xl transition-transform duration-300 bg-white"
            style={{
              transform: `scale(${1 + (status === "active" || status === "speaking" ? audioLevel * 0.002 : 0)})`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                background: "conic-gradient(from 0deg at 50% 50%, #06b6d4 0deg, #3b82f6 90deg, #0ea5e9 180deg, #1d4ed8 270deg, #06b6d4 360deg)",
                animation: status === "active" || status === "speaking" ? "spin 12s linear infinite" : "spin 32s linear infinite",
                opacity: status === "idle" || status === "ended" ? 0.35 : 0.95,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/30" />
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
            <div
              className="absolute inset-16 rounded-full bg-gradient-to-br from-white/90 to-white/40 shadow-inner flex flex-col items-center justify-center p-4 text-center transition-all duration-300"
              style={{ transform: `scale(${1 - (status === "active" || status === "speaking" ? audioLevel * 0.001 : 0)})` }}
            >
              {status === "active" || status === "speaking" ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Live</span>
                </div>
              ) : (
                <Sparkles className="w-6 h-6 text-cyan-600 opacity-60" />
              )}
            </div>

            <button
              onClick={toggleCall}
              disabled={status === "connecting"}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                status === "connecting"
                  ? "bg-[#a0a5b1] text-white cursor-wait"
                  : liveRef.current
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
              style={{ zIndex: 20 }}
            >
              {status === "connecting" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : liveRef.current ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="w-full bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assistant</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {assistantTranscript || aiResponse}
              </p>
            </div>
          </div>

          {transcript && (
            <div className="pt-3 border-t border-slate-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">You</p>
                <p className="text-[13px] text-slate-500 italic">"{transcript}"</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-xs font-medium text-cyan-700 bg-cyan-50/50 px-3 py-2 rounded-lg border border-cyan-100/50">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-600" />
              {currentField ? (
                <>Filled: <strong className="text-cyan-800">{currentField}</strong></>
              ) : (
                <>{answeredCount} draft answer{answeredCount === 1 ? "" : "s"}</>
              )}
            </span>
            <button
              onClick={() => navigate(`/f/${formId}`)}
              className="hover:underline flex items-center text-cyan-800"
            >
              Review form <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs flex justify-center z-10 pb-6">
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 px-6 py-3.5 rounded-full shadow-md flex items-center gap-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${showSettings ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            disabled={!liveRef.current}
            onClick={handleMuteToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isMuted ? "bg-red-50 text-red-600 font-semibold" : "text-slate-700 hover:bg-slate-50 font-medium"} ${!liveRef.current ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-500" />}
            <span className="text-xs">Mute</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            onClick={handleSpeakerToggle}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isSpeakerOn ? "text-slate-700 hover:text-slate-800 hover:bg-slate-50" : "bg-red-50 text-red-600"}`}
            title={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-28 left-4 right-4 max-w-sm mx-auto bg-white border border-slate-100 rounded-2xl p-5 shadow-xl z-20 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Voice Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">
                Done
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Speech engine</span>
                <span className="text-slate-500">Gemini Live</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Voice</span>
                <span className="text-slate-500">Zephyr</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 leading-normal">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                Live voice requires the backend to have GEMINI_API_KEY or GOOGLE_API_KEY configured.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
