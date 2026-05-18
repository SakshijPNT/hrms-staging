import { useEffect, useMemo, useState, type FormEvent } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'

interface UserItem {
  id: number
  fullName: string
  emailId: string
  roleId: number
  roleName: string
  managerId: number | null
  joiningDate: string
  probationMonths: number
  confirmationDate: string
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

export function UsersPage() {

  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [managers, setManagers] = useState<ManagerItem[]>([])

  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)

  const [editingUserId, setEditingUserId] =
    useState<number | null>(null)

  const [editingStatusCode, setEditingStatusCode] =
    useState<number>(1)

  const [currentPage, setCurrentPage] = useState(1)

  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    emailId: '',
    password: '',
    managerId: '',
    companyId: 1,
    roleId: '',
    joiningDate: '',
    probationMonths: 0,
    confirmationDate: '',
  })

  async function fetchUsers(roleData: RoleItem[]) { {
    try {

      const res = await api.get('/Users/company')
      console.log(res.data)

      const mappedUsers = res.data.map((user: any) => {

        const role = roleData.find(
  (r: any) => Number(r.id) === Number(user.roleId)
)

        return {
          id: user.id,
          fullName: user.fullName,
          emailId: user.emailId,
          roleId: user.roleId,
          roleName: role?.roleName || '',
          managerId: user.managerId,
          joiningDate: user.joiningDate,
          probationMonths: user.probationMonths,
          confirmationDate: user.confirmationDate,
          status: user.statusCode === 1,
        }
      })

      setUsers(mappedUsers)

    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }
}

  useEffect(() => {

    async function loadData() {

      try {

        // ROLES
        const rolesRes = await api.get('/Roles/company')

        const roleList = rolesRes.data.map((r: any) => ({
          id: r.id,
          roleName: r.roleName,
        }))

        setRoles(roleList)

        // USERS
        await fetchUsers(roleList)

        // Managers dropdown
        const usersRes = await api.get('/Users/company')

        setManagers(
          usersRes.data.map((u: any) => ({
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
      password: '',
      managerId: '',
      companyId: 1,
      roleId: '',
      joiningDate: '',
      probationMonths: 0,
      confirmationDate: '',
    })

    setError('')

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
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
      password: '',
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

    await fetchUsers(roles)

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

    if (
      !form.fullName.trim() ||
      !form.emailId.trim() ||
      !form.roleId ||
      !form.joiningDate
    ) {
      setError('All required fields are mandatory.')
      return
    }

    try {

      const payload = {
        fullName: form.fullName,
        emailId: form.emailId,
        password: form.password,
        managerId: form.managerId
          ? Number(form.managerId)
          : null,
        companyId: form.companyId,
        roleId: Number(form.roleId),
        joiningDate: form.joiningDate,
        probationMonths: Number(form.probationMonths),
        confirmationDate:
          form.confirmationDate || null,
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

      await fetchUsers(roles)

      closeModal()

    } catch (error: any) {

      console.error(error)

      setError(
        error?.response?.data?.message ||
        'Failed to save user'
      )
    }
  }

  const usersPerPage = 5

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

  return (
    <Layout title="Users Management">
    <div className="act-page">

      {/* Header */}
      <div className="act-page-header">

        <div>
          <nav className="act-breadcrumb">
            <span className="act-breadcrumb-link">
              Users
            </span>
          </nav>

          <h1 className="act-title">
            Users
          </h1>
        </div>

        <button
          className="act-new-btn"
          onClick={openModal}
        >
          + User
        </button>

      </div>

      {/* Search */}
      <div className="act-toolbar">

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

      {/* Table */}
      <div className="act-table-wrapper">

        <table className="act-table role-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th>Edit</th>
            </tr>
          </thead>

          <tbody>

            {filteredUsers.length === 0 ? (

              <tr>
                <td colSpan={7} className="act-empty">
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
                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(user)
                      }
                    >
                      Edit
                    </button>
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
          onClick={closeModal}
        >

          <div
            className="act-modal"
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
              className="act-modal-form"
              onSubmit={handleSubmit}
            >

              <div className="act-form-row">

                <label className="act-form-field">
                  <span>Full Name *</span>

                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        fullName: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Email *</span>

                  <input
                    type="email"
                    value={form.emailId}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        emailId: e.target.value,
                      }))
                    }
                  />
                </label>

              </div>

              <div className="act-form-row">

                <label className="act-form-field">
                  <span>Password *</span>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        password: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Role *</span>

                  <select
                    value={form.roleId}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        roleId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select Role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </label>

              </div>

              <div className="act-form-row">

                <label className="act-form-field">
                  <span>Manager</span>

                  <select
                    value={form.managerId}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        managerId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select Manager
                    </option>

                    {managers.map((manager) => (
                      <option
                        key={manager.id}
                        value={manager.id}
                      >
                        {manager.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="act-form-field">
                  <span>Joining Date *</span>

                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        joiningDate: e.target.value,
                      }))
                    }
                  />
                </label>

              </div>

              <div className="act-form-row">

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

                <label className="act-form-field">
                  <span>Confirmation Date</span>

                  <input
                    type="date"
                    value={form.confirmationDate}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        confirmationDate:
                          e.target.value,
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
                >
                  {editingUserId
                    ? 'Update User'
                    : 'Create User'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
    </Layout>
  )
}