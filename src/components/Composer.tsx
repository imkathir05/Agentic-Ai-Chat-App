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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const submit = async () => {
    let text = inputRef.current?.value.trim() || "";
    if (!text && !selectedFile) return;
    if (loading) return;

    if (selectedFile) {
      if (
        selectedFile.type.startsWith("text/") ||
        selectedFile.name.endsWith(".txt") ||
        selectedFile.name.endsWith(".md") ||
        selectedFile.name.endsWith(".json") ||
        selectedFile.name.endsWith(".js") ||
        selectedFile.name.endsWith(".py") ||
        selectedFile.name.endsWith(".ts") ||
        selectedFile.name.endsWith(".tsx")
      ) {
        try {
          const content = await selectedFile.text();
          text = `[File: ${selectedFile.name}]\n\`\`\`\n${content}\n\`\`\`\n\n${text}`;
        } catch (e) {
          text = `[File: ${selectedFile.name} (Error reading content)]\n\n${text}`;
        }
      } else {
        text = `[File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)]\n\n${text}`;
      }
    }

    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
    setSelectedFile(null);
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
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-72 max-h-60 overflow-y-auto bg-sidebar border border-border rounded-xl shadow-lg p-2 z-50 text-left flex flex-col gap-1">
              <button
                type="button"
                className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-left hover:bg-surface-hover cursor-pointer transition-colors border-none bg-transparent"
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenuOpen(false);
                }}
              >
                <div className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <strong className="text-xs font-semibold text-text">Upload File</strong>
                  <span className="text-[10px] text-text-secondary mt-0.5">Attach documents, logs, or code</span>
                </div>
              </button>

              <div className="border-t border-border/50 my-1" />

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

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
            }
            e.target.value = "";
          }}
        />

        <div className="flex-1 flex flex-col items-start gap-1.5 min-w-0">
          {selectedFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover border border-border rounded-xl text-xs font-medium text-text select-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="truncate max-w-[240px]" title={selectedFile.name}>{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-text-secondary hover:text-text cursor-pointer p-0.5 rounded hover:bg-surface-hover/80 border-none bg-transparent"
                title="Remove file"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            className="w-full border-none bg-transparent resize-none min-h-[24px] max-h-48 py-2 px-1 text-base text-text placeholder-text-secondary outline-none focus:outline-none"
            placeholder="Ask anything"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

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
