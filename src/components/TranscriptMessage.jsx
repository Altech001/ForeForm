import { useEffect, useMemo, useState } from "react";

const WORD_DELAY_MS = 75;

/**
 * @param {{ role: 'agent'|'user', text: string, isRevealing: boolean }} props
 */
export default function TranscriptMessage({ role, text, isRevealing }) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [visibleWords, setVisibleWords] = useState(isRevealing ? 0 : words.length);
  const [activeWord, setActiveWord] = useState(-1);

  useEffect(() => {
    if (!isRevealing) {
      setVisibleWords(words.length);
      setActiveWord(-1);
      return undefined;
    }

    setVisibleWords(0);
    setActiveWord(-1);

    const timers = words.map((_, index) => (
      setTimeout(() => {
        setVisibleWords(index + 1);
        setActiveWord(index);
        setTimeout(() => setActiveWord((current) => (current === index ? -1 : current)), 180);
      }, index * WORD_DELAY_MS)
    ));

    return () => timers.forEach(clearTimeout);
  }, [isRevealing, words]);

  return (
    <div className={`transcript-message transcript-message--${role}`}>
      <div className="transcript-message__label">{role === "agent" ? "ARIA" : "YOU"}</div>
      <div className="transcript-message__bubble">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={[
              "transcript-message__word",
              index < visibleWords ? "transcript-message__word--visible" : "",
              index === activeWord ? "transcript-message__word--active" : "",
            ].join(" ")}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
