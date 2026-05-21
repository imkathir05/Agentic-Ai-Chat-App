import { useEffect, useRef } from "react";
import type { Message } from "../types/chat";

interface Props {
  messages: Message[];
  loading: boolean;
}

export default function ChatMessages({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="messages-scroll">
      <div className="messages-inner">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === "user" ? "You" : "AI"}
            </div>
            <div className="msg-body">
              <div className="msg-content">{msg.content}</div>
              {msg.toolTrace && msg.toolTrace.length > 0 && (
                <div className="tool-trace">
                  {msg.toolTrace.map((t, j) => (
                    <details key={j} className="trace-item">
                      <summary>
                        <span className={`dot ${t.status}`} />
                        Called <code>{t.tool}</code>
                      </summary>
                      <pre>{t.result}</pre>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-row assistant">
            <div className="msg-avatar">AI</div>
            <div className="msg-body">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
