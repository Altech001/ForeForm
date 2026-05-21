import { API_BASE } from "@/api/foreform";

interface LiveVoiceCallbacks {
  formId: string;
  draftAnswers: Record<string, string>;
  onReady?: () => void;
  onConnecting?: () => void;
  onDisconnect?: () => void;
  onError?: (message: string) => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onFormUpdate?: (updates: Array<{ field_id: string; value: string }>) => void;
  onAgentSpeaking?: (isSpeaking: boolean) => void;
  onUserSpeaking?: (isSpeaking: boolean) => void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

function liveUrl(formId: string) {
  const api = new URL(API_BASE, window.location.origin);
  api.protocol = api.protocol === "https:" ? "wss:" : "ws:";
  const basePath = api.pathname.replace(/\/api\/?$/, "");
  api.pathname = `${basePath}/api/agentic-fill/live/${formId}`;
  api.search = "";
  return api.toString();
}

export class GeminiLiveVoice {
  private callbacks: LiveVoiceCallbacks;
  private ws: WebSocket | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private inputMonitor: GainNode | null = null;
  private stream: MediaStream | null = null;
  private nextPlayTime = 0;
  private manuallyStopped = false;
  private outputEnabled = true;
  private inputEnabled = true;
  private lastError: string | null = null;
  private recentAudioChunks = new Map<string, number>();
  private outputSources = new Set<AudioBufferSourceNode>();
  private isUserSpeaking = false;
  private lastVoiceAt = 0;
  private pendingInputFrames: Float32Array[] = [];
  private workletUrl: string | null = null;
  private noiseFloor = 0.006;

