import Layout from './Layout'
import '../styles/Style.css'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import api from '../services/api'
import type { AxiosError } from 'axios'
import { FiSearch, FiPlus } from 'react-icons/fi'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiCalendar } from 'react-icons/fi'

interface LeaveBalance {
  leaveTypeId: number
  leaveTypeName: string
  availableBalance: number
}

interface LeaveType {
  id: number
  leaveTypeName: string
}

interface Application {
  id: number
  leaveTypeName: string
  fromDate: string
  toDate: string
  totalDays: number
  isHalfDay: boolean
  session: string | null
  workHours: string
  reason: string
  approvalStatus: string
  createdOn: string
}

export function MyApplicationsPage() {

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])

  const [applications, setApplications] = useState<Application[]>([])

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])

  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [form, setForm] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    isHalfDay: false,
    session: '',
    workHours: '',
    reason: '',
  })

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLeaveBalances()
    fetchApplications()
    fetchLeaveTypes()
  }, [])

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

  const [isFromDateOpen, setIsFromDateOpen] = useState(false)

  const [isToDateOpen, setIsToDateOpen] = useState(false)

  async function fetchLeaveBalances() {

    try {

      const response = await api.get(
        '/user-leaves/balances'
      )

      setLeaveBalances(response.data)

    } catch (error) {

      console.error(
        'Error fetching leave balances',
        error
      )
    }
  }

  async function fetchApplications() {

    try {

      const response = await api.get(
        '/user-leaves/applications'
      )

      setApplications(response.data)

    } catch (error) {

      console.error(
        'Error fetching applications',
        error
      )
    }
  }

  async function fetchLeaveTypes() {

    try {

      const response = await api.get(
        '/user-leaves/leave-types'
      )

      setLeaveTypes(response.data)

    } catch (error) {

      console.error(
        'Error fetching leave types',
        error
      )
    }
  }

  function openModal() {

    setForm({
      leaveTypeId: '',
      fromDate: '',
      toDate: '',
      isHalfDay: false,
      session: '',
      workHours: '',
      reason: '',
    })

    setError('')

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  const filteredApplications = useMemo(() => {

    const q = search.toLowerCase()

    return applications.filter(
      (app) =>
        app.leaveTypeName
          .toLowerCase()
          .includes(q) ||

        app.approvalStatus
          .toLowerCase()
          .includes(q)
    )

  }, [applications, search])

  const applicationsPerPage = 5

  const indexOfLastApplication =
    currentPage * applicationsPerPage

  const indexOfFirstApplication =
    indexOfLastApplication - applicationsPerPage

  const currentApplications =
    filteredApplications.slice(
      indexOfFirstApplication,
      indexOfLastApplication
    )

  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage
  )

  const leaveTypeOptions = leaveTypes.map((leave) => ({
    value: leave.id,
    label: leave.leaveTypeName,
  }))

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault()

    if (
      !form.leaveTypeId ||
      !form.fromDate ||
      !form.reason.trim()
    ) {
      setError('All required fields must be filled.')
      return
    }

    if (
      form.isHalfDay &&
      !form.session
    ) {
      setError(
        'Please select session for half day leave.'
      )

      return
    }

    try {

      setLoading(true)

      const payload = {

        leaveTypeId: Number(form.leaveTypeId),

        fromDate: form.fromDate,

        toDate: form.isHalfDay
          ? form.fromDate
          : form.toDate,

        isHalfDay: form.isHalfDay,

        session: form.isHalfDay
          ? form.session
          : null,

        workHours: form.workHours,

        reason: form.reason,
      }

      await api.post(
        '/user-leaves/applications',
        payload
      )

      await fetchApplications()

      await fetchLeaveBalances()

      closeModal()

    } catch (error: unknown) {

      const axiosError = error as AxiosError<{ message?: string }>

      console.error(axiosError)

      setError(
        axiosError.response?.data?.message ||
        'Failed to apply leave'
      )


    } finally {

      setLoading(false)
    }
  }

  return (

    <Layout title="My Applications">

      <div className="act-page">

        {/* LEAVE BALANCE */}


        <div className="act-section-header">
          <h3>Leave Balances</h3>
        </div>
        <div className="act-stats">


          {leaveBalances.map((leave) => (

            <div
              key={leave.leaveTypeId}
              className="act-card"
            >
              {/* <span className="act-card-label">
    Available Balance
  </span> */}

              <h3>
                {leave.leaveTypeName}
              </h3>

              <p>
                {leave.availableBalance}
                <span> Days</span>
              </p>

            </div>

          ))}

        </div>

        {/* SEARCH */}
        {/* <div className="act-toolbar">

          <input
            className="act-search"
            type="text"
            placeholder="Search applications"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div> */}


        <div className="act-toolbar">

          {/* HEADER */}

          <div className="act-search-wrapper">
            <FiSearch className="act-search-icon" />

            <input
              className="act-search"
              type="text"
              placeholder="Search applications"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />


          </div>

          <button
            className="act-new-btn"
            onClick={openModal}
          >
            <FiPlus />
            New Application
          </button>

        </div>

        {/* APPLICATION TABLE */}
        <div className="act-table-wrapper">

          <table className="act-table">

            <thead>

              <tr>

                <th>ID</th>

                <th>Leave Type</th>

                <th>From</th>

                <th>To</th>

                <th>Total Days</th>

                <th>Session</th>

                <th>Status</th>

              </tr>

            </thead>

            <tbody>

              {filteredApplications.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    No applications found.
                  </td>

                </tr>

              ) : (

                currentApplications.map((app) => (

                  <tr key={app.id}>

                    <td>{app.id}</td>

                    <td>
                      {app.leaveTypeName}
                    </td>

                    <td>
                      {app.fromDate}
                    </td>

                    <td>
                      {app.toDate}
                    </td>

                    <td>
                      {app.totalDays}
                    </td>

                    <td>

                      {app.isHalfDay
                        ? app.session === 'FIRST_HALF'
                          ? 'First Half'
                          : 'Second Half'
                        : '-'}

                    </td>

                    <td>

                      <span
                        className={`act-status ${app.approvalStatus.toLowerCase()}`}
                      >

                        {app.approvalStatus}

                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

          <div className="role-pagination">

            <div className="pagination-info">
              Showing {currentApplications.length} of {filteredApplications.length}
            </div>

            <div className="pagination-controls">

              <button
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
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
              >
                &#8250;
              </button>

            </div>

          </div>

        </div>

        {/* MODAL */}
        {modalOpen && (

          <div
            className="act-modal-overlay"
            onClick={closeModal}
          >

            <div
              className="act-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}
              <div className="act-modal-header">

                <h2>
                  Apply Leave
                </h2>

                <button
                  className="act-modal-close"
                  onClick={closeModal}
                >
                  &times;
                </button>

              </div>

              {/* FORM */}
              <form
                className="act-modal-form"
                onSubmit={handleSubmit}
              >

                {/* ROW 1 */}
                <div className="act-form-row">

                  {/* LEAVE TYPE */}
                  <label className="act-form-field">

                    <span>
                      Leave Type *
                    </span>

                    {/* <select
                      value={form.leaveTypeId}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          leaveTypeId: e.target.value,
                        }))
                      }
                    >

                      <option value="">
                        Select Leave Type
                      </option>

                      {leaveTypes.map((leave) => (

                        <option
                          key={leave.id}
                          value={leave.id}
                        >

                          {leave.leaveTypeName}

                        </option>

                      ))}

                    </select> */}

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
                          (option) =>
                            String(option.value) === form.leaveTypeId
                        ) || null
                      }
                      onChange={(selected) =>
                        setForm((c) => ({
                          ...c,
                          leaveTypeId: selected
                            ? String(selected.value)
                            : '',
                        }))
                      }
                    />

                  </label>

                  {/* HALF DAY */}
                  <label className="act-form-field">

                    <span>
                      Half Day *
                    </span>

                    <div className="halfday-radio-group">

                      {/* TRUE */}
                      <label className="halfday-radio">

                        <input
                          type="radio"
                          name="halfDay"
                          checked={form.isHalfDay === true}
                          onChange={() =>
                            setForm((c) => ({
                              ...c,
                              isHalfDay: true,
                              toDate: c.fromDate,
                            }))
                          }
                        />

                        <span>True</span>

                      </label>

                      {/* FALSE */}
                      <label className="halfday-radio">

                        <input
                          type="radio"
                          name="halfDay"
                          checked={form.isHalfDay === false}
                          onChange={() =>
                            setForm((c) => ({
                              ...c,
                              isHalfDay: false,
                              session: '',
                            }))
                          }
                        />

                        <span>False</span>

                      </label>

                    </div>

                  </label>

                </div>

                {/* ROW 2 */}
                <div className="act-form-row">

                  {/* FROM DATE */}
                  {/* <label className="act-form-field">

                    <span>
                      From Date *
                    </span>

                    <input
                      type="date"
                      value={form.fromDate}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          fromDate: e.target.value,

                          toDate:
                            c.isHalfDay
                              ? e.target.value
                              : c.toDate,
                        }))
                      }
                    />

                  </label> */}
                  <label className="act-form-field">
                    <span>
                      From Date *
                    </span>

                    <div className="act-date-picker-wrapper">


                      <DatePicker
                        selected={
                          form.fromDate
                            ? new Date(form.fromDate)
                            : null
                        }
                        onChange={(date: Date | null) => {

                          const formattedDate =
                            date
                              ? date.toISOString().split('T')[0]
                              : ''

                          setForm((c) => ({
                            ...c,
                            fromDate: formattedDate,
                            toDate: c.isHalfDay
                              ? formattedDate
                              : c.toDate,
                          }))

                          setIsFromDateOpen(false)
                        }}
                        onInputClick={() =>
                          setIsFromDateOpen(true)
                        }
                        open={isFromDateOpen}
                        onClickOutside={() =>
                          setIsFromDateOpen(false)
                        }
                        placeholderText="Select from date"
                        dateFormat="dd MMM yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                      />

                      <FiCalendar
                        className="act-date-icon"
                        onClick={() =>
                          setIsFromDateOpen((prev) => !prev)
                        }
                      />

                    </div>
                  </label>

                  {/* TO DATE */}
                  {/* <label className="act-form-field">

                    <span>
                      To Date *
                    </span>

                    <input
                      type="date"
                      value={
                        form.isHalfDay
                          ? form.fromDate
                          : form.toDate
                      }
                      disabled={form.isHalfDay}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          toDate: e.target.value,
                        }))
                      }
                    />

                  </label> */}
                  <label className="act-form-field">

                    <span>
                      To Date *
                    </span>

                    <div className="act-date-picker-wrapper">
                      <DatePicker
                        selected={
                          form.toDate
                            ? new Date(form.toDate)
                            : null
                        }
                        onChange={(date: Date | null) => {

                          setForm((c) => ({
                            ...c,
                            toDate: date
                              ? date.toISOString().split('T')[0]
                              : '',
                          }))

                          setIsToDateOpen(false)
                        }}
                        onInputClick={() =>
                          setIsToDateOpen(true)
                        }
                        open={isToDateOpen}
                        onClickOutside={() =>
                          setIsToDateOpen(false)
                        }
                        placeholderText="Select to date"
                        dateFormat="dd MMM yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                        disabled={form.isHalfDay}
                      />

                      <FiCalendar
                        className={`act-date-icon ${form.isHalfDay ? 'disabled-date-icon' : ''
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

                {/* SESSION */}
                {form.isHalfDay && (

                  <div className="act-form-row">

                    <label className="act-form-field">

                      <span>
                        Session *
                      </span>

                      {/* <select
                        value={form.session}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            session: e.target.value,
                          }))
                        }
                      >

                        <option value="">
                          Select Session
                        </option>

                        <option value="FIRST_HALF">
                          First Half
                        </option>

                        <option value="SECOND_HALF">
                          Second Half
                        </option>

                      </select> */}

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
                          setForm((c) => ({
                            ...c,
                            session: selected
                              ? selected.value
                              : '',
                          }))
                        }
                      />

                    </label>

                  </div>

                )}

                {/* WORK HOURS + REASON */}
                <div className="act-form-row">

                  {/* WORK HOURS */}
                  <label className="act-form-field">

                    <span>
                      Work Hours
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={form.workHours}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          workHours: e.target.value,
                        }))
                      }
                      placeholder="Enter work hours"
                    />

                  </label>

                  {/* REASON */}
                  <label className="act-form-field">

                    <span>
                      Reason *
                    </span>

                    <textarea
                      rows={3}
                      value={form.reason}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="Enter leave reason"
                    />

                  </label>

                </div>

                {/* ERROR */}
                {error && (

                  <div className="form-error">
                    {error}
                  </div>

                )}


              </form>

              {/* ACTIONS */}
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
                  className="act-submit-btn"
                  disabled={loading}
                >

                  {loading
                    ? 'Applying...'
                    : 'Apply Leave'}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </Layout>
  )
}