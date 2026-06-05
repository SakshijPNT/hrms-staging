import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiCalendar, FiEye, FiTrash2 } from 'react-icons/fi'
import { MdEdit } from 'react-icons/md'

interface LeaveBalanceCard {
  id: string
  leaveTypeName: string
  total: number
  used: number
  pending: number
}

interface LeaveRequest {
  id: number
  requestType: string
  startDate: string
  endDate: string
  requestNote: string
  status: 'Approve' | 'Reject' | 'Pending'
  managerNote: string
}

const DUMMY_LEAVE_BALANCES: LeaveBalanceCard[] = [
  {
    id: 'casual',
    leaveTypeName: 'Casual Leave',
    total: 12,
    used: 4,
    pending: 8,
  },
  {
    id: 'sick',
    leaveTypeName: 'Sick Leave',
    total: 12,
    used: 4,
    pending: 8,
  },
  {
    id: 'paid',
    leaveTypeName: 'Paid Leave',
    total: 12,
    used: 4,
    pending: 8,
  },
]

const DUMMY_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 1,
    requestType: 'Paid Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    status: 'Approve',
    managerNote: '-- --',
  },
  {
    id: 2,
    requestType: 'Paid Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Not feeling well',
    status: 'Reject',
    managerNote: 'Client Meeting',
  },
  {
    id: 3,
    requestType: 'Casual Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    status: 'Pending',
    managerNote: '-- --',
  },
  {
    id: 4,
    requestType: 'Sick Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Not feeling well',
    status: 'Approve',
    managerNote: '-- --',
  },
  {
    id: 5,
    requestType: 'Paid Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    status: 'Reject',
    managerNote: 'Client Meeting',
  },
  {
    id: 6,
    requestType: 'Casual Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    status: 'Pending',
    managerNote: '-- --',
  },
  {
    id: 7,
    requestType: 'Sick Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Not feeling well',
    status: 'Approve',
    managerNote: '-- --',
  },
]

const LEAVE_TYPE_OPTIONS = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'paid', label: 'Paid Leave' },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Type' },
  ...LEAVE_TYPE_OPTIONS,
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'pending', label: 'Pending' },
]

