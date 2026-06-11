interface AlertModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export default function AlertModal({
  open,
  title,
  message,
  onClose,
}: AlertModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="act-modal-overlay" onClick={onClose}>
      <div
        className="act-modal act-alert-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
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
            className="act-submit-btn"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
