import { useMemo, useState } from "react";
import type { Agent } from "../api";
import type { ChatSession } from "../chatStorage";

type Filter = "all" | "mine";

interface Props {
  agents: Agent[];
  sessions: ChatSession[];
  userName: string;
  startingAgentId: string | null;
  onRefresh: () => void;
  onCreate: () => void;
  onOpen: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

export default function AgentsPage({
  agents,
  sessions,
  userName,
  startingAgentId,
  onRefresh,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  const workspaceCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      if (s.agentId) map[s.agentId] = (map[s.agentId] ?? 0) + 1;
    }
    return map;
  }, [sessions]);

  const filtered = agents.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>Agents</h1>
          <p>
            Create agents with specific instructions and tools. Each agent runs in
            its own workspace with an audit trail of messages and tool calls.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="icon-btn-muted" onClick={onRefresh} title="Refresh">
            <IconRefresh />
          </button>
          <button type="button" className="btn-primary-dashboard" onClick={onCreate}>
            + Create Agent
          </button>
        </div>
      </header>

      <div className="dashboard-toolbar">
        <div className="dashboard-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="dashboard-filters">
          <button
            type="button"
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === "mine" ? "active" : ""}`}
            onClick={() => setFilter("mine")}
          >
            My Agents
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dashboard-empty">
          <p>No agents found. Create your first agent to get started.</p>
          <button type="button" className="btn-primary-dashboard" onClick={onCreate}>
            + Create Agent
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {filtered.map((a) => {
            const starting = startingAgentId === a.id;
            const count = workspaceCount[a.id] ?? 0;
            return (
              <article key={a.id} className="dashboard-card agent-card">
                <div className="dashboard-card-top">
                  <button
                    type="button"
                    className="dashboard-card-title-btn"
                    onClick={() => onOpen(a)}
                    disabled={Boolean(startingAgentId)}
                  >
                    {a.name}
                  </button>
                  <span className="dashboard-card-badge">{count}</span>
                  <div className="dashboard-card-menu-wrap">
                    <button
                      type="button"
                      className="dashboard-card-menu-btn"
                      onClick={() => setMenuId(menuId === a.id ? null : a.id)}
                      aria-label="Options"
                    >
                      ⋮
                    </button>
                    {menuId === a.id && (
                      <>
                        <div
                          className="dashboard-menu-backdrop"
                          onClick={() => setMenuId(null)}
                        />
                        <div className="dashboard-card-menu">
                          <button type="button" onClick={() => { setMenuId(null); onEdit(a); }}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => { setMenuId(null); onDelete(a); }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="dashboard-card-body-btn"
                  onClick={() => onOpen(a)}
                  disabled={Boolean(startingAgentId)}
                >
                  <p className="dashboard-card-desc">
                    {a.description ||
                      (a.system_prompt?.trim()
                        ? a.system_prompt.slice(0, 160) + (a.system_prompt.length > 160 ? "…" : "")
                        : "No description yet. Add instructions and tools for this agent.")}
                  </p>
                </button>
                <footer className="dashboard-card-footer">
                  <span>Created by: {userName}</span>
                  <span className="dashboard-card-meta">
                    {a.tools_count} tool{a.tools_count === 1 ? "" : "s"}
                    {starting && " · Starting…"}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
