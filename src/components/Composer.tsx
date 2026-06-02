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
    <div className={`composer-wrap ${centered ? "centered" : ""}`}>
      {centered && (
        <div className="welcome-block">
          <h1 className="welcome-title">
            {agentName ? `Chat with ${agentName}` : "Where should we begin?"}
          </h1>
          {agentName && (
            <p className="welcome-subtitle">
              This agent only uses its assigned tools and instructions.
            </p>
          )}
        </div>
      )}

      <div className="composer-box">
        <div className="composer-menu-wrap">
          <button
            type="button"
            className="composer-icon-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Tools"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {menuOpen && (
            <div className="tools-dropdown">
              <p className="dropdown-title">Available tools</p>
              {enabledTools.length === 0 ? (
                <p className="dropdown-muted">No tools enabled</p>
              ) : (
                enabledTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      onSend(`Use the ${t.name} tool: `);
                      setMenuOpen(false);
                    }}
                  >
                    <strong>{t.name}</strong>
                    <span>{t.description.slice(0, 60)}…</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <textarea
          ref={inputRef}
          className="composer-input"
          placeholder="Ask anything"
          rows={1}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <div className="composer-actions">
          <button type="button" className="composer-icon-btn" title="Voice" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9v3h-2v-3h2z" />
            </svg>
          </button>
          <button
            type="button"
            className="composer-send"
            onClick={submit}
            disabled={loading}
            title="Send"
          >
            {loading ? (
              <span className="send-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V4m-7 7l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {centered && (
        <div className="quick-actions">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="quick-action"
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
