import '../styles/Style.css'

export interface LeaveBalanceDetail {
  leaveTypeId: number
  leaveTypeName: string
  annualUsed: number
  annualPending: number
  monthlyUsed: number
  monthlyPending: number
}

interface LeaveBalanceDetailModalProps {
  open: boolean
  loading: boolean
  error: string
  detail: LeaveBalanceDetail | null
  onClose: () => void
  formatLeaveDays: (value: number) => string
}

export function LeaveBalanceDetailModal({
  open,
  loading,
  error,
  detail,
  onClose,
  formatLeaveDays,
}: LeaveBalanceDetailModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="act-modal-overlay">
      <div
        className="act-modal modal-sm leave-balance-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>{detail?.leaveTypeName ?? 'Leave Balance'}</h2>

          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
            aria-label="Close leave balance details"
          >
            &times;
          </button>
        </div>

        <div className="act-modal-form leave-balance-detail-form">
          {loading ? (
            <p className="leave-balance-detail-loading">
              Loading balance details...
            </p>
          ) : error ? (
            <div className="form-error">{error}</div>
          ) : detail ? (
            <div className="leave-balance-detail-grid">
              <div className="leave-balance-detail-item">
                <span>Annual Used</span>
                <strong>{formatLeaveDays(detail.annualUsed)}</strong>
              </div>

              <div className="leave-balance-detail-item">
                <span>Annual Pending</span>
                <strong>{formatLeaveDays(detail.annualPending)}</strong>
              </div>

              <div className="leave-balance-detail-item">
                <span>Monthly Used</span>
                <strong>{formatLeaveDays(detail.monthlyUsed)}</strong>
              </div>

              <div className="leave-balance-detail-item">
                <span>Monthly Pending</span>
                <strong>{formatLeaveDays(detail.monthlyPending)}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="act-modal-actions">
          <button type="button" className="act-cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
