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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 relative shadow-xl text-text font-sans flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-xl font-bold text-text">Settings</h2>
          <button 
            type="button" 
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary hover:text-text p-1 flex items-center justify-center transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            LLM: <strong className="text-text font-semibold">{isGroq ? "Groq" : "Google Gemini"}</strong>
          </p>
          <p className="text-sm text-text-secondary">
            Backend:{" "}
            <span className={`font-semibold ${backendOk ? "text-accent" : "text-error"}`}>
              {backendOk === null ? "…" : backendOk ? "Connected" : "Offline"}
            </span>
          </p>
          <p className="text-sm text-text-secondary">
            Server API key:{" "}
            <span className={`font-semibold ${serverHasApiKey ? "text-accent" : "text-error"}`}>
              {serverHasApiKey
                ? `Set in backend/.env (${isGroq ? "GROQ_API_KEY" : "GEMINI_API_KEY"})`
                : "Not set in .env"}
            </span>
          </p>
          
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
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
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </label>
          
          {onClearApiKey && apiKey && (
            <button 
              type="button" 
              className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text text-sm font-semibold rounded-lg cursor-pointer transition-colors mt-1" 
              onClick={onClearApiKey}
            >
              Clear local key — use server .env
            </button>
          )}
          
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Model
            <input
              type="text"
              placeholder={defaultModel}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
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
