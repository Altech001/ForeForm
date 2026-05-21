import { useEffect, useRef } from "react";
import TranscriptMessage from "./TranscriptMessage";
import TypingIndicator from "./TypingIndicator";

/**
 * @param {{ messages: Array<{ id: string, role: 'agent'|'user', text: string }>, currentlyRevealing: string | null, showTyping: boolean, endedLabel?: string }} props
 */
export default function TranscriptArea({ messages, currentlyRevealing, showTyping, endedLabel }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showTyping, endedLabel]);

  return (
    <section className="transcript-area" aria-label="Call transcript">
      {messages.map((message) => (
        <TranscriptMessage
          key={message.id}
          role={message.role}
          text={message.text}
          isRevealing={currentlyRevealing === message.id}
        />
      ))}
      {showTyping && <TypingIndicator />}
      {endedLabel && <div className="transcript-area__ended">{endedLabel}</div>}
      <div ref={bottomRef} />
    </section>
  );
}
