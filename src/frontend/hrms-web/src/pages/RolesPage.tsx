import { useMemo, useState, type FormEvent } from 'react'

interface RoleManagementItem {
  id: string
  name: string
  description: string
  activity: string
  status: boolean
}

const DEFAULT_ROLES: RoleManagementItem[] = [
  {
    id: 'ROLE-001',
    name: 'Admin',
    description: 'Full system access',
    activity: 'Dashboard',
    status: true,
  },
  {
    id: 'ROLE-002',
    name: 'HR Manager',
    description: 'Manage employees and leave',
    activity: 'Employees',
    status: true,
  },
  {
    id: 'ROLE-003',
    name: 'Employee',
    description: 'Limited access',
    activity: 'Attendance',
    status: false,
  },
]

const ACTIVITIES = [
  'Dashboard',
  'Employees',
  'Attendance',
  'Payroll',
  'Leave Management',
  'Reports',
  'Settings',
]

export function RolesPage() {
  const [roles, setRoles] = useState<RoleManagementItem[]>(DEFAULT_ROLES)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    activity: '',
  })

  const [error, setError] = useState('')

  // Search
  const filteredRoles = useMemo(() => {
    const q = search.toLowerCase()

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.activity.toLowerCase().includes(q),
    )
  }, [roles, search])

  function openModal() {
    setForm({
      id: '',
      name: '',
      description: '',
      activity: '',
    })

    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function toggleRoleStatus(roleId: string) {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? { ...role, status: !role.status }
          : role,
      ),
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !form.id.trim() ||
      !form.name.trim() ||
      !form.description.trim() ||
      !form.activity
    ) {
      setError('All fields are required.')
      return
    }

    const newRole: RoleManagementItem = {
      id: form.id,
      name: form.name,
      description: form.description,
      activity: form.activity,
      status: true,
    }

    setRoles((prev) => [newRole, ...prev])

    closeModal()
  }

  return (
    <div className="act-page">
      {/* Header */}
      <div className="act-page-header">
        <div>
          <nav className="act-breadcrumb">
            <span className="act-breadcrumb-link">Roles</span>
          </nav>

          <h1 className="act-title">Roles</h1>
        </div>

        <button className="act-new-btn" onClick={openModal}>
          + Role
        </button>
      </div>

      {/* Search */}
      <div className="act-toolbar">
        <input
          className="act-search"
          type="text"
          placeholder="Search role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Table */}
      <div className="act-table-wrapper">
        <table className="act-table role-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Activity</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="act-empty">
                  No roles found.
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td className="role-id-cell">{role.id}</td>

                  <td>{role.name}</td>

                  <td>{role.description}</td>

                  <td>{role.activity}</td>

                  <td>
                    <div className="role-actions">
                      <span
                        className={
                          role.status
                            ? 'role-status role-status-active'
                            : 'role-status role-status-inactive'
                        }
                      >
                        {role.status ? 'Active' : 'Inactive'}
                      </span>

                      <label className="role-switch">
                        <input
                          type="checkbox"
                          checked={role.status}
                          onChange={() => toggleRoleStatus(role.id)}
                        />

                        <span className="role-slider" />
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="act-modal-overlay" onClick={closeModal}>
          <div
            className="act-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="act-modal-header">
              <h2>New Role</h2>

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
              {/* Row 1 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Role ID *</span>

                  <input
                    type="text"
                    value={form.id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        id: event.target.value,
                      }))
                    }
                    placeholder="e.g. ROLE-004"
                  />
                </label>

                <label className="act-form-field">
                  <span>Role Name *</span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. HR Admin"
                  />
                </label>
              </div>

              {/* Row 2 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Description *</span>

                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Enter role description"
                  />
                </label>

                <label className="act-form-field">
                  <span>Activity *</span>

                  <select
                    value={form.activity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        activity: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select Activity</option>

                    {ACTIVITIES.map((activity) => (
                      <option
                        key={activity}
                        value={activity}
                      >
                        {activity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error ? (
                <div className="form-error">
                  {error}
                </div>
              ) : null}

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
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}