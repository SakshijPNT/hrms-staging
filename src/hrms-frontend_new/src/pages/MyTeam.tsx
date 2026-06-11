import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import api from '../services/api'
import { useSession } from '../context/SessionContext'
import { FiSearch, FiEye, FiCalendar } from 'react-icons/fi'
import { formatAttendanceTime, normalizeDate } from '../utils/attendanceFormat'

interface TeamMember {
  id: number
  fullName: string
  emailId: string
  roleId: number
  roleName: string
  managerId: number | null
  managerName: string | null
  joiningDate: string
  probationMonths: number
  confirmationDate: string | null
  statusCode: number
}

interface MonthlyLogDay {
  date: string
  dayType: string
  displayStatus: string | null
  checkInTime: string | null
  checkOutTime: string | null
  workedMinutes: number
  isFuture: boolean
  isToday: boolean
}

interface MonthlyAttendanceLogResponse {
  year: number
  month: number
  timezone: string
  days: MonthlyLogDay[]
}

interface AttendanceTableRow {
  key: string
  dateLabel: string
  checkInTime: string | null
  checkOutTime: string | null
  workedMinutes: number
  statusLabel: string
  statusClass: string
  isWeekOff: boolean
  isToday: boolean
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapStatusToClass(status: string | null | undefined) {
  if (!status) {
    return 'empty'
  }

  const normalized = status.toLowerCase().replace(/_/g, '-')

  if (normalized === 'leave-pending') {
    return 'leave'
  }

  if (normalized === 'checked-in') {
    return 'present'
  }

  return normalized
}

function getYearMonthInTimezone(
  timezone: string,
  date = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  }
}

function formatTeamAttendanceDate(
  dateKey: string,
  timezone: string,
) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0),
  )

  return utcDate.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function normalizeLogDate(value: string) {
  return normalizeDate(value)
}

