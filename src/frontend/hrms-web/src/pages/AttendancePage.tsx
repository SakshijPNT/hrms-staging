import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { checkInAttendance, checkOutAttendance, getAttendance } from '../api/attendanceApi'
import type { AttendanceRecord } from '../types/hrms'

const PRESENT_THRESHOLD_HOURS = 9
const HALF_DAY_THRESHOLD_HOURS = 5

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDay(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
  })
}

function formatTime(value: string | null) {
  if (!value) {
    return '--:--'
  }

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatClock(value: Date) {
  return value.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function getWorkedHours(record: AttendanceRecord) {
  if (!record.checkInUtc || !record.checkOutUtc) {
    return 0
  }

  const diffMs = new Date(record.checkOutUtc).getTime() - new Date(record.checkInUtc).getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
}

function getDisplayStatus(record: AttendanceRecord) {
  if (record.checkInUtc && !record.checkOutUtc) {
    return 'Pending'
  }

  return record.status
}

function isSameMonth(date: Date, monthDate: Date) {
  return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear()
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase()
}

function formatDuration(hours: number) {
  return `${hours.toFixed(1)}h`
}

export function AttendancePage() {
  const { session } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [now, setNow] = useState(new Date())
  const [monthCursor, setMonthCursor] = useState(new Date())

  async function refreshAttendance() {
    const data = await getAttendance()
    setRecords(data)
  }

  useEffect(() => {
    refreshAttendance()
      .catch(() => setError('Unable to load attendance records.'))
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const todayDateOnly = useMemo(() => now.toISOString().slice(0, 10), [now])
  const currentEmployeeCode = session?.user.employeeCode ?? ''
  const scopedRecords = useMemo(() => {
    if (!currentEmployeeCode) {
      return records
    }

    return records.filter((record) => record.employeeCode === currentEmployeeCode)
  }, [records, currentEmployeeCode])

  const todayRecord = useMemo(
    () => scopedRecords.find((record) => record.workDate === todayDateOnly) ?? null,
    [scopedRecords, todayDateOnly],
  )

  const hasCheckedInToday = Boolean(todayRecord?.checkInUtc)
  const canCheckOut = hasCheckedInToday

  const currentSessionHours = useMemo(() => {
    if (!todayRecord?.checkInUtc) {
      return 0
    }

    const checkInTime = new Date(todayRecord.checkInUtc).getTime()
    const endTime = todayRecord.checkOutUtc ? new Date(todayRecord.checkOutUtc).getTime() : now.getTime()
    const hours = (endTime - checkInTime) / (1000 * 60 * 60)
    return Math.max(0, hours)
  }, [todayRecord, now])

  const monthRecords = useMemo(() => {
    return scopedRecords.filter((record) => isSameMonth(new Date(`${record.workDate}T00:00:00`), monthCursor))
  }, [scopedRecords, monthCursor])

  const monthStats = useMemo(() => {
    let present = 0
    let halfDay = 0
    let absent = 0
    let leave = 0
    let totalHours = 0

    // Build a set of dates that have records for quick lookup
    const recordsByDate = new Map(monthRecords.map((r) => [r.workDate, r]))

    // Determine last day to evaluate: end of month or today (whichever is earlier)
    const monthYear = monthCursor.getFullYear()
    const monthIndex = monthCursor.getMonth()
    const lastDayOfMonth = new Date(monthYear, monthIndex + 1, 0).getDate()
    const todayDate = new Date(now.toISOString().slice(0, 10) + 'T00:00:00')
    const isCurrentMonth = todayDate.getMonth() === monthIndex && todayDate.getFullYear() === monthYear
    const lastDay = isCurrentMonth ? todayDate.getDate() : lastDayOfMonth

    // Determine first day to evaluate based on joining date
    const joiningDateStr = session?.user.dateOfJoining
    const joiningDate = joiningDateStr ? new Date(`${joiningDateStr}T00:00:00`) : null
    const isJoiningMonth = joiningDate
      ? joiningDate.getMonth() === monthIndex && joiningDate.getFullYear() === monthYear
      : false
    const firstDay = isJoiningMonth ? joiningDate!.getDate() : 1
    // If joining date is after this month entirely, skip
    if (joiningDate && new Date(monthYear, monthIndex + 1, 0) < joiningDate) {
      return { present: 0, halfDay: 0, absent: 0, leave: 0, totalHours: 0 }
    }

    for (let day = firstDay; day <= lastDay; day++) {
      const dateStr = `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue
      const record = recordsByDate.get(dateStr)

      if (!record) {
        // No record at all → Absent (skip today if currently checked in)
        const isToday = dateStr === todayDateOnly
        if (!isToday || !hasCheckedInToday) {
          absent += 1
        }
        continue
      }

      const workedHours = getWorkedHours(record)
      totalHours += workedHours

      if (record.status === 'OnLeave') {
        leave += 1
      } else if (record.status === 'Absent') {
        absent += 1
      } else if (workedHours >= PRESENT_THRESHOLD_HOURS) {
        present += 1
      } else if (workedHours > HALF_DAY_THRESHOLD_HOURS) {
        halfDay += 1
      } else if (workedHours > 0) {
        absent += 1
      } else {
        // Record exists but no hours yet (checked in, not checked out) → don't count yet
      }
    }

    return {
      present,
      halfDay,
      absent,
      leave,
      totalHours,
    }
  }, [monthRecords, monthCursor, now, todayDateOnly, hasCheckedInToday, session])

  async function handleCheckIn() {
    setActionError('')
    setIsCheckingIn(true)
    try {
      await checkInAttendance()
      await refreshAttendance()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setActionError(requestError.response?.data?.message ?? 'Unable to check in right now.')
      } else {
        setActionError('Unable to check in right now.')
      }
    } finally {
      setIsCheckingIn(false)
    }
  }

  async function handleCheckOut() {
    setActionError('')
    setIsCheckingOut(true)
    try {
      await checkOutAttendance()
      await refreshAttendance()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setActionError(requestError.response?.data?.message ?? 'Unable to check out right now.')
      } else {
        setActionError('Unable to check out right now.')
      }
    } finally {
      setIsCheckingOut(false)
    }
  }

  function moveMonth(step: number) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))
  }

  return (
    <section className="attendance-page">
      <header className="attendance-topbar">
        <h1 className="attendance-kicker">ATTENDANCE</h1>
      </header>

      <section className="attendance-live-card">
        <div className="attendance-live-time">
          <p className="attendance-live-day">{now.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</p>
          <h2>{formatClock(now)}</h2>
          <p className="attendance-live-zone">Asia/Kolkata</p>
        </div>
        <div className="attendance-live-metrics">
          <div>
            <label>IN</label>
            <p>{formatTime(todayRecord?.checkInUtc ?? null)}</p>
          </div>
          <div>
            <label>OUT</label>
            <p>{formatTime(todayRecord?.checkOutUtc ?? null)}</p>
          </div>
          <div>
            <label>HOURS</label>
            <p>{formatDuration(currentSessionHours)}</p>
          </div>
        </div>
        <div className="attendance-live-actions">
          <button
            className="attendance-action-btn attendance-checkin-btn"
            onClick={handleCheckIn}
            disabled={isCheckingIn}
          >
            {isCheckingIn ? 'CHECKING IN...' : 'CHECK IN'}
          </button>
          <button
            className="attendance-action-btn attendance-checkout-btn"
            onClick={handleCheckOut}
            disabled={!canCheckOut || isCheckingOut}
          >
            {isCheckingOut ? 'CHECKING OUT...' : 'CHECK OUT'}
          </button>
        </div>
      </section>

      {error ? <div className="error-panel">{error}</div> : null}
      {actionError ? <div className="error-panel">{actionError}</div> : null}

      <section className="attendance-history">
        <div className="attendance-history-header">
          <h2>ATTENDANCE HISTORY</h2>
          <div className="attendance-month-switcher">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">&lt;</button>
            <span>{monthLabel(monthCursor)}</span>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">&gt;</button>
          </div>
        </div>

        <div className="attendance-stats-grid">
          <article className="attendance-stat-card stat-present">
            <p>PRESENT</p>
            <h3>{monthStats.present}</h3>
          </article>
          <article className="attendance-stat-card stat-halfday">
            <p>HALF DAY</p>
            <h3>{monthStats.halfDay}</h3>
          </article>
          <article className="attendance-stat-card stat-absent">
            <p>ABSENT</p>
            <h3>{monthStats.absent}</h3>
          </article>
          <article className="attendance-stat-card stat-leave">
            <p>LEAVE</p>
            <h3>{monthStats.leave}</h3>
          </article>
          <article className="attendance-stat-card stat-hours">
            <p>TOTAL HOURS</p>
            <h3>{formatDuration(monthStats.totalHours)}</h3>
          </article>
        </div>

        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>STATUS</th>
                <th>IN</th>
                <th>OUT</th>
                <th>HOURS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="attendance-empty">No attendance records for this month.</td>
                </tr>
              ) : (
                monthRecords.map((record) => {
                  const workedHours = getWorkedHours(record)
                  const displayStatus = getDisplayStatus(record)
                  const statusClass = `status-${displayStatus.toLowerCase().replaceAll(' ', '-')}`

                  return (
                    <tr key={record.id}>
                      <td>
                        <strong>{formatDate(record.workDate)}</strong>
                        <p>{formatDay(record.workDate).toUpperCase()}</p>
                      </td>
                      <td>
                        <span className={`attendance-status-pill ${statusClass}`}>{displayStatus}</span>
                      </td>
                      <td>{formatTime(record.checkInUtc)}</td>
                      <td>{formatTime(record.checkOutUtc)}</td>
                      <td>{formatDuration(workedHours)}</td>
                      <td className="attendance-action-cell">
                        {displayStatus === 'HalfDay' && (
                          <a
                            href="https://forms.office.com/r/2QUeT4SyxV"
                            target="_blank"
                            rel="noreferrer"
                            className="attendance-action-link regularize-link"
                          >
                            REGULARIZE
                          </a>
                        )}
                        {displayStatus === 'Absent' && (
                          <a
                            href="https://forms.office.com/r/iGarb4cA4C"
                            target="_blank"
                            rel="noreferrer"
                            className="attendance-action-link leave-link"
                          >
                            LEAVE
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}