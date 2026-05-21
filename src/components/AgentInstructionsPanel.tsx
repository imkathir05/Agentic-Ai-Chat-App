import type { Agent } from "../api";

interface Props {
  agent: Agent;
  onEditInstructions: () => void;
}

export default function AgentInstructionsPanel({ agent, onEditInstructions }: Props) {
  const instructions =
    agent.system_prompt?.trim() ||
    "No instructions yet. Add instructions so this agent knows how to behave.";

  return (
    <div className="agent-instructions-panel">
      <div className="agent-instructions-header">
        <div>
          <h2 className="agent-instructions-title">{agent.name}</h2>
          {agent.description && (
            <p className="agent-instructions-desc">{agent.description}</p>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={onEditInstructions}>
          Edit instructions
        </button>
      </div>
      <div className="agent-instructions-box">
        <span className="agent-instructions-label">Instructions</span>
        <pre className="agent-instructions-text">{instructions}</pre>
      </div>
      <p className="agent-instructions-footer">
        {agent.tools_count} tool{agent.tools_count === 1 ? "" : "s"} assigned · Click{" "}
        <strong>Start</strong> on this agent to open a workspace and run instructions
      </p>
    </div>
  );
}
