import { useCallback, useEffect, useState } from "react";
import {
  authMe,
  deleteAgent,
  deleteTool,
  fetchAgents,
  fetchTools,
  healthCheck,
  logout,
  sendChat,
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
import "./App.css";

const STORAGE_KEY = "agentic-ai-settings";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type LlmProvider = "groq" | "gemini";

function defaultModel(provider: LlmProvider): string {
  return provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_GROQ_MODEL;
}

function normalizeModel(model: string | undefined, provider: LlmProvider): string {
  if (!model?.trim()) return defaultModel(provider);
  const m = model.trim();
  if (provider === "gemini") {
    return m.startsWith("gemini-") ? m : DEFAULT_GEMINI_MODEL;
  }
  return m;
}

const GROQ_MODEL_OPTIONS = [
  "llama-3.3-70b-versatile",
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
        model?: string;
      };
      const key = data.apiKey ?? data.geminiApiKey;
      return {
        apiKey: sanitizeApiKey(key, provider),
        model: normalizeModel(data.model, provider),
      };
    }
  } catch {
    /* ignore */
  }
  return { model: defaultModel(provider) };
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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ apiKey, model })
    );
  }, [apiKey, model]);

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
    if (!user) return;
    healthCheck()
      .then((h) => {
        setBackendOk(true);
        setServerHasApiKey(Boolean(h.has_api_key));
        const p = (h.provider === "gemini" ? "gemini" : "groq") as LlmProvider;
        setProvider(p);
        if (h.model) setModel(normalizeModel(h.model, p));
        refreshTools();
        refreshAgents();
      })
      .catch(() => {
        setBackendOk(false);
        setServerHasApiKey(false);
      });
  }, [refreshTools, refreshAgents, user]);

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
        const s = createSession(
          agent?.id,
          agent
            ? workspaceTitleForAgent(agent.name, list, agent.id)
            : workspaceTitleGeneral(list)
        );
        sessionId = s.id;
        currentMessages = [];
        list = [s, ...list];
        persistSessions(list);
        setActiveId(s.id);
        saveActiveId(s.id);
      }

      const userMsg: Message = { role: "user", content: text };
      const nextMessages = [...currentMessages, userMsg];
      const sessionRow = list.find((s) => s.id === sessionId);
      const resolvedTitle =
        opts?.title ??
        (currentMessages.length === 0 || sessionRow?.title.startsWith("New chat")
          ? titleFromMessage(text)
          : undefined);

      const applyMessages = (msgs: Message[], title?: string) => {
        persistSessions(
          list.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: msgs,
                  title: title ?? s.title,
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      };

      applyMessages(nextMessages, resolvedTitle);
      setLoading(true);

      try {
        const res = await sendChat(
          nextMessages.map((m) => ({ role: m.role, content: m.content })),
          sanitizeApiKey(apiKey, provider) || undefined,
          model || undefined,
          provider,
          agent?.id
        );
        applyMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: res.message,
            toolTrace: res.tool_trace,
          },
        ]);
      } catch (e) {
        const err = e as Error & { status?: number };
        if (err.status === 401) {
          setUser(null);
          setLoginOpen(true);
          setAuthMode("login");
          setChatError("Session expired. Please log in again.");
        } else {
          setChatError(err instanceof Error ? err.message : String(e));
        }
        applyMessages(nextMessages);
      } finally {
        setLoading(false);
      }
    },
    [activeId, agents, apiKey, messages, model, persistSessions, provider, sessions]
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
      <div className="landing loading-screen">
        <p className="auth-loading">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          onLogin={() => openLogin("login")}
          onSignUp={() => openLogin("register")}
        />
        <AuthModal
          open={loginOpen}
          initialMode={authMode}
          onClose={() => setLoginOpen(false)}
          onSuccess={checkAuth}
        />
      </>
    );
  }

  return (
    <div className={`app-shell ${!sidebarOpen ? "sidebar-closed" : ""}`}>
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
        />
      )}

      <main className={`main ${appView !== "chat" ? "main-dashboard" : ""}`}>
        {appView === "chat" && (
          <header className="main-header">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="model-select-wrap">
              <select
                value={model}
                onChange={(e) => setModel(normalizeModel(e.target.value, provider))}
                className="model-select"
              >
                {(provider === "gemini" ? GEMINI_MODEL_OPTIONS : GROQ_MODEL_OPTIONS).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {sessionAgent && (
              <span className="active-agent-badge" title={`${sessionAgent.tools_count} tools`}>
                {sessionAgent.name}
              </span>
            )}
            <div className="header-spacer" />
            <span className={`conn-dot ${backendOk ? "on" : "off"}`} title="Backend" />
          </header>
        )}

        {chatError && (
          <div className="toast-error" role="alert">
            {chatError}
            <button type="button" onClick={() => setChatError("")}>×</button>
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
          <div className={`chat-area ${isEmpty ? "empty" : "active"}`}>
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
