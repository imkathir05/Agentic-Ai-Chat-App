import type { Message } from "./types/chat";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  agentId?: string;
}

const SESSIONS_KEY = "agentic-ai-sessions";
const ACTIVE_KEY = "agentic-ai-active-session";
const ACTIVE_AGENT_KEY = "agentic-ai-active-agent";

export function loadActiveAgentId(): string | null {
  return localStorage.getItem(ACTIVE_AGENT_KEY);
}

export function saveActiveAgentId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_AGENT_KEY, id);
  else localStorage.removeItem(ACTIVE_AGENT_KEY);
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as ChatSession[];
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

const DEFAULT_TITLE = "New chat";
const TITLE_MAX = 48;

export function createSession(agentId?: string, title?: string): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: title?.trim() || DEFAULT_TITLE,
    messages: [],
    updatedAt: Date.now(),
    ...(agentId ? { agentId } : {}),
  };
}

/** Title for a new agent workspace (e.g. "Research Agent (2)"). */
export function workspaceTitleForAgent(
  agentName: string,
  sessions: ChatSession[],
  agentId: string
): string {
  const count = sessions.filter((s) => s.agentId === agentId).length;
  return count > 0 ? `${agentName} (${count + 1})` : agentName;
}

/** Title for a general chat workspace (no agent). */
export function workspaceTitleGeneral(sessions: ChatSession[]): string {
  const count = sessions.filter((s) => !s.agentId).length;
  return count > 0 ? `New chat (${count + 1})` : DEFAULT_TITLE;
}

/** Build a short sidebar label from the user's first message. */
export function titleFromMessage(text: string): string {
  let t = text.trim().replace(/\s+/g, " ");
  t = t.replace(
    /^(please\s+|can you\s+|could you\s+|what is\s+|what's\s+|how do i\s+|tell me\s+|i need\s+)/i,
    ""
  );
  t = t.trim();
  if (!t) return DEFAULT_TITLE;
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (t.length > TITLE_MAX) {
    return `${t.slice(0, TITLE_MAX).trim()}…`;
  }
  return t;
}

function firstUserMessage(session: ChatSession): string | undefined {
  return session.messages.find((m) => m.role === "user")?.content;
}

/** Title shown in the sidebar — uses stored title or derives from chat content. */
export function sessionDisplayTitle(session: ChatSession): string {
  if (session.title && session.title !== DEFAULT_TITLE) {
    return session.title;
  }
  const first = firstUserMessage(session);
  if (first) return titleFromMessage(first);
  return DEFAULT_TITLE;
}

/** Fix sessions saved before auto-naming (messages exist but title is still "New chat"). */
export function normalizeSession(session: ChatSession): ChatSession {
  if (session.title !== DEFAULT_TITLE || session.messages.length === 0) {
    return session;
  }
  const first = firstUserMessage(session);
  if (!first) return session;
  return { ...session, title: titleFromMessage(first) };
}

export function normalizeSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.map(normalizeSession);
}
