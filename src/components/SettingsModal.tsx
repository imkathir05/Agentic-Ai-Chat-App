interface Props {
  open: boolean;
  provider: "groq" | "gemini";
  apiKey: string;
  model: string;
  backendOk: boolean | null;
  serverHasApiKey?: boolean;
  onClose: () => void;
  onApiKeyChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onClearApiKey?: () => void;
}

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

export default function SettingsModal({
  open,
  provider,
  apiKey,
  model,
  backendOk,
  serverHasApiKey = false,
  onClose,
  onApiKeyChange,
  onModelChange,
  onClearApiKey,
}: Props) {
  if (!open) return null;

  const isGroq = provider === "groq";
  const modelList = isGroq ? GROQ_MODELS : GEMINI_MODELS;
  const defaultModel = isGroq ? "llama-3.3-70b-versatile" : "gemini-2.5-flash";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Settings</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          <p className="modal-status">
            LLM: <strong>{isGroq ? "Groq" : "Google Gemini"}</strong>
          </p>
          <p className="modal-status">
            Backend:{" "}
            <span className={backendOk ? "ok" : "err"}>
              {backendOk === null ? "…" : backendOk ? "Connected" : "Offline"}
            </span>
          </p>
          <p className="modal-status">
            Server API key:{" "}
            <span className={serverHasApiKey ? "ok" : "err"}>
              {serverHasApiKey
                ? `Set in backend/.env (${isGroq ? "GROQ_API_KEY" : "GEMINI_API_KEY"})`
                : "Not set in .env"}
            </span>
          </p>
          <label>
            {isGroq ? "Groq API Key (optional override)" : "Gemini API Key (optional override)"}
            <input
              type="password"
              placeholder={
                serverHasApiKey
                  ? "Leave empty to use backend .env key"
                  : isGroq
                    ? "gsk_… or set GROQ_API_KEY in backend/.env"
                    : "AIza… or set GEMINI_API_KEY in backend/.env"
              }
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </label>
          {onClearApiKey && apiKey && (
            <button type="button" className="btn-secondary" onClick={onClearApiKey}>
              Clear local key — use server .env
            </button>
          )}
          <label>
            Model
            <input
              type="text"
              placeholder={defaultModel}
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              list="llm-models"
            />
            <datalist id="llm-models">
              {modelList.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
        </div>
      </div>
    </div>
  );
}
