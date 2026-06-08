import { useEffect, useMemo, useState, type FormEvent } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'
import type { AxiosError } from 'axios'
import { FiSearch, FiPlus, FiCalendar, FiEye } from 'react-icons/fi'
import { MdEdit } from "react-icons/md";
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface ApiUser {
  id: number
  fullName: string
  emailId: string
  roleId: number
  managerId: number | null
  joiningDate: string
  probationMonths: number
  confirmationDate: string | null
  statusCode: number
}

interface UserItem {
  id: number
  fullName: string
  emailId: string
  roleId: number
  roleName: string
  managerId: number | null
  managerName: string
  joiningDate: string
  probationMonths: number
  confirmationDate: string | null
  status: boolean
}

interface RoleItem {
  id: number
  roleName: string
}

interface ManagerItem {
  id: number
  fullName: string
}

type UserFieldErrors = {
  fullName?: string
  emailId?: string
  roleId?: string
  managerId?: string
  joiningDate?: string
}

export function UsersPage() {

  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [managers, setManagers] = useState<ManagerItem[]>([])

  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewUser, setViewUser] = useState<UserItem | null>(null)

  const [editingUserId, setEditingUserId] =
    useState<number | null>(null)

  const [editingStatusCode, setEditingStatusCode] =
    useState<number>(1)

  const [currentPage, setCurrentPage] = useState(1)

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({})

  const [form, setForm] = useState({
    fullName: '',
    emailId: '',
    managerId: '',
    companyId: 1,
    roleId: '',
    joiningDate: '',
    probationMonths: 0,
    confirmationDate: '',
  })


  async function fetchUsers(roleData: RoleItem[], userData: ApiUser[]) {
    try {

      // Build manager lookup map ONCE
      const managerMap = new Map(
        userData.map((u) => [u.id, u.fullName])
      )

      // Map users for UI
      const mappedUsers = userData.map((user) => {

        const role = roleData.find(
          (r) => Number(r.id) === Number(user.roleId)
        )

        return {
          id: user.id,
          fullName: user.fullName,
          emailId: user.emailId,
          roleId: user.roleId,
          roleName: role?.roleName || '',
          managerId: user.managerId,
          managerName: managerMap.get(user.managerId ?? 0) || '',
          joiningDate: user.joiningDate,
          probationMonths: user.probationMonths,
          confirmationDate: user.confirmationDate,
          status: user.statusCode === 1,
        }
      })
      setUsers(mappedUsers)

    } catch (err) {
      console.error(
        'Failed to fetch users',
        err
      )
    }
  }


  useEffect(() => {

    async function loadData() {

      try {

        // ROLES
        const rolesRes = await api.get('/Roles/company')

        const roleList = rolesRes.data.map((r: RoleItem) => ({
          id: r.id,
          roleName: r.roleName,
        }))

        setRoles(roleList)

        // USERS
        const usersRes = await api.get('/Users/company')

        await fetchUsers(roleList, usersRes.data)


        setManagers(
          usersRes.data.map((u: ApiUser) => ({
            id: u.id,
            fullName: u.fullName,
          }))
        )

      } catch (err) {
        console.error(err)
      }
    }

    loadData()

  }, [])

  useEffect(() => {

    if (modalOpen || viewModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }

  }, [modalOpen, viewModalOpen])

  const filteredUsers = useMemo(() => {

    const q = search.toLowerCase()

    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.emailId.toLowerCase().includes(q) ||
        user.roleName.toLowerCase().includes(q)
    )

  }, [users, search])

  function openModal() {

    setEditingUserId(null)
    setEditingStatusCode(1)

    setForm({
      fullName: '',
      emailId: '',
      managerId: '',
      companyId: 1,
      roleId: '',
      joiningDate: '',
      probationMonths: 0,
      confirmationDate: '',
    })

    setError('')
    setFieldErrors({})

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFieldErrors({})
  }

  function openViewModal(user: UserItem) {
    setViewUser(user)
    setViewModalOpen(true)
  }

  function closeViewModal() {
    setViewModalOpen(false)
    setViewUser(null)
  }

  function clearFieldError(field: keyof UserFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validateForm(): UserFieldErrors {
    const errors: UserFieldErrors = {}

    if (!form.fullName.trim()) {
      errors.fullName = 'This field is required.'
    }

    if (!form.emailId.trim()) {
      errors.emailId = 'This field is required.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId.trim())
    ) {
      errors.emailId = 'Please enter a valid email address.'
    }

    if (!form.roleId) {
      errors.roleId = 'Please select at least one role.'
    }

    if (!form.managerId) {
      errors.managerId = 'Please select at least one manager.'
    }

    if (!form.joiningDate) {
      errors.joiningDate = 'This field is required.'
    }

    return errors
  }

  function handleEdit(user: UserItem) {

    if (!user.status) {
      alert('First activate this user')
      return
    }

    setEditingUserId(user.id)

    setEditingStatusCode(user.status ? 1 : 0)

    setForm({
      fullName: user.fullName,
      emailId: user.emailId,
      managerId: user.managerId
        ? String(user.managerId)
        : '',
      companyId: 1,
      roleId: String(user.roleId),
      joiningDate: user.joiningDate,
      probationMonths: user.probationMonths,
      confirmationDate:
        user.confirmationDate || '',
    })

    setError('')
    setFieldErrors({})
    setModalOpen(true)
  }

  async function toggleUserStatus(
    userId: number,
    currentStatus: boolean
  ) {
    try {

      const newStatus = currentStatus ? 0 : 1

      const confirmMessage = currentStatus
        ? 'Are you sure you want to deactivate this user?'
        : 'Are you sure you want to activate this user?'

      const confirmed = window.confirm(confirmMessage)

      if (!confirmed) {
        return
      }

      await api.put(
        `/Users/${userId}/status`,
        {
          statusCode: newStatus,
        }
      )

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
              ...user,
              status: !currentStatus,
            }
            : user
        )
      )


    } catch (error) {

      console.error(
        'Failed to update user status',
        error
      )

      alert('Failed to update user status')
    }
  }




  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault()

    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Please fix the highlighted fields before continuing.')
      return
    }

    setFieldErrors({})
    setError('')

    try {

      const payload = {
        fullName: form.fullName,
        emailId: form.emailId,
        managerId: form.managerId ? Number(form.managerId) : null,
        companyId: form.companyId,
        roleId: Number(form.roleId),
        joiningDate: form.joiningDate,
        probationMonths: Number(form.probationMonths),
        confirmationDate: form.confirmationDate || null,
        statusCode: editingStatusCode,
        createdBy: 1,
        updatedBy: 1,
      }

      // EDIT
      if (editingUserId) {

        await api.put(
          `/Users/${editingUserId}`,
          payload
        )

      } else {

        // CREATE
        await api.post('/Users', payload)
      }

      const usersRes = await api.get('/Users/company')

      await fetchUsers(roles, usersRes.data)

      setManagers(
        usersRes.data.map((u: ApiUser) => ({
          id: u.id,
          fullName: u.fullName,
        }))
      )

      closeModal()

    } catch (error: unknown) {

      const axiosError =
        error as AxiosError<{ message?: string }>

      console.error(axiosError)

      setError(
        axiosError.response?.data?.message ||
        'Failed to save user'
      )
    }
  }

  const usersPerPage = 10

  const indexOfLastUser =
    currentPage * usersPerPage

  const indexOfFirstUser =
    indexOfLastUser - usersPerPage

  const currentUsers =
    filteredUsers.slice(
      indexOfFirstUser,
      indexOfLastUser
    )

  const totalPages = Math.ceil(
    filteredUsers.length / usersPerPage
  )

  const managerChoices = useMemo(() => {
    if (!editingUserId) {
      return managers
    }

    return managers.filter((manager) => manager.id !== editingUserId)
  }, [managers, editingUserId])

  function selectRole(roleId: number) {
    clearFieldError('roleId')
    setForm((current) => ({
      ...current,
      roleId: String(roleId),
    }))
  }

  function selectManager(managerId: number) {
    clearFieldError('managerId')
    setForm((current) => ({
      ...current,
      managerId:
        current.managerId === String(managerId)
          ? ''
          : String(managerId),
    }))
  }

  const [isJoiningDateOpen, setIsJoiningDateOpen] = useState(false);

  const [isConfirmationDateOpen, setIsConfirmationDateOpen] = useState(false);
  return (
    <Layout title="Users Management">
      <div className="act-page">

        {/* Header */}
        <div className="act-toolbar">
          <div className="act-search-wrapper">
            <FiSearch className="act-search-icon" />
            <input
              className="act-search"
              type="text"
              placeholder="Search user"
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
            <FiPlus color='' />
            User
          </button>

        </div>

        {/* Table */}
        <div className="act-table-wrapper">

          <table className="act-table role-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredUsers.length === 0 ? (

                <tr>
                  <td colSpan={8} className="act-empty">
                    No users found.
                  </td>
                </tr>

              ) : (

                currentUsers.map((user) => (

                  <tr key={user.id}>

                    <td>{user.id}</td>

                    <td>{user.fullName}</td>

                    <td>{user.emailId}</td>

                    <td>{user.roleName}</td>
                    <td>{user.managerName}</td>

                    <td>{user.joiningDate}</td>

                    <td>
                      <div className="role-actions">

                        <span
                          className={
                            user.status
                              ? 'role-status role-status-active'
                              : 'role-status role-status-inactive'
                          }
                        >
                          {user.status
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                        <label className="role-switch">
                          <input
                            type="checkbox"
                            aria-label={
                              user.status
                                ? 'Deactivate user'
                                : 'Activate user'
                            }
                            checked={user.status}
                            onChange={() =>
                              toggleUserStatus(
                                user.id,
                                user.status
                              )
                            }
                          />

                          <span className="role-slider" />
                        </label>

                      </div>
                    </td>

                    <td>
                      <div className="role-table-actions">
                        <button
                          type="button"
                          className="role-action-btn"
                          title="View user"
                          aria-label={`View user ${user.fullName}`}
                          onClick={() => openViewModal(user)}
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="role-action-btn"
                          title="Edit user"
                          aria-label={`Edit user ${user.fullName}`}
                          onClick={() => handleEdit(user)}
                        >
                          <MdEdit />
                        </button>
                      </div>
                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

          {/* Pagination */}
          <div className="role-pagination">

            <div className="pagination-info">
              Showing {currentUsers.length} of{' '}
              {filteredUsers.length}
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
        </div>

        {/* Modal */}
        {modalOpen && (

          <div
            className="act-modal-overlay"
          >

            <div
              className="act-modal modal-md"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="act-modal-header">

                <h2>
                  {editingUserId
                    ? 'Edit User'
                    : 'New User'}
                </h2>

                <button
                  className="act-modal-close"
                  onClick={closeModal}
                >
                  &times;
                </button>

              </div>

              <form
                id="user-form"
                className="act-modal-form role-modal-form"
                onSubmit={handleSubmit}
              >

                <div className="act-form-row">

                  <label
                    className={`act-form-field${fieldErrors.fullName ? ' act-form-field--invalid' : ''}`}
                  >
                    <span>Full Name *</span>

                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => {
                        clearFieldError('fullName')
                        setForm((c) => ({
                          ...c,
                          fullName: e.target.value,
                        }))
                      }}
                    />
                    {fieldErrors.fullName && (
                      <span className="field-error-message">
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </label>

                  <label
                    className={`act-form-field${fieldErrors.emailId ? ' act-form-field--invalid' : ''}`}
                  >
                    <span>Email *</span>

                    <input
                      type="email"
                      value={form.emailId}
                      onChange={(e) => {
                        clearFieldError('emailId')
                        setForm((c) => ({
                          ...c,
                          emailId: e.target.value,
                        }))
                      }}
                    />
                    {fieldErrors.emailId && (
                      <span className="field-error-message">
                        {fieldErrors.emailId}
                      </span>
                    )}
                  </label>

                </div>

                <div
                  className={`role-activities-section${fieldErrors.roleId ? ' role-activities-section--invalid' : ''}`}
                >
                  <h3 className="role-activities-title">Role *</h3>
                  <div className="role-activities-list">
                    {roles.length === 0 ? (
                      <p className="role-activities-empty">No roles available.</p>
                    ) : (
                      roles.map((role) => (
                        <label
                          key={role.id}
                          className="role-activity-item"
                        >
                          <input
                            type="checkbox"
                            checked={form.roleId === String(role.id)}
                            onChange={() => selectRole(role.id)}
                          />
                          <span>{role.roleName}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.roleId && (
                    <span className="field-error-message">
                      {fieldErrors.roleId}
                    </span>
                  )}
                </div>

                <div
                  className={`role-activities-section${fieldErrors.managerId ? ' role-activities-section--invalid' : ''}`}
                >
                  <h3 className="role-activities-title">Manager *</h3>
                  <div className="role-activities-list">
                    {managerChoices.length === 0 ? (
                      <p className="role-activities-empty">No managers available.</p>
                    ) : (
                      managerChoices.map((manager) => (
                        <label
                          key={manager.id}
                          className="role-activity-item"
                        >
                          <input
                            type="checkbox"
                            checked={form.managerId === String(manager.id)}
                            onChange={() => selectManager(manager.id)}
                          />
                          <span>{manager.fullName}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.managerId && (
                    <span className="field-error-message">
                      {fieldErrors.managerId}
                    </span>
                  )}
                </div>

                <div className="act-form-row">


                  <label
                    className={`act-form-field${fieldErrors.joiningDate ? ' act-form-field--invalid' : ''}`}
                  >
                    <span>Joining Date *</span>

                    {/* <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          joiningDate: e.target.value,
                        }))
                      }
                    /> */}

                    <div
                      className={`act-date-picker-wrapper${fieldErrors.joiningDate ? ' act-date-picker-wrapper--invalid' : ''}`}
                    >
                      <DatePicker
                        selected={
                          form.joiningDate
                            ? new Date(form.joiningDate)
                            : null
                        }
                        onChange={(date: Date | null) => {
                          clearFieldError('joiningDate')
                          setForm((c) => ({
                            ...c,
                            joiningDate: date
                              ? date.toISOString().split('T')[0]
                              : '',
                          }))

                          setIsJoiningDateOpen(false)
                        }}
                        onInputClick={() => setIsJoiningDateOpen(true)}
                        open={isJoiningDateOpen}
                        onClickOutside={() => setIsJoiningDateOpen(false)}
                        placeholderText="Select joining date"
                        dateFormat="dd MMM yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                      />
                      <FiCalendar
                        className="act-date-icon"
                        onClick={() =>
                          setIsJoiningDateOpen((prev) => !prev)
                        }
                      />
                    </div>
                    {fieldErrors.joiningDate && (
                      <span className="field-error-message">
                        {fieldErrors.joiningDate}
                      </span>
                    )}
                  </label>

                  <label className="act-form-field">
                    <span>Probation Months</span>

                    <input
                      type="number"
                      value={form.probationMonths}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          probationMonths:
                            Number(e.target.value),
                        }))
                      }
                    />
                  </label>


                </div>

                <div className="act-form-row">


                  <label className="act-form-field act-form-field-half">
                    <span>Confirmation Date</span>

                    <div className="act-date-picker-wrapper">
                      <DatePicker
                        selected={
                          form.confirmationDate
                            ? new Date(form.confirmationDate)
                            : null
                        }
                        onChange={(date: Date | null) => {
                          setForm((c) => ({
                            ...c,
                            confirmationDate: date
                              ? date.toISOString().split('T')[0]
                              : '',
                          }))

                          setIsConfirmationDateOpen(false)
                        }}
                        onInputClick={() => setIsConfirmationDateOpen(true)}
                        open={isConfirmationDateOpen}
                        onClickOutside={() => setIsConfirmationDateOpen(false)}
                        placeholderText="Select confirmation date"
                        dateFormat="dd MMM yyyy"
                        className="act-date-picker"
                        popperClassName="act-datepicker-popper"
                        portalId="root"
                        popperPlacement="bottom-start"
                      />

                      <FiCalendar
                        className="act-date-icon"
                        onClick={() =>
                          setIsConfirmationDateOpen((prev) => !prev)
                        }
                      />
                    </div>
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
                  form="user-form"
                  className="act-submit-btn"
                >
                  {editingUserId
                    ? 'Update User'
                    : 'Create User'}
                </button>

              </div>

            </div>
          </div>
        )}

        {viewModalOpen && viewUser && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>User Details</h2>
                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeViewModal}
                >
                  &times;
                </button>
              </div>

              <div className="act-modal-form role-modal-form role-view-form">
                <div className="role-view-field">
                  <span className="role-view-label">User ID</span>
                  <p className="role-view-value">{viewUser.id}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Full Name</span>
                  <p className="role-view-value">{viewUser.fullName}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Email</span>
                  <p className="role-view-value">{viewUser.emailId}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Role</span>
                  <p className="role-view-value">
                    {viewUser.roleName || '-'}
                  </p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Manager</span>
                  <p className="role-view-value">
                    {viewUser.managerName || '-'}
                  </p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Joining Date</span>
                  <p className="role-view-value">{viewUser.joiningDate}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Probation Months</span>
                  <p className="role-view-value">{viewUser.probationMonths}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Confirmation Date</span>
                  <p className="role-view-value">
                    {viewUser.confirmationDate || '-'}
                  </p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Status</span>
                  <p className="role-view-value">
                    <span
                      className={
                        viewUser.status
                          ? 'role-status role-status-active'
                          : 'role-status role-status-inactive'
                      }
                    >
                      {viewUser.status ? 'Active' : 'Inactive'}
                    </span>
                  </p>
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
          </div>
        )}
      </div>
    </Layout>
  )
}