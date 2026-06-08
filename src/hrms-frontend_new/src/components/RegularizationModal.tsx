import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AxiosError } from 'axios'
import { FiCalendar } from 'react-icons/fi'
import api from '../services/api'
import {
  formatAttendanceTime,
  toTimeInputValue,
} from '../utils/attendanceFormat'
import type { RegularizationPreview } from '../../types/regularization'

interface RegularizationModalProps {
  open: boolean
  timezone: string
  initialLogDate?: string
  onClose: () => void
  onSuccess: () => void
}

const CORRECTION_OPTIONS = [
  { value: 'FULL_DAY', label: 'Full Day' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'SHORT_DAY', label: 'Short Day' },
  { value: 'FORGOT_CHECK_IN', label: 'Forgot to Check In' },
  { value: 'FORGOT_CHECK_OUT', label: 'Forgot to Check Out' },
]

const initialForm = {
  logDate: '',
  requestedCorrectionType: '',
  requestedCheckInTime: '',
  requestedCheckOutTime: '',
  reason: '',
}

function formatStatusLabel(status: string | null | undefined) {
  if (!status) {
    return 'Not recorded'
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isTimeBasedCorrection(value: string) {
  return value === 'FORGOT_CHECK_IN' || value === 'FORGOT_CHECK_OUT'
}

function formatModalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-')
  return `${day}/${month}/${year}`
}

export default function RegularizationModal({
  open,
  timezone,
  initialLogDate,
  onClose,
  onSuccess,
}: RegularizationModalProps) {
  const [form, setForm] = useState(initialForm)
  const [preview, setPreview] = useState<RegularizationPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setPreview(null)
      setError('')
      return
    }

    if (initialLogDate) {
      setForm({
        ...initialForm,
        logDate: initialLogDate,
      })
    }
  }, [open, initialLogDate])

  useEffect(() => {
    if (!open || !form.logDate) {
      setPreview(null)
      return
    }

    let cancelled = false

    async function loadPreview() {
      setPreviewLoading(true)
      setError('')

      try {
        const response = await api.get<RegularizationPreview>(
          '/regularization/preview',
          { params: { date: form.logDate } },
        )

        if (!cancelled) {
          setPreview(response.data)

          const allowed = response.data.allowedCorrectionTypes ?? []
          setForm((current) => {
            const keepsSelection = allowed.includes(
              current.requestedCorrectionType,
            )

            return {
              ...current,
              requestedCorrectionType: keepsSelection
                ? current.requestedCorrectionType
                : '',
              requestedCheckInTime:
                current.requestedCheckInTime ||
                toTimeInputValue(response.data.originalCheckInTime, timezone),
              requestedCheckOutTime:
                current.requestedCheckOutTime ||
                toTimeInputValue(response.data.originalCheckOutTime, timezone),
            }
          })

          if (!response.data.canSubmit && response.data.blockReason) {
            setError(response.data.blockReason)
          }
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        if (!cancelled) {
          setPreview(null)
          setError(
            axiosError.response?.data?.message ??
              'Unable to load attendance preview.',
          )
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [open, form.logDate, timezone])

  const correctionOptions = useMemo(() => {
    const allowed = preview?.allowedCorrectionTypes ?? []
    if (allowed.length === 0) {
      return CORRECTION_OPTIONS
    }

    return CORRECTION_OPTIONS.filter((option) =>
      allowed.includes(option.value),
    )
  }, [preview?.allowedCorrectionTypes])

  const showRegularizedTimes = isTimeBasedCorrection(
    form.requestedCorrectionType,
  )

  const canSubmit =
    preview?.canSubmit !== false &&
    !previewLoading &&
    Boolean(form.requestedCorrectionType) &&
    Boolean(form.reason.trim()) &&
    (!showRegularizedTimes ||
      (form.requestedCheckInTime && form.requestedCheckOutTime))

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.logDate || !form.requestedCorrectionType || !form.reason.trim()) {
      setError('Please fill date, correction type, and reason.')
      return
    }

    if (showRegularizedTimes) {
      if (!form.requestedCheckInTime || !form.requestedCheckOutTime) {
        setError('Regularized check-in and check-out times are required.')
        return
      }

      if (form.requestedCheckOutTime <= form.requestedCheckInTime) {
        setError('Regularized check-out must be later than check-in.')
        return
      }
    }

    if (preview && !preview.canSubmit) {
      setError(
        preview.blockReason ?? 'Regularization is not allowed for this date.',
      )
      return
    }

    try {
      setLoading(true)

      const payload: Record<string, string> = {
        logDate: form.logDate,
        requestedCorrectionType: form.requestedCorrectionType,
        reason: form.reason.trim(),
      }

      if (showRegularizedTimes) {
        payload.requestedCheckInTime = form.requestedCheckInTime
        payload.requestedCheckOutTime = form.requestedCheckOutTime
      }

      await api.post('/regularization/applications', payload)

      onSuccess()
      onClose()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(
        axiosError.response?.data?.message ??
          'Failed to submit regularization request.',
      )
    } finally {
      setLoading(false)
    }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const maxDate = yesterday.toISOString().slice(0, 10)

  return (
    <div className="act-modal-overlay">
      <div
        className="act-modal reg-modal modal-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>Attendance Regularization</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <form className="act-modal-form reg-modal-form" onSubmit={handleSubmit}>
          <div className="act-form-row">
            <label className="act-form-field">
              <span>Date *</span>
              {initialLogDate ? (
                <div className="act-date-picker-wrapper">
                  <input
                    type="text"
                    className="act-date-picker regularization-date-readonly"
                    value={formatModalDate(form.logDate)}
                    readOnly
                  />
                  <FiCalendar className="act-date-icon" />
                </div>
              ) : (
                <input
                  type="date"
                  max={maxDate}
                  value={form.logDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      logDate: event.target.value,
                      requestedCorrectionType: '',
                    }))
                  }
                />
              )}
            </label>
          </div>

          {previewLoading ? (
            <p className="reg-readonly-hint">Loading attendance preview...</p>
          ) : preview ? (
            <div
              className={`reg-eligibility-banner${
                preview.canSubmit
                  ? ' reg-eligibility-banner--eligible'
                  : ' reg-eligibility-banner--blocked'
              }`}
            >
              {preview.canSubmit
                ? 'This day is eligible for regularisation.'
                : preview.blockReason ??
                  'Regularisation is not available for this date.'}
            </div>
          ) : null}

          <div className="reg-readonly-block">
            <span className="reg-readonly-label">
              Attendance Summary (read-only)
            </span>
            <div className="reg-summary-grid">
              <label className="act-form-field">
                <span>Original Status</span>
                <input
                  type="text"
                  readOnly
                  className="regularization-date-readonly"
                  value={formatStatusLabel(preview?.originalAttendanceStatus)}
                />
              </label>
              <label className="act-form-field">
                <span>Check In</span>
                <input
                  type="text"
                  readOnly
                  className="regularization-date-readonly"
                  value={formatAttendanceTime(
                    preview?.originalCheckInTime,
                    timezone,
                  )}
                />
              </label>
              <label className="act-form-field">
                <span>Check Out</span>
                <input
                  type="text"
                  readOnly
                  className="regularization-date-readonly"
                  value={formatAttendanceTime(
                    preview?.originalCheckOutTime,
                    timezone,
                  )}
                />
              </label>
            </div>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>Correction Requested *</span>
              <select
                value={form.requestedCorrectionType}
                disabled={!preview?.canSubmit || correctionOptions.length === 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestedCorrectionType: event.target.value,
                    requestedCheckInTime:
                      toTimeInputValue(preview?.originalCheckInTime, timezone),
                    requestedCheckOutTime:
                      toTimeInputValue(preview?.originalCheckOutTime, timezone),
                  }))
                }
              >
                <option value="">-Select-</option>
                {correctionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showRegularizedTimes && (
            <div className="reg-readonly-block">
              <span className="reg-readonly-label">Regularized Times *</span>
              <div className="reg-time-grid">
                <label className="act-form-field">
                  <span>Regularized Check In</span>
                  <input
                    type="time"
                    value={form.requestedCheckInTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requestedCheckInTime: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="act-form-field">
                  <span>Regularized Check Out</span>
                  <input
                    type="time"
                    value={form.requestedCheckOutTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requestedCheckOutTime: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <span className="reg-field-hint">
                Enter the actual times you worked for this day.
              </span>
            </div>
          )}

          <label className="act-form-field">
            <span>Reason *</span>
            <textarea
              rows={4}
              maxLength={500}
              value={form.reason}
              placeholder="Provide reason for regularisation"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />
          </label>

          <p className="reg-field-hint reg-workflow-note">
            After submit, your reporting manager will review this request.
          </p>

          {error && <div className="form-error">{error}</div>}

          <div className="act-modal-actions">
            <button
              type="button"
              className="act-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="act-submit-btn"
              disabled={loading || !canSubmit}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
