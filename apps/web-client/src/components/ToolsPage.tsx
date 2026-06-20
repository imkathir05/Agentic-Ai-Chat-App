import { useState } from "react";
import type { Tool } from "../api";

interface Props {
  tools: Tool[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
}

export default function ToolsPage({
  tools,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  const filtered = tools.filter((t) => {
    if (filter === "mine" && t.builtin) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-dashboard-bg">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-text tracking-tight">Tools</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Tools are functions your agents can call — built-in utilities, HTTP APIs,
            or custom handlers. Assign tools per agent in agent setup.
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
            + Create Tool
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3.5 py-2 border border-border bg-surface rounded-xl focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all w-full sm:max-w-xs text-sm">
          <IconSearch />
          <input
            type="text"
            placeholder="Search tools…"
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
            My Tools
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-2xl text-center text-text-secondary">
          <p>No tools match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <article key={t.id} className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="text-base font-bold text-text truncate">{t.name}</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-secondary hover:text-text cursor-pointer transition-colors"
                    onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                    aria-label="Options"
                  >
                    ⋮
                  </button>
                  {menuId === t.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setMenuId(null)}
                      />
                      <div className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-40 min-w-[120px] flex flex-col gap-0.5">
                        {!t.builtin && (
                          <button 
                            type="button" 
                            className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:text-text hover:bg-surface-hover cursor-pointer transition-colors"
                            onClick={() => { setMenuId(null); onEdit(t); }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className={`w-full px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                            t.builtin 
                              ? "text-text-secondary/40 cursor-not-allowed" 
                              : "text-red-550 hover:bg-red-500/10 hover:text-red-650"
                          }`}
                          onClick={() => {
                            setMenuId(null);
                            if (!t.builtin) onDelete(t);
                          }}
                          disabled={t.builtin}
                        >
                          {t.builtin ? "Built-in" : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-5 leading-relaxed line-clamp-3 flex-1">{t.description}</p>
              <footer className="flex items-center justify-between text-xs border-t border-border/50 pt-3.5 mt-auto">
                <span className="text-text-secondary font-medium">
                  {t.builtin ? "Built-in" : "Custom"}
                  {t.handler_type === "http_api" && " · API"}
                </span>
                <span className={`flex items-center gap-1.5 font-semibold ${t.enabled ? "text-accent" : "text-text-secondary"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.enabled ? "bg-accent" : "bg-gray-400"}`} />
                  {t.enabled ? "Enabled" : "Disabled"}
                </span>
              </footer>
            </article>
          ))}
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
