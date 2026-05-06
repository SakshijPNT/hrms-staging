import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getRoles } from '../api/roleApi'
import { createUser, getUsers, setUserActive, updateUser } from '../api/usersApi'
import { useAuth } from '../auth/AuthContext'
import type { CompanyUser, CreateCompanyUserPayload, RoleManagementItem, UpdateCompanyUserPayload } from '../types/hrms'

const emptyForm: CreateCompanyUserPayload = {
  email: '',
  firstName: '',
  lastName: '',
  department: '',
  jobTitle: '',
  phoneNumber: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
  roleName: 'Employee',
}

export function UsersPage() {
  const { session } = useAuth()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [roles, setRoles] = useState<RoleManagementItem[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<CompanyUser | null>(null)
  const [viewUser, setViewUser] = useState<CompanyUser | null>(null)
  const [editForm, setEditForm] = useState<UpdateCompanyUserPayload>({
    email: '',
    firstName: '',
    lastName: '',
    employeeCode: '',
    department: '',
    jobTitle: '',
    phoneNumber: '',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    roleName: 'Employee',
  })
  const [editError, setEditError] = useState('')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getUsers(), getRoles()])
      .then(([usersResult, rolesResult]) => {
        setUsers(usersResult)
        setRoles(rolesResult)
        setForm((current) => ({
          ...current,
          roleName: rolesResult[0]?.name ?? 'Employee',
        }))
      })
      .catch((requestError) => {
        if (requestError instanceof AxiosError) {
          if (requestError.response?.status === 401) {
            setPageError('Your session has expired. Please log in again.')
            return
          }

          if (requestError.response?.status === 403) {
            setPageError('You do not have permission to view users.')
            return
          }

          setPageError(requestError.response?.data?.message ?? 'Unable to load users right now.')
          return
        }

        setPageError('Unable to load users right now.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return users
    }

    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.employeeCode.toLowerCase().includes(q) ||
        user.department.toLowerCase().includes(q) ||
        user.roleName.toLowerCase().includes(q),
    )
  }, [users, search])

  const isAdmin = session?.user.role === 'Admin'

  function canViewUser(user: CompanyUser) {
    return isAdmin || session?.user.id === user.id
  }

  function canEditUser(user: CompanyUser) {
    return isAdmin || (session?.user.id === user.id && user.isEditable)
  }

  function openModal() {
    setError('')
    setForm({
      ...emptyForm,
      roleName: roles[0]?.name ?? 'Employee',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setError('')
  }

  function openViewModal(user: CompanyUser) {
    if (!canViewUser(user)) {
      return
    }

    setViewUser(user)
  }

  function closeViewModal() {
    setViewUser(null)
  }

  function openEditModal(user: CompanyUser) {
    if (!canEditUser(user)) {
      return
    }

    setEditUser(user)
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeCode: user.employeeCode,
      department: user.department,
      jobTitle: user.jobTitle,
      phoneNumber: user.phoneNumber,
      dateOfJoining: user.dateOfJoining.slice(0, 10),
      roleName: user.roleName,
    })
    setEditError('')
  }

  function closeEditModal() {
    setEditUser(null)
    setEditError('')
  }

  async function toggleUserStatus(user: CompanyUser) {
    if (!isAdmin) {
      return
    }

    try {
      const updated = await setUserActive(user.id, !user.isActive)
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      // Keep current UI state if request fails.
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editUser) return

    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      setEditError('First name, last name and email are required.')
      return
    }

    if (!editForm.employeeCode.trim() || !editForm.department.trim() || !editForm.jobTitle.trim()) {
      setEditError('Employee code, department and job title are required.')
      return
    }

    setEditError('')
    setIsEditSubmitting(true)

    try {
      const updated = await updateUser(editUser.id, {
        ...editForm,
        email: editForm.email.trim().toLowerCase(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        employeeCode: editForm.employeeCode.trim().toUpperCase(),
        department: editForm.department.trim(),
        jobTitle: editForm.jobTitle.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
      })

      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)))
      closeEditModal()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setEditError(requestError.response?.data?.message ?? 'Unable to update user.')
      } else {
        setEditError('Unable to update user.')
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('First name, last name and email are required.')
      setIsSubmitting(false)
      return
    }

    if (!form.department.trim() || !form.jobTitle.trim()) {
      setError('Department and job title are required.')
      setIsSubmitting(false)
      return
    }

    try {
      const createdUser = await createUser({
        ...form,
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        department: form.department.trim(),
        jobTitle: form.jobTitle.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })

      setUsers((current) => [createdUser, ...current])
      closeModal()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setError(requestError.response?.data?.message ?? 'Unable to create user.')
      } else {
        setError('Unable to create user.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="panel loading-panel">Loading users...</div>
  }

  return (
    <div className="act-page">
      <div className="act-page-header">
        <div>
          <nav className="act-breadcrumb">
            <span className="act-breadcrumb-link">Users</span>
          </nav>
          <h1 className="act-title">Employees</h1>
        </div>
        {isAdmin ? (
          <button className="act-new-btn" onClick={openModal}>
            + New User
          </button>
        ) : null}
      </div>

      {!isAdmin ? (
        <div className="form-error" role="status">
          Your current access is shown in the Actions column as View or Edit.
        </div>
      ) : null}

      <div className="act-toolbar">
        <input
          className="act-search"
          type="text"
          placeholder="Search employee"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {pageError ? <div className="form-error">{pageError}</div> : null}

      <div className="act-table-wrapper">
        <table className="act-table users-table">
          <thead>
            <tr>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="act-empty">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="role-id-cell">{user.employeeCode}</td>
                  <td>{user.fullName}</td>
                  <td>{user.department}</td>
                  <td>{user.roleName}</td>
                  <td>
                    <div className="role-actions">
                      <span className={user.isActive ? 'role-status role-status-active' : 'role-status role-status-inactive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isAdmin ? (
                        <label className="role-switch" aria-label={`Toggle status for ${user.fullName}`}>
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            onChange={() => toggleUserStatus(user)}
                          />
                          <span className="role-slider" />
                        </label>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    {isAdmin ? (
                      <button type="button" className="role-edit-btn" onClick={() => openEditModal(user)}>
                        View
                      </button>
                    ) : canEditUser(user) ? (
                      <button type="button" className="role-edit-btn" onClick={() => openEditModal(user)}>
                        Edit
                      </button>
                    ) : canViewUser(user) ? (
                      <button type="button" className="role-edit-btn" onClick={() => openViewModal(user)}>
                        View
                      </button>
                    ) : (
                      <span className="role-status role-status-inactive">No Access</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="act-modal-overlay" onClick={closeModal}>
          <div className="act-modal users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="act-modal-header">
              <h2>Add New User</h2>
              <button className="act-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form" onSubmit={handleSubmit}>
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>First Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="act-form-field">
                  <span>Last Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Email <span className="req">*</span></span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Role</span>
                  <select
                    value={form.roleName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, roleName: event.target.value }))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="act-form-field">
                  <span>Department <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, department: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Job Title <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, jobTitle: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="act-form-field">
                  <span>Phone Number</span>
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Date Of Joining</span>
                  <input
                    type="date"
                    value={form.dateOfJoining}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dateOfJoining: event.target.value }))
                    }
                  />
                </label>
              </div>

              {error ? <div className="form-error">{error}</div> : null}

              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="act-modal-overlay" onClick={closeEditModal}>
          <div className="act-modal users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="act-modal-header">
              <h2>Edit User — {editUser.fullName}</h2>
              <button className="act-modal-close" onClick={closeEditModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form" onSubmit={handleEditSubmit}>
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>First Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="act-form-field">
                  <span>Last Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Email <span className="req">*</span></span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="act-form-field">
                  <span>Employee Code <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.employeeCode}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, employeeCode: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Role</span>
                  <select
                    value={editForm.roleName}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, roleName: event.target.value }))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="act-form-field">
                  <span>Department <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, department: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Job Title <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.jobTitle}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, jobTitle: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className="act-form-field">
                  <span>Phone Number</span>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, phoneNumber: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Date Of Joining</span>
                  <input
                    type="date"
                    value={editForm.dateOfJoining}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, dateOfJoining: event.target.value }))
                    }
                  />
                </label>
              </div>

              {editError ? <div className="form-error">{editError}</div> : null}
              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isEditSubmitting}>
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="act-modal-overlay" onClick={closeViewModal}>
          <div className="act-modal users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="act-modal-header">
              <h2>View User — {viewUser.fullName}</h2>
              <button className="act-modal-close" onClick={closeViewModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form">
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>First Name</span>
                  <input type="text" value={viewUser.firstName} readOnly />
                </label>
                <label className="act-form-field">
                  <span>Last Name</span>
                  <input type="text" value={viewUser.lastName} readOnly />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Email</span>
                  <input type="email" value={viewUser.email} readOnly />
                </label>

                <label className="act-form-field">
                  <span>Employee Code</span>
                  <input type="text" value={viewUser.employeeCode} readOnly />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Role</span>
                  <input type="text" value={viewUser.roleName} readOnly />
                </label>

                <label className="act-form-field">
                  <span>Department</span>
                  <input type="text" value={viewUser.department} readOnly />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Job Title</span>
                  <input type="text" value={viewUser.jobTitle} readOnly />
                </label>

                <label className="act-form-field">
                  <span>Phone Number</span>
                  <input type="text" value={viewUser.phoneNumber} readOnly />
                </label>
              </div>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Date Of Joining</span>
                  <input type="date" value={viewUser.dateOfJoining.slice(0, 10)} readOnly />
                </label>
              </div>

              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeViewModal}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
