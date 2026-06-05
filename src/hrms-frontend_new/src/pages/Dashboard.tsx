import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import api from '../services/api'
import type { AxiosError } from 'axios'
// import Calendar from 'react-calendar'
// import 'react-calendar/dist/Calendar.css'
import { FiCalendar } from 'react-icons/fi'
import Select from 'react-select'

interface Attendance {
  checkInTime: string | null
  checkOutTime: string | null
  workedHours: number
  attendanceStatus: string
}

interface AttendanceHistoryRecord {
  id: number
  logDate: string
  checkInTime: string | null
  checkOutTime: string | null
  workedHours: number
  workedMinutes: number
  attendanceStatus: string
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

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeLogDate(logDate: string) {
  return logDate.slice(0, 10)
}

// Dummy data for attendance table UI preview
const DUMMY_MONTHLY_RECORDS: AttendanceHistoryRecord[] = [
  {
    id: 1,
    logDate: '2026-06-01',
    checkInTime: '2026-06-01T08:32:00+05:30',
    checkOutTime: '2026-06-01T13:00:00+05:30',
    workedHours: 4.47,
    workedMinutes: 268,
    attendanceStatus: 'HALF_DAY',
  },
  {
    id: 2,
    logDate: '2026-06-02',
    checkInTime: '2026-06-02T09:00:00+05:30',
    checkOutTime: '2026-06-02T21:15:00+05:30',
    workedHours: 11.98,
    workedMinutes: 719,
    attendanceStatus: 'PRESENT',
  },
  {
    id: 3,
    logDate: '2026-06-03',
    checkInTime: '2026-06-03T08:06:00+05:30',
    checkOutTime: '2026-06-03T21:14:00+05:30',
    workedHours: 12.82,
    workedMinutes: 769,
    attendanceStatus: 'PRESENT',
  },
  {
    id: 4,
    logDate: '2026-06-08',
    checkInTime: '2026-06-08T10:04:00+05:30',
    checkOutTime: '2026-06-08T14:16:00+05:30',
    workedHours: 4.2,
    workedMinutes: 252,
    attendanceStatus: 'HALF_DAY',
  },
  {
    id: 5,
    logDate: '2026-06-09',
    checkInTime: '2026-06-09T09:10:00+05:30',
    checkOutTime: '2026-06-09T18:30:00+05:30',
    workedHours: 9.33,
    workedMinutes: 560,
    attendanceStatus: 'PRESENT',
  },
  {
    id: 6,
    logDate: '2026-06-10',
    checkInTime: null,
    checkOutTime: null,
    workedHours: 0,
    workedMinutes: 0,
    attendanceStatus: 'LEAVE',
  },
]

const REGULARIZATION_TYPE_OPTIONS = [
  { value: 'late-check-in', label: 'Late Check In' },
  { value: 'early-check-out', label: 'Early Check Out' },
  { value: 'missed-punch', label: 'Missed Punch' },
  { value: 'work-from-home', label: 'Work From Home' },
  { value: 'other', label: 'Other' },
]

function formatModalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-')

  return `${day}/${month}/${year}`
}

