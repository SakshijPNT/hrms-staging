import Layout from './Layout'
import '../styles/Style.css'
import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import api from '../services/api'
import type { SessionInfo } from '../../types/auth'
import type { RegularizationApplication } from '../../types/regularization'
import { formatCorrectionTypeLabel } from '../../types/regularization'
import RegularizationModal from '../components/RegularizationModal'
import { ApplyLeaveModal } from '../components/ApplyLeaveModal'
import { formatAttendanceTime, normalizeDate } from '../utils/attendanceFormat'
import { FiSearch, FiPlus } from 'react-icons/fi'

interface LeaveBalance {
  leaveTypeId: number
  leaveTypeName: string
  availableBalance: number
}

interface Application {
  id: number
  leaveTypeName: string
  fromDate: string
  toDate: string
  totalDays: number
  isHalfDay: boolean
  session: string | null
  workHours: string
  reason: string
  approvalStatus: string
  createdOn: string
}

export function MyApplicationsPage() {

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [regularizations, setRegularizations] = useState<
    RegularizationApplication[]
  >([])
  const [search, setSearch] = useState('')
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [regularizationModalOpen, setRegularizationModalOpen] =
    useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)

  const timezone = session?.timezone ?? 'Asia/Kolkata'

  useEffect(() => {
    void loadSession()
    void fetchLeaveBalances()
    void fetchApplications()
    void fetchRegularizations()
  }, [])

  async function loadSession() {
  try {
    const response = await api.get<SessionInfo>('/auth/session')
    setSession(response.data)
  } catch {
    setSession(null)
  }
}

  async function fetchLeaveBalances() {
    try {
      const response = await api.get('/user-leaves/balances')
      setLeaveBalances(response.data)
    } catch (fetchError) {
      console.error('Error fetching leave balances', fetchError)
    }
  }

  async function fetchApplications() {
    try {
      const response = await api.get('/user-leaves/applications')
      setApplications(response.data)
    } catch (fetchError) {
      console.error('Error fetching applications', fetchError)
    }
  }

  async function fetchRegularizations() {
    try {
      const response = await api.get<RegularizationApplication[]>(
        '/regularization/applications',
      )
      setRegularizations(response.data)
    } catch (fetchError) {
      console.error('Error fetching regularizations', fetchError)
    }
  }

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase()
    return applications.filter(
      (app) =>
        app.leaveTypeName.toLowerCase().includes(q) ||
        app.approvalStatus.toLowerCase().includes(q),
    )
  }, [applications, search])

  const applicationsPerPage = 5

  const indexOfLastApplication =
    currentPage * applicationsPerPage

  const indexOfFirstApplication =
    indexOfLastApplication - applicationsPerPage

  const currentApplications =
    filteredApplications.slice(
      indexOfFirstApplication,
      indexOfLastApplication
    )

  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage
  )

  const filteredRegularizations = useMemo(() => {
    const q = search.toLowerCase()
    return regularizations.filter(
      (item) =>
        item.reason.toLowerCase().includes(q) ||
        item.approvalStatus.toLowerCase().includes(q) ||
        normalizeDate(item.logDate).includes(q),
    )
  }, [regularizations, search])

  async function handleCancelRegularization(id: number) {
    if (!window.confirm('Cancel this regularization request?')) {
      return
    }

    setCancellingId(id)

    try {
      await api.patch(`/regularization/applications/${id}/cancel`)
      await fetchRegularizations()
    } catch (cancelError) {
      const axiosError = cancelError as AxiosError<{ message?: string }>
      window.alert(
        axiosError.response?.data?.message ??
          'Failed to cancel regularization request.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  function statusClass(status: string) {
    return `act-status ${status.toLowerCase()}`
  }

  return (
    <Layout title="My Applications">
      <div className="act-page">

        {/* HEADER */}
        <div className="act-page-header">

          <div>

            <nav className="act-breadcrumb">

              <span className="act-breadcrumb-link">
                Applications
              </span>

            </nav>

            <h1 className="act-title">
              My Applications
            </h1>

          </div>

          <div className="act-header-actions">
            <button
              className="act-new-btn act-new-btn-secondary"
              onClick={() => setRegularizationModalOpen(true)}
            >
              <FiPlus /> Regularization
            </button>

            <button
              className="act-new-btn"
              onClick={() => setLeaveModalOpen(true)}
            >
              + New Application
            </button>
          </div>

        </div>

        {/* LEAVE BALANCE */}
        <div className="act-stats">

          {leaveBalances.map((leave) => (

            <div
              key={leave.leaveTypeId}
              className="act-card"
            >

              <h3>
                {leave.leaveTypeName}
              </h3>

              <p>
                {leave.availableBalance}
              </p>

            </div>
          ))}
        </div>

        {/* SEARCH */}
        {/* <div className="act-toolbar">

          <input
            className="act-search"
            type="text"
            placeholder="Search applications"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div> */}


        <div className="act-toolbar">

          {/* HEADER */}

          <div className="act-search-wrapper">
            <FiSearch className="act-search-icon" />

            <input
              className="act-search"
              type="text"
              placeholder="Search applications"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />


          </div>

          <button
            className="act-new-btn"
            onClick={() => setLeaveModalOpen(true)}
          >
            <FiPlus />
            New Application
          </button>

        </div>

        <div className="act-table-wrapper">
          <table className="act-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Total Days</th>
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="act-empty">
                    No applications found.
                  </td>
                </tr>
              ) : (

                filteredApplications.map((app) => (

                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.leaveTypeName}</td>
                    <td>{app.fromDate}</td>
                    <td>{app.toDate}</td>
                    <td>{app.totalDays}</td>
                    <td>
                      {app.isHalfDay
                        ? app.session === 'FIRST_HALF'
                          ? 'First Half'
                          : 'Second Half'
                        : '-'}
                    </td>
                    <td>
                      <span className={statusClass(app.approvalStatus)}>
                        {app.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="role-pagination">

            <div className="pagination-info">
              Showing {currentApplications.length} of {filteredApplications.length}
            </div>

            <div className="pagination-controls">

              <button
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
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
              >
                &#8250;
              </button>

            </div>

          </div>

        </div>

        <div className="act-section">
          <div className="act-section-header">
            <h2 className="act-section-title">Regularization Requests</h2>
          </div>

          <div className="act-table-wrapper">
            <table className="act-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Actual IN</th>
                  <th>Actual OUT</th>
                  <th>Original Status</th>
                  <th>Requested Correction</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegularizations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="act-empty">
                      No regularization requests yet.
                    </td>
                  </tr>
                ) : (
                  filteredRegularizations.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
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
                          <span className={statusClass(item.approvalStatus)}>
                            {item.approvalStatus}
                          </span>
                        </td>
                        <td>
                          {item.approvalStatus === 'PENDING' ? (
                            <button
                              type="button"
                              className="act-cancel-btn reg-action-btn"
                              disabled={cancellingId === item.id}
                              onClick={() =>
                                void handleCancelRegularization(item.id)
                              }
                            >
                              {cancellingId === item.id
                                ? 'Cancelling...'
                                : 'Cancel'}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        <RegularizationModal
          open={regularizationModalOpen}
          timezone={timezone}
          onClose={() => setRegularizationModalOpen(false)}
          onSuccess={() => {
            void fetchRegularizations()
          }}
        />

        <ApplyLeaveModal
          open={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          onSuccess={() => {
            void fetchApplications()
            void fetchLeaveBalances()
          }}
        />
      </div>
    </Layout>
  )
}