function formatTableHours(minutes: number) {
  if (!minutes || minutes <= 0) {
    return '--:-- Hrs'
  }

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} Hrs`
}

export function MyTeamPage() {
  return (
    <Layout title="My Team">
      <MyTeamContent />
    </Layout>
  )
}

function MyTeamContent() {
  const session = useSession()
  const timezone = session.timezone || 'Asia/Kolkata'

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewMember, setViewMember] = useState<TeamMember | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const [attendanceModalOpen, setAttendanceModalOpen] =
    useState(false)
  const [attendanceMember, setAttendanceMember] =
    useState<TeamMember | null>(null)
  const [monthView, setMonthView] = useState({ year: 0, month: 0 })
  const [monthlyLogDays, setMonthlyLogDays] = useState<
    MonthlyLogDay[]
  >([])
  const [monthlyLogLoading, setMonthlyLogLoading] =
    useState(false)

  const fetchTeam = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get<TeamMember[]>('/users/my-team')
      setTeamMembers(response.data ?? [])
    } catch {
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTeam()
  }, [fetchTeam])

  useEffect(() => {
    const { year, month } = getYearMonthInTimezone(timezone)
    setMonthView({ year, month })
  }, [timezone])

  useEffect(() => {
    if (!attendanceModalOpen || !attendanceMember) {
      return
    }

    if (monthView.year === 0 || monthView.month === 0) {
      return
    }

    const memberId = attendanceMember.id
    const { year, month } = monthView

    async function loadMonthlyLog() {
      setMonthlyLogLoading(true)

      try {
        const response = await api.get<MonthlyAttendanceLogResponse>(
          `/attendance/team/${memberId}/monthly-log/${year}/${month}`,
        )

        setMonthlyLogDays(response.data.days ?? [])
      } catch {
        setMonthlyLogDays([])
      } finally {
        setMonthlyLogLoading(false)
      }
    }

    void loadMonthlyLog()
  }, [
    attendanceModalOpen,
    attendanceMember,
    monthView.year,
    monthView.month,
  ])

  useEffect(() => {
    if (viewModalOpen || attendanceModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [viewModalOpen, attendanceModalOpen])

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase()

    return teamMembers.filter(
      (member) =>
        String(member.id).includes(q) ||
        member.fullName.toLowerCase().includes(q) ||
        member.emailId.toLowerCase().includes(q) ||
        member.roleName.toLowerCase().includes(q),
    )
  }, [teamMembers, search])

  const membersPerPage = 10
  const indexOfLastMember = currentPage * membersPerPage
  const indexOfFirstMember = indexOfLastMember - membersPerPage
  const currentMembers = filteredMembers.slice(
    indexOfFirstMember,
    indexOfLastMember,
  )
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / membersPerPage),
  )

  const monthLabel =
    monthView.month === 0
      ? ''
      : new Date(
          monthView.year,
          monthView.month - 1,
          1,
        ).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

  const attendanceRows = useMemo<AttendanceTableRow[]>(() => {
    return monthlyLogDays.map((day) => {
      const dateKey = normalizeLogDate(day.date)
      const statusLabel = day.displayStatus
        ? formatStatusLabel(day.displayStatus)
        : '-- -- --'

      return {
        key: dateKey,
        dateLabel: formatTeamAttendanceDate(dateKey, timezone),
        checkInTime: day.checkInTime,
        checkOutTime: day.checkOutTime,
        workedMinutes: day.workedMinutes,
        statusLabel,
        statusClass: mapStatusToClass(day.displayStatus),
        isWeekOff: day.dayType === 'WEEK_OFF',
        isToday: day.isToday,
      }
    })
  }, [monthlyLogDays, timezone])

  function moveMonth(step: number) {
    setMonthView(({ year, month }) => {
      const next = new Date(year, month - 1 + step, 1)

      return {
        year: next.getFullYear(),
        month: next.getMonth() + 1,
      }
    })
  }

  async function openViewModal(member: TeamMember) {
    setViewModalOpen(true)
    setViewLoading(true)
    setViewMember(member)

    try {
      const response = await api.get<TeamMember>(
        `/users/my-team/${member.id}`,
      )
      setViewMember(response.data)
    } catch {
      setViewMember(member)
    } finally {
      setViewLoading(false)
    }
  }

  function closeViewModal() {
    setViewModalOpen(false)
    setViewMember(null)
  }

  function openAttendanceModal(member: TeamMember) {
    const { year, month } = getYearMonthInTimezone(timezone)
    setMonthView({ year, month })
    setAttendanceMember(member)
    setAttendanceModalOpen(true)
  }

  function closeAttendanceModal() {
    setAttendanceModalOpen(false)
    setAttendanceMember(null)
    setMonthlyLogDays([])
  }

  return (
    <div className="act-page">
     

      <div className="act-toolbar">
        <div className="act-search-wrapper">
          <FiSearch className="act-search-icon" />
          <input
            className="act-search"
            type="text"
            placeholder="Search team member"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      <div className="act-table-wrapper">
        <table className="act-table role-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Name</th>
              <th>Status</th>
              <th className="table-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="act-empty">
                  Loading team members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="act-empty">
                  No team members found.
                </td>
              </tr>
            ) : (
              currentMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.fullName}</td>
                  <td>
                    <span
                      className={
                        member.statusCode === 1
                          ? 'role-status role-status-active'
                          : 'role-status role-status-inactive'
                      }
                    >
                      {member.statusCode === 1
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-action-col">
                    <div className="table-action-group">
                      <button
                        type="button"
                        className="table-action-btn"
                        title="View user details"
                        aria-label={`View ${member.fullName}`}
                        onClick={() => void openViewModal(member)}
                      >
                        <FiEye />
                      </button>

                      <button
                        type="button"
                        className="table-action-btn"
                        title="View attendance"
                        aria-label={`View attendance for ${member.fullName}`}
                        onClick={() =>
                          openAttendanceModal(member)
                        }
                      >
                        <FiCalendar />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && filteredMembers.length > 0 && (
          <div className="role-pagination">
            <div className="pagination-info">
              Showing {currentMembers.length} of{' '}
              {filteredMembers.length}
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
                disabled={currentPage === totalPages}
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

      {viewModalOpen && viewMember && (
        <div className="act-modal-overlay">
          <div
            className="act-modal modal-sm role-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="act-modal-header">
              <h2>User Details</h2>
              <button
                type="button"
                className="act-modal-close"
                onClick={closeViewModal}
              >
                &times;
              </button>
            </div>

            <div className="act-modal-form role-view-form">
              {viewLoading ? (
                <p className="role-view-value-box">Loading...</p>
              ) : (
                <div className="role-view-grid">
                  <div className="role-view-field">
                    <span className="role-view-label">User ID</span>
                    <p className="role-view-value-box">{viewMember.id}</p>
                  </div>

                  <div className="role-view-field">
                    <span className="role-view-label">Status</span>
                    <p className="role-view-value-box role-view-value-box--badge">
                      <span
                        className={
                          viewMember.statusCode === 1
                            ? 'role-status role-status-active'
                            : 'role-status role-status-inactive'
                        }
                      >
                        {viewMember.statusCode === 1
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </p>
                  </div>

                  <div className="role-view-field role-view-field--full">
                    <span className="role-view-label">Full Name</span>
                    <p className="role-view-value-box">
                      {viewMember.fullName}
                    </p>
                  </div>

                  <div className="role-view-field role-view-field--full">
                    <span className="role-view-label">Email</span>
                    <p className="role-view-value-box">
                      {viewMember.emailId}
                    </p>
                  </div>

                  <div className="role-view-field">
                    <span className="role-view-label">Role</span>
                    <p className="role-view-value-box">
                      {viewMember.roleName || '-'}
                    </p>
                  </div>

                  <div className="role-view-field">
                    <span className="role-view-label">Manager</span>
                    <p className="role-view-value-box">
                      {viewMember.managerName || '-'}
                    </p>
                  </div>

                  <div className="role-view-field">
                    <span className="role-view-label">Joining Date</span>
                    <p className="role-view-value-box">
                      {viewMember.joiningDate}
                    </p>
                  </div>

                  <div className="role-view-field">
                    <span className="role-view-label">Confirmation Date</span>
                    <p className="role-view-value-box">
                      {viewMember.confirmationDate || '-'}
                    </p>
                  </div>

                  <div className="role-view-field role-view-field--full">
                    <span className="role-view-label">Probation Months</span>
                    <p className="role-view-value-box">
                      {viewMember.probationMonths}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="act-modal-actions">
              <button
                type="button"
                className="act-cancel-btn"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {attendanceModalOpen && attendanceMember && (
        <div className="act-modal-overlay">
          <div
            className="act-modal team-attendance-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="act-modal-header">
              <h2>
                Attendance - {attendanceMember.fullName}
              </h2>
              <button
                type="button"
                className="act-modal-close"
                onClick={closeAttendanceModal}
              >
                &times;
              </button>
            </div>

            <div className="act-modal-form team-attendance-modal">
              <div className="attendance-month-nav team-attendance-month-nav">
                <button
                  type="button"
                  className="attendance-month-btn"
                  onClick={() => moveMonth(-1)}
                  aria-label="Previous month"
                >
                  &#8249;
                </button>

                <span className="attendance-month-label">
                  {monthLabel}
                </span>

                <button
                  type="button"
                  className="attendance-month-btn"
                  onClick={() => moveMonth(1)}
                  aria-label="Next month"
                >
                  &#8250;
                </button>
              </div>

              <div className="team-attendance-table-scroll">
                <table className="act-table attendance-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>In Time</th>
                        <th>Out Time</th>
                        <th>Status</th>
                        <th>Total Hours</th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        monthlyLogLoading
                          ? 'attendance-history-tbody--loading'
                          : undefined
                      }
                    >
                    {monthlyLogLoading ? (
                      Array.from({ length: 12 }, (_, index) => (
                        <tr
                          key={`attendance-skeleton-${index}`}
                          className="attendance-row-skeleton"
                          aria-hidden="true"
                        >
                          <td>
                            <span className="attendance-skeleton-bar attendance-skeleton-bar--md" />
                          </td>
                          <td>
                            <span className="attendance-skeleton-bar attendance-skeleton-bar--sm" />
                          </td>
                          <td>
                            <span className="attendance-skeleton-bar attendance-skeleton-bar--sm" />
                          </td>
                          <td>
                            <span className="attendance-skeleton-bar attendance-skeleton-bar--lg" />
                          </td>
                          <td>
                            <span className="attendance-skeleton-bar attendance-skeleton-bar--sm" />
                          </td>
                        </tr>
                      ))
                    ) : attendanceRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="act-empty">
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      attendanceRows.map((row) => (
                        <tr
                          key={row.key}
                          className={[
                            row.isToday
                              ? 'attendance-row-today'
                              : '',
                            row.isWeekOff
                              ? 'attendance-row-weekoff'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <td>{row.dateLabel}</td>
                          <td>
                            {formatAttendanceTime(
                              row.checkInTime,
                              timezone,
                            )}
                          </td>
                          <td>
                            {formatAttendanceTime(
                              row.checkOutTime,
                              timezone,
                            )}
                          </td>
                          <td>
                            <div className="attendance-status-cell">
                              <span
                                className={`attendance-status-dot dot-${row.statusClass}`}
                              />
                              <span
                                className={`attendance-status-text text-${row.statusClass}`}
                              >
                                {row.statusLabel}
                              </span>
                            </div>
                          </td>
                          <td>
                            {formatTableHours(row.workedMinutes)}
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                </table>
              </div>
            </div>

            <div className="act-modal-actions">
              <button
                type="button"
                className="act-cancel-btn"
                onClick={closeAttendanceModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
