import Layout from './Layout'
import '../styles/Style.css'
import { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import api from '../services/api'
import { formatAttendanceTime, normalizeDate } from '../utils/attendanceFormat'
import type { ManagerRegularizationApplication } from '../../types/regularization'
import { formatCorrectionTypeLabel } from '../../types/regularization'
import type { SessionInfo } from '../../types/auth'

export function RegularizationApprovalsPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [items, setItems] = useState<ManagerRegularizationApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [remark, setRemark] = useState('')
  const [reviewTarget, setReviewTarget] =
    useState<ManagerRegularizationApplication | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null,
  )
  const [error, setError] = useState('')

  const timezone = session?.timezone ?? 'Asia/Kolkata'

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<ManagerRegularizationApplication[]>(
        '/regularization/pending-approvals',
      )
      setItems(response.data)
    } catch (err) {
      console.error('Error fetching pending regularizations', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await api.get<SessionInfo>('/auth/session')
        setSession(response.data)
      } catch {
        setSession(null)
      }
    }

    void loadSession()
    void fetchPending()
  }, [fetchPending])

  function openReview(
    item: ManagerRegularizationApplication,
    action: 'approve' | 'reject',
  ) {
    setReviewTarget(item)
    setReviewAction(action)
    setRemark('')
    setError('')
  }

  function closeReview() {
    setReviewTarget(null)
    setReviewAction(null)
    setRemark('')
    setError('')
  }

  async function submitReview() {
    if (!reviewTarget || !reviewAction) {
      return
    }

    setActionId(reviewTarget.id)
    setError('')

    try {
      await api.patch(
        `/regularization/applications/${reviewTarget.id}/${reviewAction}`,
        { approverRemark: remark.trim() || null },
      )
      closeReview()
      await fetchPending()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(
        axiosError.response?.data?.message ??
          `Failed to ${reviewAction} request.`,
      )
    } finally {
      setActionId(null)
    }
  }

  return (
    <Layout title="Regularization Approvals">
      <div className="act-page">
        <div className="act-page-header">
          <div>
            <nav className="act-breadcrumb">
              <span className="act-breadcrumb-link">Applications</span>
            </nav>
            <h1 className="act-title">Regularization Approvals</h1>
          </div>
        </div>

        <div className="act-table-wrapper">
          <table className="act-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Actual IN</th>
                <th>Actual OUT</th>
                <th>Original Status</th>
                <th>Requested Correction</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="act-empty">
                    Loading pending requests...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="act-empty">
                    No pending regularization requests.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.employeeName}</div>
                      <div className="act-date">{item.employeeEmail}</div>
                    </td>
                    <td>{normalizeDate(item.logDate)}</td>
                    <td>
                      {formatAttendanceTime(
                        item.originalCheckInTime,
                        timezone,
                      )}
                    </td>
                    <td>
                      {formatAttendanceTime(
                        item.originalCheckOutTime,
                        timezone,
                      )}
                    </td>
                    <td>{item.originalAttendanceStatus.replace('_', ' ')}</td>
                    <td>{formatCorrectionTypeLabel(item.requestedCorrectionType)}</td>
                    <td>{item.reason}</td>
                    <td>
                      <div className="reg-action-group">
                        <button
                          type="button"
                          className="act-submit-btn reg-action-btn"
                          disabled={actionId === item.id}
                          onClick={() => openReview(item, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="act-cancel-btn reg-action-btn"
                          disabled={actionId === item.id}
                          onClick={() => openReview(item, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {reviewTarget && reviewAction && (
          <div className="act-modal-overlay">
            <div
              className="act-modal reg-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'} Request
                </h2>
                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeReview}
                >
                  &times;
                </button>
              </div>

              <div className="act-modal-form">
                <p>
                  <strong>{reviewTarget.employeeName}</strong> —{' '}
                  {normalizeDate(reviewTarget.logDate)}
                </p>

                <label className="act-form-field">
                  <span>Remark (optional)</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={remark}
                    placeholder="Add approver remark"
                    onChange={(event) => setRemark(event.target.value)}
                  />
                </label>

                {error && <div className="form-error">{error}</div>}

                <div className="act-modal-actions">
                  <button
                    type="button"
                    className="act-cancel-btn"
                    onClick={closeReview}
                    disabled={actionId != null}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="act-submit-btn"
                    disabled={actionId != null}
                    onClick={() => void submitReview()}
                  >
                    {actionId != null
                      ? 'Saving...'
                      : reviewAction === 'approve'
                        ? 'Confirm Approve'
                        : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
