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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEdit ? "Edit agent" : "Create agent"}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body modal-create-tool">
          <div className="setup-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`setup-tab ${tab === "details" ? "active" : ""}`}
              onClick={() => setTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              role="tab"
              className={`setup-tab ${tab === "instructions" ? "active" : ""}`}
              onClick={() => setTab("instructions")}
            >
              Instructions
            </button>
            <button
              type="button"
              role="tab"
              className={`setup-tab ${tab === "tools" ? "active" : ""}`}
              onClick={() => setTab("tools")}
            >
              Tools ({selectedToolIds.size})
            </button>
          </div>

          <form className="agent-setup-form" onSubmit={handleSubmit}>
            {error && <p className="error-banner">{error}</p>}

            {tab === "details" && (
              <div className="setup-tab-panel">
                <p className="create-tool-intro">
                  Name your agent and describe what it does. Add instructions and
                  tools in the other tabs.
                </p>
                <label>
                  Agent name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Weather Assistant"
                    required
                  />
                </label>
                <label>
                  Description (short summary)
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this agent is for"
                  />
                </label>
              </div>
            )}

            {tab === "instructions" && (
              <div className="setup-tab-panel">
                <p className="create-tool-intro">
                  Instructions tell the AI how to behave and when to use tools.
                  Only this agent&apos;s assigned tools are available in chat.
                </p>
                <label>
                  Agent instructions
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={12}
                    className="instructions-textarea"
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
              <div className="setup-tab-panel agent-tools-picker">
                <p className="agent-tools-hint">
                  Check the tools this agent can call. Unchecked tools are not
                  available during chat.
                </p>
                {builtin.length > 0 && (
                  <section className="tools-list-section">
                    <h4 className="tools-list-heading">Built-in</h4>
                    <ul className="agent-tool-checklist">
                      {builtin.map((t) => (
                        <li key={t.id}>
                          <label className="agent-tool-check">
                            <input
                              type="checkbox"
                              checked={selectedToolIds.has(t.id)}
                              onChange={() => toggleTool(t.id)}
                              disabled={!t.enabled}
                            />
                            <code>{t.name}</code>
                            <span className="agent-tool-check-desc">
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
                  <section className="tools-list-section">
                    <h4 className="tools-list-heading">Your tools</h4>
                    <ul className="agent-tool-checklist">
                      {custom.map((t) => (
                        <li key={t.id}>
                          <label className="agent-tool-check">
                            <input
                              type="checkbox"
                              checked={selectedToolIds.has(t.id)}
                              onChange={() => toggleTool(t.id)}
                              disabled={!t.enabled}
                            />
                            <code>{t.name}</code>
                            <span className="agent-tool-check-desc">
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

            <div className="create-tool-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-create-tool" disabled={busy}>
                {busy ? "Saving…" : isEdit ? "Save agent" : "Create agent"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
