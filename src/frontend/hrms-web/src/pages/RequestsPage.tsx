import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getAttendance } from '../api/attendanceApi'
import { useAuth } from '../auth/AuthContext'
import { createRequest } from '../api/requestApi'
import type { AttendanceRecord, CreateRequestPayload } from '../types/hrms'

function formatDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10)
}

function formatTime(value: string | null) {
  if (!value) {
    return '--:--'
  }

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTimeInput(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

interface RegularizationForm {
  workDate: string
  regularizedCheckIn: string
  regularizedCheckOut: string
  reason: string
}

const initialRegularizationForm: RegularizationForm = {
  workDate: formatDateInputValue(new Date()),
  regularizedCheckIn: '',
  regularizedCheckOut: '',
  reason: '',
}

export function RequestsPage() {
  const { session } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [regularizationForm, setRegularizationForm] = useState<RegularizationForm>(initialRegularizationForm)
  const [regularizationError, setRegularizationError] = useState('')
  const [regularizationSuccess, setRegularizationSuccess] = useState('')
  const [pageError, setPageError] = useState('')
  const [isRegularizationSubmitting, setIsRegularizationSubmitting] = useState(false)

  useEffect(() => {
    getAttendance()
      .then((attendanceResult) => {
        setAttendance(attendanceResult)
      })
      .catch(() => setPageError('Unable to load attendance.'))
  }, [])

  const employeeCode = session?.user.employeeCode ?? ''
  const scopedAttendance = useMemo(() => {
    if (!employeeCode) {
      return attendance
    }

    return attendance.filter((record) => record.employeeCode === employeeCode)
  }, [attendance, employeeCode])

  const selectedDayRecord = useMemo(
    () => scopedAttendance.find((record) => record.workDate === regularizationForm.workDate) ?? null,
    [scopedAttendance, regularizationForm.workDate],
  )

  const actualCheckIn = formatTime(selectedDayRecord?.checkInUtc ?? null)
  const actualCheckOut = formatTime(selectedDayRecord?.checkOutUtc ?? null)

  useEffect(() => {
    if (!selectedDayRecord) {
      return
    }

    setRegularizationForm((current) => {
      const nextCheckIn = current.regularizedCheckIn || formatTimeInput(selectedDayRecord.checkInUtc)
      const nextCheckOut = current.regularizedCheckOut || formatTimeInput(selectedDayRecord.checkOutUtc)

      if (
        nextCheckIn === current.regularizedCheckIn &&
        nextCheckOut === current.regularizedCheckOut
      ) {
        return current
      }

      return {
        ...current,
        regularizedCheckIn: nextCheckIn,
        regularizedCheckOut: nextCheckOut,
      }
    })
  }, [selectedDayRecord])

  function handleRegularizationCancel() {
    setRegularizationError('')
    setRegularizationSuccess('')
    setRegularizationForm((current) => ({
      ...initialRegularizationForm,
      workDate: current.workDate,
    }))
  }

  async function handleRegularizationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegularizationError('')
    setRegularizationSuccess('')
    setIsRegularizationSubmitting(true)

    if (
      !regularizationForm.workDate ||
      !regularizationForm.regularizedCheckIn ||
      !regularizationForm.regularizedCheckOut ||
      !regularizationForm.reason.trim()
    ) {
      setRegularizationError('Please provide date, in time, out time, and reason.')
      setIsRegularizationSubmitting(false)
      return
    }

    if (regularizationForm.regularizedCheckOut <= regularizationForm.regularizedCheckIn) {
      setRegularizationError('Regularization out time must be later than in time.')
      setIsRegularizationSubmitting(false)
      return
    }

    const payload: CreateRequestPayload = {
      title: 'Attendance Regularization',
      description: `Date: ${regularizationForm.workDate}\nActual: ${actualCheckIn} to ${actualCheckOut}\nRegularized: ${regularizationForm.regularizedCheckIn} to ${regularizationForm.regularizedCheckOut}\nReason: ${regularizationForm.reason.trim()}`,
      startDate: regularizationForm.workDate,
      endDate: regularizationForm.workDate,
    }

    try {
      await createRequest(payload)
      setRegularizationSuccess('Regularization request submitted successfully.')
      setRegularizationForm((current) => ({
        ...current,
        regularizedCheckIn: '',
        regularizedCheckOut: '',
        reason: '',
      }))
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setRegularizationError(requestError.response?.data?.message ?? 'Unable to submit regularization request.')
      } else {
        setRegularizationError('Unable to submit regularization request.')
      }
    } finally {
      setIsRegularizationSubmitting(false)
    }
  }

  return (
    <div className="act-page">
      <div className="act-page-header">
        <div>
          <nav className="act-breadcrumb">
            <span className="act-breadcrumb-link">Requests</span>
          </nav>
          <h1 className="act-title">Regularization Request</h1>
        </div>
      </div>

      {pageError ? <div className="form-error">{pageError}</div> : null}

      {regularizationSuccess ? <div className="form-success">{regularizationSuccess}</div> : null}

      <div className="req-tab-content">
        <form className="req-regularization-card" onSubmit={handleRegularizationSubmit}>
          <div className="req-regularization-row">
            <div className="req-regularization-label">Request Date</div>
            <input
              className="req-regularization-date"
              type="date"
              value={regularizationForm.workDate}
              onChange={(event) =>
                setRegularizationForm((current) => ({
                  ...current,
                  workDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="req-regularization-row">
            <div className="req-regularization-label">Actual Time</div>
            <div className="req-regularization-time-grid">
              <div className="req-time-box req-time-box-muted">{actualCheckIn}</div>
              <div className="req-time-box req-time-box-muted">{actualCheckOut}</div>
            </div>
          </div>

          <div className="req-regularization-row">
            <div className="req-regularization-label">Regularization</div>
            <div className="req-regularization-time-grid">
              <input
                className="req-time-box"
                type="time"
                value={regularizationForm.regularizedCheckIn}
                onChange={(event) =>
                  setRegularizationForm((current) => ({
                    ...current,
                    regularizedCheckIn: event.target.value,
                  }))
                }
                required
              />
              <input
                className="req-time-box"
                type="time"
                value={regularizationForm.regularizedCheckOut}
                onChange={(event) =>
                  setRegularizationForm((current) => ({
                    ...current,
                    regularizedCheckOut: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="req-regularization-row req-regularization-row-reason">
            <div className="req-regularization-label">Reason</div>
            <textarea
              className="req-reason-box"
              rows={3}
              value={regularizationForm.reason}
              onChange={(event) =>
                setRegularizationForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Provide reason for regularization"
              required
            />
          </div>

          {regularizationError ? <div className="form-error">{regularizationError}</div> : null}

          <div className="req-regularization-actions">
            <button
              type="button"
              className="act-cancel-btn"
              onClick={handleRegularizationCancel}
              disabled={isRegularizationSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="act-submit-btn"
              disabled={isRegularizationSubmitting}
            >
              {isRegularizationSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
