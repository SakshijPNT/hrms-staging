import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import Select from 'react-select'
import { FiEye, FiTrash2 } from 'react-icons/fi'
import { MdEdit } from 'react-icons/md'

import api from '../services/api'
import {
  ApplyLeaveModal,
  type LeaveApplicationEditData,
} from '../components/ApplyLeaveModal'
import {
  LeaveRequestViewModal,
  type LeaveRequestDetail,
} from '../components/LeaveRequestViewModal'
import {
  LeaveBalanceDetailModal,
  type LeaveBalanceDetail,
} from '../components/LeaveBalanceDetailModal'
import {
  getLocalTodayIso,
  normalizeDate,
} from '../utils/attendanceFormat'
import type { AxiosError } from 'axios'
import { useAlert } from '../context/AlertContext'

interface LeaveBalanceCard {
  leaveTypeId: number
  leaveTypeName: string
  totalAnnual: number
  monthlyLeave: number
  used: number
  pending: number
}

interface LeaveRequest {
  id: number
  requestType: string
  startDate: string
  endDate: string
  requestNote: string
  status: 'Approve' | 'Reject' | 'Pending' | 'Cancelled'
  managerNote: string
}

interface ApiLeaveApplication {
  id: number
  leaveTypeId: number
  leaveTypeName: string
  fromDate: string
  toDate: string
  totalDays: number
  isHalfDay: boolean
  session: string | null
  reason: string | null
  approvalStatus: string
  approverEmailId: string | null
  approverRemark: string | null
  approvedOn: string | null
  createdOn: string
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

function mapApprovalStatus(
  status: string,
): LeaveRequest['status'] {
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

function mapApplication(item: ApiLeaveApplication): LeaveRequest {
  return {
    id: item.id,
    requestType: item.leaveTypeName,
    startDate: formatDisplayDate(item.fromDate),
    endDate: formatDisplayDate(item.toDate),
    requestNote: item.reason?.trim() || '-- --',
    status: mapApprovalStatus(item.approvalStatus),
    managerNote: item.approverRemark?.trim() || '-- --',
  }
}

function toViewDetail(item: ApiLeaveApplication): LeaveRequestDetail {
  return {
    id: item.id,
    leaveTypeName: item.leaveTypeName,
    startDate: formatDisplayDate(item.fromDate),
    endDate: formatDisplayDate(item.toDate),
    totalDays: Number(item.totalDays),
    isHalfDay: item.isHalfDay,
    session: item.session,
    requestNote: item.reason?.trim() || '-- --',
    status: mapApprovalStatus(item.approvalStatus),
    managerNote: item.approverRemark?.trim() || '-- --',
    approverEmailId: item.approverEmailId,
    approvedOn: item.approvedOn,
    createdOn: item.createdOn,
  }
}

function toEditData(item: ApiLeaveApplication): LeaveApplicationEditData {
  return {
    id: item.id,
    leaveTypeId: item.leaveTypeId,
    fromDate: normalizeDate(item.fromDate),
    toDate: normalizeDate(item.toDate),
    isHalfDay: item.isHalfDay,
    session: item.session,
    reason: item.reason,
  }
}

function canModifyApplication(item: ApiLeaveApplication) {
  if (item.approvalStatus.toUpperCase() !== 'PENDING') {
    return false
  }

  const fromDate = normalizeDate(item.fromDate)
  if (!fromDate) {
    return false
  }

  const today = getLocalTodayIso()
  return fromDate > today
}

export function MyLeavesPage() {
  const { showAlert, showConfirm } = useAlert()

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceCard[]>([])
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [leaveApplications, setLeaveApplications] = useState<
    ApiLeaveApplication[]
  >([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editApplication, setEditApplication] =
    useState<LeaveApplicationEditData | null>(null)
  const [viewRequest, setViewRequest] = useState<LeaveRequestDetail | null>(
    null,
  )
  const [actionId, setActionId] = useState<number | null>(null)
  const [balanceDetailOpen, setBalanceDetailOpen] = useState(false)
  const [balanceDetailLoading, setBalanceDetailLoading] = useState(false)
  const [balanceDetailError, setBalanceDetailError] = useState('')
  const [balanceDetail, setBalanceDetail] =
    useState<LeaveBalanceDetail | null>(null)

  const rowsPerPage = 10

  const typeFilterOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(leaveRequests.map((request) => request.requestType)),
    ).sort((a, b) => a.localeCompare(b))

    return [
      { value: 'all', label: 'All Type' },
      ...uniqueTypes.map((leaveTypeName) => ({
        value: leaveTypeName.toLowerCase(),
        label: leaveTypeName,
      })),
    ]
  }, [leaveRequests])

