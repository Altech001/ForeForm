import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

/**
 * @param {{ muted: boolean, speakerOn: boolean, ended: boolean, onToggleMute: () => void, onEnd: () => void, onToggleSpeaker: () => void }} props
 */
export default function CallControls({
  muted,
  speakerOn,
  ended,
  onToggleMute,
  onEnd,
  onToggleSpeaker,
}) {
  return (
    <div className="call-controls" aria-label="Call controls">
      <button
        type="button"
        className={`call-controls__button ${muted ? "call-controls__button--active" : ""}`}
        onClick={onToggleMute}
        disabled={ended}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      <button
        type="button"
        className="call-controls__button call-controls__button--end"
        onClick={onEnd}
        disabled={ended}
        aria-label="End call"
      >
        <PhoneOff size={26} />
      </button>

      <button
        type="button"
        className={`call-controls__button ${!speakerOn ? "call-controls__button--active" : ""}`}
        onClick={onToggleSpeaker}
        disabled={ended}
        aria-label={speakerOn ? "Turn speaker off" : "Turn speaker on"}
      >
        {speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
}
