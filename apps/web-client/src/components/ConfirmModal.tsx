interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={onCancel}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 relative shadow-xl text-text font-sans flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-2.5 border-b border-border">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button type="button" className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary hover:text-text p-1 flex items-center justify-center transition-colors" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </header>
        <div className="py-1">
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button type="button" className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text text-sm font-semibold rounded-lg cursor-pointer transition-colors" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm text-white ${
              danger 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-accent hover:bg-accent-dim"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
