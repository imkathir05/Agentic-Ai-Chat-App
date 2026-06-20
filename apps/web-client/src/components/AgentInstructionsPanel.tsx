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
    <div className="flex-1 overflow-y-auto py-6 px-8 max-w-[720px] mx-auto w-full">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-text">{agent.name}</h2>
          {agent.description && (
            <p className="text-[13px] text-text-secondary mt-1">{agent.description}</p>
          )}
        </div>
        <button 
          type="button" 
          className="px-3.5 py-1.5 bg-surface border border-border text-text hover:text-text hover:bg-surface-hover text-sm font-semibold rounded-lg cursor-pointer transition-colors" 
          onClick={onEditInstructions}
        >
          Edit instructions
        </button>
      </div>
      <div className="border border-border rounded-xl bg-surface p-4">
        <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Instructions</span>
        <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap break-words text-text m-0">{instructions}</pre>
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        {agent.tools_count} tool{agent.tools_count === 1 ? "" : "s"} assigned · Click{" "}
        <strong>Start</strong> on this agent to open a workspace and run instructions
      </p>
    </div>
  );
}
