export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator__label">ARIA</div>
      <div className="typing-indicator__bubble" aria-label="Aria is typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
