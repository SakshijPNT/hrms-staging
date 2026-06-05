import { useMemo } from 'react'
import '../styles/Style.css'

export interface LeaveBadge {
  leaveTypeCode: string
  leaveTypeName: string
  isHalfDay: boolean
  session: string | null
  isPending: boolean
}

export interface CalendarDay {
  date: string
  attendanceStatus: string | null
  statusColor: string
  holidayName: string | null
  leaveBadges: LeaveBadge[]
  isFuture: boolean
}

interface AttendanceCalendarProps {
  year: number
  month: number
  days: CalendarDay[]
  loading?: boolean
  onMonthChange: (year: number, month: number) => void
  onDayClick: (date: string) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: Array<{ date: string | null }> = []

  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ date })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null })
  }

  return cells
}

export default function AttendanceCalendar({
  year,
  month,
  days,
  loading,
  onMonthChange,
  onDayClick,
}: AttendanceCalendarProps) {
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    days.forEach((day) => map.set(day.date, day))
    return map
  }, [days])

  const grid = useMemo(
    () => getMonthGrid(year, month),
    [year, month]
  )

  function goPrevMonth() {
    if (month === 1) {
      onMonthChange(year - 1, 12)
    } else {
      onMonthChange(year, month - 1)
    }
  }

  function goNextMonth() {
    if (month === 12) {
      onMonthChange(year + 1, 1)
    } else {
      onMonthChange(year, month + 1)
    }
  }

  if (loading) {
    return <p className="calendar-loading">Loading calendar...</p>
  }

  return (
    <div className="attendance-calendar">
      <div className="calendar-header-bar">
        <button type="button" className="calendar-nav-btn" onClick={goPrevMonth}>
          &lt;
        </button>
        <h3>{MONTH_NAMES[month - 1]} {year}</h3>
        <button type="button" className="calendar-nav-btn" onClick={goNextMonth}>
          &gt;
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map((cell, index) => {
          if (!cell.date) {
            return (
              <div
                key={`empty-${index}`}
                className="calendar-day calendar-day-outside"
              />
            )
          }

          const dayData = dayMap.get(cell.date)
          const colorClass = dayData?.statusColor ?? 'none'
          const dayNum = Number(cell.date.split('-')[2])

          return (
            <button
              key={cell.date}
              type="button"
              className={`calendar-day ${dayData?.isFuture ? 'calendar-day-future' : ''}`}
              onClick={() => onDayClick(cell.date)}
            >
              <span className="calendar-day-number">{dayNum}</span>
              <span
                className={`calendar-day-circle calendar-color-${colorClass}`}
              />
              {dayData?.leaveBadges?.map((badge, badgeIndex) => (
                <span
                  key={`${cell.date}-badge-${badgeIndex}`}
                  className={`calendar-leave-badge ${badge.isPending ? 'pending' : ''}`}
                >
                  {badge.isHalfDay ? `${badge.leaveTypeCode}½` : badge.leaveTypeCode}
                </span>
              ))}
            </button>
          )
        })}
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-present" /> Present
        </span>
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-half_day" /> Half Day
        </span>
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-absent" /> Absent
        </span>
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-holiday" /> Holiday
        </span>
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-week_off" /> Week Off
        </span>
        <span className="calendar-legend-item">
          <i className="calendar-legend-dot calendar-color-leave" /> Leave
        </span>
      </div>
    </div>
  )
}
