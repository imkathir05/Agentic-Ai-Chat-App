export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  created_at?: string;
}


export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  builtin: boolean;
  enabled: boolean;
  handler_type?: string;
  api_url?: string;
  api_method?: string;
  api_headers?: Record<string, string>;
  api_body?: string;
  api_timeout?: number;
}

export interface ToolTraceEntry {
  tool: string;
  arguments: Record<string, unknown>;
  result: string;
  status: string;
  call_id: string;
}

export interface ChatResponse {
  message: string;
  tool_trace: ToolTraceEntry[];
  provider?: string;
  model?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  tool_ids: string[];
  tools_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface HealthResponse {
  status: string;
  provider: string;
  model: string;
  has_api_key: boolean;
  framework?: string;
  google_client_id?: string;
}

const API_BASE = "/api";
const DEV_BACKEND = "http://127.0.0.1:8000";

const fetchOpts: RequestInit = {
  credentials: "include",
};

const BACKEND_HINT =
  "Backend is not running. Open a terminal and run: cd backend && .\\venv\\Scripts\\activate && python manage.py runserver 127.0.0.1:8000 (or double-click start-backend.bat)";

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const opts = { ...fetchOpts, ...init };
  try {
    return await fetch(url, opts);
  } catch {
    /* Vite proxy failed — try Django directly in dev (CORS allows localhost:5173) */
    if (import.meta.env.DEV && url.startsWith("/api")) {
      try {
        return await fetch(`${DEV_BACKEND}${url}`, opts);
      } catch {
        /* fall through */
      }
    }
    throw new Error(BACKEND_HINT);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = body.detail;
    const msg = Array.isArray(detail)
      ? detail.join(", ")
      : detail || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return res.json();
}

export async function authMe(): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/me`);

  return handleResponse(res);
}

export async function login(
  username: string,
  password: string
): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/login`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

export async function googleLogin(token: string): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/google`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return handleResponse(res);
}

export async function checkEmail(email: string): Promise<{ exists: boolean }> {
  const res = await apiFetch(`${API_BASE}/auth/check-email`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function logout(): Promise<void> {
  const res = await apiFetch(`${API_BASE}/auth/logout`, {
    ...fetchOpts,
    method: "POST",
  });
  await handleResponse(res);
}

export async function healthCheck(): Promise<HealthResponse> {
  const res = await apiFetch(`${API_BASE}/health`);

  return res.json();
}

export async function sendChat(
  messages: { role: string; content: string }[],
  apiKey?: string,
  model?: string,
  provider: "groq" | "gemini" = "groq",
  agentId?: string
): Promise<ChatResponse> {
  const body: Record<string, unknown> = { messages, model };
  if (agentId) body.agent_id = agentId;
  if (apiKey) {
    if (provider === "groq") body.groq_api_key = apiKey;
    else body.gemini_api_key = apiKey;
  }
  const res = await apiFetch(`${API_BASE}/chat`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function fetchTools(): Promise<Tool[]> {
  const res = await apiFetch(`${API_BASE}/tools`);

  const data = await handleResponse<{ tools: Tool[] }>(res);
  return data.tools;
}

export async function toggleTool(toolId: string): Promise<Tool> {
  const res = await apiFetch(`${API_BASE}/tools/${toolId}/toggle`, {
    ...fetchOpts,
    method: "POST",
  });
  return handleResponse(res);
}

export async function updateTool(
  toolId: string,
  updates: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    handler_type: string;
    parameters: Record<string, unknown>;
    api_url: string;
    api_method: string;
    api_headers: Record<string, string>;
    api_body: string;
    api_timeout: number;
  }>
): Promise<Tool> {
  const res = await apiFetch(`${API_BASE}/tools/${toolId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function createTool(payload: {
  name: string;
  description: string;
  handler_type?: string;
  enabled?: boolean;
  parameters?: Record<string, unknown>;
  api_url?: string;
  api_method?: string;
  api_headers?: Record<string, string>;
  api_body?: string;
  api_timeout?: number;
}): Promise<Tool> {
  const res = await apiFetch(`${API_BASE}/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteTool(toolId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/tools/${toolId}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await apiFetch(`${API_BASE}/agents`);
  const data = await handleResponse<{ agents: Agent[] }>(res);
  return data.agents;
}

export async function createAgent(payload: {
  name: string;
  description?: string;
  system_prompt?: string;
  tool_ids?: string[];
}): Promise<Agent> {
  const res = await apiFetch(`${API_BASE}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateAgent(
  agentId: string,
  updates: Partial<{
    name: string;
    description: string;
    system_prompt: string;
    tool_ids: string[];
  }>
): Promise<Agent> {
  const res = await apiFetch(`${API_BASE}/agents/${agentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function deleteAgent(agentId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/agents/${agentId}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}
