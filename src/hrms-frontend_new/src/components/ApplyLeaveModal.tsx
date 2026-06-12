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
import {
  formatLocalDateIso,
  normalizeDate,
  parseLocalDate,
} from '../utils/attendanceFormat'
import {
  isHalfDayLeave,
  sessionFromSubLeaveType,
  SUB_LEAVE_TYPE_OPTIONS,
  subLeaveTypeFromApi,
  type SubLeaveType,
} from '../utils/leaveFormat'
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
  const [monthlyLimitMessage, setMonthlyLimitMessage] = useState('')
  const [monthlyLimitExceeded, setMonthlyLimitExceeded] = useState(false)
  const [isFromDateOpen, setIsFromDateOpen] = useState(false)
  const [isToDateOpen, setIsToDateOpen] = useState(false)
  const [form, setForm] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    subLeaveType: 'FULL_DAY' as SubLeaveType,
    reason: '',
  })

  const isHalfDay = isHalfDayLeave(form.subLeaveType)
  const session = sessionFromSubLeaveType(form.subLeaveType)

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((leave) => ({
        value: leave.id,
        label: leave.leaveTypeName,
      })),
    [leaveTypes],
  )

  const subLeaveTypeOptions = useMemo(
    () =>
      SUB_LEAVE_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
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
        subLeaveType: subLeaveTypeFromApi(
          editApplication.isHalfDay,
          editApplication.session,
        ),
        reason: editApplication.reason ?? '',
      })
    } else {
      setForm({
        leaveTypeId: '',
        fromDate: '',
        toDate: '',
        subLeaveType: 'FULL_DAY',
        reason: '',
      })
    }

    setError('')
    setMonthlyLimitMessage('')
    setMonthlyLimitExceeded(false)
    setIsFromDateOpen(false)
    setIsToDateOpen(false)

    void fetchLeaveTypes()
  }, [open, editApplication])

  useEffect(() => {
    if (!open || !form.leaveTypeId || !form.fromDate) {
      setMonthlyLimitMessage('')
      setMonthlyLimitExceeded(false)
      return
    }

    if (!isHalfDay && !form.toDate) {
      setMonthlyLimitMessage('')
      setMonthlyLimitExceeded(false)
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
    form.subLeaveType,
    editApplication?.id,
    isHalfDay,
    session,
  ])

  async function fetchMonthlyPreview() {
    try {
      const params: Record<string, string | number | boolean> = {
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: isHalfDay ? form.fromDate : form.toDate,
        isHalfDay,
      }

      if (isHalfDay && session) {
        params.session = session
      }

      if (editApplication) {
        params.excludeLeaveId = editApplication.id
      }

      const response = await api.get<{
        exceedsMonthlyLimit: boolean
        warningMessage?: string | null
      }>('/user-leaves/applications/monthly-preview', { params })

      const exceeds = Boolean(response.data.exceedsMonthlyLimit)
      setMonthlyLimitExceeded(exceeds)
      setMonthlyLimitMessage(
        exceeds ? (response.data.warningMessage ?? '') : '',
      )
    } catch {
      setMonthlyLimitMessage('')
      setMonthlyLimitExceeded(false)
    }
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

  function handleSubLeaveTypeChange(subLeaveType: SubLeaveType) {
    setForm((current) => ({
      ...current,
      subLeaveType,
      toDate: isHalfDayLeave(subLeaveType)
        ? current.fromDate
        : current.toDate,
    }))
  }

  async function handleLeaveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.leaveTypeId || !form.fromDate || !form.reason.trim()) {
      setError('All required fields must be filled.')
      return
    }

    if (!isHalfDay && !form.toDate) {
      setError('Please select a to date.')
      return
    }

    if (monthlyLimitExceeded) {
      setError(
        monthlyLimitMessage ||
          'You have exceeded this month\'s leave quota for the selected leave type.',
      )
      return
    }

    try {
      setLoading(true)
      setError('')

      const payload = {
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: isHalfDay ? form.fromDate : form.toDate,
        isHalfDay,
        session: isHalfDay ? session : null,
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
              <span>Sub Leave Type *</span>

              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={subLeaveTypeOptions}
                placeholder="Select Sub Leave Type"
                value={
                  subLeaveTypeOptions.find(
                    (option) => option.value === form.subLeaveType,
                  ) || subLeaveTypeOptions[0]
                }
                onChange={(selected) =>
                  handleSubLeaveTypeChange(
                    (selected?.value as SubLeaveType | undefined) ?? 'FULL_DAY',
                  )
                }
              />
            </label>
          </div>

          <div className="act-form-row">
            <label className="act-form-field">
              <span>From Date *</span>

              <div className="act-date-picker-wrapper">
                <DatePicker
                  selected={
                    form.fromDate ? parseLocalDate(form.fromDate) : null
                  }
                  onChange={(date: Date | null) => {
                    const formattedDate = date ? formatLocalDateIso(date) : ''

                    setForm((current) => ({
                      ...current,
                      fromDate: formattedDate,
                      toDate: isHalfDayLeave(current.subLeaveType)
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

            {!isHalfDay && (
              <label className="act-form-field">
                <span>To Date *</span>

                <div className="act-date-picker-wrapper">
                  <DatePicker
                    selected={form.toDate ? parseLocalDate(form.toDate) : null}
                    onChange={(date: Date | null) => {
                      setForm((current) => ({
                        ...current,
                        toDate: date ? formatLocalDateIso(date) : '',
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
                    minDate={
                      form.fromDate ? parseLocalDate(form.fromDate) : undefined
                    }
                  />

                  <FiCalendar
                    className="act-date-icon"
                    onClick={() => setIsToDateOpen((prev) => !prev)}
                  />
                </div>
              </label>
            )}
          </div>

          <div className="act-form-row">
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

          {monthlyLimitMessage && (
            <div className="form-error">{monthlyLimitMessage}</div>
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
            disabled={loading || monthlyLimitExceeded}
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
