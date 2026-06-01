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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-full" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Edit tool</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body modal-create-tool">
          <p className="create-tool-intro">
            Editing <code>{tool.name}</code>
            {tool.builtin ? " (built-in)" : ""}
          </p>
          <ToolForm tool={tool} onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
