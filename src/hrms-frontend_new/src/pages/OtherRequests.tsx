import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import type { AxiosError } from 'axios'
import Layout from './Layout'
import '../styles/Style.css'
import { FiSearch, FiCheck, FiX } from 'react-icons/fi'
import api from '../services/api'
import { normalizeDate } from '../utils/attendanceFormat'
import type { AdminRegularizationQueueItem } from '../../types/regularization'
import { formatCorrectionTypeLabel } from '../../types/regularization'

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

function formatRegCorrectionLabel(item: {
  requestedCorrectionType: string
  session?: string | null
}) {
  const base = formatCorrectionTypeLabel(item.requestedCorrectionType)

  if (item.requestedCorrectionType === 'HALF_DAY' && item.session) {
    const sessionLabel =
      item.session === 'FIRST_HALF'
        ? '1st Half'
        : item.session === 'SECOND_HALF'
          ? '2nd Half'
          : null

    if (sessionLabel) {
      return `${base} (${sessionLabel})`
    }
  }

  return base
}

function formatEscalationFlags(item: AdminRegularizationQueueItem) {
  const flags: string[] = []

  if (item.isNoApprover) {
    flags.push('No Approver')
  }

  if (item.isOverdue) {
    flags.push(`Overdue (${item.pendingDays}d)`)
  }

  return flags.length > 0 ? flags.join(' · ') : 'Awaiting manager'
}

export function OtherRequestsPage() {
  return (
    <Layout title="Other Requests">
      <OtherRequestsContent />
    </Layout>
  )
}

