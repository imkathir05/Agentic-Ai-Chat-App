import { useEffect, useRef, useState } from "react";
import type { User } from "../api";
import { sessionDisplayTitle, type ChatSession } from "../chatStorage";
import type { Theme } from "../theme";

export type AppView = "agents" | "tools" | "chat";

interface Props {
  user: User;
  appView: AppView;
  sessions: ChatSession[];
  activeId: string | null;
  onNavigate: (view: AppView) => void;
  onNewChat: () => void;
  onSelectWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onToggleSidebar?: () => void;
}

export default function Sidebar({
  user,
  appView,
  sessions,
  activeId,
  onNavigate,
  onNewChat,
  onSelectWorkspace,
  onDeleteWorkspace,
  onOpenSettings,
  onLogout,
  theme,
  onThemeChange,
  onToggleSidebar,
}: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [userMenuOpen]);

  const workspaces = [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12);

  return (
    <aside className="sidebar june-sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.25rem' }}>
          <span className="sidebar-brand-logo" style={{ fontSize: '1.25rem' }}>◇</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleSidebar}
          title="Close sidebar"
          style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 0.5rem 0.5rem' }}>
        <button
          type="button"
          onClick={onNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.55rem 0.75rem',
            background: 'var(--surface-hover)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            textAlign: 'left',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          New chat
        </button>
      </div>

      <nav className="sidebar-nav" style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          className={`sidebar-nav-item ${appView === "agents" ? "active" : ""}`}
          onClick={() => onNavigate("agents")}
        >
          <IconAgents />
          Agents
        </button>
        <button
          type="button"
          className={`sidebar-nav-item ${appView === "tools" ? "active" : ""}`}
          onClick={() => onNavigate("tools")}
        >
          <IconTools />
          Tools
        </button>
        <button type="button" className="sidebar-nav-item" onClick={onOpenSettings}>
          <IconSettings />
          Settings
        </button>
      </nav>

      <div className="sidebar-workspaces">
        <span className="sidebar-workspaces-label">Workspaces</span>
        {workspaces.length === 0 ? (
          <p className="sidebar-workspaces-empty">No workspaces yet</p>
        ) : (
          <ul className="sidebar-workspaces-list">
            {workspaces.map((s) => {
              const label = sessionDisplayTitle(s);
              const isActive = s.id === activeId && appView === "chat";
              return (
                <li key={s.id} className="sidebar-workspace-row">
                  <button
                    type="button"
                    className={`sidebar-workspace-item ${isActive ? "active" : ""}`}
                    onClick={() => onSelectWorkspace(s.id)}
                    title={label}
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    className="sidebar-workspace-delete"
                    onClick={() => onDeleteWorkspace(s.id)}
                    title={`Delete ${label}`}
                    aria-label={`Delete workspace ${label}`}
                  >
                    <IconTrash />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="sidebar-footer june-sidebar-footer" ref={userMenuRef}>
        <button
          type="button"
          className={`sidebar-user ${userMenuOpen ? "open" : ""}`}
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
        >
          <span className="sidebar-user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="sidebar-user-info">
            <span className="sidebar-user-name">{user.username}</span>
            <span className="sidebar-user-meta">
              {theme === "light" ? "Light theme" : "Dark theme"}
            </span>
          </span>
          <IconChevron className={userMenuOpen ? "up" : ""} />
        </button>
        {userMenuOpen && (
          <div className="sidebar-user-menu" role="menu">
            <span className="sidebar-user-menu-label">Theme</span>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "light"}
              className={`sidebar-user-menu-item ${theme === "light" ? "active" : ""}`}
              onClick={() => {
                onThemeChange("light");
                setUserMenuOpen(false);
              }}
            >
              <IconSun />
              Light
              {theme === "light" && <span className="menu-check">✓</span>}
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "dark"}
              className={`sidebar-user-menu-item ${theme === "dark" ? "active" : ""}`}
              onClick={() => {
                onThemeChange("dark");
                setUserMenuOpen(false);
              }}
            >
              <IconMoon />
              Dark
              {theme === "dark" && <span className="menu-check">✓</span>}
            </button>
            <div className="sidebar-user-menu-divider" />
            <button
              type="button"
              role="menuitem"
              className="sidebar-user-menu-item"
              onClick={() => {
                setUserMenuOpen(false);
                onOpenSettings();
              }}
            >
              <IconSettings />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              className="sidebar-user-menu-item danger"
              onClick={() => {
                setUserMenuOpen(false);
                onLogout();
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconAgents() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconTools() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`sidebar-user-chevron ${className}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
