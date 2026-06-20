import React, { useEffect, useRef, useState } from "react";
import type { Message } from "../types/chat";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="my-3 border border-border rounded-xl overflow-hidden bg-zinc-900 text-zinc-100 font-mono text-[13px] shadow-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-950 border-b border-zinc-800/80 text-xs text-zinc-400 font-sans select-none">
        <span className="font-medium tracking-wide uppercase text-[10px] text-zinc-500">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer border-none bg-transparent text-zinc-400"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[11px] font-medium text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="text-[11px] font-medium">Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono">{code.trim()}</pre>
    </div>
  );
}

function renderTextWithInlineFormatting(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 bg-surface-hover rounded font-mono text-[13px] border border-border text-accent">
          {part.slice(1, -1)}
        </code>
      );
    }
    
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={index}>
        {boldParts.map((bp, bidx) => {
          if (bp.startsWith("**") && bp.endsWith("**")) {
            return <strong key={bidx} className="font-semibold text-text">{bp.slice(2, -2)}</strong>;
          }
          return renderTextWithImages(bp, `${index}-${bidx}`);
        })}
      </React.Fragment>
    );
  });
}

function renderTextWithImages(text: string, keyPrefix: string) {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const alt = match[1] || "Attached image";
    const src = match[2];
    nodes.push(
      <img
        key={`${keyPrefix}-img-${match.index}`}
        src={src}
        alt={alt}
        className="my-2 max-w-full max-h-80 rounded-xl border border-border object-contain"
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  if (nodes.length === 0) {
    return text;
  }

  return <React.Fragment key={keyPrefix}>{nodes}</React.Fragment>;
}

function parseMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : "";
      const code = match ? match[2] : part.slice(3, -3);
      return { type: "code", language, content: code, key: index };
    }
    return { type: "text", content: part, key: index };
  });
}

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
              <div className="break-words leading-relaxed text-[15px] text-text">
                {parseMarkdown(msg.content).map((part) => {
                  if (part.type === "code") {
                    return <CodeBlock key={part.key} code={part.content} language={part.language} />;
                  }
                  return (
                    <span key={part.key} className="whitespace-pre-wrap">
                      {renderTextWithInlineFormatting(part.content)}
                    </span>
                  );
                })}
              </div>
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
