const bars = Array.from({ length: 14 }, (_, index) => index);

/**
 * @param {{ speaking: boolean, muted: boolean }} props
 */
export default function Waveform({ speaking, muted }) {
  const active = speaking && !muted;

  return (
    <div className={`waveform ${active ? "waveform--active" : "waveform--flat"}`} aria-hidden="true">
      {bars.map((bar) => (
        <span
          key={bar}
          className="waveform__bar"
          style={{ "--bar-delay": `${bar * 70}ms` }}
        />
      ))}
    </div>
  );
}
