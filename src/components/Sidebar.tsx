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
    <aside className="w-[var(--sidebar-width)] min-w-[var(--sidebar-width)] bg-sidebar border-r border-border flex flex-col h-screen select-none">
      <div className="flex items-center justify-between p-2.5">
        <div className="flex items-center pl-1">
          <span className="text-xl text-accent font-bold">◇</span>
        </div>
        <button
          type="button"
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          onClick={onToggleSidebar}
          title="Close sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-3.5 py-2.5 bg-surface-hover rounded-lg text-text text-sm font-semibold text-left cursor-pointer hover:bg-border/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          New chat
        </button>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        <button
          type="button"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${
            appView === "agents" ? "text-accent bg-surface-hover" : "text-text-secondary hover:text-text hover:bg-surface-hover"
          }`}
          onClick={() => onNavigate("agents")}
        >
          <IconAgents />
          Agents
        </button>
        <button
          type="button"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${
            appView === "tools" ? "text-accent bg-surface-hover" : "text-text-secondary hover:text-text hover:bg-surface-hover"
          }`}
          onClick={() => onNavigate("tools")}
        >
          <IconTools />
          Tools
        </button>
        <button 
          type="button" 
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-hover transition-all text-left cursor-pointer" 
          onClick={onOpenSettings}
        >
          <IconSettings />
          Settings
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto px-2 flex flex-col mt-4">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-3 py-1.5">Workspaces</span>
        {workspaces.length === 0 ? (
          <p className="text-xs text-text-secondary px-3 py-1.5">No workspaces yet</p>
        ) : (
          <ul className="list-none flex flex-col gap-0.5 mt-1">
            {workspaces.map((s) => {
              const label = sessionDisplayTitle(s);
              const isActive = s.id === activeId && appView === "chat";
              return (
                <li key={s.id} className="flex items-center justify-between rounded-lg hover:bg-surface-hover group relative pr-1.5">
                  <button
                    type="button"
                    className={`flex-1 text-sm px-3 py-2 text-left truncate cursor-pointer transition-colors ${
                      isActive ? "text-text font-semibold bg-surface-hover/80" : "text-text-secondary hover:text-text"
                    }`}
                    onClick={() => onSelectWorkspace(s.id)}
                    title={label}
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-secondary hover:text-error hover:bg-red-500/10 transition-all cursor-pointer"
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

      <div className="p-2 border-t border-border relative" ref={userMenuRef}>
        <button
          type="button"
          className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-surface-hover transition-colors text-left cursor-pointer ${
            userMenuOpen ? "bg-surface-hover" : ""
          }`}
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
        >
          <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 flex flex-col min-w-0">
            <span className="text-sm font-medium text-text truncate">{user.username}</span>
            <span className="text-[10px] text-text-secondary truncate">
              {theme === "light" ? "Light theme" : "Dark theme"}
            </span>
          </span>
          <IconChevron className={userMenuOpen ? "rotate-180" : ""} />
        </button>
        {userMenuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-2 right-2 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-0.5" role="menu">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider px-2 py-1">Theme</span>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "light"}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-left cursor-pointer transition-colors ${
                theme === "light" ? "text-text bg-surface-hover font-semibold" : "text-text-secondary hover:text-text hover:bg-surface-hover"
              }`}
              onClick={() => {
                onThemeChange("light");
                setUserMenuOpen(false);
              }}
            >
              <IconSun />
              Light
              {theme === "light" && <span className="ml-auto text-accent text-xs font-bold">✓</span>}
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "dark"}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-left cursor-pointer transition-colors ${
                theme === "dark" ? "text-text bg-surface-hover font-semibold" : "text-text-secondary hover:text-text hover:bg-surface-hover"
              }`}
              onClick={() => {
                onThemeChange("dark");
                setUserMenuOpen(false);
              }}
            >
              <IconMoon />
              Dark
              {theme === "dark" && <span className="ml-auto text-accent text-xs font-bold">✓</span>}
            </button>
            <div className="h-[1px] bg-border my-1 mx-2" />
            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors text-left cursor-pointer"
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
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-red-550 hover:bg-red-500/10 hover:text-red-600 transition-colors text-left cursor-pointer"
              onClick={() => {
                setUserMenuOpen(false);
                onLogout();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
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
      className={`text-text-secondary transition-transform duration-200 ${className}`}
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