  constructor(callbacks: LiveVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    if (this.ws || this.inputContext || this.outputContext) return;

    this.manuallyStopped = false;
    this.lastError = null;
    this.callbacks.onConnecting?.();

    try {
      this.inputContext = new AudioContext({ latencyHint: "interactive" });
      this.outputContext = new AudioContext({ latencyHint: "interactive" });
      await Promise.all([this.inputContext.resume(), this.outputContext.resume()]);
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: INPUT_SAMPLE_RATE,
        },
      });
    } catch (error) {
      this.callbacks.onError?.(error instanceof Error ? error.message : "Could not start the microphone.");
      this.stop();
      return;
    }

    this.ws = new WebSocket(liveUrl(this.callbacks.formId));

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: "start",
        draft_answers: this.callbacks.draftAnswers,
      }));
    };
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = () => {
      this.lastError = "Gemini Live connection failed.";
      this.callbacks.onError?.(this.lastError);
    };
    this.ws.onclose = (event) => {
      if (!this.manuallyStopped && !this.lastError) {
        const reason = event.reason || (event.code !== 1000 ? `Live voice disconnected (${event.code}).` : "");
        if (reason) this.callbacks.onError?.(reason);
        else this.callbacks.onDisconnect?.();
      }
      this.cleanup();
    };
  }

  stop() {
    this.manuallyStopped = true;
    this.ws?.close();
    this.cleanup();
    this.callbacks.onDisconnect?.();
  }

  setOutputEnabled(enabled: boolean) {
    this.outputEnabled = enabled;
    if (!enabled) {
      this.stopQueuedOutput();
    }
  }

  setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) this.endUserActivity();
  }

  private startMicrophone() {
    void this.startMicrophoneCapture();
  }

  private async startMicrophoneCapture() {
    if (!this.inputContext || !this.stream || !this.ws || this.processor) return;

    this.source = this.inputContext.createMediaStreamSource(this.stream);
    this.inputMonitor = this.inputContext.createGain();
    this.inputMonitor.gain.value = 0;

    try {
      this.workletUrl = URL.createObjectURL(new Blob([`
        class ForeformMicProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = [];
            this.bufferSize = 2048;
          }

          process(inputs) {
            const channel = inputs[0] && inputs[0][0];
            if (!channel) return true;

            for (let i = 0; i < channel.length; i += 1) {
              this.buffer.push(channel[i]);
            }

            while (this.buffer.length >= this.bufferSize) {
              const frame = new Float32Array(this.buffer.splice(0, this.bufferSize));
              this.port.postMessage(frame, [frame.buffer]);
            }

            return true;
          }
        }

        registerProcessor("foreform-mic-processor", ForeformMicProcessor);
      `], { type: "application/javascript" }));

      await this.inputContext.audioWorklet.addModule(this.workletUrl);
      const worklet = new AudioWorkletNode(this.inputContext, "foreform-mic-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      worklet.port.onmessage = (event) => this.handleInputFrame(event.data);
      this.processor = worklet;
      this.source.connect(worklet);
      worklet.connect(this.inputMonitor);
    } catch {
      const fallback = this.inputContext.createScriptProcessor(2048, 1, 1);
      fallback.onaudioprocess = (event) => {
        this.handleInputFrame(event.inputBuffer.getChannelData(0));
      };
      this.processor = fallback;
      this.source.connect(fallback);
      fallback.connect(this.inputMonitor);
    }

    this.inputMonitor.connect(this.inputContext.destination);
  }

  private handleInputFrame(frame: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.inputContext) return;
    if (!this.inputEnabled) {
      this.pendingInputFrames = [];
      this.endUserActivity();
      return;
    }

    const startedSpeaking = this.updateUserActivity(frame);
    if (startedSpeaking) {
      for (const pending of this.pendingInputFrames) {
        this.sendInputAudio(pending);
      }
      this.pendingInputFrames = [];
    }

    if (this.isUserSpeaking) {
      this.sendInputAudio(frame);
      return;
    }

    this.pendingInputFrames.push(new Float32Array(frame));
    if (this.pendingInputFrames.length > 4) {
      this.pendingInputFrames.shift();
    }
  }

  private sendInputAudio(frame: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.inputContext) return;
    const resampled = this.resample(frame, this.inputContext.sampleRate, INPUT_SAMPLE_RATE);
    const pcm = this.floatTo16BitPCM(resampled);
    this.ws.send(JSON.stringify({ type: "audio", audio: this.arrayBufferToBase64(pcm) }));
  }

  private handleMessage(event: MessageEvent) {
    let message: any;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.type === "ready") {
      this.nextPlayTime = this.outputContext?.currentTime ?? 0;
      this.startMicrophone();
      this.callbacks.onReady?.();
      return;
    }

    if (message.type === "audio" && typeof message.audio === "string") {
      this.playAudioChunk(message.audio);
      return;
    }

    if (message.type === "inputTranscript" && typeof message.text === "string") {
      this.callbacks.onInputTranscript?.(message.text);
      return;
    }

    if (message.type === "outputTranscript" && typeof message.text === "string") {
      this.callbacks.onOutputTranscript?.(message.text);
      return;
    }

    if (message.type === "formUpdate") {
      this.callbacks.onFormUpdate?.(Array.isArray(message.field_updates) ? message.field_updates : []);
      return;
    }

    if (message.type === "interrupted") {
      this.stopQueuedOutput();
      return;
    }

    if (message.type === "error") {
      this.lastError = message.message || message.data || "Live voice failed.";
      this.callbacks.onError?.(this.lastError);
    }
  }

  private playAudioChunk(base64: string) {
    if (!this.outputContext || !this.outputEnabled) return;

    const now = performance.now();
    const lastSeen = this.recentAudioChunks.get(base64);
    if (lastSeen && now - lastSeen < 2500) return;
    this.recentAudioChunks.set(base64, now);
    for (const [chunk, seenAt] of this.recentAudioChunks) {
      if (now - seenAt > 5000) this.recentAudioChunks.delete(chunk);
    }

    const bytes = this.base64ToBytes(base64);
    const audio = this.pcm16ToFloat32(bytes);
    const buffer = this.outputContext.createBuffer(1, audio.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(audio);

    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    this.outputSources.add(source);

    if (this.nextPlayTime < this.outputContext.currentTime) {
      this.nextPlayTime = this.outputContext.currentTime + 0.015;
    }

    this.callbacks.onAgentSpeaking?.(true);
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
    source.onended = () => {
      this.outputSources.delete(source);
      try {
        source.disconnect();
      } catch {
        // It may already have been disconnected during barge-in.
      }
      if (this.outputContext && this.outputContext.currentTime >= this.nextPlayTime - 0.08) {
        this.callbacks.onAgentSpeaking?.(false);
      }
    };
  }

  private stopQueuedOutput() {
    for (const source of this.outputSources) {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
      try {
        source.disconnect();
      } catch {
        // Source may already be disconnected.
      }
    }
    this.outputSources.clear();
    this.nextPlayTime = this.outputContext?.currentTime ?? 0;
    this.callbacks.onAgentSpeaking?.(false);
  }

  private updateUserActivity(input: Float32Array): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    const rms = this.rms(input);
    const now = performance.now();
    const speechThreshold = Math.max(0.012, Math.min(0.04, this.noiseFloor * 3.2));
    const silenceMs = 350;

    if (!this.isUserSpeaking && rms < speechThreshold) {
      this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
    }

    if (rms >= speechThreshold) {
      this.lastVoiceAt = now;
      if (!this.isUserSpeaking) {
        this.isUserSpeaking = true;
        this.stopQueuedOutput();
        this.callbacks.onUserSpeaking?.(true);
        return true;
      }
      return false;
    }

    if (this.isUserSpeaking && now - this.lastVoiceAt > silenceMs) {
      this.endUserActivity();
    }
    return false;
  }

  private endUserActivity() {
    if (!this.isUserSpeaking) return;
    this.isUserSpeaking = false;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "audioStreamEnd" }));
    }
    this.callbacks.onUserSpeaking?.(false);
  }

  private cleanup() {
    this.endUserActivity();
    this.stopQueuedOutput();
    this.processor?.disconnect();
    this.inputMonitor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.inputContext?.close();
    this.outputContext?.close();
    if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
    this.processor = null;
    this.inputMonitor = null;
    this.source = null;
    this.stream = null;
    this.inputContext = null;
    this.outputContext = null;
    this.ws = null;
    this.nextPlayTime = 0;
    this.recentAudioChunks.clear();
    this.pendingInputFrames = [];
    this.isUserSpeaking = false;
    this.lastVoiceAt = 0;
    this.workletUrl = null;
    this.noiseFloor = 0.006;
    this.callbacks.onAgentSpeaking?.(false);
  }

  private rms(input: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < input.length; i += 1) {
      sum += input[i] * input[i];
    }
    return Math.sqrt(sum / input.length);
  }

  private resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const outputLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i += 1) {
      const position = i * ratio;
      const before = Math.floor(position);
      const after = Math.min(before + 1, input.length - 1);
      const weight = position - before;
      output[i] = input[before] * (1 - weight) + input[after] * weight;
    }
    return output;
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return buffer;
  }

  private pcm16ToFloat32(bytes: Uint8Array): Float32Array {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const output = new Float32Array(bytes.byteLength / 2);

    for (let i = 0; i < output.length; i += 1) {
      const value = view.getInt16(i * 2, true);
      output[i] = value / (value < 0 ? 0x8000 : 0x7fff);
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