  const fetchLeaveApplications = useCallback(async () => {
    setRequestsLoading(true)

    try {
      const response = await api.get<ApiLeaveApplication[]>(
        '/user-leaves/applications',
      )
      const items = response.data ?? []
      setLeaveApplications(items)
      setLeaveRequests(items.map(mapApplication))
    } catch (fetchError) {
      console.error('Failed to fetch leave applications', fetchError)
      setLeaveApplications([])
      setLeaveRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLeaveBalances()
    void fetchLeaveApplications()
  }, [fetchLeaveApplications])

  async function fetchLeaveBalances() {
    setBalancesLoading(true)

    try {
      const response = await api.get<
        {
          leaveTypeId: number
          leaveTypeName: string
          totalAnnual: number
          monthlyLeave: number
          used: number
          pending: number
        }[]
      >('/user-leaves/balances')

      setLeaveBalances(
        (response.data ?? []).map((item) => ({
          leaveTypeId: item.leaveTypeId,
          leaveTypeName: item.leaveTypeName,
          totalAnnual: Number(item.totalAnnual),
          monthlyLeave: Number(item.monthlyLeave),
          used: Number(item.used),
          pending: Number(item.pending),
        }))
      )
    } catch (fetchError) {
      console.error('Failed to fetch leave balances', fetchError)
      setLeaveBalances([])
    } finally {
      setBalancesLoading(false)
    }
  }

  function formatLeaveDays(value: number) {
    const rounded = Math.round(value * 100) / 100
    if (Number.isInteger(rounded)) {
      return String(rounded).padStart(2, '0')
    }

    return rounded.toFixed(2)
  }

  useEffect(() => {
    if (modalOpen || balanceDetailOpen || viewRequest) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [modalOpen, balanceDetailOpen, viewRequest])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter])

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesType =
        typeFilter === 'all' ||
        request.requestType
          .toLowerCase()
          .includes(typeFilter)

      const matchesStatus =
        statusFilter === 'all' ||
        request.status.toLowerCase() === statusFilter

