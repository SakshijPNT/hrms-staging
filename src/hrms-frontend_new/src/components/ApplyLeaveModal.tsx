import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import type { AxiosError } from 'axios'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiCalendar } from 'react-icons/fi'
import api from '../services/api'
import '../styles/Style.css'

interface LeaveType {
  id: number
  leaveTypeName: string
}

export interface LeaveApplicationEditData {
  id: number
  leaveTypeId: number
  fromDate: string
  toDate: string
  isHalfDay: boolean
  session: string | null
  reason: string | null
}

interface ApplyLeaveModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editApplication?: LeaveApplicationEditData | null
}

export function ApplyLeaveModal({
  open,
  onClose,
  onSuccess,
  editApplication = null,
}: ApplyLeaveModalProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [monthlyWarning, setMonthlyWarning] = useState('')
  const [isFromDateOpen, setIsFromDateOpen] = useState(false)
  const [isToDateOpen, setIsToDateOpen] = useState(false)
  const [form, setForm] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    isHalfDay: false,
    session: '',
    workHours: '',
    reason: '',
  })

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((leave) => ({
        value: leave.id,
        label: leave.leaveTypeName,
      })),
    [leaveTypes],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    if (editApplication) {
      setForm({
        leaveTypeId: String(editApplication.leaveTypeId),
        fromDate: normalizeDate(editApplication.fromDate),
        toDate: normalizeDate(editApplication.toDate),
        isHalfDay: editApplication.isHalfDay,
        session: editApplication.session ?? '',
        workHours: '',
        reason: editApplication.reason ?? '',
      })
    } else {
      setForm({
        leaveTypeId: '',
        fromDate: '',
        toDate: '',
        isHalfDay: false,
        session: '',
        workHours: '',
        reason: '',
      })
    }

    setError('')
    setMonthlyWarning('')
    setIsFromDateOpen(false)
    setIsToDateOpen(false)

    void fetchLeaveTypes()
  }, [open, editApplication])

  useEffect(() => {
    if (!open || !form.leaveTypeId || !form.fromDate) {
      setMonthlyWarning('')
      return
    }

    if (!form.isHalfDay && !form.toDate) {
      setMonthlyWarning('')
      return
    }

    if (form.isHalfDay && !form.session) {
      setMonthlyWarning('')
      return
    }

    const timer = window.setTimeout(() => {
      void fetchMonthlyPreview()
    }, 300)

    return () => window.clearTimeout(timer)
  }, [
    open,
    form.leaveTypeId,
    form.fromDate,
    form.toDate,
    form.isHalfDay,
    form.session,
    editApplication?.id,
  ])

  async function fetchMonthlyPreview() {
    try {
      const params: Record<string, string | number | boolean> = {
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: form.isHalfDay ? form.fromDate : form.toDate,
        isHalfDay: form.isHalfDay,
      }

      if (form.isHalfDay) {
        params.session = form.session
      }

      if (editApplication) {
        params.excludeLeaveId = editApplication.id
      }

      const response = await api.get<{
        exceedsMonthlyLimit: boolean
        warningMessage?: string | null
      }>('/user-leaves/applications/monthly-preview', { params })

      setMonthlyWarning(
        response.data.exceedsMonthlyLimit
          ? (response.data.warningMessage ?? '')
          : '',
      )
    } catch {
      setMonthlyWarning('')
    }
  }

  function normalizeDate(value: string) {
    return value.slice(0, 10)
  }

  async function fetchLeaveTypes() {
    try {
      const response = await api.get<LeaveType[]>('/user-leaves/leave-types')
      setLeaveTypes(response.data ?? [])
    } catch (fetchError) {
      console.error('Error fetching leave types', fetchError)
      setLeaveTypes([])
    }
  }

  async function handleLeaveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.leaveTypeId || !form.fromDate || !form.reason.trim()) {
      setError('All required fields must be filled.')
      return
    }

    if (!form.isHalfDay && !form.toDate) {
      setError('Please select a to date.')
      return
    }

    if (form.isHalfDay && !form.session) {
      setError('Please select session for half day leave.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const payload = {
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: form.isHalfDay ? form.fromDate : form.toDate,
        isHalfDay: form.isHalfDay,
        session: form.isHalfDay ? form.session : null,
        reason: form.reason.trim(),
      }

      if (editApplication) {
        await api.put(
          `/user-leaves/applications/${editApplication.id}`,
          payload,
        )
      } else {
        await api.post('/user-leaves/applications', payload)
      }
      onSuccess?.()
      onClose()
    } catch (submitError: unknown) {
      const axiosError = submitError as AxiosError<{ message?: string }>
      setError(
        axiosError.response?.data?.message ??
          (editApplication ? 'Failed to update leave' : 'Failed to apply leave'),
      )
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="act-modal-overlay">
      <div
        className="act-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="act-modal-header">
          <h2>{editApplication ? 'Edit Leave Request' : 'Apply Leave'}</h2>
          <button
            type="button"
            className="act-modal-close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <form
          id="apply-leave-form"
          className="act-modal-form"
          onSubmit={handleLeaveSubmit}
        >
          <div className="act-form-row">
            <label className="act-form-field">
              <span>Leave Type *</span>

              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={leaveTypeOptions}
                placeholder="Select Leave Type"
                value={
                  leaveTypeOptions.find(
                    (option) => String(option.value) === form.leaveTypeId,
                  ) || null
                }
                onChange={(selected) =>
                  setForm((current) => ({
                    ...current,
                    leaveTypeId: selected ? String(selected.value) : '',
                  }))
                }
              />
            </label>

            <label className="act-form-field">
              <span>Half Day *</span>
              <div className="halfday-radio-group">
                <label className="halfday-radio">
                  <input
                    type="radio"
                    name="halfDay"
                    checked={form.isHalfDay === true}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        isHalfDay: true,
                        toDate: current.fromDate,
                      }))
                    }
                  />
                  <span>True</span>
                </label>
                <label className="halfday-radio">
                  <input
                    type="radio"
                    name="halfDay"
                    checked={form.isHalfDay === false}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        isHalfDay: false,
                        session: '',
                        workHours: '',
                      }))
                    }
                  />
                  <span>False</span>
                </label>
              </div>
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>From Date *</span>

              <div className="act-date-picker-wrapper">
                <DatePicker
                  selected={form.fromDate ? new Date(form.fromDate) : null}
                  onChange={(date: Date | null) => {
                    const formattedDate = date
                      ? date.toISOString().split('T')[0]
                      : ''

                    setForm((current) => ({
                      ...current,
                      fromDate: formattedDate,
                      toDate: current.isHalfDay
                        ? formattedDate
                        : current.toDate,
                    }))

                    setIsFromDateOpen(false)
                  }}
                  onInputClick={() => setIsFromDateOpen(true)}
                  open={isFromDateOpen}
                  onClickOutside={() => setIsFromDateOpen(false)}
                  placeholderText="Select from date"
                  dateFormat="dd MMM yyyy"
                  className="act-date-picker"
                  popperClassName="act-datepicker-popper"
                  portalId="root"
                  popperPlacement="bottom-start"
                />

                <FiCalendar
                  className="act-date-icon"
                  onClick={() => setIsFromDateOpen((prev) => !prev)}
                />
              </div>
            </label>

            <label className="act-form-field">
              <span>To Date *</span>

              <div className="act-date-picker-wrapper">
                <DatePicker
                  selected={form.toDate ? new Date(form.toDate) : null}
                  onChange={(date: Date | null) => {
                    setForm((current) => ({
                      ...current,
                      toDate: date ? date.toISOString().split('T')[0] : '',
                    }))

                    setIsToDateOpen(false)
                  }}
                  onInputClick={() => setIsToDateOpen(true)}
                  open={isToDateOpen}
                  onClickOutside={() => setIsToDateOpen(false)}
                  placeholderText="Select to date"
                  dateFormat="dd MMM yyyy"
                  className="act-date-picker"
                  popperClassName="act-datepicker-popper"
                  portalId="root"
                  popperPlacement="bottom-start"
                  disabled={form.isHalfDay}
                />

                <FiCalendar
                  className={`act-date-icon ${
                    form.isHalfDay ? 'disabled-date-icon' : ''
                  }`}
                  onClick={() => {
                    if (!form.isHalfDay) {
                      setIsToDateOpen((prev) => !prev)
                    }
                  }}
                />
              </div>
            </label>
          </div>

          {form.isHalfDay && (
            <div className="act-form-row">
              <label className="act-form-field">
                <span>Session *</span>

                <Select
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuPlacement="auto"
                  menuShouldScrollIntoView={false}
                  classNamePrefix="act-select"
                  placeholder="Select Session"
                  options={[
                    {
                      value: 'FIRST_HALF',
                      label: 'First Half',
                    },
                    {
                      value: 'SECOND_HALF',
                      label: 'Second Half',
                    },
                  ]}
                  value={
                    form.session
                      ? {
                          value: form.session,
                          label:
                            form.session === 'FIRST_HALF'
                              ? 'First Half'
                              : 'Second Half',
                        }
                      : null
                  }
                  onChange={(selected) =>
                    setForm((current) => ({
                      ...current,
                      session: selected ? selected.value : '',
                    }))
                  }
                />
              </label>
            </div>
          )}

          <div className="act-form-row">
            {form.isHalfDay && (
              <label className="act-form-field">
                <span>Work Hours</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={form.workHours}
                  placeholder="Enter work hours"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workHours: event.target.value,
                    }))
                  }
                />
              </label>
            )}

            <label className="act-form-field">
              <span>Reason *</span>
              <textarea
                rows={3}
                value={form.reason}
                placeholder="Enter leave reason"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {monthlyWarning && (
            <div className="form-warning">{monthlyWarning}</div>
          )}

          {error && <div className="form-error">{error}</div>}
        </form>

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
            form="apply-leave-form"
            className="act-submit-btn"
            disabled={loading}
          >
            {loading
              ? editApplication
                ? 'Updating...'
                : 'Applying...'
              : editApplication
                ? 'Update Leave'
                : 'Apply Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}