export default function Dashboard() {

  const [attendance, setAttendance] = useState<Attendance | null>(null)

  const [currentTime, setCurrentTime] =
    useState(new Date())

  const [loading, setLoading] =
    useState(false)

  const [monthCursor, setMonthCursor] =
    useState(new Date())

  const [currentPage, setCurrentPage] =
    useState(1)

  const rowsPerPage = 10

  const session = JSON.parse(
    localStorage.getItem('session') || '{}'
  )

  const timezone = session.timezone || 'Asia/Kolkata'

  // const [selectedDate, setSelectedDate] = useState(new Date())

  const [regularizationModalOpen, setRegularizationModalOpen] =
    useState(false)

  const [selectedAttendanceRow, setSelectedAttendanceRow] =
    useState<AttendanceTableRow | null>(null)

  const [regularizationForm, setRegularizationForm] =
    useState({
      regularizationType: '',
      reason: '',
    })

  const [regularizationError, setRegularizationError] =
    useState('')

  const todayKey = useMemo(
    () => toDateKey(new Date()),
    [currentTime]
  )

  const loadAttendance = async () => {
    try {
      const response =
        await api.get('/attendance/today')

      setAttendance(response.data)
    } catch {
      console.log(
        'No attendance found for today'
      )
      setAttendance(null)
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
    setCurrentPage(1)
  }, [monthCursor])

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

  const monthlyRecords = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth() + 1

    return DUMMY_MONTHLY_RECORDS.filter((record) => {
      const [recordYear, recordMonth] =
        normalizeLogDate(record.logDate)
          .split('-')
          .map(Number)

      return (
        recordYear === year &&
        recordMonth === month
      )
    })
  }, [monthCursor])

  const handleCheckIn = async () => {
    try {
      setLoading(true)

      const response =
        await api.post('/attendance/check-in')

      setAttendance(response.data)

      alert('Checked in successfully')
    } catch (error: unknown) {
      const axiosError =
        error as AxiosError<{ message?: string }>

      alert(
        axiosError.response?.data?.message ||
        'Check-in failed'
      )
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

      alert('Checked out successfully')
    } catch (error: unknown) {
      const axiosError =
        error as AxiosError<{ message?: string }>

      alert(
        axiosError.response?.data?.message ||
        'Check-out failed'
      )
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

  const formatTableDate = (date: Date) => {
    return date.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  const monthLabel = monthCursor.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  )

  const attendanceRows = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const daysInMonth =
      new Date(year, month + 1, 0).getDate()

    const recordMap = new Map(
      monthlyRecords.map((record) => [
        normalizeLogDate(record.logDate),
        record,
      ])
    )

    const rows: AttendanceTableRow[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = toDateKey(date)
      const record = recordMap.get(dateKey)
      const isWeekend =
        date.getDay() === 0 ||
        date.getDay() === 6
      const isToday = dateKey === todayKey
      const isFuture =
        dateKey > todayKey

      let statusLabel = '-- -- --'
      let statusClass = 'empty'

      if (isWeekend) {
        statusLabel = 'Week Off'
        statusClass = 'week-off'
      } else if (record?.attendanceStatus) {
        statusLabel = formatStatusLabel(
          record.attendanceStatus
        )
        statusClass = statusLabel
          .toLowerCase()
          .replace(/\s+/g, '-')
      } else if (!isFuture) {
        statusLabel = '-- -- --'
        statusClass = 'empty'
      }

      rows.push({
        key: dateKey,
        dateLabel: formatTableDate(date),
        checkInTime: record?.checkInTime ?? null,
        checkOutTime: record?.checkOutTime ?? null,
        workedMinutes:
          record?.workedMinutes ?? 0,
        statusLabel,
        statusClass,
        isWeekOff: isWeekend,
        isToday,
        isFuture,
        hasRecord: Boolean(record),
      })
    }

    return rows
  }, [monthCursor, monthlyRecords, todayKey])

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
    setMonthCursor((current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() + step,
        1
      )
    )
  }

  function openRegularizationModal(
    row: AttendanceTableRow
  ) {
    setSelectedAttendanceRow(row)
    setRegularizationForm({
      regularizationType: '',
      reason: '',
    })
    setRegularizationError('')
    setRegularizationModalOpen(true)
  }

  function closeRegularizationModal() {
    setRegularizationModalOpen(false)
    setSelectedAttendanceRow(null)
    setRegularizationForm({
      regularizationType: '',
      reason: '',
    })
    setRegularizationError('')
  }

  function handleRegularizationSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!regularizationForm.regularizationType) {
      setRegularizationError(
        'Please select a type of regularization.'
      )
      return
    }

    alert('Regularization request submitted successfully')
    closeRegularizationModal()
  }

  const selectedRegularizationType =
    REGULARIZATION_TYPE_OPTIONS.find(
      (option) =>
        option.value ===
        regularizationForm.regularizationType
    ) || null

  return (
    <Layout title="Dashboard">
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
              className={`check-btn ${!attendance?.checkInTime
                ? 'check-btn-primary'
                : 'check-btn-secondary'
                }`}
              onClick={handleCheckIn}
              disabled={
                !!attendance?.checkInTime || loading
              }
            >
              {
                attendance?.checkInTime
                  ? 'Checked In'
                  : 'Check In'
              }
            </button>

            <button
              className={`check-btn ${attendance?.checkInTime &&
                !attendance?.checkOutTime
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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {attendanceRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                      <button
                        type="button"
                        className="attendance-action-btn"
                        title="Regularization request"
                        aria-label={`Open regularization request for ${row.dateLabel}`}
                        onClick={() =>
                          openRegularizationModal(row)
                        }
                      >
                        <FiCalendar />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {attendanceRows.length > 0 && (
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
          )}
        </div>
      </div>

      {regularizationModalOpen && (
        <div
          className="act-modal-overlay"
          onClick={closeRegularizationModal}
        >
          <div
            className="act-modal modal-sm"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="act-modal-header">
              <h2>Regularization Request</h2>

              <button
                type="button"
                className="act-modal-close"
                onClick={closeRegularizationModal}
              >
                &times;
              </button>
            </div>

            <form
              id="regularization-form"
              className="act-modal-form"
              onSubmit={handleRegularizationSubmit}
            >
              {/* <h3 className="act-form-section-title">
                Basic Details
              </h3> */}

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Regularization Date</span>

                  <div className="act-date-picker-wrapper">
                    <input
                      type="text"
                      className="act-date-picker regularization-date-readonly"
                      value={
                        selectedAttendanceRow
                          ? formatModalDate(
                            selectedAttendanceRow.key
                          )
                          : ''
                      }
                      readOnly
                    />

                    <FiCalendar className="act-date-icon" />
                  </div>
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>
                    Type of Regularization *
                  </span>

                  <Select
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    menuShouldScrollIntoView={false}
                    classNamePrefix="act-select"
                    options={
                      REGULARIZATION_TYPE_OPTIONS
                    }
                    placeholder="-Select-"
                    value={selectedRegularizationType}
                    onChange={(selected) =>
                      setRegularizationForm((current) => ({
                        ...current,
                        regularizationType: selected
                          ? String(selected.value)
                          : '',
                      }))
                    }
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>
                    Reason for Regularization
                  </span>

                  <textarea
                    rows={4}
                    placeholder="-Enter Text-"
                    value={regularizationForm.reason}
                    onChange={(e) =>
                      setRegularizationForm((current) => ({
                        ...current,
                        reason: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {regularizationError && (
                <div className="form-error">
                  {regularizationError}
                </div>
              )}
            </form>

            <div className="act-modal-actions">
              <button
                type="button"
                className="act-cancel-btn"
                onClick={closeRegularizationModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="regularization-form"
                className="act-submit-btn"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar UI hidden for now
      <div className="dashboard-bottom-grid">
        <div className="attendance-calendar-card">
          <div className="calendar-card-header">
            <h3>Attendance Overview</h3>
          </div>

          <Calendar
            onChange={(value) =>
              setSelectedDate(value as Date)
            }
            value={selectedDate}
            className="hrms-calendar"
          />

          <div className="attendance-legend">
            <div><span className="legend-dot green"></span>Present</div>
            <div><span className="legend-dot red"></span>Absent</div>
            <div><span className="legend-dot orange"></span>Half Day</div>
            <div><span className="legend-dot blue"></span>Leave</div>
          </div>
        </div>
      </div>
      */}
    </Layout>
  )
}
