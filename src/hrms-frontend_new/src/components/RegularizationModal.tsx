import { useEffect, useState, type FormEvent } from 'react'
import type { AxiosError } from 'axios'
import api from '../services/api'
import {
  formatAttendanceTime,
  normalizeDate,
} from '../utils/attendanceFormat'
import type { RegularizationPreview } from '../../types/regularization'

interface RegularizationModalProps {
  open: boolean
  timezone: string
  onClose: () => void
  onSuccess: () => void
}

const initialForm = {
  logDate: '',
  requestedCheckInTime: '',
  requestedCheckOutTime: '',
  reason: '',
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

export default function RegularizationModal({
  open,
  timezone,
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
    }
  }, [open])

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
  }, [open, form.logDate])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (
      !form.logDate ||
      !form.requestedCheckInTime ||
      !form.requestedCheckOutTime ||
      !form.reason.trim()
    ) {
      setError('Please fill date, requested in/out times, and reason.')
      return
    }

    if (form.requestedCheckOutTime <= form.requestedCheckInTime) {
      setError('Requested check-out must be later than check-in.')
      return
    }

    if (preview && !preview.canSubmit) {
      setError(preview.blockReason ?? 'Regularization is not allowed for this date.')
      return
    }

    try {
      setLoading(true)

      await api.post('/regularization/applications', {
        logDate: form.logDate,
        requestedCheckInTime: toApiTime(form.requestedCheckInTime),
        requestedCheckOutTime: toApiTime(form.requestedCheckOutTime),
        reason: form.reason.trim(),
      })

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
    <div className="act-modal-overlay" onClick={onClose}>
      <div
        className="act-modal reg-modal"
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

        <form className="act-modal-form" onSubmit={handleSubmit}>
          <div className="act-form-row">
            <label className="act-form-field">
              <span>Request Date *</span>
              <input
                type="date"
                max={maxDate}
                value={form.logDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    logDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="reg-readonly-block">
            <span className="reg-readonly-label">Actual Time (read-only)</span>
            {previewLoading ? (
              <p className="reg-readonly-hint">Loading actual attendance...</p>
            ) : (
              <div className="reg-time-grid">
                <label className="act-form-field">
                  <span>Check In</span>
                  <input
                    type="text"
                    readOnly
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
                    value={formatAttendanceTime(
                      preview?.originalCheckOutTime,
                      timezone,
                    )}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="reg-readonly-block">
            <span className="reg-readonly-label">Requested Time *</span>
            <div className="reg-time-grid">
              <label className="act-form-field">
                <span>Check In</span>
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
                <span>Check Out</span>
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
          </div>

          <label className="act-form-field">
            <span>Reason *</span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.reason}
              placeholder="Provide reason for regularization"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />
          </label>

          {preview && preview.canSubmit && (
            <p className="reg-readonly-hint">
              Date: {normalizeDate(preview.logDate) || form.logDate}
            </p>
          )}

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
              disabled={loading || previewLoading || preview?.canSubmit === false}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
