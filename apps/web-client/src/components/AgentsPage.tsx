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
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-dashboard-bg">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-text tracking-tight">Agents</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Create agents with specific instructions and tools. Each agent runs in
            its own workspace with an audit trail of messages and tool calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition-colors cursor-pointer border border-border/40 bg-surface/50" 
            onClick={onRefresh} 
            title="Refresh"
          >
            <IconRefresh />
          </button>
          <button 
            type="button" 
            className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dim shadow-sm transition-all cursor-pointer text-sm" 
            onClick={onCreate}
          >
            + Create Agent
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3.5 py-2 border border-border bg-surface rounded-xl focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all w-full sm:max-w-xs text-sm">
          <IconSearch />
          <input
            type="text"
            placeholder="Search agents…"
            className="flex-1 bg-transparent border-none outline-none text-text placeholder-text-secondary focus:outline-none p-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              filter === "all" 
                ? "bg-filter-pill-active-bg text-filter-pill-active-text border-transparent" 
                : "bg-surface border-border text-text-secondary hover:text-text hover:bg-surface-hover"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              filter === "mine" 
                ? "bg-filter-pill-active-bg text-filter-pill-active-text border-transparent" 
                : "bg-surface border-border text-text-secondary hover:text-text hover:bg-surface-hover"
            }`}
            onClick={() => setFilter("mine")}
          >
            My Agents
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-2xl text-center text-text-secondary">
          <p className="mb-4">No agents found. Create your first agent to get started.</p>
          <button 
            type="button" 
            className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dim shadow-sm transition-all cursor-pointer text-sm" 
            onClick={onCreate}
          >
            + Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => {
            const starting = startingAgentId === a.id;
            const count = workspaceCount[a.id] ?? 0;
            return (
              <article key={a.id} className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-center gap-2 mb-3 w-full">
                  <button
                    type="button"
                    className="text-base font-bold text-text truncate hover:text-accent transition-colors text-left cursor-pointer outline-none focus:outline-none"
                    onClick={() => onOpen(a)}
                    disabled={Boolean(startingAgentId)}
                  >
                    {a.name}
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-hover border border-border text-text-secondary shrink-0" title={`${count} active workspaces`}>{count}</span>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-secondary hover:text-text cursor-pointer transition-colors"
                      onClick={() => setMenuId(menuId === a.id ? null : a.id)}
                      aria-label="Options"
                    >
                      ⋮
                    </button>
                    {menuId === a.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-40 min-w-[120px] flex flex-col gap-0.5">
                          <button 
                            type="button" 
                            className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:text-text hover:bg-surface-hover cursor-pointer transition-colors"
                            onClick={() => { setMenuId(null); onEdit(a); }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-xs text-left cursor-pointer transition-colors text-red-550 hover:bg-red-500/10 hover:text-red-650"
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
                  className="flex-1 text-left w-full cursor-pointer hover:opacity-95 outline-none focus:outline-none"
                  onClick={() => onOpen(a)}
                  disabled={Boolean(startingAgentId)}
                >
                  <p className="text-sm text-text-secondary mb-5 leading-relaxed line-clamp-3 text-left w-full">
                    {a.description ||
                      (a.system_prompt?.trim()
                        ? a.system_prompt.slice(0, 160) + (a.system_prompt.length > 160 ? "…" : "")
                        : "No description yet. Add instructions and tools for this agent.")}
                  </p>
                </button>
                <footer className="flex items-center justify-between text-xs border-t border-border/50 pt-3.5 mt-auto w-full">
                  <span className="text-text-secondary">Created by: {userName}</span>
                  <span className="text-text-secondary font-medium">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary shrink-0">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
