import { useCallback, useEffect, useRef, useState } from "react";
import {
  authMe,
  clearStoredAccessToken,
  getWsAuthToken,
  deleteAgent,
  deleteTool,
  fetchAgents,
  fetchTools,
  healthCheck,
  logout,
  getChatSocketUrl,
  type Agent,
  type Tool,
  type User,
} from "./api";
import AuthModal from "./components/AuthModal";
import LandingPage from "./components/LandingPage";
import {
  createSession,
  loadActiveAgentId,
  loadActiveId,
  loadSessions,
  normalizeSessions,
  saveActiveAgentId,
  saveActiveId,
  saveSessions,
  sessionDisplayTitle,
  titleFromMessage,
  workspaceTitleForAgent,
  workspaceTitleGeneral,
  type ChatSession,
} from "./chatStorage";
import type { Message } from "./types/chat";
import { sanitizeApiKey } from "./llmKey";
import AgentInstructionsPanel from "./components/AgentInstructionsPanel";
import AgentsPage from "./components/AgentsPage";
import ChatMessages from "./components/ChatMessages";
import Composer from "./components/Composer";
import SettingsModal from "./components/SettingsModal";
import Sidebar, { type AppView } from "./components/Sidebar";
import CreateToolModal from "./components/CreateToolModal";
import EditToolModal from "./components/EditToolModal";
import AgentSetupModal from "./components/AgentSetupModal";
import ConfirmModal from "./components/ConfirmModal";
import ToolsPage from "./components/ToolsPage";
import { applyTheme, loadTheme, type Theme } from "./theme";

const STORAGE_KEY = "agentic-ai-settings";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_HUGGINGFACE_MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct";

type LlmProvider = "groq" | "gemini" | "huggingface";

function defaultModel(provider: LlmProvider): string {
  if (provider === "gemini") return DEFAULT_GEMINI_MODEL;
  if (provider === "huggingface") return DEFAULT_HUGGINGFACE_MODEL;
  return DEFAULT_GROQ_MODEL;
}

function normalizeModel(model: string | undefined, provider: LlmProvider): string {
  if (!model?.trim()) return defaultModel(provider);
  const m = model.trim();
  if (provider === "gemini") {
    return m.startsWith("gemini-") ? m : DEFAULT_GEMINI_MODEL;
  }
  if (provider === "groq") {
    if (m.startsWith("gemini-") || m.includes("/")) {
      return DEFAULT_GROQ_MODEL;
    }
  }
  if (provider === "huggingface") {
    if (!m.includes("/")) {
      return DEFAULT_HUGGINGFACE_MODEL;
    }
  }
  return m;
}

const GROQ_MODEL_OPTIONS = [
  "llama-3.3-70b-versatile",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

const GEMINI_MODEL_OPTIONS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

const HUGGINGFACE_MODEL_OPTIONS = [
  "Qwen/Qwen2.5-Coder-32B-Instruct",
  "meta-llama/Llama-3.3-70B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
  "meta-llama/Meta-Llama-3-8B-Instruct",
];

/** Sent when opening a new agent workspace to run its instructions. */
const AGENT_RUN_KICKOFF =
  "Begin. Follow your instructions and execute your task now.";

function loadSettings(provider: LlmProvider) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as {
        apiKey?: string;
        geminiApiKey?: string;
        huggingfaceApiKey?: string;
        model?: string;
        groqModel?: string;
        geminiModel?: string;
        huggingfaceModel?: string;
      };
      let key = data.apiKey;
      let modelName = data.groqModel ?? data.model;
      if (provider === "gemini") {
        key = data.geminiApiKey;
        modelName = data.geminiModel ?? data.model;
      } else if (provider === "huggingface") {
        key = data.huggingfaceApiKey;
        modelName = data.huggingfaceModel ?? data.model;
      }

      return {
        apiKey: sanitizeApiKey(key, provider),
        model: normalizeModel(modelName, provider),
      };
    }
  } catch {
    /* ignore */
  }
  return { model: defaultModel(provider) };
}

const PROVIDERS = [
  {
    id: "groq" as const,
    name: "Groq",
    models: GROQ_MODEL_OPTIONS,
  },
  {
    id: "gemini" as const,
    name: "Google Gemini",
    models: GEMINI_MODEL_OPTIONS,
  },
  {
    id: "huggingface" as const,
    name: "Hugging Face",
    models: HUGGINGFACE_MODEL_OPTIONS,
  },
];

