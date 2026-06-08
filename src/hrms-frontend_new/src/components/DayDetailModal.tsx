import { useEffect, useState } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import type { LeaveBadge } from './AttendanceCalendar'
import {
  formatAttendanceTime,
  formatWorkedHours,
  normalizeDate,
  pickField,
  roundWorkedHours,
} from '../utils/attendanceFormat'

export interface DayDetail {
  date: string
  dayType: string
  holidayName: string | null
  checkInTime: unknown
  checkOutTime: unknown
  workedHours: number
  attendanceStatus: string | null
  isLate: boolean
  isEarlyLeave: boolean
  leaveInfo: LeaveBadge[]
}

interface FallbackAttendance {
  checkInTime?: string | null
  checkOutTime?: string | null
  workedHours?: number
  attendanceStatus?: string | null
}

interface DayDetailModalProps {
  open: boolean
  date: string | null
  timezone: string
  fallbackAttendance?: FallbackAttendance | null
  onClose: () => void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  return null
}

function mapDayDetailResponse(data: Record<string, unknown>): DayDetail {
  const attendance = asRecord(data.attendance ?? data.Attendance)
  const workedMinutes = Number(
    pickField(data, 'workedMinutes', 'WorkedMinutes') ??
      pickField(attendance, 'workedMinutes', 'WorkedMinutes') ??
      0
  )

  const workedHours = roundWorkedHours(
    pickField(data, 'workedHours', 'WorkedHours') ??
      pickField(attendance, 'workedHours', 'WorkedHours') ??
      workedMinutes / 60
  )

  const leaveRaw = pickField(data, 'leaveInfo', 'LeaveInfo')
  const leaveInfo = Array.isArray(leaveRaw)
    ? (leaveRaw as LeaveBadge[])
    : []

  return {
    date: normalizeDate(pickField(data, 'date', 'Date')),
    dayType: String(pickField(data, 'dayType', 'DayType') ?? 'WORKING'),
    holidayName: (pickField(data, 'holidayName', 'HolidayName') ?? null) as
      | string
      | null,
    checkInTime:
      pickField(data, 'checkInTime', 'CheckInTime') ??
      pickField(attendance, 'checkInTime', 'CheckInTime'),
    checkOutTime:
      pickField(data, 'checkOutTime', 'CheckOutTime') ??
      pickField(attendance, 'checkOutTime', 'CheckOutTime'),
    workedHours,
    attendanceStatus: (pickField(data, 'attendanceStatus', 'AttendanceStatus') ??
      pickField(attendance, 'attendanceStatus', 'AttendanceStatus') ??
      null) as string | null,
    isLate: Boolean(
      pickField(data, 'isLate', 'IsLate') ??
        pickField(attendance, 'isLate', 'IsLate') ??
        false
    ),
    isEarlyLeave: Boolean(
      pickField(data, 'isEarlyLeave', 'IsEarlyLeave') ??
        pickField(attendance, 'isEarlyLeave', 'IsEarlyLeave') ??
        false
    ),
    leaveInfo,
  }
}

function mergeWithFallback(
  detail: DayDetail,
  fallback: FallbackAttendance | null | undefined
): DayDetail {
  if (!fallback) {
    return detail
  }

  return {
    ...detail,
    checkInTime: detail.checkInTime ?? fallback.checkInTime,
    checkOutTime: detail.checkOutTime ?? fallback.checkOutTime,
    workedHours: detail.checkInTime || detail.checkOutTime
      ? detail.workedHours
      : roundWorkedHours(fallback.workedHours ?? detail.workedHours),
    attendanceStatus:
      detail.attendanceStatus && detail.attendanceStatus !== 'WEEK_OFF'
        ? detail.attendanceStatus
        : fallback.attendanceStatus ?? detail.attendanceStatus,
  }
}

export default function DayDetailModal({
  open,
  date,
  timezone,
  fallbackAttendance,
  onClose,
}: DayDetailModalProps) {
  const [detail, setDetail] = useState<DayDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !date) {
      return
    }

    let cancelled = false

    async function loadDayDetail() {
      setLoading(true)
      setError('')
      setDetail(null)

      try {
        const response = await api.get('/attendance/day', {
          params: { date },
        })

        if (!cancelled) {
          const mapped = mapDayDetailResponse(response.data)
          setDetail(mergeWithFallback(mapped, fallbackAttendance))
        }
      } catch {
        if (!cancelled) {
          if (fallbackAttendance) {
            setDetail(
              mergeWithFallback(
                {
                  date: date ?? '',
                  dayType: 'WORKING',
                  holidayName: null,
                  checkInTime: null,
                  checkOutTime: null,
                  workedHours: 0,
                  attendanceStatus: null,
                  isLate: false,
                  isEarlyLeave: false,
                  leaveInfo: [],
                },
                fallbackAttendance
              )
            )
          } else {
            setError('Could not load attendance for this day.')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDayDetail()

    return () => {
      cancelled = true
    }
  }, [open, date, fallbackAttendance])

  if (!open) return null

  return (
    <div className="act-modal-overlay">
      <div
        className="act-modal calendar-day-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>Day Detail</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {loading ? (
          <p className="calendar-modal-loading">Loading...</p>
        ) : error ? (
          <p className="calendar-modal-loading">{error}</p>
        ) : detail ? (
          <div className="calendar-day-detail">
            <p className="calendar-detail-date">{detail.date}</p>

            <div className="calendar-detail-grid">
              <div>
                <span>Day Type</span>
                <strong>{detail.dayType.replace('_', ' ')}</strong>
              </div>

              {detail.holidayName && (
                <div>
                  <span>Holiday</span>
                  <strong>{detail.holidayName}</strong>
                </div>
              )}

              <div>
                <span>Check In</span>
                <strong>
                  {formatAttendanceTime(detail.checkInTime, timezone)}
                </strong>
              </div>

              <div>
                <span>Check Out</span>
                <strong>
                  {formatAttendanceTime(detail.checkOutTime, timezone)}
                </strong>
              </div>

              <div>
                <span>Total Hours</span>
                <strong>{formatWorkedHours(detail.workedHours)}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{detail.attendanceStatus ?? '—'}</strong>
              </div>

              {(detail.isLate || detail.isEarlyLeave) && (
                <div>
                  <span>Flags</span>
                  <strong>
                    {[detail.isLate ? 'Late' : '', detail.isEarlyLeave ? 'Early Leave' : '']
                      .filter(Boolean)
                      .join(', ')}
                  </strong>
                </div>
              )}
            </div>

            {detail.leaveInfo.length > 0 && (
              <div className="calendar-detail-leaves">
                <span>Leave</span>
                <div className="calendar-leave-list">
                  {detail.leaveInfo.map((leave, index) => (
                    <span
                      key={`${leave.leaveTypeCode}-${index}`}
                      className={`calendar-leave-chip ${leave.isPending ? 'pending' : ''}`}
                    >
                      {leave.isHalfDay
                        ? `${leave.leaveTypeCode} (${leave.session ?? 'Half'})`
                        : leave.leaveTypeCode}
                      {leave.isPending ? ' Pending' : ' Approved'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
