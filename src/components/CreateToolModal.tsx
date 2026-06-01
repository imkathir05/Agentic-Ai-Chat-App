import ToolForm from "./ToolForm";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateToolModal({ open, onClose, onCreated }: Props) {
  if (!open) return null;

  const handleSuccess = () => {
    onCreated();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-full" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Create tool</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body modal-create-tool">
          <p className="create-tool-intro">
            Add a new tool to the database. Gemini can call HTTP APIs automatically when
            users ask relevant questions.
          </p>
          <ToolForm onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
