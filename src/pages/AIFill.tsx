import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { base44 } from "@/api/foreform";
import SEO from "@/components/SEO";
import OfflineBanner from "@/components/forms/OfflineBanner";
import { savePendingResponse } from "@/lib/offlineDB";
import { requestBackgroundSync } from "@/lib/serviceWorker";
import { stripHtml } from "@/lib/richText";
import { formatCallTime, useCallTimer } from "@/hooks/useCallTimer";
import { Persona } from "@/components/ai-elements/persona";
import { Transcription, TranscriptionSegment } from "@/components/ai-elements/transcription";

const RATE = 24_000;
const API_KEY_STORAGE = "foreform:assemblyai-api-key";

const workletUrl = URL.createObjectURL(new Blob([`
  class ForeformAssemblyMic extends AudioWorkletProcessor {
    process(inputs) {
      const channel = inputs[0] && inputs[0][0];
      if (!channel) return true;
      const buffer = new Int16Array(channel.length);
      for (let i = 0; i < channel.length; i += 1) {
        buffer[i] = Math.max(-32768, Math.min(32767, channel[i] * 32767));
      }
      this.port.postMessage(buffer.buffer, [buffer.buffer]);
      return true;
    }
  }
  registerProcessor("foreform-assembly-mic", ForeformAssemblyMic);
`], { type: "application/javascript" }));

function evaluateCondition(condition, currentAnswers) {
  if (!condition || !condition.source_question_id) return true;
  const sourceAnswer = currentAnswers[condition.source_question_id] || "";
  switch (condition.operator) {
    case "equals": return sourceAnswer === condition.value;
    case "not_equals": return sourceAnswer !== condition.value;
    case "contains": return sourceAnswer.toLowerCase().includes((condition.value || "").toLowerCase());
    case "not_empty": return sourceAnswer.trim() !== "";
    default: return true;
  }
}

function normalizeSpokenAnswer(question, rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const options = question.options || [];

  if ((question.type === "multiple_choice" || question.type === "dropdown") && options.length) {
    return options.find((option) => lower.includes(String(option).toLowerCase())) || text;
  }

  if (question.type === "checkbox" && options.length) {
    const selected = options.filter((option) => lower.includes(String(option).toLowerCase()));
    return selected.length ? selected.join(", ") : text;
  }

  if (question.type === "rating") {
    return lower.match(/\b([1-5])\b/)?.[1] || text;
  }

  if (question.type === "number") {
    return text.match(/-?\d+(\.\d+)?/)?.[0] || text;
  }

  if (question.type === "email") {
    const spoken = lower.replace(/\s+at\s+/g, "@").replace(/\s+dot\s+/g, ".");
    return spoken.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] || text;
  }

  return text;
}