      return matchesType && matchesStatus
    })
  }, [leaveRequests, typeFilter, statusFilter])

  const totalPages = Math.ceil(
    filteredRequests.length / rowsPerPage
  )

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage

  const currentRows = filteredRequests.slice(
    indexOfFirstRow,
    indexOfLastRow
  )

  function openModal() {
    setEditApplication(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditApplication(null)
  }

  function openViewModal(applicationId: number) {
    const item = leaveApplications.find((entry) => entry.id === applicationId)
    if (!item) {
      return
    }

    setViewRequest(toViewDetail(item))
  }

  function closeViewModal() {
    setViewRequest(null)
  }

  function openEditModal(applicationId: number) {
    const item = leaveApplications.find((entry) => entry.id === applicationId)
    if (!item || !canModifyApplication(item)) {
      return
    }

    setEditApplication(toEditData(item))
    setModalOpen(true)
  }

  async function handleDeleteApplication(applicationId: number) {
    const item = leaveApplications.find((entry) => entry.id === applicationId)
    if (!item || !canModifyApplication(item)) {
      return
    }

    const confirmed = await showConfirm(
      'Delete this leave request? This action cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    setActionId(applicationId)

    try {
      await api.delete(`/user-leaves/applications/${applicationId}`)
      await fetchLeaveApplications()
      await fetchLeaveBalances()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      const message =
        axiosError.response?.data?.message ??
        'Failed to delete leave request.'
      showAlert({
        title: 'Error',
        message,
      })
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

  function getStatusClass(status: LeaveRequest['status']) {
    if (status === 'Cancelled') {
      return 'reject'
    }

    return status.toLowerCase()
  }

  return (
    <Layout title="My Leaves">
      <div className="act-page">
        <div className="act-stats leaves-stats">
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
              <div
                key={leave.leaveTypeId}
                className="act-leave-card"
              >
                <div className="act-leave-card-content">
                  <h3>
                    {leave.leaveTypeName}:{' '}
                    <span className="act-leave-card-total">
                      {formatLeaveDays(leave.totalAnnual)}
                    </span>
                  </h3>

                  <p className="act-leave-card-monthly">
                    Monthly: {formatLeaveDays(leave.monthlyLeave)}
                  </p>

                  <div className="act-leave-card-meta">
                    <button
                      type="button"
                      className="act-leave-card-stat-btn"
                    >
                      Used: {formatLeaveDays(leave.used)}
                    </button>
                    <button
                      type="button"
                      className="act-leave-card-stat-btn"
                    >
                      Pending: {formatLeaveDays(leave.pending)}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="act-toolbar leaves-toolbar">
          <div className="leaves-filters">
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
                    (option) => option.value === typeFilter
                  ) || typeFilterOptions[0]
                }
                onChange={(selected) =>
                  setTypeFilter(
                    selected ? String(selected.value) : 'all'
                  )
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
                    (option) =>
                      option.value === statusFilter
                  ) || STATUS_FILTER_OPTIONS[0]
                }
                onChange={(selected) =>
                  setStatusFilter(
                    selected ? String(selected.value) : 'all'
                  )
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="act-new-btn"
            onClick={openModal}
          >
            Apply Leave
          </button>
        </div>

        <div className="act-table-wrapper">
          <table className="act-table leaves-table">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Request Note</th>
                <th>Status</th>
                <th>Manager Note</th>
                <th className="table-action-col">Action</th>
              </tr>
            </thead>

            <tbody>
              {requestsLoading ? (
                <tr>
                  <td colSpan={7} className="act-empty">
                    Loading leave requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                currentRows.map((request) => {
                  const application = leaveApplications.find(
                    (entry) => entry.id === request.id,
                  )
                  const canModify = application
                    ? canModifyApplication(application)
                    : false

                  return (
                  <tr key={request.id}>
                    <td>{request.requestType}</td>
                    <td>{request.startDate}</td>
                    <td>{request.endDate}</td>
                    <td>{request.requestNote}</td>
                    <td>
                      <span
                        className={`leave-status-text ${getStatusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>{request.managerNote}</td>
                    <td className="table-action-col">
                      <div className="table-action-group">
                        <button
                          type="button"
                          className="table-action-btn"
                          title="View request"
                          aria-label={`View leave request ${request.id}`}
                          onClick={() => openViewModal(request.id)}
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn"
                          title="Edit request"
                          aria-label={`Edit leave request ${request.id}`}
                          disabled={!canModify || actionId === request.id}
                          onClick={() => openEditModal(request.id)}
                        >
                          <MdEdit />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn"
                          title="Delete request"
                          aria-label={`Delete leave request ${request.id}`}
                          disabled={!canModify || actionId === request.id}
                          onClick={() =>
                            void handleDeleteApplication(request.id)
                          }
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {!requestsLoading && filteredRequests.length > 0 && (
            <div className="role-pagination">
              <div className="pagination-info">
                Showing {currentRows.length} of{' '}
                {filteredRequests.length}
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                >
                  &#8249;
                </button>

                <span className="pagination-text">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                >
                  &#8250;
                </button>
              </div>
            </div>
          )}
        </div>

        <ApplyLeaveModal
          open={modalOpen}
          onClose={closeModal}
          editApplication={editApplication}
          onSuccess={() => {
            void fetchLeaveApplications()
            void fetchLeaveBalances()
          }}
        />

        <LeaveRequestViewModal
          open={viewRequest !== null}
          request={viewRequest}
          onClose={closeViewModal}
        />

        <LeaveBalanceDetailModal
          open={balanceDetailOpen}
          loading={balanceDetailLoading}
          error={balanceDetailError}
          detail={balanceDetail}
          onClose={closeBalanceDetail}
          formatLeaveDays={formatLeaveDays}
        />
      </div>
    </Layout>
  )
}
