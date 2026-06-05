import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import Layout from './Layout'
import '../styles/Style.css'
import Select from 'react-select'
import { FiSearch, FiEye, FiX, FiCheck } from 'react-icons/fi'

interface LeaveBalanceCard {
  id: string
  leaveTypeName: string
  total: number
  used: number
  pending: number
}

interface ApprovalRequest {
  id: number
  userId: string
  userName: string
  requestType: string
  startDate: string
  endDate: string
  requestNote: string
  managerNote: string
  status: 'Approve' | 'Reject' | 'Pending'
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

const DUMMY_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 1,
    userId: 'U001',
    userName: 'Rahul G.',
    requestType: 'Paid Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    managerNote: '-- --',
    status: 'Approve',
  },
  {
    id: 2,
    userId: 'U001',
    userName: 'Sakshi Pillai',
    requestType: 'Casual Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    managerNote: '-- --',
    status: 'Pending',
  },
  {
    id: 3,
    userId: 'U001',
    userName: 'David M.',
    requestType: 'Sick Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Not feeling well',
    managerNote: '-- --',
    status: 'Approve',
  },
  {
    id: 4,
    userId: 'U001',
    userName: 'Aryan D.',
    requestType: 'Casual Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Out of Town',
    managerNote: 'Client Meeting',
    status: 'Reject',
  },
  {
    id: 5,
    userId: 'U001',
    userName: 'John Doe',
    requestType: 'Paid Leave',
    startDate: '13/07/2026',
    endDate: '13/07/2026',
    requestNote: 'Family function',
    managerNote: '-- --',
    status: 'Pending',
  },
  {
    id: 6,
    userId: 'U002',
    userName: 'Priya Sharma',
    requestType: 'Sick Leave',
    startDate: '14/07/2026',
    endDate: '14/07/2026',
    requestNote: 'Not feeling well',
    managerNote: '-- --',
    status: 'Approve',
  },
  {
    id: 7,
    userId: 'U002',
    userName: 'Amit Verma',
    requestType: 'Paid Leave',
    startDate: '15/07/2026',
    endDate: '16/07/2026',
    requestNote: 'Out of Town',
    managerNote: '-- --',
    status: 'Pending',
  },
  {
    id: 8,
    userId: 'U003',
    userName: 'Neha Kapoor',
    requestType: 'Casual Leave',
    startDate: '17/07/2026',
    endDate: '17/07/2026',
    requestNote: 'Personal work',
    managerNote: 'Client Meeting',
    status: 'Reject',
  },
  {
    id: 9,
    userId: 'U003',
    userName: 'Rohan Mehta',
    requestType: 'Sick Leave',
    startDate: '18/07/2026',
    endDate: '18/07/2026',
    requestNote: 'Not feeling well',
    managerNote: '-- --',
    status: 'Approve',
  },
  {
    id: 10,
    userId: 'U004',
    userName: 'Anita Roy',
    requestType: 'Paid Leave',
    startDate: '19/07/2026',
    endDate: '20/07/2026',
    requestNote: 'Out of Town',
    managerNote: '-- --',
    status: 'Pending',
  },
  {
    id: 11,
    userId: 'U004',
    userName: 'Vikram Singh',
    requestType: 'Casual Leave',
    startDate: '21/07/2026',
    endDate: '21/07/2026',
    requestNote: 'Out of Town',
    managerNote: '-- --',
    status: 'Approve',
  },
  {
    id: 12,
    userId: 'U005',
    userName: 'Kavya Nair',
    requestType: 'Sick Leave',
    startDate: '22/07/2026',
    endDate: '22/07/2026',
    requestNote: 'Not feeling well',
    managerNote: 'Client Meeting',
    status: 'Reject',
  },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Type' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'paid', label: 'Paid Leave' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'pending', label: 'Pending' },
]

