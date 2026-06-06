import { useRef, useState } from "react";
import type { Tool } from "../api";

interface Props {
  loading: boolean;
  tools: Tool[];
  agentName?: string;
  centered?: boolean;
  onSend: (text: string) => void;
}

const QUICK_ACTIONS = [
  { label: "Calculate", icon: "calc", prompt: "What is sqrt(144) + 25?" },
  { label: "Current time", icon: "time", prompt: "What is the current time in UTC?" },
  { label: "Call an API", icon: "api", prompt: "Use an API tool to fetch post id 1" },
];

export default function Composer({
  loading,
  tools,
  agentName,
  centered = false,
  onSend,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const submit = () => {
    const text = inputRef.current?.value.trim();
    if (!text || loading) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
    setMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const enabledTools = tools.filter((t) => t.enabled);

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 pb-6 pt-4 ${centered ? "flex flex-col items-center justify-center text-center pb-8" : ""}`}>
      {centered && (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-text">
            {agentName ? `Chat with ${agentName}` : "Where should we begin?"}
          </h1>
          {agentName && (
            <p className="text-sm text-text-secondary mt-1.5">
              This agent only uses its assigned tools and instructions.
            </p>
          )}
        </div>
      )}

      <div className="flex items-end gap-1 bg-composer-bg border border-composer-border rounded-3xl p-2.5 shadow-custom w-full max-w-3xl">
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded-full text-text-secondary hover:bg-surface-hover hover:text-text disabled:opacity-55 disabled:cursor-not-allowed shrink-0 transition-all cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Tools"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-72 max-h-60 overflow-y-auto bg-sidebar border border-border rounded-xl shadow-lg p-2 z-50 text-left">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-2 py-1">Available tools</p>
              {enabledTools.length === 0 ? (
                <p className="text-xs text-text-secondary px-2.5 py-1.5">No tools enabled</p>
              ) : (
                enabledTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="flex flex-col items-start w-full p-2.5 rounded-lg text-left hover:bg-surface-hover cursor-pointer transition-colors"
                    onClick={() => {
                      onSend(`Use the ${t.name} tool: `);
                      setMenuOpen(false);
                    }}
                  >
                    <strong className="text-xs font-semibold text-text">{t.name}</strong>
                    <span className="text-[10px] text-text-secondary truncate w-full mt-0.5">{t.description.slice(0, 60)}…</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <textarea
          ref={inputRef}
          className="flex-1 border-none bg-transparent resize-none min-h-[24px] max-h-48 py-2 px-1 text-base text-text placeholder-text-secondary outline-none focus:outline-none"
          placeholder="Ask anything"
          rows={1}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <div className="flex items-center gap-1">
          <button 
            type="button" 
            className="p-2 rounded-full text-text-secondary hover:bg-surface-hover hover:text-text disabled:opacity-55 disabled:cursor-not-allowed shrink-0 transition-all cursor-pointer" 
            title="Voice" 
            disabled
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9v3h-2v-3h2z" />
            </svg>
          </button>
          <button
            type="button"
            className="p-2 rounded-full bg-text text-bg disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
            onClick={submit}
            disabled={loading}
            title="Send"
          >
            {loading ? (
              <span className="w-4.5 h-4.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin shrink-0" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V4m-7 7l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {centered && (
        <div className="flex flex-wrap gap-2.5 justify-center mt-6">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-full text-sm font-medium text-text transition-all shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => onSend(a.prompt)}
              disabled={loading}
            >
              <QuickIcon type={a.icon} />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickIcon({ type }: { type: string }) {
  if (type === "calc")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h8M8 14h4" />
      </svg>
    );
  if (type === "time")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
