import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import api from '../services/api'
import { useSession } from '../context/SessionContext'
import { useAlert } from '../context/AlertContext'
import type { AxiosError } from 'axios'
import RegularizationModal from '../components/RegularizationModal'
import { FiCalendar } from 'react-icons/fi'

interface LeaveBadge {
  leaveTypeCode: string
  leaveTypeName: string
  isHalfDay: boolean
  session: string | null
  isPending: boolean
}

interface Attendance {
  checkInTime: string | null
  checkOutTime: string | null
  workedHours: number
  attendanceStatus: string
}

interface TodayAttendanceResponse {
  logDate: string
  dayType: string
  isCheckInAllowed: boolean
  dayLabel?: string | null
  attendance: Attendance | null
}

interface MonthlyLogDay {
  date: string
  dayType: string
  displayStatus: string | null
  holidayName?: string | null
  checkInTime: string | null
  checkOutTime: string | null
  workedMinutes: number
  isFuture: boolean
  isToday: boolean
  leaveBadges: LeaveBadge[]
  hasRegularizationPending: boolean
  isRegularized: boolean
  regularizationStatus: string | null
}

interface MonthlyAttendanceLogResponse {
  year: number
  month: number
  timezone: string
  today: string
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
  regularizationStatusLabel: string | null
  regularizationStatusClass: string | null
  displayStatus: string | null
  dayType: string
  isWeekOff: boolean
  isToday: boolean
  isFuture: boolean
  hasRecord: boolean
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

function resolveHalfDayLeaveLabel(
  session: string | null | undefined,
  isPending: boolean,
) {
  const halfLabel =
    session === 'FIRST_HALF'
      ? '1H'
      : session === 'SECOND_HALF'
        ? '2H'
        : 'Half'

  return isPending ? `${halfLabel} · Pending` : `${halfLabel} Leave`
}

function resolvePrimaryStatus(
  displayStatus: string | null,
  leaveBadges: LeaveBadge[],
) {
  if (!displayStatus) {
    return {
      label: '-- -- --',
      className: 'empty',
    }
  }

  const leaveBadge =
    displayStatus === 'LEAVE'
      ? leaveBadges.find((badge) => !badge.isPending)
      : displayStatus === 'LEAVE_PENDING'
        ? leaveBadges.find((badge) => badge.isPending)
        : undefined

  if (leaveBadge?.isHalfDay) {
    return {
      label: resolveHalfDayLeaveLabel(
        leaveBadge.session,
        leaveBadge.isPending,
      ),
      className: 'leave',
    }
  }

  return {
    label: formatStatusLabel(displayStatus),
    className: mapStatusToClass(displayStatus),
  }
}

function resolveRegularizationStatusClass(label: string | null) {
  if (!label) {
    return null
  }

  if (label.startsWith('Reg. Pending')) {
    return 'reg-pending'
  }

  if (label.startsWith('Reg. Approved')) {
    return 'reg-approved'
  }

  if (label.startsWith('Reg. Rejected')) {
    return 'reg-rejected'
  }

  return null
}

function getYearMonthInTimezone(
  timezone: string,
  date = new Date()
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

function formatTableDateFromKey(
  dateKey: string,
  timezone: string
) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0)
  )

  return utcDate.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeLogDate(logDate: string) {
  return logDate.slice(0, 10)
}

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <DashboardPage />
    </Layout>
  )
}

