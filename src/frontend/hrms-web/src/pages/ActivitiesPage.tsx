import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createActivity, getActivities, updateActivity } from '../api/activityApi'
import { useAuth } from '../auth/AuthContext'
import type { Activity, CreateActivityPayload } from '../types/hrms'

const PAGE_SIZE = 10

const emptyForm: CreateActivityPayload = {
  name: '',
  code: '',
  description: '',
  type: 'Permission',
  moduleCode: '',
  moduleName: '',
}

export function ActivitiesPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'Admin'
  const [activities, setActivities] = useState<Activity[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editActivityId, setEditActivityId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  useEffect(() => {
    getActivities()
      .then((result) => setActivities(result))
      .catch(() => setError('Unable to load activities right now.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activities
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.moduleName.toLowerCase().includes(q),
    )
  }, [activities, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const nextActivityCode = useMemo(() => {
    const max = activities
      .map((item) => /^A(\d+)$/i.exec(item.code)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => Number(value))
      .reduce((acc, current) => Math.max(acc, current), 0)

    return `A${max + 1}`
  }, [activities])

  function openModal() {
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setError('')
  }

  function openEditModal(activity: Activity) {
    setEditActivityId(activity.id)
    setEditForm({
      name: activity.name,
      code: activity.code,
      description: activity.description,
      type: activity.type || 'Permission',
      moduleCode: activity.moduleCode,
      moduleName: activity.moduleName,
    })
    setEditError('')
    setEditModalOpen(true)
  }

  function closeEditModal() {
    setEditModalOpen(false)
    setEditActivityId(null)
    setEditError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const normalizedCode = nextActivityCode
    if (!form.name.trim() || !form.description.trim() || !form.moduleName.trim()) {
      setError('Activity name, description and module are required.')
      setIsSubmitting(false)
      return
    }

    try {
      const created = await createActivity({
        name: form.name.trim(),
        code: normalizedCode,
        description: form.description.trim(),
        type: 'Permission',
        moduleCode: form.moduleName.trim().toUpperCase().replace(/\s+/g, '_'),
        moduleName: form.moduleName.trim(),
      })
      setActivities((prev) => [created, ...prev])
      closeModal()
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message ?? 'Unable to create activity.')
      } else {
        setError('Unable to create activity.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editActivityId) return

    setEditError('')
    setIsEditSubmitting(true)

    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.moduleName.trim()) {
      setEditError('Activity name, description and module are required.')
      setIsEditSubmitting(false)
      return
    }

    try {
      const updated = await updateActivity(editActivityId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        type: 'Permission',
        moduleCode: editForm.moduleName.trim().toUpperCase().replace(/\s+/g, '_'),
        moduleName: editForm.moduleName.trim(),
      })

      setActivities((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      closeEditModal()
    } catch (err) {
      if (err instanceof AxiosError) {
        setEditError(err.response?.data?.message ?? 'Unable to update activity.')
      } else {
        setEditError('Unable to update activity.')
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  return (
    <div className="act-page">
      {/* Header */}
      <div className="act-page-header">
        <div>
          <nav className="act-breadcrumb">
            <span className="act-breadcrumb-link">Activities</span>
          </nav>
          <h1 className="act-title">Activities</h1>
        </div>
      </div>

      {/* Search */}
      <div className="act-toolbar">
        <input
          className="act-search"
          type="text"
          placeholder="Search activities..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="act-loading">Loading activities...</div>
      ) : (
        <div className="act-table-wrapper">
          <table className="act-table">
            <thead>
              <tr>
                <th>Activity Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Module</th>
                {isAdmin ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="act-empty">
                    No activities found.
                  </td>
                </tr>
              ) : (
                pageItems.map((activity) => (
                  <tr key={activity.id}>
                    <td className="role-id-cell">{activity.code}</td>
                    <td>{activity.name}</td>
                    <td className="act-desc">{activity.description}</td>
                    <td>{activity.moduleName}</td>
                    {isAdmin ? (
                      <td>
                        <button type="button" className="role-edit-btn" onClick={() => openEditModal(activity)}>
                          Edit
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!isLoading && (
        <div className="act-footer">
          <span className="act-count">
            Showing {pageItems.length} of {filtered.length}
          </span>
          <div className="act-pagination">
            <button
              className="act-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &#8249;
            </button>
            <span className="act-page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="act-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              &#8250;
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="act-modal-overlay" onClick={closeModal}>
          <div className="act-modal" onClick={(e) => e.stopPropagation()}>
            <div className="act-modal-header">
              <h2>New Activity</h2>
              <button className="act-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form" onSubmit={handleSubmit}>
              <label className="act-form-field">
                <span>Activity Code</span>
                <input
                  type="text"
                  value={nextActivityCode}
                  readOnly
                  disabled
                />
              </label>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Activity Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Attendance Review"
                    required
                  />
                </label>
              </div>

              <label className="act-form-field">
                <span>Activity Module <span className="req">*</span></span>
                <input
                  type="text"
                  value={form.moduleName}
                  onChange={(e) => setForm((f) => ({ ...f, moduleName: e.target.value }))}
                  placeholder="e.g. Settings"
                  required
                />
              </label>

              <label className="act-form-field">
                <span>Description <span className="req">*</span></span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what access this activity grants"
                  required
                />
              </label>

              {error ? <div className="form-error">{error}</div> : null}

              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="act-modal-overlay" onClick={closeEditModal}>
          <div className="act-modal" onClick={(e) => e.stopPropagation()}>
            <div className="act-modal-header">
              <h2>Edit Activity</h2>
              <button className="act-modal-close" onClick={closeEditModal}>
                &times;
              </button>
            </div>

            <form className="act-modal-form" onSubmit={handleEditSubmit}>
              <label className="act-form-field">
                <span>Activity Code</span>
                <input type="text" value={editForm.code} readOnly disabled />
              </label>

              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Activity Name <span className="req">*</span></span>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="act-form-field">
                <span>Activity Module <span className="req">*</span></span>
                <input
                  type="text"
                  value={editForm.moduleName}
                  onChange={(e) => setEditForm((f) => ({ ...f, moduleName: e.target.value }))}
                  required
                />
              </label>

              <label className="act-form-field">
                <span>Description <span className="req">*</span></span>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </label>

              {editError ? <div className="form-error">{editError}</div> : null}

              <div className="act-modal-actions">
                <button type="button" className="act-cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="act-submit-btn" disabled={isEditSubmitting}>
                  {isEditSubmitting ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}