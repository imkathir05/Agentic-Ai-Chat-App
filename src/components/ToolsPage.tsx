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
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>Tools</h1>
          <p>
            Tools are functions your agents can call — built-in utilities, HTTP APIs,
            or custom handlers. Assign tools per agent in agent setup.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="icon-btn-muted" onClick={onRefresh} title="Refresh">
            <IconRefresh />
          </button>
          <button type="button" className="btn-primary-dashboard" onClick={onCreate}>
            + Create Tool
          </button>
        </div>
      </header>

      <div className="dashboard-toolbar">
        <div className="dashboard-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search tools…"
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
            My Tools
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dashboard-empty">
          <p>No tools match your search.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {filtered.map((t) => (
            <article key={t.id} className="dashboard-card tool-card-dashboard">
              <div className="dashboard-card-top">
                <h3 className="dashboard-card-title-static">{t.name}</h3>
                <div className="dashboard-card-menu-wrap">
                  <button
                    type="button"
                    className="dashboard-card-menu-btn"
                    onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                    aria-label="Options"
                  >
                    ⋮
                  </button>
                  {menuId === t.id && (
                    <>
                      <div
                        className="dashboard-menu-backdrop"
                        onClick={() => setMenuId(null)}
                      />
                      <div className="dashboard-card-menu">
                        {!t.builtin && (
                          <button type="button" onClick={() => { setMenuId(null); onEdit(t); }}>
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className={t.builtin ? "" : "danger"}
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
              <p className="dashboard-card-desc">{t.description}</p>
              <footer className="dashboard-card-footer">
                <span>
                  {t.builtin ? "Built-in" : "Custom"}
                  {t.handler_type === "http_api" && " · API"}
                </span>
                <span className={`status-dot ${t.enabled ? "on" : "off"}`}>
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
