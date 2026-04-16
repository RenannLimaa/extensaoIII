export function TypingIndicator() {
  return (
    <div className="msg assistant" aria-live="polite">
      <div className="msg-avatar is-assistant" aria-hidden>🤖</div>
      <div className="msg-body">
        <span className="msg-author">ENEMBot</span>
        <div className="typing">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}
