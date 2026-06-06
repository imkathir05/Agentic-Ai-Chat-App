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
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border ${
              msg.role === "user" 
                ? "bg-accent text-white border-transparent" 
                : "bg-composer-bg text-text-secondary border-border"
            }`}>
              {msg.role === "user" ? "You" : "AI"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px] text-text">{msg.content}</div>
              {msg.toolTrace && msg.toolTrace.length > 0 && (
                <div className="mt-3 text-xs flex flex-col gap-2">
                  {msg.toolTrace.map((t, j) => (
                    <details key={j} className="border border-border rounded-xl p-2.5 bg-surface shadow-sm">
                      <summary className="cursor-pointer flex items-center gap-2 font-medium text-text select-none outline-none">
                        <span className={`w-2 h-2 rounded-full ${t.status === "success" ? "bg-accent" : "bg-error"}`} />
                        <span className="text-text-secondary">Called tool:</span>
                        <code className="px-1.5 py-0.5 bg-surface-hover rounded font-mono text-[11px] text-text">{t.tool}</code>
                      </summary>
                      <pre className="mt-2.5 text-[11px] font-mono overflow-x-auto bg-surface-hover p-3 rounded-lg border border-border/50 text-text-secondary whitespace-pre-wrap">{t.result}</pre>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border bg-composer-bg text-text-secondary border-border">
              AI
            </div>
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