export function MyLeavesPage() {
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(DUMMY_LEAVE_REQUESTS)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    requestNote: '',
  })

  const [isStartDateOpen, setIsStartDateOpen] =
    useState(false)

  const [isEndDateOpen, setIsEndDateOpen] =
    useState(false)

  const rowsPerPage = 10

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [modalOpen])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter])

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesType =
        typeFilter === 'all' ||
        request.requestType
          .toLowerCase()
          .includes(typeFilter)

      const matchesStatus =
        statusFilter === 'all' ||
        request.status.toLowerCase() === statusFilter

      return matchesType && matchesStatus
    })
  }, [leaveRequests, typeFilter, statusFilter])

  const totalPages = Math.ceil(
    filteredRequests.length / rowsPerPage
  )

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage

  const currentRows = filteredRequests.slice(
    indexOfFirstRow,
    indexOfLastRow
  )

  const selectedLeaveType =
    LEAVE_TYPE_OPTIONS.find(
      (option) => option.value === form.leaveType
    ) || null

  function openModal() {
    setForm({
      leaveType: '',
      startDate: '',
      endDate: '',
      requestNote: '',
    })
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setError('')
  }

  function formatRequestDate(date: Date | null) {
    if (!date) return ''

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  function parseDisplayDate(dateStr: string) {
    if (!dateStr) return null

    const [day, month, year] = dateStr
      .split('/')
      .map(Number)

    return new Date(year, month - 1, day)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (
      !form.leaveType ||
      !form.startDate ||
      !form.endDate
    ) {
      setError('Please fill all required fields.')
      return
    }

    const leaveLabel =
      LEAVE_TYPE_OPTIONS.find(
        (option) => option.value === form.leaveType
      )?.label || 'Leave'

    const newRequest: LeaveRequest = {
      id: leaveRequests.length + 1,
      requestType: leaveLabel,
      startDate: form.startDate,
      endDate: form.endDate,
      requestNote: form.requestNote || '-- --',
      status: 'Pending',
      managerNote: '-- --',
    }

    setLeaveRequests((current) => [
      newRequest,
      ...current,
    ])

    alert('Leave request submitted successfully')
    closeModal()
  }

  function getStatusClass(status: LeaveRequest['status']) {
    return status.toLowerCase()
  }

  return (
    <Layout title="My Leaves">
      <div className="act-page">
        <div className="act-stats leaves-stats">
          {DUMMY_LEAVE_BALANCES.map((leave) => (
            <div
              key={leave.id}
              className={`act-leave-card ${leave.id}`}
            >
              <div className="act-leave-card-content">
                <h3>
                  {leave.leaveTypeName}:{' '}
                  <span className="act-leave-card-total">
                    {leave.total}
                  </span>
                </h3>

                <div className="act-leave-card-meta">
                  <span>Used: {String(leave.used).padStart(2, '0')}</span>
                  <span>
                    Pending:{' '}
                    {String(leave.pending).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="act-toolbar leaves-toolbar">
          <div className="leaves-filters">
            <div className="leaves-filter-field">
              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={TYPE_FILTER_OPTIONS}
                value={
                  TYPE_FILTER_OPTIONS.find(
                    (option) =>
                      option.value === typeFilter
                  ) || TYPE_FILTER_OPTIONS[0]
                }
                onChange={(selected) =>
                  setTypeFilter(
                    selected ? String(selected.value) : 'all'
                  )
                }
              />
            </div>

            <div className="leaves-filter-field">
              <Select
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                classNamePrefix="act-select"
                options={STATUS_FILTER_OPTIONS}
                value={
                  STATUS_FILTER_OPTIONS.find(
                    (option) =>
                      option.value === statusFilter
                  ) || STATUS_FILTER_OPTIONS[0]
                }
                onChange={(selected) =>
                  setStatusFilter(
                    selected ? String(selected.value) : 'all'
                  )
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="act-new-btn"
            onClick={openModal}
          >
            Apply Leave
          </button>
        </div>

        <div className="act-table-wrapper">
          <table className="act-table leaves-table">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Request Note</th>
                <th>Status</th>
                <th>Manager Note</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                currentRows.map((request) => (
                  <tr key={request.id}>
                    <td>{request.requestType}</td>
                    <td>{request.startDate}</td>
                    <td>{request.endDate}</td>
                    <td>{request.requestNote}</td>
                    <td>
                      <span
                        className={`leave-status-text ${getStatusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>{request.managerNote}</td>
                    <td>
                      <div className="table-action-group">
                        <button
                          type="button"
                          className="leave-table-action-btn"
                          title="View request"
                          aria-label={`View leave request ${request.id}`}
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="leave-table-action-btn"
                          title="Edit request"
                          aria-label={`Edit leave request ${request.id}`}
                        >
                          <MdEdit />
                        </button>

                        <button
                          type="button"
                          className="leave-table-action-btn"
                          title="Delete request"
                          aria-label={`Delete leave request ${request.id}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredRequests.length > 0 && (
            <div className="role-pagination">
              <div className="pagination-info">
                Showing {currentRows.length} of{' '}
                {filteredRequests.length}
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

        {modalOpen && (
          <div
            className="act-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="act-modal modal-sm"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="act-modal-header">
                <h2>Leave Request</h2>

                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeModal}
                >
                  &times;
                </button>
              </div>

              <form
                id="leave-request-form"
                className="act-modal-form"
                onSubmit={handleSubmit}
              >
                {/* <h3 className="act-form-section-title">
                  Basic Details
                </h3> */}

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Leave Type *</span>

                    <Select
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      menuShouldScrollIntoView={false}
                      classNamePrefix="act-select"
                      options={LEAVE_TYPE_OPTIONS}
                      placeholder="-Select-"
                      value={selectedLeaveType}
                      onChange={(selected) =>
                        setForm((current) => ({
                          ...current,
                          leaveType: selected
                            ? String(selected.value)
                            : '',
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Start Date *</span>

                    <div className="act-date-picker-wrapper">
                      <DatePicker
                        selected={parseDisplayDate(
                          form.startDate
                        )}
                        onChange={(date: Date | null) => {
                          setForm((current) => ({
                            ...current,
                            startDate:
                              formatRequestDate(date),
                          }))
                          setIsStartDateOpen(false)
                        }}
                        onInputClick={() =>
                          setIsStartDateOpen(true)
                        }
                        open={isStartDateOpen}
                        onClickOutside={() =>
                          setIsStartDateOpen(false)
                        }
                        placeholderText="-Select-"
                        dateFormat="dd/MM/yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                      />

                      <FiCalendar
                        className="act-date-icon"
                        onClick={() =>
                          setIsStartDateOpen((prev) => !prev)
                        }
                      />
                    </div>
                  </label>

                  <label className="act-form-field">
                    <span>End Date *</span>

                    <div className="act-date-picker-wrapper">
                      <DatePicker
                        selected={parseDisplayDate(
                          form.endDate
                        )}
                        onChange={(date: Date | null) => {
                          setForm((current) => ({
                            ...current,
                            endDate:
                              formatRequestDate(date),
                          }))
                          setIsEndDateOpen(false)
                        }}
                        onInputClick={() =>
                          setIsEndDateOpen(true)
                        }
                        open={isEndDateOpen}
                        onClickOutside={() =>
                          setIsEndDateOpen(false)
                        }
                        placeholderText="-Select-"
                        dateFormat="dd/MM/yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                      />

                      <FiCalendar
                        className="act-date-icon"
                        onClick={() =>
                          setIsEndDateOpen((prev) => !prev)
                        }
                      />
                    </div>
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Request Note</span>

                    <textarea
                      rows={4}
                      placeholder="-Enter Text-"
                      value={form.requestNote}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          requestNote: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}
              </form>

              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="leave-request-form"
                  className="act-submit-btn"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