function DashboardPage() {

  const { showAlert } = useAlert()

  const [attendance, setAttendance] = useState<Attendance | null>(null)

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [loading, setLoading] =
    useState(false)

  const [monthView, setMonthView] = useState({
    year: 0,
    month: 0,
  })

  const [monthlyLogDays, setMonthlyLogDays] =
    useState<MonthlyLogDay[]>([])

  const [monthlyLogLoading, setMonthlyLogLoading] =
    useState(false)

  const [currentPage, setCurrentPage] =
    useState(1)

  const rowsPerPage = 10

  const session = useSession()
  const timezone = session.timezone || 'Asia/Kolkata'

  // const [selectedDate, setSelectedDate] = useState(new Date())

  const [regularizationModalOpen, setRegularizationModalOpen] =
    useState(false)

  const [selectedAttendanceRow, setSelectedAttendanceRow] =
    useState<AttendanceTableRow | null>(null)

  const loadAttendance = async () => {
    try {
      const response =
        await api.get<TodayAttendanceResponse>(
          '/attendance/today'
        )

      setAttendance(response.data.attendance ?? null)
    } catch {
      setAttendance(null)
    }
  }

  const loadMonthlyLog = async (
    year: number,
    month: number
  ) => {
    try {
      setMonthlyLogLoading(true)

      const response =
        await api.get<MonthlyAttendanceLogResponse>(
          `/attendance/monthly-log/${year}/${month}`
        )

      setMonthlyLogDays(response.data.days)
    } catch {
      setMonthlyLogDays([])
    } finally {
      setMonthlyLogLoading(false)
    }
  }

  const refreshMonthlyIfCurrent = () => {
    const { year, month } =
      getYearMonthInTimezone(timezone)

    if (
      year === monthView.year &&
      month === monthView.month
    ) {
      loadMonthlyLog(year, month)
    }
  }

  useEffect(() => {
    loadAttendance()

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const { year, month } =
      getYearMonthInTimezone(timezone)

    setMonthView({ year, month })
  }, [timezone])

  useEffect(() => {
    if (monthView.year === 0 || monthView.month === 0) {
      return
    }

    loadMonthlyLog(monthView.year, monthView.month)
  }, [monthView.year, monthView.month])

  useEffect(() => {
    setCurrentPage(1)
  }, [monthView.year, monthView.month])

  useEffect(() => {
    if (regularizationModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [regularizationModalOpen])

  const handleCheckIn = async () => {
    if (attendance?.checkInTime) {
      showAlert({
        title: 'Check In',
        message: 'You have already checked in today.',
      })
      return
    }

    try {
      setLoading(true)

      const response =
        await api.post('/attendance/check-in')

      setAttendance(response.data)

      refreshMonthlyIfCurrent()
      showAlert({
        title: 'Success',
        message: 'Checked in successfully',
      })
    } catch (error: unknown) {
      const axiosError =
        error as AxiosError<{ message?: string }>

      showAlert({
        title: 'Error',
        message:
          axiosError.response?.data?.message ||
          'Check-in failed',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setLoading(true)

      const response =
        await api.post('/attendance/check-out')

      setAttendance(response.data)

      refreshMonthlyIfCurrent()
      showAlert({
        title: 'Success',
        message: 'Checked out successfully',
      })
    } catch (error: unknown) {
      const axiosError =
        error as AxiosError<{ message?: string }>

      showAlert({
        title: 'Error',
        message:
          axiosError.response?.data?.message ||
          'Check-out failed',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (
    time: string | null | undefined,
    emptyValue = '--:--'
  ) => {
    if (!time) return emptyValue

    return new Date(time).toLocaleTimeString(
      'en-US',
      {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
    )
  }

  const formatWorkedHours = (
    hours: number | undefined
  ) => {
    if (!hours || hours <= 0) {
      return '00:00:00'
    }

    const totalSeconds = Math.floor(hours * 3600)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatTableHours = (
    minutes: number
  ) => {
    if (!minutes || minutes <= 0) {
      return '--:-- Hrs'
    }

    const h = Math.floor(minutes / 60)
    const m = minutes % 60

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} Hrs`
  }

  const monthLabel =
    monthView.month === 0
      ? ''
      : new Date(
          monthView.year,
          monthView.month - 1,
          1
        ).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

  const attendanceRows = useMemo(() => {
    return monthlyLogDays.map((day) => {
      const dateKey = normalizeLogDate(day.date)
      const primaryStatus = resolvePrimaryStatus(
        day.displayStatus,
        day.leaveBadges ?? [],
      )
      const regularizationStatusLabel =
        day.regularizationStatus ?? null

      return {
        key: dateKey,
        dateLabel: formatTableDateFromKey(
          dateKey,
          timezone
        ),
        checkInTime: day.checkInTime,
        checkOutTime: day.checkOutTime,
        workedMinutes: day.workedMinutes,
        statusLabel: primaryStatus.label,
        statusClass: primaryStatus.className,
        regularizationStatusLabel,
        regularizationStatusClass: resolveRegularizationStatusClass(
          regularizationStatusLabel,
        ),
        displayStatus: day.displayStatus,
        dayType: day.dayType,
        isWeekOff: day.dayType === 'WEEK_OFF',
        isToday: day.isToday,
        isFuture: day.isFuture,
        hasRecord: Boolean(
          day.checkInTime || day.checkOutTime
        ),
      }
    })
  }, [monthlyLogDays, timezone])

  const totalPages = Math.ceil(
    attendanceRows.length / rowsPerPage
  )

  const indexOfLastRow =
    currentPage * rowsPerPage

  const indexOfFirstRow =
    indexOfLastRow - rowsPerPage

  const currentRows = attendanceRows.slice(
    indexOfFirstRow,
    indexOfLastRow
  )

  const statusLabel =
    attendance?.attendanceStatus || 'Not Checked In'

  const statusClass = statusLabel
    .toLowerCase()
    .replace(/\s+/g, '-')

  function moveMonth(step: number) {
    setMonthView(({ year, month }) => {
      const next = new Date(
        year,
        month - 1 + step,
        1
      )

      return {
        year: next.getFullYear(),
        month: next.getMonth() + 1,
      }
    })
  }

  function openRegularizationModal(row: AttendanceTableRow) {
    setSelectedAttendanceRow(row)
    setRegularizationModalOpen(true)
  }

  function closeRegularizationModal() {
    setRegularizationModalOpen(false)
    setSelectedAttendanceRow(null)
  }

  function handleRegularizationSuccess() {
    refreshMonthlyIfCurrent()
  }

  return (
    <>
      <div className="attendance-card">
        <div className="attendance-card-body">
          <div className="attendance-left">
            <p className="attendance-date">
              {currentTime.toLocaleDateString(
                'en-US',
                {
                  timeZone: timezone,
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }
              )}
              {' '}({timezone})
            </p>

            <h1 className="attendance-time">
              {currentTime.toLocaleTimeString(
                'en-US',
                {
                  timeZone: timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                }
              )}
            </h1>

            <p className="attendance-current-status">
              <span className="status-label">
                Current Status:
              </span>
              <span
                className={`status-value status-${statusClass}`}
              >
                {statusLabel}
              </span>
            </p>
          </div>

          <div className="attendance-buttons">
            <button
              type="button"
              className={`check-btn ${attendance?.checkInTime
                ? 'check-btn-secondary check-btn-checked-in'
                : 'check-btn-primary'
                }`}
              onClick={handleCheckIn}
              disabled={loading}
            >
              {
                attendance?.checkInTime
                  ? 'Checked In'
                  : 'Check In'
              }
            </button>

            <button
              type="button"
              className={`check-btn ${attendance?.checkInTime
                ? 'check-btn-primary'
                : 'check-btn-secondary'
                }`}
              onClick={handleCheckOut}
              disabled={
                !attendance?.checkInTime || loading
              }
            >
              Check Out
            </button>
          </div>
        </div>

        <div className="attendance-card-footer">
          <div className="attendance-footer-item">
            <span className="footer-label">
              Check In Time:
            </span>
            <span className="footer-value">
              {formatTime(attendance?.checkInTime)}
            </span>
          </div>

          <div className="attendance-footer-item">
            <span className="footer-label">
              Check Out Time:
            </span>
            <span className="footer-value">
              {formatTime(
                attendance?.checkOutTime,
                '-- -- --'
              )}
            </span>
          </div>

          <div className="attendance-footer-item attendance-footer-hours">
            <span className="footer-label">
              Total Hours
            </span>
            <span className="footer-value">
              {formatWorkedHours(
                attendance?.workedHours
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="attendance-table-section">
        <div className="attendance-month-nav">
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

        <div className="act-table-wrapper">
          <table className="act-table attendance-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Status</th>
                <th>Total Hours</th>
                <th>Regularization Status</th>
                <th className="table-action-col">Action</th>
              </tr>
            </thead>

            <tbody>
              {monthlyLogLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : attendanceRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                currentRows.map((row) => (
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
                      {row.checkInTime
                        ? formatTime(row.checkInTime)
                        : '--:-- --'}
                    </td>

                    <td>
                      {row.checkOutTime
                        ? formatTime(row.checkOutTime)
                        : '--:-- --'}
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
                      {formatTableHours(
                        row.workedMinutes
                      )}
                    </td>

                    <td>
                      {row.regularizationStatusLabel ? (
                        <span
                          className={`attendance-reg-status attendance-reg-status--${row.regularizationStatusClass}`}
                        >
                          {row.regularizationStatusLabel}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>

                    <td className="table-action-col">
                      <div className="table-action-group">
                        <button
                          type="button"
                          className="table-action-btn"
                          title="Regularization request"
                          aria-label={`Open regularization request for ${row.dateLabel}`}
                          onClick={() =>
                            openRegularizationModal(row)
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

          {attendanceRows.length > 0 && (
            <>
              <div className="attendance-status-legend">
                <span>1H Regularize = First half regularization</span>
                <span>2H Regularize = Second half regularization</span>
                <span>Reg. = Regularization</span>
              </div>

              <div className="role-pagination">
              <div className="pagination-info">
                Showing {currentRows.length} of{' '}
                {attendanceRows.length}
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
            </>
          )}
        </div>
      </div>

      <RegularizationModal
        open={regularizationModalOpen}
        timezone={timezone}
        initialLogDate={selectedAttendanceRow?.key}
        onClose={closeRegularizationModal}
        onSuccess={handleRegularizationSuccess}
      />
    </>
  )
}
