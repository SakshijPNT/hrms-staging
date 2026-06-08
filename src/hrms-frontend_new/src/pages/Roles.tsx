import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useEffect } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'
import { FiSearch, FiPlus, FiEye } from 'react-icons/fi'
import { MdEdit } from 'react-icons/md'
import type { AxiosError } from 'axios'
import type { SessionInfo } from '../../types/auth'

interface RoleManagementItem {
  id: number
  name: string
  description: string
  activity: string[]
  status: boolean
}

interface ActivityItem {
  id: number
  activityName: string
}

type RoleFieldErrors = {
  name?: string
  description?: string
  activityIds?: string
}

export function RolesPage() {

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [roles, setRoles] = useState<RoleManagementItem[]>([])
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewRole, setViewRole] = useState<RoleManagementItem | null>(null)
  const [activityModalRole, setActivityModalRole] =
    useState<RoleManagementItem | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [editingStatusCode, setEditingStatusCode] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState(1)
  // const [activityDropdownOpen, setActivityDropdownOpen] = useState(false)
  // const activityRef = useRef<HTMLDivElement>(null)

  interface RoleApiResponse {
    id: number
    roleName: string
    description: string
    activityIds: number[]
    statusCode: number
  }


  async function fetchRoles(
    activityData = activities
  ) {
    try {

      const res = await api.get('/Roles/company')

      const mappedRoles = res.data
        .map((role: RoleApiResponse) => ({
          id: role.id,
          name: role.roleName,
          description: role.description,

          activity: activityData
            .filter((a: ActivityItem) =>
              role.activityIds.includes(a.id)
            )
            .map((a: ActivityItem) => a.activityName),

          status: role.statusCode === 1,
        }))
        .sort((a: RoleManagementItem, b: RoleManagementItem) => a.id - b.id)

      setRoles(mappedRoles)

    } catch (err) {

      console.error(
        'Failed to fetch roles',
        err
      )

    }
  }


  useEffect(() => {
    async function loadData() {
      try {
        const [activityRes, sessionRes] = await Promise.all([
          api.get('/Roles/activities'),
          api.get<SessionInfo>('/auth/session'),
        ])

        setActivities(activityRes.data)
        setSession(sessionRes.data)

        await fetchRoles(activityRes.data)
      } catch (err) {
        console.error('Failed loading data', err)
      }
    }

    loadData()
  }, [])

    useEffect(() => {

    if (modalOpen || viewModalOpen || activityModalRole) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }

  }, [modalOpen, viewModalOpen, activityModalRole])

  {/*useEffect(() => {
  async function fetchRoles() {
    try {
      const res = await api.get('/Roles/company')

      const mappedRoles = res.data.map((role: any) => ({
        id: role.id,
        name: role.roleName,
        description: role.description,

        activity: activities
          .filter((a) =>
            role.activityIds.includes(a.id)
          )
          .map((a) => a.activityName),

        status: role.statusCode === 1,
      }))

      setRoles(mappedRoles)

    } catch (err) {
      console.error('Failed to fetch roles', err)
    }
  }

  fetchRoles()
}, [activities])*/}

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (
  //       activityRef.current &&
  //       !activityRef.current.contains(event.target as Node)
  //     ) {
  //       setActivityDropdownOpen(false)
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside)

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside)
  //   }
  // }, [])


  const [form, setForm] = useState({

    name: '',
    description: '',
    activityIds: [] as number[],
  })

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<RoleFieldErrors>({})

  // Search
  const filteredRoles = useMemo(() => {
    const q = search.toLowerCase()

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(q))
    {/*||
        role.description.toLowerCase().includes(q) ||
        role.activity.join(', ').toLowerCase().includes(q),*/}

  }, [roles, search])

  function openModal() {
    setEditingRoleId(null)
    setEditingStatusCode(1)

    setForm({
      name: '',
      description: '',
      activityIds: [],
    })

    setError('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setFieldErrors({})
  }

  function clearFieldError(field: keyof RoleFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validateForm(): RoleFieldErrors {
    const errors: RoleFieldErrors = {}

    if (!form.name.trim()) {
      errors.name = 'This field is required.'
    }

    if (!form.description.trim()) {
      errors.description = 'This field is required.'
    }

    if (form.activityIds.length === 0) {
      errors.activityIds = 'Please select at least one activity.'
    }

    return errors
  }

  function openViewModal(role: RoleManagementItem) {
    setViewRole(role)
    setViewModalOpen(true)
  }

  function closeViewModal() {
    setViewModalOpen(false)
    setViewRole(null)
  }

  function openActivityModal(role: RoleManagementItem) {
    setActivityModalRole(role)
  }

  function closeActivityModal() {
    setActivityModalRole(null)
  }

  {/*function handleEdit(role: RoleManagementItem) {

  const selectedActivityIds = activities
    .filter((a) =>
      role.activity.includes(a.activityName)
    )
    .map((a) => a.id)

  setEditingRoleId(role.id)

  setForm({
    name: role.name,
    description: role.description,
    activityIds: selectedActivityIds,
  })

  setModalOpen(true)
}*/}


  async function toggleRoleStatus(
    roleId: number,
    currentStatus: boolean
  ) {
    try {
      // new status
      const newStatus = currentStatus ? 0 : 1

      // confirmation message
      const confirmMessage = currentStatus
        ? 'Are you sure you want to deactivate this role?'
        : 'Are you sure you want to activate this role?'

      const confirmed = window.confirm(confirmMessage)

      if (!confirmed) {
        return
      }

      // API call
      await api.put(
        `/Roles/${roleId}/status`,
        {
          statusCode: newStatus
        }
      )
      // refresh table
      await fetchRoles()

    } catch (error) {

      console.error(
        'Failed to update role status',
        error
      )

      alert('Failed to update role status')
    }
  }

  function handleEdit(role: RoleManagementItem) {

    // inactive role check
    if (!role.status) {
      alert('First activate this role')
      return
    }

    // set edit mode
    setEditingRoleId(role.id)

    // keep status
    setEditingStatusCode(role.status ? 1 : 0)

    // fill form
    setForm({
      name: role.name,
      description: role.description,

      activityIds: activities
        .filter((a) =>
          role.activity.includes(a.activityName)
        )
        .map((a) => a.id),
    })

    setError('')
    setFieldErrors({})
    setModalOpen(true)
  }


  //   function toggleActivity(activityId: number) {
  //   setForm((current) => {
  //     const exists = current.activityIds.includes(activityId)

  //     return {
  //       ...current,
  //       activityIds: exists
  //         ? current.activityIds.filter((id) => id !== activityId)
  //         : [...current.activityIds, activityId],
  //     }
  //   })
  // }

  {/*function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      
      !form.name.trim() ||
      !form.description.trim() ||
      form.activity.length === 0
    ) {
      setError('All fields are required.')
      return
    }

    const newRole: RoleManagementItem = {
      id: crypto.randomUUID(),,
      name: form.name,
      description: form.description,
      activity: form.activity,
      status: true,
    }

    setRoles((prev) => [newRole, ...prev])
    closeModal()
  }*/}

  const rolesPerPage = 10

  const indexOfLastRole = currentPage * rolesPerPage

  const indexOfFirstRole =
    indexOfLastRole - rolesPerPage

  const currentRoles =
    filteredRoles.slice(
      indexOfFirstRole,
      indexOfLastRole
    )

  const totalPages = Math.ceil(
    filteredRoles.length / rolesPerPage
  )

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

    if (!session?.userId) {
      setFieldErrors({})
      setError('Session expired. Please log in again.')
      return
    }

    try {
      setSubmitting(true)
      setFieldErrors({})
      setError('')

      const payload = {
        roleName: form.name.trim(),
        description: form.description.trim(),
        activityIds: form.activityIds,
        statusCode: editingRoleId ? editingStatusCode : 1,
        createdBy: session.userId,
        updatedBy: session.userId,
      }

      if (editingRoleId) {
        await api.put(`/Roles/${editingRoleId}`, payload)
      } else {
        await api.post('/Roles', payload)
      }

      await fetchRoles()
      setEditingRoleId(null)
      setForm({
        name: '',
        description: '',
        activityIds: [],
      })
      closeModal()
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(
        axiosError.response?.data?.message ?? 'Failed to save role',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function toggleActivity(activityId: number) {
    clearFieldError('activityIds')
    setForm((current) => {
      const exists = current.activityIds.includes(activityId)

      return {
        ...current,
        activityIds: exists
          ? current.activityIds.filter((id) => id !== activityId)
          : [...current.activityIds, activityId],
      }
    })
  }

  return (
    <Layout title="Roles Management">
      <div className="act-page">
        {/* Header */}
        <div className="act-toolbar">

          <div className="act-search-wrapper">
            <FiSearch className="act-search-icon" />

            <input
              className="act-search"
              type="text"
              placeholder="Search role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="act-new-btn"
            onClick={openModal}
          >
            <FiPlus />
            Role
          </button>

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
                <th>Action</th>
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
                currentRoles.map((role) => (
                  <tr key={role.id}>
                    <td className="role-id-cell">{role.id}</td>
                    <td>{role.name}</td>
                    <td>{role.description}</td>
                    <td>
                      <button
                        type="button"
                        className="role-activity-count-link"
                        title={`View ${role.activity.length} assigned activities`}
                        onClick={() => openActivityModal(role)}
                      >
                        {role.activity.length}
                      </button>
                    </td>

                    <td>
                      <span
                        className={
                          role.status
                            ? 'role-status role-status-active'
                            : 'role-status role-status-inactive'
                        }
                      >
                        {role.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="role-table-actions">
                        <label className="role-switch" title={role.status ? 'Deactivate role' : 'Activate role'}>
                          <input
                            type="checkbox"
                            checked={role.status}
                            aria-label={
                              role.status
                                ? 'Deactivate role'
                                : 'Activate role'
                            }
                            onChange={() =>
                              toggleRoleStatus(role.id, role.status)
                            }
                          />
                          <span className="role-slider" />
                        </label>

                        <button
                          type="button"
                          className="role-action-btn"
                          title="View role"
                          aria-label={`View role ${role.name}`}
                          onClick={() => openViewModal(role)}
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          className="role-action-btn"
                          title="Edit role"
                          aria-label={`Edit role ${role.name}`}
                          onClick={() => handleEdit(role)}
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

          <div className="role-pagination">
            <div className="pagination-info">
              Showing {currentRoles.length} of {filteredRoles.length}
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

        {/* Modal */}
        {modalOpen && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>
                  {editingRoleId ? 'Edit Role' : 'New Role'}
                </h2>

                <button className="act-modal-close" onClick={closeModal}>
                  &times;
                </button>
              </div>

              <form className="act-modal-form role-modal-form" onSubmit={handleSubmit}>
                <label
                  className={`act-form-field role-modal-field${fieldErrors.name ? ' act-form-field--invalid' : ''}`}
                >
                  <span>Role Name *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      clearFieldError('name')
                      setForm((c) => ({ ...c, name: e.target.value }))
                    }}
                    placeholder="-Enter Text-"
                  />
                  {fieldErrors.name && (
                    <span className="field-error-message">
                      {fieldErrors.name}
                    </span>
                  )}
                </label>

                <label
                  className={`act-form-field role-modal-field${fieldErrors.description ? ' act-form-field--invalid' : ''}`}
                >
                  <span>Description *</span>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => {
                      clearFieldError('description')
                      setForm((c) => ({
                        ...c,
                        description: e.target.value,
                      }))
                    }}
                    placeholder="-Enter Text-"
                  />
                  {fieldErrors.description && (
                    <span className="field-error-message">
                      {fieldErrors.description}
                    </span>
                  )}
                </label>

                <div
                  className={`role-activities-section${fieldErrors.activityIds ? ' role-activities-section--invalid' : ''}`}
                >
                  <h3 className="role-activities-title">Assign Activities *</h3>
                  <div className="role-activities-list">
                    {activities.length === 0 ? (
                      <p className="role-activities-empty">No activities available.</p>
                    ) : (
                      activities.map((activity) => (
                        <label
                          key={activity.id}
                          className="role-activity-item"
                        >
                          <input
                            type="checkbox"
                            checked={form.activityIds.includes(activity.id)}
                            onChange={() => toggleActivity(activity.id)}
                          />
                          <span>{activity.activityName}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.activityIds && (
                    <span className="field-error-message">
                      {fieldErrors.activityIds}
                    </span>
                  )}
                </div>

                {error && <div className="form-error">{error}</div>}

                <div className="act-modal-actions">
                  <button
                    type="button"
                    className="act-cancel-btn"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="act-submit-btn"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Saving...'
                      : editingRoleId
                        ? 'Update'
                        : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activityModalRole && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>Assigned Activities</h2>
                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeActivityModal}
                >
                  &times;
                </button>
              </div>

              <div className="act-modal-form role-modal-form role-view-form">
                <p className="role-activity-modal-subtitle">
                  {activityModalRole.name} — {activityModalRole.activity.length}{' '}
                  {activityModalRole.activity.length === 1
                    ? 'activity'
                    : 'activities'}
                </p>

                <div className="role-activities-list role-view-activities">
                  {activityModalRole.activity.length === 0 ? (
                    <p className="role-activities-empty">No activities assigned.</p>
                  ) : (
                    activityModalRole.activity.map((activityName) => (
                      <div
                        key={`${activityModalRole.id}-${activityName}`}
                        className="role-activity-item role-view-activity-item"
                      >
                        <span>{activityName}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="act-modal-actions">
                  <button
                    type="button"
                    className="act-cancel-btn"
                    onClick={closeActivityModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewModalOpen && viewRole && (
          <div className="act-modal-overlay">
            <div
              className="act-modal modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>Role Details</h2>
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
                  <span className="role-view-label">Role ID</span>
                  <p className="role-view-value">{viewRole.id}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Role Name</span>
                  <p className="role-view-value">{viewRole.name}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Description</span>
                  <p className="role-view-value">{viewRole.description || '-'}</p>
                </div>

                <div className="role-view-field">
                  <span className="role-view-label">Status</span>
                  <p className="role-view-value">
                    <span
                      className={
                        viewRole.status
                          ? 'role-status role-status-active'
                          : 'role-status role-status-inactive'
                      }
                    >
                      {viewRole.status ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                <div className="role-activities-section">
                  <h3 className="role-activities-title">Assigned Activities</h3>
                  <div className="role-activities-list role-view-activities">
                    {viewRole.activity.length === 0 ? (
                      <p className="role-activities-empty">No activities assigned.</p>
                    ) : (
                      viewRole.activity.map((activityName) => (
                        <div key={activityName} className="role-activity-item role-view-activity-item">
                          <span>{activityName}</span>
                        </div>
                      ))
                    )}
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
          </div>
        )}
      </div>
    </Layout>
  )
}