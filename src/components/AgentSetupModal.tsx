import { useEffect, useState } from "react";
import type { Agent, Tool } from "../api";
import { createAgent, updateAgent } from "../api";

type SetupTab = "details" | "instructions" | "tools";

interface Props {
  open: boolean;
  agent: Agent | null;
  allTools: Tool[];
  initialTab?: SetupTab;
  onClose: () => void;
  onSaved: (agent: Agent) => void;
}

export default function AgentSetupModal({
  open,
  agent,
  allTools,
  initialTab = "details",
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(agent);
  const [tab, setTab] = useState<SetupTab>(initialTab);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setSystemPrompt(agent.system_prompt);
      setSelectedToolIds(new Set(agent.tool_ids));
    } else {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setSelectedToolIds(
        new Set(allTools.filter((t) => t.enabled).map((t) => t.id))
      );
    }
    setError("");
  }, [open, agent, allTools, initialTab]);

  const toggleTool = (id: string) => {
    setSelectedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const tool_ids = [...selectedToolIds];
    try {
      let saved: Agent;
      if (isEdit && agent) {
        saved = await updateAgent(agent.id, {
          name: name.trim(),
          description: description.trim(),
          system_prompt: systemPrompt.trim(),
          tool_ids,
        });
      } else {
        saved = await createAgent({
          name: name.trim(),
          description: description.trim(),
          system_prompt: systemPrompt.trim(),
          tool_ids,
        });
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const builtin = allTools.filter((t) => t.builtin);
  const custom = allTools.filter((t) => !t.builtin);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 relative shadow-xl text-text font-sans flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-xl font-bold text-text">{isEdit ? "Edit agent" : "Create agent"}</h2>
          <button 
            type="button" 
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary hover:text-text p-1 flex items-center justify-center transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div>
          <div className="flex gap-1 border-b border-border pb-0.5 mb-4" role="tablist">
            <button
              type="button"
              role="tab"
              className={`px-4 py-2 text-sm border-b-2 transition-all cursor-pointer ${
                tab === "details" 
                  ? "text-accent border-accent font-semibold" 
                  : "text-text-secondary border-transparent hover:text-text"
              }`}
              onClick={() => setTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              role="tab"
              className={`px-4 py-2 text-sm border-b-2 transition-all cursor-pointer ${
                tab === "instructions" 
                  ? "text-accent border-accent font-semibold" 
                  : "text-text-secondary border-transparent hover:text-text"
              }`}
              onClick={() => setTab("instructions")}
            >
              Instructions
            </button>
            <button
              type="button"
              role="tab"
              className={`px-4 py-2 text-sm border-b-2 transition-all cursor-pointer ${
                tab === "tools" 
                  ? "text-accent border-accent font-semibold" 
                  : "text-text-secondary border-transparent hover:text-text"
              }`}
              onClick={() => setTab("tools")}
            >
              Tools ({selectedToolIds.size})
            </button>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50 mb-2 font-medium">
                {error}
              </p>
            )}

            {tab === "details" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Name your agent and describe what it does. Add instructions and
                  tools in the other tabs.
                </p>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Agent name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Weather Assistant"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Description (short summary)
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this agent is for"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
                  />
                </label>
              </div>
            )}

            {tab === "instructions" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Instructions tell the AI how to behave and when to use tools.
                  Only this agent&apos;s assigned tools are available in chat.
                </p>
                <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Agent instructions
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={12}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1 min-h-[300px] font-mono"
                    placeholder={`You are a specialized assistant for...

Rules:
- Use only your assigned tools when needed
- Be concise and helpful
- Explain tool results clearly`}
                  />
                </label>
              </div>
            )}

            {tab === "tools" && (
              <div className="flex flex-col gap-4 mt-1">
                <p className="text-sm text-text-secondary mb-2">
                  Check the tools this agent can call. Unchecked tools are not
                  available during chat.
                </p>
                {builtin.length > 0 && (
                  <section className="flex flex-col gap-2.5 mt-2">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-border/40 pb-1.5">Built-in</h4>
                    <ul className="list-none flex flex-col gap-2">
                      {builtin.map((t) => (
                        <li key={t.id}>
                          <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none text-text">
                            <input
                              type="checkbox"
                              className="mt-1 accent-accent"
                              checked={selectedToolIds.has(t.id)}
                              onChange={() => toggleTool(t.id)}
                              disabled={!t.enabled}
                            />
                            <code className="px-1.5 py-0.5 bg-surface-hover rounded font-mono text-[11px] text-text shrink-0">{t.name}</code>
                            <span className="text-xs text-text-secondary leading-normal">
                              {t.description.slice(0, 80)}
                              {t.description.length > 80 ? "…" : ""}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {custom.length > 0 && (
                  <section className="flex flex-col gap-2.5 mt-4">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-border/40 pb-1.5">Your tools</h4>
                    <ul className="list-none flex flex-col gap-2">
                      {custom.map((t) => (
                        <li key={t.id}>
                          <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none text-text">
                            <input
                              type="checkbox"
                              className="mt-1 accent-accent"
                              checked={selectedToolIds.has(t.id)}
                              onChange={() => toggleTool(t.id)}
                              disabled={!t.enabled}
                            />
                            <code className="px-1.5 py-0.5 bg-surface-hover rounded font-mono text-[11px] text-text shrink-0">{t.name}</code>
                            <span className="text-xs text-text-secondary leading-normal">
                              {t.description.slice(0, 80)}
                              {t.description.length > 80 ? "…" : ""}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 border-t border-border/50 pt-4">
              <button 
                type="button" 
                className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text text-sm font-semibold rounded-lg cursor-pointer transition-colors" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={busy}
              >
                {busy ? "Saving…" : isEdit ? "Save agent" : "Create agent"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