function OtherRequestsContent() {
  const [queueItems, setQueueItems] = useState<AdminRegularizationQueueItem[]>(
    [],
  )
  const [queueLoading, setQueueLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionableOnly, setActionableOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const [reviewTarget, setReviewTarget] =
    useState<AdminRegularizationQueueItem | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null,
  )
  const [adminNote, setAdminNote] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true)

    try {
      const response = await api.get<AdminRegularizationQueueItem[]>(
        '/regularization/admin/pending-queue',
      )
      setQueueItems(response.data)
    } catch (err) {
      console.error('Failed to fetch admin regularization queue', err)
      setQueueItems([])
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, actionableOnly])

  const actionableCount = useMemo(
    () => queueItems.filter((item) => item.adminCanAct).length,
    [queueItems],
  )

  const filteredQueue = useMemo(() => {
    const query = search.toLowerCase().trim()

    return queueItems.filter((item) => {
      if (actionableOnly && !item.adminCanAct) {
        return false
      }

      if (!query) {
        return true
      }

      return (
        item.employeeName.toLowerCase().includes(query) ||
        item.employeeEmail.toLowerCase().includes(query) ||
        (item.managerName ?? '').toLowerCase().includes(query) ||
        normalizeDate(item.logDate).includes(query)
      )
    })
  }, [queueItems, search, actionableOnly])

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / rowsPerPage))
  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage
  const currentRows = filteredQueue.slice(indexOfFirstRow, indexOfLastRow)

  function openReview(
    item: AdminRegularizationQueueItem,
    action: 'approve' | 'reject',
  ) {
    setReviewTarget(item)
    setReviewAction(action)
    setAdminNote('')
    setActionError('')
  }

  function closeReview() {
    setReviewTarget(null)
    setReviewAction(null)
    setAdminNote('')
    setActionError('')
  }

  async function handleReviewSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!reviewTarget || !reviewAction) {
      return
    }

    if (!adminNote.trim()) {
      setActionError('Admin comment is required.')
      return
    }

    setActionId(reviewTarget.id)
    setActionError('')

    try {
      await api.patch(
        `/regularization/admin/applications/${reviewTarget.id}/${reviewAction}`,
        { approverRemark: adminNote.trim() },
      )

      closeReview()
      await fetchQueue()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setActionError(
        axiosError.response?.data?.message ??
          `Failed to ${reviewAction} regularization request.`,
      )
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="act-page">
      <div className="act-page-header">
        <div>
          <h1 className="act-title">Other Requests</h1>
          <p className="act-subtitle">
            Admin override for overdue or unassigned regularization requests
            across the organisation.
            {actionableCount > 0 && (
              <>
                {' '}
                <span className="other-requests-actionable-count">
                  {actionableCount} actionable
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="act-toolbar leaves-toolbar approval-toolbar">
        <div className="approval-search-wrapper">
          <FiSearch className="act-search-icon" />
          <input
            className="act-search"
            type="text"
            placeholder="Search employee, manager, or date"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="approval-filter-checkbox">
          <input
            type="checkbox"
            checked={actionableOnly}
            onChange={(e) => setActionableOnly(e.target.checked)}
          />
          Show actionable only
        </label>
      </div>

      <div className="act-table-wrapper">
        <table className="act-table approval-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Manager</th>
              <th>Date</th>
              <th>Correction</th>
              <th>Raised</th>
              <th>Escalation</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {queueLoading ? (
              <tr>
                <td colSpan={8} className="act-empty">
                  Loading regularization queue...
                </td>
              </tr>
            ) : filteredQueue.length === 0 ? (
              <tr>
                <td colSpan={8} className="act-empty">
                  No pending regularization requests.
                </td>
              </tr>
            ) : (
              currentRows.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.adminCanAct ? 'other-requests-actionable-row' : ''
                  }
                >
                  <td>
                    <div>{item.employeeName}</div>
                    <div className="act-date">{item.employeeEmail}</div>
                  </td>
                  <td>
                    {item.managerName ? (
                      <>
                        <div>{item.managerName}</div>
                        <div className="act-date">{item.managerEmail}</div>
                      </>
                    ) : (
                      <span className="other-requests-flag">No Approver</span>
                    )}
                  </td>
                  <td>{formatDisplayDate(normalizeDate(item.logDate))}</td>
                  <td>{formatRegCorrectionLabel(item)}</td>
                  <td>
                    {formatDisplayDate(
                      normalizeDate(item.createdOn.slice(0, 10)),
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        item.adminCanAct
                          ? 'other-requests-flag other-requests-flag--alert'
                          : 'act-date'
                      }
                    >
                      {formatEscalationFlags(item)}
                    </span>
                  </td>
                  <td>{item.reason}</td>
                  <td>
                    {item.adminCanAct ? (
                      <div className="table-action-group approval-action-group">
                        <button
                          type="button"
                          className="approval-action-btn reject"
                          title="Reject request"
                          disabled={actionId === item.id}
                          onClick={() => openReview(item, 'reject')}
                        >
                          <FiX />
                        </button>
                        <button
                          type="button"
                          className="approval-action-btn approve"
                          title="Approve request"
                          disabled={actionId === item.id}
                          onClick={() => openReview(item, 'approve')}
                        >
                          <FiCheck />
                        </button>
                      </div>
                    ) : (
                      <span className="act-date">Manager path</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!queueLoading && filteredQueue.length > 0 && (
          <div className="role-pagination">
            <div className="pagination-info">
              Showing {currentRows.length} of {filteredQueue.length}
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                &#8249;
              </button>
              <span className="pagination-page">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                &#8250;
              </button>
            </div>
          </div>
        )}
      </div>

      {reviewTarget && reviewAction && (
        <div className="act-modal-overlay">
          <div
            className="act-modal modal-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="act-modal-header">
              <h2>
                Admin {reviewAction === 'approve' ? 'Approve' : 'Reject'}{' '}
                Regularization
              </h2>
              <button
                type="button"
                className="act-modal-close"
                onClick={closeReview}
              >
                &times;
              </button>
            </div>

            <form
              className="act-modal-form approval-modal-form"
              onSubmit={handleReviewSubmit}
            >
              <div className="reg-summary-grid">
                <label className="act-form-field">
                  <span>Employee</span>
                  <input
                    type="text"
                    readOnly
                    className="approval-detail-readonly"
                    value={reviewTarget.employeeName}
                  />
                </label>
                <label className="act-form-field">
                  <span>Date</span>
                  <input
                    type="text"
                    readOnly
                    className="approval-detail-readonly"
                    value={formatDisplayDate(
                      normalizeDate(reviewTarget.logDate),
                    )}
                  />
                </label>
                <label className="act-form-field">
                  <span>Correction</span>
                  <input
                    type="text"
                    readOnly
                    className="approval-detail-readonly"
                    value={formatRegCorrectionLabel(reviewTarget)}
                  />
                </label>
                <label className="act-form-field">
                  <span>Escalation</span>
                  <input
                    type="text"
                    readOnly
                    className="approval-detail-readonly"
                    value={formatEscalationFlags(reviewTarget)}
                  />
                </label>
              </div>

              <div className="approval-employee-reason">
                <span>Employee Reason</span>
                <p className="approval-employee-reason-value">
                  {reviewTarget.reason}
                </p>
              </div>

              <label className="act-form-field">
                <span>Admin Comment *</span>
                <textarea
                  className="approval-manager-note"
                  placeholder="Required for audit trail"
                  value={adminNote}
                  onChange={(e) => {
                    setAdminNote(e.target.value)
                    if (actionError) {
                      setActionError('')
                    }
                  }}
                />
              </label>

              {actionError && <div className="form-error">{actionError}</div>}

              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeReview}
                  disabled={actionId === reviewTarget.id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={
                    reviewAction === 'approve'
                      ? 'act-submit-btn'
                      : 'act-reject-btn'
                  }
                  disabled={actionId === reviewTarget.id}
                >
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
