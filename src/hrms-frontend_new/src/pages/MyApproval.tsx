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
import Select from 'react-select'
import { FiSearch, FiEye, FiX, FiCheck } from 'react-icons/fi'
import api from '../services/api'
import { useSession } from '../context/SessionContext'
import { normalizeDate, formatAttendanceTime } from '../utils/attendanceFormat'
import type { ManagerRegularizationApplication } from '../../types/regularization'
import { formatCorrectionTypeLabel } from '../../types/regularization'
import {
  LeaveBalanceDetailModal,
  type LeaveBalanceDetail,
} from '../components/LeaveBalanceDetailModal'

interface LeaveBalanceCard {
  leaveTypeId: number
  leaveTypeName: string
  totalAnnual: number
  used: number
  pending: number
}

interface ManagerLeaveApplication {
  id: number
  userId: number
  userName: string
  leaveTypeId: number
  leaveTypeName: string
  fromDate: string
  toDate: string
  reason: string | null
  approvalStatus: string
  approverRemark: string | null
}

type DisplayStatus = 'Approve' | 'Reject' | 'Pending' | 'Cancelled'

interface ApprovalRequest {
  id: number
  userId: string
  userName: string
  requestType: string
  startDate: string
  endDate: string
  requestNote: string
  managerNote: string
  status: DisplayStatus
  canReview: boolean
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'pending', label: 'Pending' },
]

function formatDisplayDate(value: string): string {
  const normalized = normalizeDate(value)
  if (!normalized) {
    return value
  }

  const [year, month, day] = normalized.split('-')
  return `${day}/${month}/${year}`
}

function mapApprovalStatus(status: string): DisplayStatus {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'Approve'
    case 'REJECTED':
      return 'Reject'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return 'Pending'
  }
}

function mapApplication(item: ManagerLeaveApplication): ApprovalRequest {
  return {
    id: item.id,
    userId: String(item.userId),
    userName: item.userName,
    requestType: item.leaveTypeName,
    startDate: formatDisplayDate(item.fromDate),
    endDate: formatDisplayDate(item.toDate),
    requestNote: item.reason?.trim() || '-- --',
    managerNote: item.approverRemark?.trim() || '-- --',
    status: mapApprovalStatus(item.approvalStatus),
    canReview: item.approvalStatus.toUpperCase() === 'PENDING',
  }
}

function formatRegCorrectionLabel(item: ManagerRegularizationApplication) {
  const base = formatCorrectionTypeLabel(item.requestedCorrectionType)

  if (
    item.requestedCorrectionType === 'HALF_DAY' &&
    item.session
  ) {
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

function formatLeaveDays(value: number) {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded).padStart(2, '0')
  }

  return rounded.toFixed(2)
}

type ApprovalTab = 'leave' | 'regularization'

export function MyApprovalPage() {
  return (
    <Layout title="My Approval">
      <MyApprovalContent />
    </Layout>
  )
}

