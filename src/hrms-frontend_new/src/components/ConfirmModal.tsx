interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="act-modal-overlay" onClick={onCancel}>
      <div
        className="act-modal act-alert-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onCancel}
          >
            &times;
          </button>
        </div>

        <div className="act-modal-form act-alert-modal-body">
          <p className="act-alert-message">{message}</p>
        </div>

        <div className="act-modal-actions">
          <button
            type="button"
            className="act-cancel-btn"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="act-submit-btn"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
