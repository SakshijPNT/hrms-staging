import '../styles/Style.css'

export interface LeaveRequestDetail {
  id: number
  leaveTypeName: string
  startDate: string
  endDate: string
  totalDays: number
  isHalfDay: boolean
  session: string | null
  requestNote: string
  status: string
  managerNote: string
  approverEmailId: string | null
  approvedOn: string | null
  createdOn: string
}

interface LeaveRequestViewModalProps {
  open: boolean
  request: LeaveRequestDetail | null
  onClose: () => void
}

function formatSession(session: string | null) {
  if (!session) {
    return '-'
  }

  return session === 'FIRST_HALF' ? 'First Half' : 'Second Half'
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-- --'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export function LeaveRequestViewModal({
  open,
  request,
  onClose,
}: LeaveRequestViewModalProps) {
  if (!open || !request) {
    return null
  }

  return (
    <div className="act-modal-overlay">
      <div
        className="act-modal modal-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>Leave Request Details</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="act-modal-form">
          <div className="act-form-row">
            <label className="act-form-field">
              <span>Request Type</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.leaveTypeName}
                readOnly
              />
            </label>

            <label className="act-form-field">
              <span>Status</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.status}
                readOnly
              />
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Start Date</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.startDate}
                readOnly
              />
            </label>

            <label className="act-form-field">
              <span>End Date</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.endDate}
                readOnly
              />
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Total Days</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={String(request.totalDays)}
                readOnly
              />
            </label>

            <label className="act-form-field">
              <span>Half Day</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.isHalfDay ? 'Yes' : 'No'}
                readOnly
              />
            </label>
          </div>

          {request.isHalfDay && (
            <div className="act-form-row">
              <label className="act-form-field">
                <span>Session</span>
                <input
                  type="text"
                  className="approval-detail-readonly"
                  value={formatSession(request.session)}
                  readOnly
                />
              </label>
            </div>
          )}

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Request Note</span>
              <textarea
                rows={3}
                className="approval-detail-readonly"
                value={request.requestNote}
                readOnly
              />
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Manager Note</span>
              <textarea
                rows={3}
                className="approval-detail-readonly"
                value={request.managerNote}
                readOnly
              />
            </label>

            <label className="act-form-field">
              <span>Approver Email</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={request.approverEmailId ?? '-- --'}
                readOnly
              />
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Approved On</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={formatDateTime(request.approvedOn)}
                readOnly
              />
            </label>

            <label className="act-form-field">
              <span>Applied On</span>
              <input
                type="text"
                className="approval-detail-readonly"
                value={formatDateTime(request.createdOn)}
                readOnly
              />
            </label>
          </div>
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
