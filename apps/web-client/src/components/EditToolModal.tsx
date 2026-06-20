import type { Tool } from "../api";
import ToolForm from "./ToolForm";

interface Props {
  open: boolean;
  tool: Tool | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditToolModal({ open, tool, onClose, onSaved }: Props) {
  if (!open || !tool) return null;

  const handleSuccess = () => {
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 relative shadow-xl text-text font-sans flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-xl font-bold text-text">Edit tool</h2>
          <button 
            type="button" 
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary hover:text-text p-1 flex items-center justify-center transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Editing <code className="px-1.5 py-0.5 bg-surface-hover rounded font-mono text-xs">{tool.name}</code>
            {tool.builtin ? " (built-in)" : ""}
          </p>
          <ToolForm tool={tool} onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
