import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getActivities } from '../api/activityApi'
import { assignRolePermissions, createRole, getAllPermissions, getRolePermissions, getRoles, updateRoleActivities } from '../api/roleApi'
import type { Activity, CreateRolePayload, Permission, RoleManagementItem, RolePermission } from '../types/hrms'

const emptyForm: CreateRolePayload = {
  name: '',
  description: '',
  activityIds: [],
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleManagementItem[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  // permission modal state
  const [permRole, setPermRole] = useState<RoleManagementItem | null>(null)
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set())
  const [permModalLoading, setPermModalLoading] = useState(false)
  const [permSaving, setPermSaving] = useState(false)
  const [permError, setPermError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleManagementItem | null>(null)
  const [editActivityIds, setEditActivityIds] = useState<string[]>([])
  const [editError, setEditError] = useState('')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [statusByRoleId, setStatusByRoleId] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getRoles(), getActivities(), getAllPermissions()])
      .then(([rolesResult, activitiesResult, permissionsResult]) => {
        setRoles(rolesResult)
        setActivities(activitiesResult)
        setAllPermissions(permissionsResult)
        setStatusByRoleId(
          rolesResult.reduce<Record<string, boolean>>((acc, role, index) => {
            acc[role.id] = index !== 1
            return acc
          }, {}),
        )
        setForm((current) => ({
          ...current,
          activityIds: activitiesResult[0] ? [activitiesResult[0].id] : [],
        }))
      })
      .catch(() => setPageError('Unable to load roles and activities right now.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return roles
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q),
    )
  }, [roles, search])

  function openModal() {
    setError('')
    setForm({
      ...emptyForm,
      activityIds: activities[0] ? [activities[0].id] : [],
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setError('')
  }

  function openEditModal(role: RoleManagementItem) {
    setEditRole(role)
    setEditActivityIds(role.activities.map((a) => a.id))
    setEditError('')
  }

  function closeEditModal() {
    setEditRole(null)
    setEditError('')
  }

  function toggleEditActivity(activityId: string) {
    setEditActivityIds((current) =>
      current.includes(activityId)
        ? current.filter((id) => id !== activityId)
        : [...current, activityId],
    )
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editRole) return
    if (editActivityIds.length === 0) {
      setEditError('Assign at least one activity to the role.')
      return
    }
    setEditError('')
    setIsEditSubmitting(true)
    try {
      const updated = await updateRoleActivities(editRole.id, editActivityIds)
      setRoles((current) => current.map((r) => (r.id === updated.id ? updated : r)))
      closeEditModal()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setEditError(requestError.response?.data?.message ?? 'Unable to update activities.')
      } else {
        setEditError('Unable to update activities.')
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  async function openPermissionsModal(role: RoleManagementItem) {
    setPermRole(role)
    setPermError('')
    setPermModalLoading(true)
    try {
      const existing = await getRolePermissions(role.id)
      setRolePermissions(existing)
      setSelectedPermIds(new Set(existing.map((rp) => rp.permissionId)))
    } catch {
      setPermError('Unable to load permissions.')
    } finally {
      setPermModalLoading(false)
    }
  }

  function closePermissionsModal() {
    setPermRole(null)
    setRolePermissions([])
    setSelectedPermIds(new Set())
    setPermError('')
  }

  function togglePermission(permId: string) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) {
        next.delete(permId)
      } else {
        next.add(permId)
      }
      return next
    })
  }

  async function handleSavePermissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!permRole) return
    setPermSaving(true)
    setPermError('')
    try {
      await assignRolePermissions(permRole.id, [...selectedPermIds])
      closePermissionsModal()
    } catch (err) {
      if (err instanceof AxiosError) {
        setPermError(err.response?.data?.message ?? 'Unable to save permissions.')
      } else {
        setPermError('Unable to save permissions.')
      }
    } finally {
      setPermSaving(false)
    }
  }

  function toggleRoleStatus(roleId: string) {    setStatusByRoleId((current) => ({
      ...current,
      [roleId]: !current[roleId],
    }))
  }

  function toggleActivity(activityId: string) {
    setForm((current) => ({
      ...current,
      activityIds: current.activityIds.includes(activityId)
        ? current.activityIds.filter((item) => item !== activityId)
        : [...current.activityIds, activityId],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!form.name.trim() || !form.description.trim()) {
      setError('Role name and description are required.')
      setIsSubmitting(false)
      return
    }

    if (form.activityIds.length === 0) {
      setError('Assign at least one activity to the role.')
      setIsSubmitting(false)
      return
    }

    try {
      const createdRole = await createRole({
        name: form.name.trim(),
        description: form.description.trim(),
        activityIds: form.activityIds,
      })

      setRoles((current) =>
        [...current, createdRole].sort((a, b) => a.name.localeCompare(b.name)),
      )
      setStatusByRoleId((current) => ({
        ...current,
        [createdRole.id]: true,
      }))
      setForm({
        ...emptyForm,
        activityIds: activities[0] ? [activities[0].id] : [],
      })
      closeModal()
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setError(requestError.response?.data?.message ?? 'Unable to create role.')
      } else {
        setError('Unable to create role.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="panel loading-panel">Loading roles and activities...</div>
  }

  return (
    <div className="act-page">
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

      <div className="act-toolbar">
        <input
          className="act-search"
          type="text"
          placeholder="Search role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {pageError ? <div className="form-error">{pageError}</div> : null}

      <div className="act-table-wrapper">
        <table className="act-table role-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={6} className="act-empty">
                  No roles found.
                </td>
              </tr>
            ) : (
              filteredRoles.map((role, index) => {
                const roleCode = `ROLE-${String(index + 1).padStart(3, '0')}`
                const isActive = statusByRoleId[role.id] ?? true

                return (
                  <tr key={role.id}>
                    <td className="role-id-cell">{roleCode}</td>
                    <td>{role.name}</td>
                    <td className="act-desc">{role.description}</td>
                    <td>System</td>
                    <td>
                      <span className={isActive ? 'role-status role-status-active' : 'role-status role-status-inactive'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="role-actions">
                        <button type="button" className="role-edit-btn" onClick={() => openEditModal(role)}>
                          Edit
                        </button>
                        <button type="button" className="role-perm-btn" onClick={() => openPermissionsModal(role)}>
                          Permissions
                        </button>
                        <label className="role-switch" aria-label={`Toggle status for ${role.name}`}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleRoleStatus(role.id)}
                          />
                          <span className="role-slider" />
                        </label>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="act-modal-overlay" onClick={closeModal}>
          <div className="act-modal" onClick={(event) => event.stopPropagation()}>
            <div className="act-modal-header">
              <h2>New Role</h2>
              <button className="act-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form" onSubmit={handleSubmit}>
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Role Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Client Admin"
                    required
                  />
                </label>

                <label className="act-form-field">
                  <span>Description <span className="req">*</span></span>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Summarize the permissions of this role"
                    required
                  />
                </label>
              </div>

              <fieldset className="activity-assignment-group">
                <legend>Assign Activities</legend>
                {activities.map((activity) => (
                  <label key={activity.id} className="activity-option">
                    <input
                      type="checkbox"
                      checked={form.activityIds.includes(activity.id)}
                      onChange={() => toggleActivity(activity.id)}
                    />
                    <span>{activity.name}</span>
                  </label>
                ))}
              </fieldset>

              {error ? <div className="form-error">{error}</div> : null}

              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editRole && (
        <div className="act-modal-overlay" onClick={closeEditModal}>
          <div className="act-modal" onClick={(event) => event.stopPropagation()}>
            <div className="act-modal-header">
              <h2>Edit Activities — {editRole.name}</h2>
              <button className="act-modal-close" onClick={closeEditModal}>
                &times;
              </button>
            </div>
            <form className="act-modal-form" onSubmit={handleEditSubmit}>
              <fieldset className="activity-assignment-group">
                <legend>Assign Activities</legend>
                {activities.map((activity) => (
                  <label key={activity.id} className="activity-option">
                    <input
                      type="checkbox"
                      checked={editActivityIds.includes(activity.id)}
                      onChange={() => toggleEditActivity(activity.id)}
                    />
                    <span>{activity.name}</span>
                  </label>
                ))}
              </fieldset>
              {editError ? <div className="form-error">{editError}</div> : null}
              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isEditSubmitting}>
                  {isEditSubmitting ? 'Saving...' : 'Save Activities'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {permRole !== null && (
        <div className="act-modal-overlay" onClick={closePermissionsModal}>
          <div className="act-modal perm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="act-modal-header">
              <h2>Permissions — {permRole.name}</h2>
              <button className="act-modal-close" onClick={closePermissionsModal}>&times;</button>
            </div>

            {permModalLoading ? (
              <div className="perm-loading">Loading permissions...</div>
            ) : (
              <form className="act-modal-form" onSubmit={handleSavePermissions}>
                <p className="perm-hint">Grant <strong>View</strong> or <strong>Edit</strong> access per module for this role.</p>

                <div className="perm-table-wrapper">
                  <table className="perm-table">
                    <thead>
                      <tr>
                        <th>Module / Activity</th>
                        <th className="perm-col">View</th>
                        <th className="perm-col">Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => {
                        const viewPerm = allPermissions.find(
                          (p) => p.activityId === activity.id && p.permissionType === 'View'
                        )
                        const editPerm = allPermissions.find(
                          (p) => p.activityId === activity.id && p.permissionType === 'Edit'
                        )
                        return (
                          <tr key={activity.id}>
                            <td className="perm-activity-name">{activity.name}</td>
                            <td className="perm-col">
                              {viewPerm ? (
                                <input
                                  type="checkbox"
                                  className="perm-check"
                                  checked={selectedPermIds.has(viewPerm.id)}
                                  onChange={() => togglePermission(viewPerm.id)}
                                  aria-label={`${activity.name} View`}
                                />
                              ) : '—'}
                            </td>
                            <td className="perm-col">
                              {editPerm ? (
                                <input
                                  type="checkbox"
                                  className="perm-check"
                                  checked={selectedPermIds.has(editPerm.id)}
                                  onChange={() => togglePermission(editPerm.id)}
                                  aria-label={`${activity.name} Edit`}
                                />
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {permError ? <div className="form-error">{permError}</div> : null}

                <div className="act-modal-actions">
                  <button type="button" className="act-cancel-btn" onClick={closePermissionsModal}>
                    Cancel
                  </button>
                  <button type="submit" className="act-submit-btn" disabled={permSaving}>
                    {permSaving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}