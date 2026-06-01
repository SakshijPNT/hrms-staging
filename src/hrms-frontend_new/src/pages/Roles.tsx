import React, {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useEffect, useRef } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'
import { FiSearch, FiPlus } from 'react-icons/fi'
import { MdEdit } from 'react-icons/md'
import Select, { components } from 'react-select'

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


export function RolesPage() {

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [roles, setRoles] = useState<RoleManagementItem[]>([])
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
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

      const mappedRoles = res.data.map(
        (role: RoleApiResponse) => ({

          id: role.id,
          name: role.roleName,
          description: role.description,

          activity: activityData
            .filter((a: ActivityItem) =>
              role.activityIds.includes(a.id)
            )
            .map(
              (a: ActivityItem) =>
                a.activityName
            ),

          status: role.statusCode === 1,
        })
      )

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
        const activityRes = await api.get('/Roles/activities')

        setActivities(activityRes.data)

        await fetchRoles(activityRes.data)

      } catch (err) {
        console.error('Failed loading data', err)
      }
    }

    loadData()
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

    setForm({
      name: '',
      description: '',
      activityIds: [],
    })

    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
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

  const rolesPerPage = 5

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

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      form.activityIds.length === 0
    ) {
      setError('All fields are required.')
      return
    }

    try {

      const payload = {
        roleName: form.name,
        description: form.description,
        activityIds: form.activityIds,
        statusCode: editingStatusCode,
        createdBy: 1,
        updatedBy: 1
      }

      // EDIT
      if (editingRoleId) {

        await api.put(
          `/Roles/${editingRoleId}`,
          payload
        )

      } else {

        // CREATE
        await api.post(
          '/Roles',
          payload
        )
      }

      // refresh table
      await fetchRoles()

      // reset states
      setEditingRoleId(null)

      setForm({
        name: '',
        description: '',
        activityIds: [],
      })

      setError('')

      closeModal()

    } catch (error: unknown) {

      console.error(error)

      setError(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to save role'
      )
    }
  }

  const activityOptions = activities.map((activity) => ({
    value: activity.id,
    label: activity.activityName,
  }))



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
                <th>Edit</th>
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
                    <td>{role.activity.join(', ')}</td>

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
                            aria-label={
                              role.status
                                ? 'Deactivate role'
                                : 'Activate role'
                            }
                            onChange={() =>
                              toggleRoleStatus(
                                role.id,
                                role.status
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
                        onClick={() => handleEdit(role)}
                      >
                        <MdEdit />

                      </button>
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
          <div className="act-modal-overlay" onClick={closeModal}>
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

              <form className="act-modal-form" onSubmit={handleSubmit}>
                {/* Row 1 */}
                <div className="act-form-row">


                  <label className="act-form-field ">
                    <span>Role Name *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, name: e.target.value }))
                      }
                      placeholder="e.g. HR Admin"
                    />
                  </label>

                  <label className="act-form-field">
                    <span>Activity *</span>
                    <Select
                      isMulti
                      isClearable={false}
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}

                      classNamePrefix="act-select"
                      options={activityOptions}
                      placeholder="Select Activities"

                      menuPortalTarget={document.body}
                      menuPosition="fixed"

                      value={activityOptions.filter((option) =>
                        form.activityIds.includes(option.value)
                      )}

                      onChange={(selected) =>
                        setForm((c) => ({
                          ...c,
                          activityIds: selected.map((s) => s.value),
                        }))
                      }

                      components={{
                        MultiValue: (props) => {
                          const index = props.index
                          const selectedValues = props.getValue()

                          // show only first 2 chips
                          if (index < 2) {
                            return (
                              <components.MultiValue {...props}>
                                {props.children}
                              </components.MultiValue>
                            )
                          }

                          // show only ONE overflow badge
                          if (index === 2) {
                            return (
                              <div className="act-select-more">
                                +{selectedValues.length - 2} more
                              </div>
                            )
                          }

                          return null
                        },
                      }}
                    />


                  </label>
                </div>

                {/* Row 2 */}
                <div className="act-form-row">


                  {/* Activity Multi Select */}
                  {/*<label className="act-form-field">
                  <span>Activity *</span>

                  <select
                    multiple
                    value={form.activity}
                    onChange={(event) => {
                      const selected = Array.from(
                        event.target.selectedOptions,
                        (option) => option.value,
                      )

                      setForm((current) => ({
                        ...current,
                        activity: selected,
                      }))
                    }}
                  >
                    {ACTIVITIES.map((activity) => (
                      <option key={activity} value={activity}>
                        {activity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>*/}


                </div>

                {/* Row 2 */}
                <div className="act-form-row">
                  <label className="act-form-field">
                    <span>Description *</span>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter role description"
                    />
                  </label>


                </div>

                {/* Error */}
                {error && <div className="form-error">{error}</div>}


              </form>

              {/* Actions */}
              <div className="act-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="act-submit-btn">
                  {editingRoleId ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}