function MyApprovalContent() {
  const session = useSession()
  const timezone = session.timezone || 'Asia/Kolkata'

  const [approvalTab, setApprovalTab] = useState<ApprovalTab>('leave')
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceCard[]>([])
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(
    [],
  )
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regStatusFilter, setRegStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null)
  const [managerNote, setManagerNote] = useState('')
  const [actionError, setActionError] = useState('')
  const [balanceDetailOpen, setBalanceDetailOpen] = useState(false)
  const [balanceDetailLoading, setBalanceDetailLoading] = useState(false)
  const [balanceDetailError, setBalanceDetailError] = useState('')
  const [balanceDetail, setBalanceDetail] =
    useState<LeaveBalanceDetail | null>(null)

  const [regularizationItems, setRegularizationItems] = useState<
    ManagerRegularizationApplication[]
  >([])
  const [regularizationLoading, setRegularizationLoading] = useState(true)
  const [regReviewTarget, setRegReviewTarget] =
    useState<ManagerRegularizationApplication | null>(null)
  const [regReviewAction, setRegReviewAction] = useState<
    'approve' | 'reject' | null
  >(null)
  const [regActionError, setRegActionError] = useState('')

  const rowsPerPage = 10

  const isModalOpen =
    viewModalOpen ||
    balanceDetailOpen ||
    regReviewTarget != null

  const typeFilterOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(approvalRequests.map((request) => request.requestType)),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { value: 'all', label: 'All Type' },
      ...uniqueTypes.map((leaveTypeName) => ({
        value: leaveTypeName.toLowerCase(),
        label: leaveTypeName,
      })),
    ]
  }, [approvalRequests])

  const fetchLeaveBalances = useCallback(async () => {
    setBalancesLoading(true)

    try {
      const response = await api.get<
        {
          leaveTypeId: number
          leaveTypeName: string
          totalAnnual: number
          used: number
          pending: number
        }[]
      >('/user-leaves/balances')

      setLeaveBalances(
        (response.data ?? []).map((item) => ({
          leaveTypeId: item.leaveTypeId,
          leaveTypeName: item.leaveTypeName,
          totalAnnual: Number(item.totalAnnual),
          used: Number(item.used),
          pending: Number(item.pending),
        })),
      )
    } catch (fetchError) {
      console.error('Failed to fetch leave balances', fetchError)
      setLeaveBalances([])
    } finally {
      setBalancesLoading(false)
    }
  }, [])

  const fetchApprovalRequests = useCallback(async () => {
    setRequestsLoading(true)

    try {
      const response = await api.get<ManagerLeaveApplication[]>(
        '/user-leaves/pending-approvals',
      )

      setApprovalRequests((response.data ?? []).map(mapApplication))
    } catch (fetchError) {
      console.error('Failed to fetch leave approvals', fetchError)
      setApprovalRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  const fetchRegularizationApprovals = useCallback(async () => {
    setRegularizationLoading(true)

    try {
      const response = await api.get<ManagerRegularizationApplication[]>(
        '/regularization/manager-requests',
      )

      setRegularizationItems(
        (response.data ?? []).map((item) => ({
          ...item,
          employeeName:
            item.employeeName ??
            (item as { EmployeeName?: string }).EmployeeName ??
            'Unknown',
          employeeEmail:
            item.employeeEmail ??
            (item as { EmployeeEmail?: string }).EmployeeEmail ??
            '',
          logDate: normalizeDate(item.logDate),
          requestedCorrectionType:
            item.requestedCorrectionType ??
            (item as { RequestedCorrectionType?: string })
              .RequestedCorrectionType ??
            '',
          approvalStatus:
            item.approvalStatus ??
            (item as { ApprovalStatus?: string }).ApprovalStatus ??
            'PENDING',
          session:
            item.session ??
            (item as { Session?: string }).Session ??
            null,
          reason:
            item.reason ??
            (item as { Reason?: string }).Reason ??
            '',
        })),
      )
    } catch (fetchError) {
      console.error('Failed to fetch regularization approvals', fetchError)
      setRegularizationItems([])
    } finally {
      setRegularizationLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLeaveBalances()
    void fetchApprovalRequests()
    void fetchRegularizationApprovals()
  }, [fetchApprovalRequests, fetchLeaveBalances, fetchRegularizationApprovals])

  useEffect(() => {
    if (regularizationItems.length > 0 && approvalRequests.length === 0) {
      setApprovalTab('regularization')
    }
  }, [regularizationItems.length, approvalRequests.length])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter, regStatusFilter, search, approvalTab])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isModalOpen])

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim()

    return approvalRequests.filter((request) => {
      const matchesType =
        typeFilter === 'all' ||
        request.requestType.toLowerCase().includes(typeFilter)

      const matchesStatus =
        statusFilter === 'all' ||
        request.status.toLowerCase() === statusFilter

      const matchesSearch =
        !query ||
        request.userId.toLowerCase().includes(query) ||
        request.userName.toLowerCase().includes(query)

      return matchesType && matchesStatus && matchesSearch
    })
  }, [approvalRequests, typeFilter, statusFilter, search])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / rowsPerPage),
  )

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage

  const currentRows = filteredRequests.slice(
    indexOfFirstRow,
    indexOfLastRow,
  )

  function getStatusClass(status: ApprovalRequest['status']) {
    if (status === 'Cancelled') {
      return 'reject'
    }

    return status.toLowerCase()
  }

  function openViewModal(request: ApprovalRequest) {
    setSelectedRequest(request)
    setManagerNote('')
    setActionError('')
    setViewModalOpen(true)
  }

  function closeViewModal() {
    setViewModalOpen(false)
    setSelectedRequest(null)
    setManagerNote('')
    setActionError('')
  }

  async function handleApprove() {
    if (!selectedRequest?.canReview) {
      return
    }

    setActionId(selectedRequest.id)
    setActionError('')

    try {
      await api.patch(
        `/user-leaves/applications/${selectedRequest.id}/approve`,
        { approverRemark: managerNote.trim() || null },
      )

      closeViewModal()
      await fetchApprovalRequests()
      await fetchLeaveBalances()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setActionError(
        axiosError.response?.data?.message ??
          'Failed to approve leave request.',
      )
    } finally {
      setActionId(null)
    }
  }

  async function handleReject() {
    if (!managerNote.trim()) {
      setActionError('Rejection note is required.')
      return
    }

    if (!selectedRequest?.canReview) {
      return
    }

    setActionId(selectedRequest.id)
    setActionError('')

    try {
      await api.patch(
        `/user-leaves/applications/${selectedRequest.id}/reject`,
        { approverRemark: managerNote.trim() },
      )

      closeViewModal()
      await fetchApprovalRequests()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setActionError(
        axiosError.response?.data?.message ??
          'Failed to reject leave request.',
      )
    } finally {
      setActionId(null)
    }
  }

  async function openBalanceDetail(leaveTypeId: number) {
    setBalanceDetailOpen(true)
    setBalanceDetailLoading(true)
    setBalanceDetailError('')
    setBalanceDetail(null)

    try {
      const response = await api.get<{
        leaveTypeId: number
        leaveTypeName: string
        annualUsed: number
        annualPending: number
        monthlyUsed: number
        monthlyPending: number
      }>(`/user-leaves/balances/${leaveTypeId}/detail`)

      setBalanceDetail({
        leaveTypeId: response.data.leaveTypeId,
        leaveTypeName: response.data.leaveTypeName,
        annualUsed: Number(response.data.annualUsed),
        annualPending: Number(response.data.annualPending),
        monthlyUsed: Number(response.data.monthlyUsed),
        monthlyPending: Number(response.data.monthlyPending),
      })
    } catch (fetchError) {
      console.error('Failed to fetch leave balance detail', fetchError)
      setBalanceDetailError('Unable to load leave balance details.')
    } finally {
      setBalanceDetailLoading(false)
    }
  }

  function closeBalanceDetail() {
    setBalanceDetailOpen(false)
    setBalanceDetailError('')
    setBalanceDetail(null)
  }

  function openRegReview(
    item: ManagerRegularizationApplication,
    action: 'approve' | 'reject',
  ) {
    setRegReviewTarget(item)
    setRegReviewAction(action)
    setManagerNote('')
    setRegActionError('')
  }

  function closeRegReview() {
    setRegReviewTarget(null)
    setRegReviewAction(null)
    setManagerNote('')
    setRegActionError('')
  }

  async function handleRegReviewSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!regReviewTarget || !regReviewAction) {
      return
    }

    if (regReviewAction === 'reject' && !managerNote.trim()) {
      setRegActionError('Rejection note is required.')
      return
    }

    setActionId(regReviewTarget.id)
    setRegActionError('')

    try {
      await api.patch(
        `/regularization/applications/${regReviewTarget.id}/${regReviewAction}`,
        { approverRemark: managerNote.trim() || null },
      )

      closeRegReview()
      await fetchRegularizationApprovals()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setRegActionError(
        axiosError.response?.data?.message ??
          `Failed to ${regReviewAction} regularization request.`,
      )
    } finally {
      setActionId(null)
    }
  }

  const pendingRegularizationCount = useMemo(
    () =>
      regularizationItems.filter(
        (item) => item.approvalStatus?.toUpperCase() === 'PENDING',
      ).length,
    [regularizationItems],
  )

  const filteredRegularizations = useMemo(() => {
    const query = search.toLowerCase().trim()

    return regularizationItems.filter((item) => {
      const matchesStatus =
        regStatusFilter === 'all' ||
        mapApprovalStatus(item.approvalStatus).toLowerCase() ===
          regStatusFilter

      if (!matchesStatus) {
        return false
      }

      if (!query) {
        return true
      }

      return (
        item.employeeName.toLowerCase().includes(query) ||
        item.employeeEmail.toLowerCase().includes(query) ||
        normalizeDate(item.logDate).includes(query)
      )
    })
  }, [regularizationItems, search, regStatusFilter])

  const regTotalPages = Math.max(
    1,
    Math.ceil(filteredRegularizations.length / rowsPerPage),
  )

  const regIndexOfLastRow = currentPage * rowsPerPage
  const regIndexOfFirstRow = regIndexOfLastRow - rowsPerPage
  const currentRegRows = filteredRegularizations.slice(
    regIndexOfFirstRow,
    regIndexOfLastRow,
  )

  return (
    <div className="act-page">
     

      {/* <div className="act-stats leaves-stats">
          {balancesLoading ? (
            <div className="act-leave-card leaves-stats-loading">
              Loading leave balances...
            </div>
          ) : leaveBalances.length === 0 ? (
            <div className="act-leave-card leaves-stats-empty">
              No leave types configured for your company.
            </div>
          ) : (
            leaveBalances.map((leave) => (
              <div key={leave.leaveTypeId} className="act-leave-card">
                <div className="act-leave-card-content">
                  <h3>
                    {leave.leaveTypeName}:{' '}
                    <span className="act-leave-card-total">
                      {formatLeaveDays(leave.totalAnnual)}
                    </span>
                  </h3>

                  <div className="act-leave-card-meta">
                    <button
                      type="button"
                      className="act-leave-card-stat-btn"
                      onClick={() =>
                        void openBalanceDetail(leave.leaveTypeId)
                      }
                    >
                      Used: {formatLeaveDays(leave.used)}
                    </button>
                    <button
                      type="button"
                      className="act-leave-card-stat-btn"
                      onClick={() =>
                        void openBalanceDetail(leave.leaveTypeId)
                      }
                    >
                      Pending: {formatLeaveDays(leave.pending)}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div> */}

        <div className="act-tabs approval-tabs">
          <button
            type="button"
            className={`act-tab approval-tab${approvalTab === 'leave' ? ' act-tab--active approval-tab--active' : ''}`}
            onClick={() => {
              setApprovalTab('leave')
              setCurrentPage(1)
            }}
          >
            Leave Requests
          </button>
          <button
            type="button"
            className={`act-tab approval-tab${approvalTab === 'regularization' ? ' act-tab--active approval-tab--active' : ''}`}
            onClick={() => {
              setApprovalTab('regularization')
              setRegStatusFilter('all')
              setCurrentPage(1)
            }}
          >
            Regularization
            {pendingRegularizationCount > 0 && (
              <span className="approval-tab-badge">
                {pendingRegularizationCount}
              </span>
            )}
          </button>
        </div>

        <div className="act-toolbar leaves-toolbar approval-toolbar">
          <div className="leaves-filters approval-filters">
            {approvalTab === 'leave' ? (
              <>
            <div className="leaves-filter-field">
              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={typeFilterOptions}
                value={
                  typeFilterOptions.find(
                    (option) => option.value === typeFilter,
                  ) || typeFilterOptions[0]
                }
                onChange={(selected) =>
                  setTypeFilter(selected ? String(selected.value) : 'all')
                }
              />
            </div>

            <div className="leaves-filter-field">
              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={STATUS_FILTER_OPTIONS}
                value={
                  STATUS_FILTER_OPTIONS.find(
                    (option) => option.value === statusFilter,
                  ) || STATUS_FILTER_OPTIONS[0]
                }
                onChange={(selected) =>
                  setStatusFilter(selected ? String(selected.value) : 'all')
                }
              />
            </div>
              </>
            ) : (
              <div className="leaves-filter-field">
                <Select
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuPlacement="auto"
                  menuShouldScrollIntoView={false}
                  classNamePrefix="act-select"
                  options={STATUS_FILTER_OPTIONS}
                  value={
                    STATUS_FILTER_OPTIONS.find(
                      (option) => option.value === regStatusFilter,
                    ) || STATUS_FILTER_OPTIONS[0]
                  }
                  onChange={(selected) =>
                    setRegStatusFilter(selected ? String(selected.value) : 'all')
                  }
                />
              </div>
            )}

            <div className="approval-search-wrapper">
              <FiSearch className="act-search-icon" />
              <input
                className="act-search"
                type="text"
                placeholder={
                  approvalTab === 'leave'
                    ? 'Search by User'
                    : 'Search regularization requests'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {approvalTab === 'leave' ? (
        <div className="act-table-wrapper">
          <table className="act-table approval-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>User Name</th>
                <th>Request Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className="table-action-col">Action</th>
              </tr>
            </thead>

            <tbody>
              {requestsLoading ? (
                <tr>
                  <td colSpan={7} className="act-empty">
                    Loading approval requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="act-empty">
                    No approval requests found.
                  </td>
                </tr>
              ) : (
                currentRows.map((request) => (
                  <tr key={request.id}>
                    <td>{request.userId}</td>
                    <td>{request.userName}</td>
                    <td>{request.requestType}</td>
                    <td>{request.startDate}</td>
                    <td>{request.endDate}</td>
                    <td>
                      <span
                        className={`leave-status-text ${getStatusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="table-action-col">
                      <div className="table-action-group approval-action-group">
                        <button
                          type="button"
                          className="approval-action-btn view"
                          title="View request"
                          aria-label={`View request for ${request.userName}`}
                          onClick={() => openViewModal(request)}
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!requestsLoading && filteredRequests.length > 0 && (
            <div className="role-pagination">
              <div className="pagination-info">
                Showing {currentRows.length} of {filteredRequests.length}
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

                <span className="pagination-text">
                  Page {currentPage} of {totalPages}
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
        ) : (
        <div className="act-table-wrapper">
          <table className="act-table approval-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Correction</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="table-action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {regularizationLoading ? (
                <tr>
                  <td colSpan={6} className="act-empty">
                    Loading regularization requests...
                  </td>
                </tr>
              ) : filteredRegularizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="act-empty">
                    No regularization requests found.
                  </td>
                </tr>
              ) : (
                currentRegRows.map((item) => {
                  const canReview =
                    item.approvalStatus?.toUpperCase() === 'PENDING'

                  return (
                  <tr key={item.id}>
                    <td>
                      <div>{item.employeeName}</div>
                      <div className="act-date">{item.employeeEmail}</div>
                    </td>
                    <td>{formatDisplayDate(normalizeDate(item.logDate))}</td>
                    <td>
                      {formatRegCorrectionLabel(item)}
                    </td>
                    <td>{item.reason}</td>
                    <td>
                      <span
                        className={`leave-status-text ${getStatusClass(mapApprovalStatus(item.approvalStatus))}`}
                      >
                        {mapApprovalStatus(item.approvalStatus)}
                      </span>
                    </td>
                    <td className="table-action-col">
                      <div className="table-action-group approval-action-group">
                        <button
                          type="button"
                          className="approval-action-btn reject"
                          title="Reject request"
                          disabled={!canReview || actionId === item.id}
                          onClick={() => openRegReview(item, 'reject')}
                        >
                          <FiX />
                        </button>
                        <button
                          type="button"
                          className="approval-action-btn approve"
                          title="Approve request"
                          disabled={!canReview || actionId === item.id}
                          onClick={() => openRegReview(item, 'approve')}
                        >
                          <FiCheck />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {!regularizationLoading && filteredRegularizations.length > 0 && (
            <div className="role-pagination">
              <div className="pagination-info">
                Showing {currentRegRows.length} of {filteredRegularizations.length}
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
                <span className="pagination-text">
                  Page {currentPage} of {regTotalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === regTotalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  &#8250;
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {viewModalOpen && selectedRequest && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>Leave Request Details</h2>

                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeViewModal}
                >
                  &times;
                </button>
              </div>

              <div className="act-modal-form">
                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>User ID</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.userId}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>User Name</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.userName}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Request Type</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.requestType}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>Status</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.status}
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
                      value={selectedRequest.startDate}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>End Date</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.endDate}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Request Note</span>
                    <textarea
                      rows={3}
                      className="approval-detail-readonly"
                      value={selectedRequest.requestNote}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>
                      Manager Note
                      {selectedRequest.canReview ? ' (required for reject)' : ''}
                    </span>
                    <textarea
                      rows={3}
                      className={
                        selectedRequest.canReview
                          ? 'approval-manager-note'
                          : 'approval-detail-readonly'
                      }
                      placeholder={
                        selectedRequest.canReview ? '-Enter Text-' : undefined
                      }
                      value={
                        selectedRequest.canReview
                          ? managerNote
                          : selectedRequest.managerNote
                      }
                      readOnly={!selectedRequest.canReview}
                      onChange={(event) => {
                        setManagerNote(event.target.value)
                        if (actionError) {
                          setActionError('')
                        }
                      }}
                    />
                  </label>
                </div>

                {actionError && (
                  <div className="form-error">{actionError}</div>
                )}
              </div>

              <div className="act-modal-actions">
                {selectedRequest.canReview ? (
                  <>
                    <button
                      type="button"
                      className="act-reject-btn"
                      disabled={actionId === selectedRequest.id}
                      onClick={() => void handleReject()}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="act-submit-btn"
                      disabled={actionId === selectedRequest.id}
                      onClick={() => void handleApprove()}
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="act-cancel-btn"
                    onClick={closeViewModal}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {regReviewTarget && regReviewAction && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>
                  {regReviewAction === 'approve' ? 'Approve' : 'Reject'}{' '}
                  Regularization
                </h2>
                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeRegReview}
                >
                  &times;
                </button>
              </div>

              <form
                className="act-modal-form approval-modal-form"
                onSubmit={handleRegReviewSubmit}
              >
                <div className="reg-summary-grid">
                  <label className="act-form-field">
                    <span>Employee</span>
                    <input
                      type="text"
                      readOnly
                      className="approval-detail-readonly"
                      value={regReviewTarget.employeeName}
                    />
                  </label>
                  <label className="act-form-field">
                    <span>Date</span>
                    <input
                      type="text"
                      readOnly
                      className="approval-detail-readonly"
                      value={formatDisplayDate(normalizeDate(regReviewTarget.logDate))}
                    />
                  </label>
                  <label className="act-form-field">
                    <span>Correction</span>
                    <input
                      type="text"
                      readOnly
                      className="approval-detail-readonly"
                      value={formatCorrectionTypeLabel(
                        regReviewTarget.requestedCorrectionType,
                      )}
                    />
                  </label>
                  <label className="act-form-field">
                    <span>Requested Check In</span>
                    <input
                      type="text"
                      readOnly
                      className="approval-detail-readonly"
                      value={formatAttendanceTime(
                        regReviewTarget.requestedCheckInTime,
                        timezone,
                      )}
                    />
                  </label>
                  <label className="act-form-field">
                    <span>Requested Check Out</span>
                    <input
                      type="text"
                      readOnly
                      className="approval-detail-readonly"
                      value={formatAttendanceTime(
                        regReviewTarget.requestedCheckOutTime,
                        timezone,
                      )}
                    />
                  </label>
                </div>

                <div className="approval-employee-reason">
                  <span>Employee Reason</span>
                  <p className="approval-employee-reason-value">
                    {regReviewTarget.reason}
                  </p>
                </div>

                <label className="act-form-field">
                  <span>
                    Manager Note
                    {regReviewAction === 'reject' ? ' *' : ''}
                  </span>
                  <textarea
                    className="approval-manager-note"
                    placeholder="-Enter Text-"
                    value={managerNote}
                    onChange={(e) => {
                      setManagerNote(e.target.value)
                      if (regActionError) {
                        setRegActionError('')
                      }
                    }}
                  />
                </label>

                {regActionError && (
                  <div className="form-error">{regActionError}</div>
                )}

                <div className="act-modal-actions">
                  <button
                    type="button"
                    className="act-cancel-btn"
                    onClick={closeRegReview}
                    disabled={actionId === regReviewTarget.id}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={
                      regReviewAction === 'approve'
                        ? 'act-submit-btn'
                        : 'act-reject-btn'
                    }
                    disabled={actionId === regReviewTarget.id}
                  >
                    {regReviewAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <LeaveBalanceDetailModal
          open={balanceDetailOpen}
          loading={balanceDetailLoading}
          error={balanceDetailError}
          detail={balanceDetail}
          onClose={closeBalanceDetail}
          formatLeaveDays={formatLeaveDays}
        />
      </div>
  )
}
