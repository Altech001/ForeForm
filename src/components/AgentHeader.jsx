import { Bot } from "lucide-react";

/**
 * @param {{ ended: boolean, timer: string }} props
 */
export default function AgentHeader({ ended, timer }) {
  return (
    <header className="agent-header">
      <div className={`agent-header__status ${ended ? "agent-header__status--ended" : ""}`}>
        <span>●</span> {ended ? "Ended" : "Live"}
      </div>

      <div className="agent-header__avatar-wrap">
        {!ended && (
          <>
            <span className="agent-header__ring agent-header__ring--one" />
            <span className="agent-header__ring agent-header__ring--two" />
          </>
        )}
        <div className="agent-header__avatar">
          <Bot size={34} strokeWidth={1.8} />
        </div>
      </div>

      <div className="agent-header__identity">
        <h1>Aria</h1>
        <p>AI Support Agent</p>
      </div>

      <time className="agent-header__timer">{timer}</time>
    </header>
  );
}