function InlineAgentHeader({ ended, timer }) {
  return (
    <header className="flex shrink-0 flex-col items-center pt-8">
      <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 backdrop-blur-md">
        <div className={`h-2 w-2 rounded-full ${ended ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
        <time className="font-mono text-sm font-medium tabular-nums tracking-wider text-white/80">{timer}</time>
      </div>
    </header>
  );
}

function InlineCallControls({ muted, speakerOn, ended, onToggleMute, onEnd, onToggleSpeaker }) {
  const controlClass = "flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/10 transition-all hover:bg-white/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-md";
  const activeClass = "bg-white/20 text-white ring-white/30";

  return (
    <div className="mx-auto flex w-fit shrink-0 items-center justify-center gap-6 rounded-full bg-black/40 p-4 ring-1 ring-white/10 backdrop-blur-xl" aria-label="Call controls">
      <button
        type="button"
        className={`${controlClass} ${muted ? activeClass : ""}`}
        onClick={onToggleMute}
        disabled={ended}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <button
        type="button"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-red-400/50 transition-all hover:scale-105 hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        onClick={onEnd}
        disabled={ended}
        aria-label="End call"
      >
        <PhoneOff size={28} />
      </button>

      <button
        type="button"
        className={`${controlClass} ${!speakerOn ? activeClass : ""}`}
        onClick={onToggleSpeaker}
        disabled={ended}
        aria-label={speakerOn ? "Turn speaker off" : "Turn speaker on"}
      >
        {speakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </button>
    </div>
  );
}

export default function AIFill() {
  const { id: formId } = useParams();
  const timer = useCallTimer(false);
  const [apiKey] = useState(() => import.meta.env.VITE_ASSEMBLY_API_KEY || sessionStorage.getItem(API_KEY_STORAGE) || "bbb368dfc33042ea9a874163fcdc9ddf");
  const [status, setStatus] = useState("ready");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentlyRevealing, setCurrentlyRevealing] = useState(null);
  const [showTyping, setShowTyping] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedResponse, setSavedResponse] = useState(null);
  const [endedAt, setEndedAt] = useState(null);
  const [lastCompletedText, setLastCompletedText] = useState("");

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const playTimeRef = useRef(0);
  const mutedRef = useRef(false);
  const speakerOnRef = useRef(true);
  const answersRef = useRef({});
  const currentIndexRef = useRef(0);
  const revealingTimeoutRef = useRef(null);
  const submittingRef = useRef(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ["public-form", formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    select: (data) => data[0],
    enabled: !!formId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["sections", formId],
    queryFn: () => base44.entities.FormSection.list(formId),
    enabled: !!formId,
  });

  const presentation = form?.presentation || {};
  const collectParticipantDetails = presentation.collect_participant_details ?? presentation.collectParticipantDetails ?? false;
  const flatQuestions = useMemo(() => {
    const sectionQuestions = sections.flatMap((section) => section.questions || []);
    return sectionQuestions.length ? sectionQuestions : (form?.questions || []);
  }, [form, sections]);
  const visibleQuestions = useMemo(
    () => flatQuestions.filter((question) => evaluateCondition(question.condition, answers)),
    [answers, flatQuestions],
  );
  const currentQuestion = visibleQuestions[currentIndex] || null;
  const progress = visibleQuestions.length
    ? Math.min(100, (visibleQuestions.filter((question) => answers[question.id]).length / visibleQuestions.length) * 100)
    : 0;
  const ended = status === "ended" || status === "done";
  const active = status === "connecting" || status === "connected" || status === "submitting";
  const controlsDisabled = ended || (!active && status !== "submitting");

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    speakerOnRef.current = speakerOn;
  }, [speakerOn]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => () => stopVoice(false), []);

  const addTranscript = (role, text, reveal = true) => {
    if (!text.trim()) return;
    const id = `${role}-${Date.now()}-${Math.random()}`;
    setMessages((current) => [...current, { id, role, text }]);
    if (!reveal) return;
    setCurrentlyRevealing(id);
    if (revealingTimeoutRef.current) clearTimeout(revealingTimeoutRef.current);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    revealingTimeoutRef.current = setTimeout(() => setCurrentlyRevealing(null), Math.max(1, wordCount) * WORD_REVEAL_MS + 180);
  };

  const buildSystemPrompt = () => {
    const questionLines = visibleQuestions.map((question, index) => {
      const options = question.options?.length ? ` Options: ${question.options.join(", ")}.` : "";
      return `${index + 1}. ${question.label}${question.required ? " Required." : ""}${options}`;
    }).join("\n");

    return `You are Aria, ForeForm's calm voice form assistant. Ask the respondent these form questions one at a time and keep replies short.
Do not invent answers. If an answer is unclear, ask one short follow-up. When all questions are answered, tell them you are submitting the form.
Form title: ${form?.title || "Untitled form"}
Questions:
${questionLines}`;
  };

  const submitResponse = async (finalAnswers) => {
    if (submittingRef.current || !formId) return;
    submittingRef.current = true;
    setStatus("submitting");

    const missing = visibleQuestions.find((question) => question.required && !finalAnswers[question.id]);
    if (missing) {
      submittingRef.current = false;
      setStatus(wsRef.current ? "connected" : "ready");
      setCurrentIndex(Math.max(0, visibleQuestions.findIndex((question) => question.id === missing.id)));
      addTranscript("agent", `I still need this one: ${missing.label}`);
      return;
    }

    const formattedAnswers = visibleQuestions.map((question) => ({
      question_id: question.id,
      question_label: question.label,
      question_type: question.type,
      answer: finalAnswers[question.id] || "",
    }));
    const questionEmail = formattedAnswers.find((answer) => answer.question_type === "email" && answer.answer)?.answer || "";
    const responsePayload = {
      form_id: formId,
      respondent_name: collectParticipantDetails ? finalAnswers.respondent_name || "" : "",
      respondent_email: questionEmail,
      answers: formattedAnswers,
    };

    const response = !navigator.onLine
      ? await (async () => {
          await savePendingResponse("/api/responses", responsePayload);
          await requestBackgroundSync();
          return { ...responsePayload, _offline: true };
        })()
      : await base44.entities.FormResponse.create(responsePayload);

    const fullResponse = { ...responsePayload, ...response };
    setSavedResponse(fullResponse);
    setStatus("done");
    setEndedAt(timer.seconds);
    timer.stop();
    stopVoice(false);
    addTranscript(
      "agent",
      fullResponse._offline
        ? "Your response is saved offline and will submit when you reconnect."
        : `Done. Your response has been submitted${fullResponse.respondent_email ? ` and a copy was sent to ${fullResponse.respondent_email}` : ""}.`,
    );
  };

  const submitMutation = useMutation({ mutationFn: submitResponse });

  const handleUserTranscript = (text) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText === lastCompletedText || status === "submitting" || status === "done") return;
    setLastCompletedText(cleanText);
    addTranscript("user", cleanText);

    const question = visibleQuestions[currentIndexRef.current];
    if (!question) {
      submitMutation.mutate(answersRef.current);
      return;
    }

    const normalized = normalizeSpokenAnswer(question, cleanText);
    const nextAnswers = { ...answersRef.current, [question.id]: normalized };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    const nextIndex = currentIndexRef.current + 1;
    setCurrentIndex(Math.min(nextIndex, visibleQuestions.length));
    if (nextIndex >= visibleQuestions.length) submitMutation.mutate(nextAnswers);
  };

  const startVoice = async () => {
    if (!apiKey.trim()) {
      toast.error("Add your AssemblyAI API key first.");
      return;
    }
    if (!visibleQuestions.length) {
      toast.error("This form has no questions to ask.");
      return;
    }

    sessionStorage.setItem(API_KEY_STORAGE, apiKey.trim());
    setStatus("connecting");
    setMessages([]);
    setEndedAt(null);
    timer.start();

    try {
      const audioContext = new AudioContext({ sampleRate: RATE });
      audioContextRef.current = audioContext;
      await audioContext.resume();
      await audioContext.audioWorklet.addModule(workletUrl);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "foreform-assembly-mic");
      const monitor = audioContext.createGain();
      monitor.gain.value = 0;
      source.connect(worklet).connect(monitor).connect(audioContext.destination);

      const url = new URL("wss://agents.assemblyai.com/v1/ws");
      url.searchParams.set("token", apiKey.trim());
      const ws = new WebSocket(url);
      wsRef.current = ws;
      let ready = false;

      worklet.port.onmessage = ({ data }) => {
        if (!ready || mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
        const bytes = new Uint8Array(data);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(binary) }));
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            system_prompt: buildSystemPrompt(),
            greeting: `Hi, I'm Aria. I'll help fill ${form?.title || "this form"}. ${currentQuestion?.label || "Let's begin."}`,
            output: { voice: "ivy" },
          },
        }));
      };

      ws.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        switch (message.type) {
          case "session.ready":
            ready = true;
            setStatus("connected");
            break;
          case "input.speech.started":
            setUserSpeaking(true);
            break;
          case "input.speech.stopped":
            setUserSpeaking(false);
            break;
          case "reply.started":
            setShowTyping(true);
            setAgentSpeaking(true);
            break;
          case "reply.done":
            setShowTyping(false);
            setAgentSpeaking(false);
            if (message.status === "interrupted") playTimeRef.current = audioContext.currentTime;
            break;
          case "reply.audio": {
            if (!speakerOnRef.current) break;
            const raw = atob(message.data);
            const pcm = new Int16Array(raw.length / 2);
            for (let i = 0; i < pcm.length; i += 1) {
              pcm[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
            }
            const audio = new Float32Array(pcm.length);
            for (let i = 0; i < pcm.length; i += 1) audio[i] = pcm[i] / 32768;
            const buffer = audioContext.createBuffer(1, audio.length, RATE);
            buffer.getChannelData(0).set(audio);
            const player = audioContext.createBufferSource();
            player.buffer = buffer;
            player.connect(audioContext.destination);
            playTimeRef.current = Math.max(playTimeRef.current, audioContext.currentTime);
            player.start(playTimeRef.current);
            playTimeRef.current += buffer.duration;
            break;
          }
          case "transcript.user":
            handleUserTranscript(message.text || "");
            break;
          case "transcript.agent":
            setShowTyping(false);
            addTranscript("agent", message.text || "");
            break;
          case "session.error":
            setStatus("ready");
            toast.error(message.message || "Voice session failed.");
            break;
        }
      };

      ws.onerror = () => {
        setStatus("ready");
        toast.error("AssemblyAI connection failed.");
      };
      ws.onclose = () => {
        if (!submittingRef.current && status !== "done") setStatus("ready");
      };
    } catch (error) {
      setStatus("ready");
      timer.stop();
      toast.error(error instanceof Error ? error.message : "Could not start voice fill.");
      stopVoice(false);
    }
  };

  const stopVoice = (markEnded = true) => {
    wsRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();
    wsRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    setUserSpeaking(false);
    setAgentSpeaking(false);
    setShowTyping(false);
    if (markEnded) {
      setStatus("ended");
      setEndedAt(timer.seconds);
      timer.stop();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center "><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
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

  const endedLabel = ended ? `Call ended · ${formatCallTime(endedAt ?? timer.seconds)}` : "";
  
  let personaState: "idle" | "thinking" | "listening" | "speaking" | "asleep" = "idle";
  if (status === "connecting") personaState = "thinking";
  else if (userSpeaking) personaState = "listening";
  else if (agentSpeaking || showTyping) personaState = "speaking";
  else if (ended) personaState = "asleep";

  const transcriptionSegments = messages.map((m, i) => ({
    text: m.role === "user" ? `You: ${m.text}` : `Aria: ${m.text}`,
    startSecond: i,
    endSecond: i + 1,
  }));

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-zinc-950 font-sans text-zinc-50 selection:bg-white/20">
      <SEO title={`Voice Fill - ${form?.title || "Form"}`} description={stripHtml(form?.description || "") || undefined} path={`/f/${formId}/ai-fill`} />
      <OfflineBanner />
      
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,0.5),rgba(9,9,11,1))]" />
        <div className={`absolute h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full opacity-20 mix-blend-screen blur-[100px] transition-all duration-1000 ease-in-out ${
          personaState === "speaking" ? "scale-110 bg-indigo-500/50" : 
          personaState === "listening" ? "scale-100 bg-emerald-500/40" : 
          personaState === "thinking" ? "scale-90 bg-amber-500/30 animate-pulse" :
          "scale-75 bg-zinc-600/20"
        }`} />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-2">
        <InlineAgentHeader ended={ended} timer={timer.formatted} />
        <div className="h-4">
          {endedLabel && <div className="text-xs font-medium text-white/50">{endedLabel}</div>}
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-white/5 blur-3xl transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}`} />
          <Persona variant="obsidian" state={personaState} className="relative z-10 size-64 drop-shadow-2xl sm:size-80" />
        </div>
        
        <div className="relative mt-12 flex h-40 w-full flex-col justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_40%,black_100%)]">
          {transcriptionSegments.length > 0 ? (
            <Transcription segments={transcriptionSegments} currentTime={messages.length - 1} className="flex-col items-center justify-end gap-6 pb-4 text-center">
              {(segment, index) => (
                <TranscriptionSegment 
                  key={index} 
                  segment={segment} 
                  index={index} 
                  className="text-2xl font-light tracking-wide transition-all duration-700 data-[active=false]:translate-y-4 data-[active=true]:scale-100 data-[active=false]:scale-95 data-[active=true]:text-white data-[active=true]:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] data-[active=false]:text-white/30 sm:text-3xl" 
                />
              )}
            </Transcription>
          ) : (
            <p className="pb-4 text-center text-xl font-light tracking-wide text-white/40">
              {currentQuestion ? currentQuestion.label : savedResponse ? "Response submitted" : "Ready to start"}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 pb-12">
        {active || ended ? (
          <InlineCallControls
            muted={muted}
            speakerOn={speakerOn}
            ended={controlsDisabled}
            onToggleMute={() => setMuted((value) => !value)}
            onToggleSpeaker={() => setSpeakerOn((value) => !value)}
            onEnd={() => stopVoice(true)}
          />
        ) : (
          <button 
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-white/10 text-base font-medium tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:ring-white/40 active:scale-[0.98]" 
            type="button" 
            onClick={startVoice}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative drop-shadow-md">Start Session</span>
          </button>
        )}
      </div>
    </main>
  );
}