export function MyApprovalPage() {
  const [approvalRequests, setApprovalRequests] =
    useState<ApprovalRequest[]>(DUMMY_APPROVAL_REQUESTS)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewModalOpen, setViewModalOpen] =
    useState(false)
  const [approveModalOpen, setApproveModalOpen] =
    useState(false)
  const [rejectModalOpen, setRejectModalOpen] =
    useState(false)
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null)
  const [managerNote, setManagerNote] = useState('')
  const [actionError, setActionError] = useState('')

  const rowsPerPage = 10

  const isModalOpen =
    viewModalOpen ||
    approveModalOpen ||
    rejectModalOpen

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter, search])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isModalOpen])

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim()

    return approvalRequests.filter((request) => {
      const matchesType =
        typeFilter === 'all' ||
        request.requestType
          .toLowerCase()
          .includes(typeFilter)

      const matchesStatus =
        statusFilter === 'all' ||
        request.status.toLowerCase() === statusFilter

      const matchesSearch =
        !query ||
        request.userId.toLowerCase().includes(query) ||
        request.userName.toLowerCase().includes(query)

      return matchesType && matchesStatus && matchesSearch
    })
  }, [approvalRequests, typeFilter, statusFilter, search])

  const totalPages = Math.ceil(
    filteredRequests.length / rowsPerPage
  )

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage

  const currentRows = filteredRequests.slice(
    indexOfFirstRow,
    indexOfLastRow
  )

  function getStatusClass(status: ApprovalRequest['status']) {
    return status.toLowerCase()
  }

  function openViewModal(request: ApprovalRequest) {
    setSelectedRequest(request)
    setViewModalOpen(true)
  }

  function closeViewModal() {
    setViewModalOpen(false)
    setSelectedRequest(null)
  }

  function openApproveModal(request: ApprovalRequest) {
    setSelectedRequest(request)
    setManagerNote('')
    setActionError('')
    setApproveModalOpen(true)
  }

  function closeApproveModal() {
    setApproveModalOpen(false)
    setSelectedRequest(null)
    setManagerNote('')
    setActionError('')
  }

  function openRejectModal(request: ApprovalRequest) {
    setSelectedRequest(request)
    setManagerNote('')
    setActionError('')
    setRejectModalOpen(true)
  }

  function closeRejectModal() {
    setRejectModalOpen(false)
    setSelectedRequest(null)
    setManagerNote('')
    setActionError('')
  }

  function handleApproveSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedRequest) return

    setApprovalRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? {
            ...request,
            status: 'Approve',
            managerNote:
              managerNote.trim() || '-- --',
          }
          : request
      )
    )

    alert('Leave request approved successfully')
    closeApproveModal()
  }

  function handleRejectSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!managerNote.trim()) {
      setActionError(
        'Rejection note is required.'
      )
      return
    }

    if (!selectedRequest) return

    setApprovalRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? {
            ...request,
            status: 'Reject',
            managerNote: managerNote.trim(),
          }
          : request
      )
    )

    alert('Leave request rejected successfully')
    closeRejectModal()
  }

  return (
    <Layout title="My Approval">
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
                  <span>
                    Used:{' '}
                    {String(leave.used).padStart(2, '0')}
                  </span>
                  <span>
                    Pending:{' '}
                    {String(leave.pending).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="act-toolbar leaves-toolbar approval-toolbar">
          <div className="leaves-filters approval-filters">
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

            <div className="approval-search-wrapper">
              <FiSearch className="act-search-icon" />
              <input
                className="act-search"
                type="text"
                placeholder="Search by User"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="act-table-wrapper">
          <table className="act-table approval-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>User Name</th>
                <th>Request Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
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
                    No approval requests found.
                  </td>
                </tr>
              ) : (
                currentRows.map((request) => (
                  <tr key={request.id}>
                    <td>{request.userId}</td>
                    <td>{request.userName}</td>
                    <td>{request.requestType}</td>
                    <td>{request.startDate}</td>
                    <td>{request.endDate}</td>
                    <td>
                      <span
                        className={`leave-status-text ${getStatusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-group approval-action-group">
                        <button
                          type="button"
                          className="approval-action-btn view"
                          title="View request"
                          aria-label={`View request for ${request.userName}`}
                          onClick={() =>
                            openViewModal(request)
                          }
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="approval-action-btn reject"
                          title="Reject request"
                          aria-label={`Reject request for ${request.userName}`}
                          onClick={() =>
                            openRejectModal(request)
                          }
                        >
                          <FiX />
                        </button>

                        <button
                          type="button"
                          className="approval-action-btn approve"
                          title="Approve request"
                          aria-label={`Approve request for ${request.userName}`}
                          onClick={() =>
                            openApproveModal(request)
                          }
                        >
                          <FiCheck />
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

        {approveModalOpen && selectedRequest && (
          <div
            className="act-modal-overlay"
            onClick={closeApproveModal}
          >
            <div
              className="act-modal modal-sm"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="act-modal-header">
                <h2>Approval Request</h2>

                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeApproveModal}
                >
                  &times;
                </button>
              </div>

              <form
                id="approval-form"
                className="act-modal-form approval-modal-form"
                onSubmit={handleApproveSubmit}
              >
                <div className="act-form-row">
                  <div className="approval-employee-reason">
                    <span>Employee Reason</span>
                    <p className="approval-employee-reason-value">
                      {selectedRequest.requestNote}
                    </p>
                  </div>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Manager Note</span>
                    <textarea
                      className="approval-manager-note"
                      placeholder="-Enter Text-"
                      value={managerNote}
                      onChange={(e) =>
                        setManagerNote(e.target.value)
                      }
                    />
                  </label>
                </div>

                {actionError && (
                  <div className="form-error">
                    {actionError}
                  </div>
                )}
              </form>

              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeApproveModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="approval-form"
                  className="act-submit-btn"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectModalOpen && selectedRequest && (
          <div
            className="act-modal-overlay"
            onClick={closeRejectModal}
          >
            <div
              className="act-modal modal-sm"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="act-modal-header">
                <h2>Rejection Request</h2>

                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeRejectModal}
                >
                  &times;
                </button>
              </div>

              <form
                id="rejection-form"
                className="act-modal-form approval-modal-form"
                onSubmit={handleRejectSubmit}
              >
                <div className="act-form-row">
                  <div className="approval-employee-reason">
                    <span>Employee Reason</span>
                    <p className="approval-employee-reason-value">
                      {selectedRequest.requestNote}
                    </p>
                  </div>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>
                      Rejection Note / Manager Note *
                    </span>
                    <textarea
                      className="approval-rejection-note"
                      placeholder="-Enter Text-"
                      value={managerNote}
                      onChange={(e) => {
                        setManagerNote(e.target.value)
                        if (actionError) {
                          setActionError('')
                        }
                      }}
                    />
                  </label>
                </div>

                {actionError && (
                  <div className="form-error">
                    {actionError}
                  </div>
                )}
              </form>

              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeRejectModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="rejection-form"
                  className="act-reject-btn"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {viewModalOpen && selectedRequest && (
          <div
            className="act-modal-overlay"
            onClick={closeViewModal}
          >
            <div
              className="act-modal modal-md"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="act-modal-header">
                <h2>Leave Request Details</h2>

                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeViewModal}
                >
                  &times;
                </button>
              </div>

              <div className="act-modal-form">
                {/* <h3 className="act-form-section-title">
                  Basic Details
                </h3> */}

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>User ID</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.userId}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>User Name</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.userName}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Request Type</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.requestType}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>Status</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.status}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Start Date</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.startDate}
                      readOnly
                    />
                  </label>

                  <label className="act-form-field">
                    <span>End Date</span>
                    <input
                      type="text"
                      className="approval-detail-readonly"
                      value={selectedRequest.endDate}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Request Note</span>
                    <textarea
                      rows={3}
                      className="approval-detail-readonly"
                      value={selectedRequest.requestNote}
                      readOnly
                    />
                  </label>
                </div>

                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Manager Note</span>
                    <textarea
                      rows={3}
                      className="approval-detail-readonly"
                      value={selectedRequest.managerNote}
                      readOnly
                    />
                  </label>
                </div>
              </div>

              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