function ModelSelector({
  model,
  provider,
  onChange,
}: {
  model: string;
  provider: LlmProvider;
  onChange: (m: string, p: LlmProvider) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`flex items-center gap-2 bg-transparent border-none text-lg font-semibold px-2 py-1.5 cursor-pointer text-text rounded-lg hover:bg-surface-hover transition-colors ${open ? "bg-surface-hover" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs text-text-secondary uppercase tracking-wider mr-1 px-1.5 py-0.5 rounded bg-surface border border-border">
          {provider === "gemini" ? "Gemini" : provider === "huggingface" ? "HF" : "Groq"}
        </span>
        <span className="max-w-[200px] truncate">{model}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`text-text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[320px] bg-surface border border-border rounded-xl shadow-lg p-2.5 z-50 flex flex-col gap-2 max-h-[480px] overflow-y-auto">
          {PROVIDERS.map((group) => (
            <div key={group.id} className="flex flex-col">
              <div className="px-3.5 py-1 text-[11px] font-bold text-text-secondary uppercase tracking-wider bg-surface-hover/30 rounded-md mb-1">
                {group.name}
              </div>
              {group.models.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`flex items-center justify-between w-full px-3.5 py-2 border-none bg-transparent text-text text-[14px] font-medium text-left rounded-lg cursor-pointer hover:bg-surface-hover transition-colors ${model === m && provider === group.id ? "text-accent" : ""}`}
                  onClick={(e) => {
                    console.log("ModelSelector button clicked:", m, "provider:", group.id);
                    e.stopPropagation();
                    onChange(m, group.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate mr-2">{m}</span>
                  {model === m && provider === group.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [provider, setProvider] = useState<LlmProvider>("groq");
  const saved = loadSettings(provider);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    normalizeSessions(loadSessions())
  );
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId());
  const [apiKey, setApiKey] = useState(saved.apiKey ?? "");
  const [model, setModel] = useState(saved.model);
  console.log("App render state:", { provider, model, apiKeyLength: apiKey?.length });


  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(() =>
    loadActiveAgentId()
  );
  const [agentSetupOpen, setAgentSetupOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentSetupTab, setAgentSetupTab] = useState<
    "details" | "instructions" | "tools"
  >("details");
  const [appView, setAppView] = useState<AppView>("chat");
  const [startingAgentId, setStartingAgentId] = useState<string | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleteAgentConfirm, setDeleteAgentConfirm] = useState<Agent | null>(
    null
  );
  const [deleteToolConfirm, setDeleteToolConfirm] = useState<Tool | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [serverHasApiKey, setServerHasApiKey] = useState(false);
  const [chatError, setChatError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [editToolOpen, setEditToolOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim() || ""
  );

  const activeSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (activeSocketRef.current) {
        activeSocketRef.current.close();
      }
    };
  }, []);

  const handleThemeChange = useCallback((next: Theme) => {
    setTheme(next);
    applyTheme(next);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { user: u } = await authMe();
      setUser(u);
      setLoginOpen(false);
    } catch {
      clearStoredAccessToken();
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const openLogin = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setLoginOpen(true);
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    const loaded = loadSessions();
    const normalized = normalizeSessions(loaded);
    const titlesChanged = normalized.some(
      (s, i) => s.title !== loaded[i]?.title
    );
    if (titlesChanged) {
      saveSessions(normalized);
      setSessions(normalized);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    setLoginOpen(false);
  };

  const activeSession =
    sessions.find((s) => s.id === activeId) ??
    (sessions[0] ?? null);
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (provider === "gemini") {
        data.geminiApiKey = apiKey;
        data.geminiModel = model;
      } else if (provider === "huggingface") {
        data.huggingfaceApiKey = apiKey;
        data.huggingfaceModel = model;
      } else {
        data.apiKey = apiKey;
        data.groqModel = model;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [apiKey, model, provider]);

  const persistSessions = useCallback((next: ChatSession[]) => {
    const normalized = normalizeSessions(next);
    setSessions(normalized);
    saveSessions(normalized);
  }, []);

  const openCreateTool = useCallback(() => {
    setCreateToolOpen(true);
  }, []);

  const openEditTool = useCallback((tool: Tool) => {
    setEditingTool(tool);
    setEditToolOpen(true);
  }, []);

  const refreshTools = useCallback(async () => {
    try {
      setTools(await fetchTools());
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    try {
      const list = await fetchAgents();
      setAgents(list);
      if (activeAgentId && !list.some((a) => a.id === activeAgentId)) {
        setActiveAgentId(null);
        saveActiveAgentId(null);
      }
    } catch {
      /* ignore */
    }
  }, [activeAgentId]);

  const activeAgent = activeAgentId
    ? agents.find((a) => a.id === activeAgentId) ?? null
    : null;

  /** Agent tied to the current workspace only (not global selection). */
  const sessionAgent = activeSession?.agentId
    ? agents.find((a) => a.id === activeSession.agentId) ?? null
    : null;

  const agentTools = sessionAgent
    ? tools.filter((t) => sessionAgent.tool_ids.includes(t.id) && t.enabled)
    : tools.filter((t) => t.enabled);

  useEffect(() => {
    healthCheck()
      .then((h) => {
        setBackendOk(true);
        setServerHasApiKey(Boolean(h.has_api_key));
        const p = (h.provider === "gemini" ? "gemini" : h.provider === "huggingface" ? "huggingface" : "groq") as LlmProvider;
        setProvider(p);
        const saved = loadSettings(p);
        setApiKey(saved.apiKey ?? "");
        setModel(saved.model || normalizeModel(h.model, p));
        if (h.google_client_id) setGoogleClientId(h.google_client_id);
      })
      .catch(() => {
        setBackendOk(false);
        setServerHasApiKey(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshTools();
    refreshAgents();
  }, [user, refreshTools, refreshAgents]);

  useEffect(() => {
    if (activeId != null || sessions.length === 0) return;
    const pick = sessions[0] ?? null;
    if (pick) {
      setActiveId(pick.id);
      saveActiveId(pick.id);
    }
  }, [activeId, sessions]);

  const sendMessage = useCallback(
    async (
      text: string,
      opts?: {
        agent?: Agent;
        sessionId?: string;
        title?: string;
        sessionsList?: ChatSession[];
      }
    ) => {
      let list = opts?.sessionsList ?? sessions;
      let sessionId = opts?.sessionId ?? activeId;
      const sessionRowEarly = sessionId
        ? list.find((s) => s.id === sessionId)
        : undefined;
      const agent =
        opts?.agent ??
        (sessionRowEarly?.agentId
          ? agents.find((a) => a.id === sessionRowEarly.agentId)
          : undefined);
      let currentMessages =
        sessionId != null
          ? (list.find((s) => s.id === sessionId)?.messages ?? [])
          : messages;

      if (!sessionId) {
        sessionId = "session-" + Math.random().toString(36).substring(2, 9);
        currentMessages = [];
        setActiveId(sessionId);
        saveActiveId(sessionId);
      }

      const userMsg: Message = { role: "user", content: text };
      const nextMessages = [...currentMessages, userMsg];
      const sessionRow = list.find((s) => s.id === sessionId);
      const resolvedTitle =
        opts?.title ??
        (currentMessages.length === 0 || sessionRow?.title.startsWith("New chat")
          ? titleFromMessage(text)
          : undefined);

      const updateSessionMessages = (msgs: Message[], title?: string) => {
        setSessions((prevSessions) => {
          let found = false;
          let next = prevSessions.map((s) => {
            if (s.id === sessionId) {
              found = true;
              return {
                ...s,
                messages: msgs,
                title: title ?? s.title,
                updatedAt: Date.now(),
              };
            }
            return s;
          });

          if (!found) {
            const newS: ChatSession = {
              id: sessionId!,
              agentId: agent?.id,
              messages: msgs,
              title: title || (agent ? workspaceTitleForAgent(agent.name, prevSessions, agent.id) : workspaceTitleGeneral(prevSessions)),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            next = [newS, ...prevSessions];
          }

          const normalized = normalizeSessions(next);
          saveSessions(normalized);
          return normalized;
        });
      };

      updateSessionMessages(nextMessages, resolvedTitle);
      setLoading(true);
      setChatError("");

      if (activeSocketRef.current) {
        activeSocketRef.current.close();
      }

      try {
        const wsToken = await getWsAuthToken();
        const wsUrl = getChatSocketUrl();
        const socket = new WebSocket(wsUrl);
        activeSocketRef.current = socket;

        let currentAssistantContent = "";
        let currentToolTrace: any[] = [];

        socket.onopen = () => {
          socket.send(JSON.stringify({ type: "auth", token: wsToken }));
          const payload = {
            type: "chat",
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            api_key: sanitizeApiKey(apiKey, provider) || undefined,
            model: model || undefined,
            provider: provider,
            agent_id: agent?.id,
          };
          socket.send(JSON.stringify(payload));
        };

        socket.onmessage = (event) => {
          try {
            const chunk = JSON.parse(event.data);

            if (chunk.type === "error") {
              if (chunk.code === "unauthorized") {
                setChatError(
                  "Chat auth failed. Check Render: same DJANGO_SECRET_KEY on API + WebSocket, DB_* vars on WebSocket, then redeploy both."
                );
              } else {
                setChatError(chunk.message || "An error occurred.");
              }
              socket.close();
              return;
            }

            if (chunk.type === "content") {
              currentAssistantContent += chunk.delta;
              const updatedAssistantMsg: Message = {
                role: "assistant",
                content: currentAssistantContent,
                toolTrace: [...currentToolTrace],
              };
              updateSessionMessages([...nextMessages, updatedAssistantMsg]);
            } else if (chunk.type === "tool_start") {
              currentToolTrace.push({
                tool: chunk.tool,
                arguments: chunk.arguments,
                result: "Running...",
                status: "running",
                call_id: chunk.call_id,
              });
              const updatedAssistantMsg: Message = {
                role: "assistant",
                content: currentAssistantContent,
                toolTrace: [...currentToolTrace],
              };
              updateSessionMessages([...nextMessages, updatedAssistantMsg]);
            } else if (chunk.type === "tool_end") {
              currentToolTrace = currentToolTrace.map((t) =>
                t.call_id === chunk.call_id
                  ? { ...t, result: chunk.result, status: chunk.status }
                  : t
              );
              const updatedAssistantMsg: Message = {
                role: "assistant",
                content: currentAssistantContent,
                toolTrace: [...currentToolTrace],
              };
              updateSessionMessages([...nextMessages, updatedAssistantMsg]);
            } else if (chunk.type === "done") {
              const finalAssistantMsg: Message = {
                role: "assistant",
                content: chunk.message || currentAssistantContent,
                toolTrace: chunk.tool_trace || currentToolTrace,
              };
              updateSessionMessages([...nextMessages, finalAssistantMsg]);
              socket.close();
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
          setChatError("WebSocket connection failed.");
          setLoading(false);
        };

        socket.onclose = () => {
          setLoading(false);
          if (activeSocketRef.current === socket) {
            activeSocketRef.current = null;
          }
        };
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401 || err.message === "Unauthorized") {
          setChatError("Session expired. Please log in again.");
          setLoginOpen(true);
          setAuthMode("login");
        } else {
          setChatError(e instanceof Error ? e.message : String(e));
        }
        setLoading(false);
      }
    },
    [
      activeId,
      agents,
      apiKey,
      messages,
      model,
      provider,
      sessions,
      setUser,
      setSessions,
      setActiveId,
      setChatError,
      setLoading,
    ]
  );

  const startWorkWithAgent = useCallback(
    async (agent: Agent) => {
      if (startingAgentId) return;
      setStartingAgentId(agent.id);
      setChatError("");

      const title = workspaceTitleForAgent(agent.name, sessions, agent.id);
      const workspace = createSession(agent.id, title);
      const nextSessions = [workspace, ...sessions];
      persistSessions(nextSessions);
      setActiveAgentId(agent.id);
      saveActiveAgentId(agent.id);
      setActiveId(workspace.id);
      saveActiveId(workspace.id);
      setAppView("chat");

      const hasInstructions = Boolean(agent.system_prompt?.trim());
      if (hasInstructions) {
        await sendMessage(AGENT_RUN_KICKOFF, {
          agent,
          sessionId: workspace.id,
          title,
          sessionsList: nextSessions,
        });
      }

      setStartingAgentId(null);
    },
    [sessions, persistSessions, sendMessage, startingAgentId]
  );

  const handleNewChat = () => {
    const title = workspaceTitleGeneral(sessions);
    const s = createSession(undefined, title);
    const next = [s, ...sessions];
    persistSessions(next);
    setActiveAgentId(null);
    saveActiveAgentId(null);
    setActiveId(s.id);
    saveActiveId(s.id);
    setAppView("chat");
    setChatError("");
  };

  const handleSelectWorkspace = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session?.agentId) {
        setActiveAgentId(session.agentId);
        saveActiveAgentId(session.agentId);
      } else {
        setActiveAgentId(null);
        saveActiveAgentId(null);
      }
      setActiveId(id);
      saveActiveId(id);
      setAppView("chat");
      setChatError("");
    },
    [sessions]
  );

  const confirmDeleteAgent = useCallback(async () => {
    if (!deleteAgentConfirm) return;
    const id = deleteAgentConfirm.id;
    setDeleteAgentConfirm(null);
    try {
      await deleteAgent(id);
      const next = sessions.filter((s) => s.agentId !== id);
      persistSessions(next);
      if (activeAgentId === id) {
        setActiveAgentId(null);
        saveActiveAgentId(null);
        setActiveId(null);
        saveActiveId(null);
        setAppView("chat");
      }
      await refreshAgents();
    } catch (e) {
      setChatError(e instanceof Error ? e.message : String(e));
    }
  }, [
    activeAgentId,
    deleteAgentConfirm,
    persistSessions,
    refreshAgents,
    sessions,
  ]);

  const handleDeleteSessionRequest = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      setDeleteWorkspace({
        id,
        label: sessionDisplayTitle(session),
      });
    },
    [sessions]
  );

  const confirmDeleteWorkspace = useCallback(() => {
    if (!deleteWorkspace) return;
    const id = deleteWorkspace.id;
    const session = sessions.find((s) => s.id === id);
    setDeleteWorkspace(null);
    if (!session) return;

    const next = sessions.filter((s) => s.id !== id);
    persistSessions(next);

    if (activeId !== id) return;

    const agentId = session.agentId ?? activeAgent?.id;
    const sameAgent = next.filter((s) => !agentId || s.agentId === agentId);
    const fallback = sameAgent[0] ?? null;

    if (fallback) {
      handleSelectWorkspace(fallback.id);
    } else {
      setActiveId(null);
      saveActiveId(null);
      setAppView("chat");
      setChatError("");
    }
  }, [
    activeAgent?.id,
    activeId,
    deleteWorkspace,
    handleSelectWorkspace,
    persistSessions,
    sessions,
  ]);

  const handleSend = async (text: string) => {
    setChatError("");
    await sendMessage(text);
  };

  const isEmpty =
    messages.length === 0 && !loading && !startingAgentId;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-lg text-text-secondary animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          theme={theme}
          onThemeChange={handleThemeChange}
          onLogin={() => openLogin("login")}
          onSignUp={() => openLogin("register")}
        />
        <AuthModal
          open={loginOpen}
          initialMode={authMode}
          onClose={() => setLoginOpen(false)}
          onSuccess={checkAuth}
          googleClientId={googleClientId}
          theme={theme}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {sidebarOpen && (
        <Sidebar
          user={user}
          appView={appView}
          sessions={sessions}
          activeId={activeId}
          onNavigate={setAppView}
          onNewChat={handleNewChat}
          onSelectWorkspace={handleSelectWorkspace}
          onDeleteWorkspace={handleDeleteSessionRequest}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={handleThemeChange}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <main className={`flex-1 flex flex-col min-w-0 h-screen ${appView !== "chat" ? "bg-dashboard-bg" : ""}`}>
        {appView === "chat" && (
          <header className="relative z-20 flex items-center gap-2 px-4 min-h-[52px] border-b border-border bg-sidebar/50 backdrop-blur-sm">
            {!sidebarOpen && (
              <button
                type="button"
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Toggle sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            )}
            <ModelSelector 
              model={model} 
              provider={provider} 
              onChange={(newModel, newProvider) => {
                console.log("ModelSelector selected:", { newModel, newProvider, currentProvider: provider, currentModel: model });
                if (newProvider !== provider) {
                  console.log("ModelSelector provider switching to:", newProvider);
                  setProvider(newProvider);
                  const saved = loadSettings(newProvider);
                  console.log("ModelSelector loaded keys for new provider:", saved);
                  setApiKey(saved.apiKey ?? "");
                }
                console.log("ModelSelector setting model to:", newModel);
                setModel(newModel);
              }} 
            />
            {sessionAgent && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-surface-hover border border-border text-accent font-medium max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" title={`${sessionAgent.tools_count} tools`}>
                {sessionAgent.name}
              </span>
            )}
            <div className="flex-1" />
            <span className={`w-2 h-2 rounded-full ${backendOk ? "bg-accent" : "bg-error"}`} title="Backend" />
          </header>
        )}

        {chatError && (
          <div className="flex items-center justify-between gap-4 mx-4 my-2.5 py-2.5 px-4 bg-red-500/15 border border-red-500/35 text-error rounded-lg text-sm" role="alert">
            {chatError}
            <button type="button" className="text-lg text-error hover:opacity-80" onClick={() => setChatError("")}>×</button>
          </div>
        )}

        {appView === "agents" && (
          <AgentsPage
            agents={agents}
            sessions={sessions}
            userName={user.username}
            startingAgentId={startingAgentId}
            onRefresh={refreshAgents}
            onCreate={() => {
              setEditingAgent(null);
              setAgentSetupTab("details");
              setAgentSetupOpen(true);
            }}
            onOpen={startWorkWithAgent}
            onEdit={(a) => {
              setEditingAgent(a);
              setAgentSetupTab("instructions");
              setAgentSetupOpen(true);
            }}
            onDelete={setDeleteAgentConfirm}
          />
        )}

        {appView === "tools" && (
          <ToolsPage
            tools={tools}
            onRefresh={refreshTools}
            onCreate={() => openCreateTool()}
            onEdit={openEditTool}
            onDelete={setDeleteToolConfirm}
          />
        )}

        {appView === "chat" && (
          <div className={`flex-1 flex flex-col min-h-0 relative ${isEmpty ? "justify-center items-center" : "justify-end"}`}>
            {!isEmpty && (
              <ChatMessages messages={messages} loading={loading} />
            )}
            {isEmpty && sessionAgent && !startingAgentId && (
              <AgentInstructionsPanel
                agent={sessionAgent}
                onEditInstructions={() => {
                  setEditingAgent(sessionAgent);
                  setAgentSetupTab("instructions");
                  setAgentSetupOpen(true);
                }}
              />
            )}
            <Composer
              loading={loading}
              tools={agentTools}
              agentName={sessionAgent?.name}
              centered={isEmpty && !sessionAgent}
              onSend={handleSend}
            />
          </div>
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        provider={provider}
        apiKey={apiKey}
        model={model}
        backendOk={backendOk}
        serverHasApiKey={serverHasApiKey}
        onClose={() => setSettingsOpen(false)}
        onApiKeyChange={setApiKey}
        onModelChange={setModel}
        onClearApiKey={() => setApiKey("")}
        onProviderChange={(p) => {
          setProvider(p);
          const saved = loadSettings(p);
          setApiKey(saved.apiKey ?? "");
          setModel(saved.model || defaultModel(p));
        }}
      />
      <CreateToolModal
        open={createToolOpen}
        onClose={() => setCreateToolOpen(false)}
        onCreated={refreshTools}
      />
      <EditToolModal
        open={editToolOpen}
        tool={editingTool}
        onClose={() => {
          setEditToolOpen(false);
          setEditingTool(null);
        }}
        onSaved={refreshTools}
      />
      <ConfirmModal
        open={deleteWorkspace != null}
        title="Delete workspace"
        message={
          deleteWorkspace
            ? `Delete workspace "${deleteWorkspace.label}"? This cannot be undone.`
            : ""
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDeleteWorkspace}
        onCancel={() => setDeleteWorkspace(null)}
      />
      <ConfirmModal
        open={deleteAgentConfirm != null}
        title="Delete agent"
        message={
          deleteAgentConfirm
            ? `Delete agent "${deleteAgentConfirm.name}" and its workspaces? This cannot be undone.`
            : ""
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDeleteAgent}
        onCancel={() => setDeleteAgentConfirm(null)}
      />
      <ConfirmModal
        open={deleteToolConfirm != null}
        title="Delete tool"
        message={
          deleteToolConfirm
            ? `Delete tool "${deleteToolConfirm.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        danger
        onConfirm={async () => {
          if (!deleteToolConfirm) return;
          const id = deleteToolConfirm.id;
          setDeleteToolConfirm(null);
          try {
            await deleteTool(id);
            await refreshTools();
          } catch (e) {
            setChatError(e instanceof Error ? e.message : String(e));
          }
        }}
        onCancel={() => setDeleteToolConfirm(null)}
      />
      <AgentSetupModal
        open={agentSetupOpen}
        agent={editingAgent}
        allTools={tools}
        initialTab={agentSetupTab}
        onClose={() => {
          setAgentSetupOpen(false);
          setEditingAgent(null);
        }}
        onSaved={(saved) => {
          refreshAgents();
          if (!editingAgent) {
            startWorkWithAgent(saved);
          } else if (saved.id === activeAgentId) {
            setActiveAgentId(saved.id);
          }
        }}
      />
    </div>
  );
}
