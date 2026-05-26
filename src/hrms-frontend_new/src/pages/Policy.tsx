import { useEffect, useState, type FormEvent } from 'react'
import Layout from '../pages/Layout'
import api from '../services/api'
import '../styles/Style.css'

interface PolicyItem {
  id: number
  companyId: number
  workHours: number
  halfdayThreshold: number
  checkinGracePeriod: number
  checkoutGracePeriod: number
  workDays: string
  shiftStart: string
  shiftEnd: string
}

export function PolicyPage() {

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingPolicyId, setEditingPolicyId] =
    useState<number | null>(null)

  const [hasPolicyAccess, setHasPolicyAccess] =
    useState(false)

  const [policies, setPolicies] =
    useState<PolicyItem[]>([])

  const [error, setError] =
    useState('')

  const [form, setForm] = useState({
    companyId: '',
    workHours: 8,
    halfdayThreshold: 4,
    checkinGracePeriod: 15,
    checkoutGracePeriod: 15,
    workDays: 'MON,TUE,WED,THU,FRI',
    shiftStart: '09:00',
    shiftEnd: '17:00'
  })

  async function fetchAccess() {

    try {

      const response =
        await api.get(
          '/Policy/HasPolicyAccess'
        )

      setHasPolicyAccess(
        response.data.hasAccess
      )

    } catch (error) {

      console.error(error)
    }
  }

  async function fetchPolicies() {

    try {

      const response =
        await api.get('/Policy')

      setPolicies(response.data)

    } catch (error) {

      console.error(error)
    }
  }

 useEffect(() => {

  async function loadData() {

    await fetchAccess()

    await fetchPolicies()
  }

  loadData()

}, [])

  function openModal() {

    setEditingPolicyId(null)

    setForm({
      companyId: '',
      workHours: 8,
      halfdayThreshold: 4,
      checkinGracePeriod: 15,
      checkoutGracePeriod: 15,
      workDays: 'MON,TUE,WED,THU,FRI',
      shiftStart: '09:00',
      shiftEnd: '17:00'
    })

    setError('')

    setModalOpen(true)
  }

  function closeModal() {

    setModalOpen(false)
  }

  function handleEdit(policy: PolicyItem) {

    setEditingPolicyId(policy.id)

    setForm({
      companyId: policy.companyId.toString(),
      workHours: policy.workHours,
      halfdayThreshold: policy.halfdayThreshold,
      checkinGracePeriod:
        policy.checkinGracePeriod,
      checkoutGracePeriod:
        policy.checkoutGracePeriod,
      workDays: policy.workDays,
      shiftStart:
        policy.shiftStart.substring(0, 5),
      shiftEnd:
        policy.shiftEnd.substring(0, 5)
    })

    setModalOpen(true)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault()

    try {

      if (editingPolicyId) {

        await api.put(
          '/Policy',
          {
            id: editingPolicyId,

            companyId:
              Number(form.companyId),

            workHours:
              form.workHours,

            halfdayThreshold:
              form.halfdayThreshold,

            checkinGracePeriod:
              form.checkinGracePeriod,

            checkoutGracePeriod:
              form.checkoutGracePeriod,

            workDays:
              form.workDays,

            shiftStart:
              `${form.shiftStart}:00`,

            shiftEnd:
              `${form.shiftEnd}:00`
          }
        )

      } else {

        await api.post(
          '/Policy/CreatePolicy',
          {
            companyId:
              Number(form.companyId),

            workHours:
              form.workHours,

            halfdayThreshold:
              form.halfdayThreshold,

            checkinGracePeriod:
              form.checkinGracePeriod,

            checkoutGracePeriod:
              form.checkoutGracePeriod,

            workDays:
              form.workDays,

            shiftStart:
              `${form.shiftStart}:00`,

            shiftEnd:
              `${form.shiftEnd}:00`
          }
        )
      }

      closeModal()

      fetchPolicies()

    } catch (error: unknown) {

  const axiosError = error as {response?: {data?: {message?: string}
    }
  }

  setError(
    axiosError.response?.data?.message ||
    'Failed to save policy'
  )
}
  }

  return (

    <Layout title="Policy Management">

      <div className="act-page">

        <div className="act-page-header">

          <div>

            <h1 className="act-title">
              Policies
            </h1>

          </div>

          {hasPolicyAccess && (

            <button
              className="act-new-btn"
              onClick={openModal}
            >
              + Policy
            </button>

          )}

        </div>

        <div className="act-table-wrapper">

          <table className="act-table">

            <thead>

              <tr>
                <th>ID</th>     
                <th>Company</th>
                <th>Work Hours</th>
                <th>Half Day</th>
                <th>Shift</th>
                {hasPolicyAccess && (
                <th>Action</th>
                )}
              </tr>

            </thead>

            <tbody>

              {policies.map((policy) => (

                <tr key={policy.id}>

                  <td>{policy.id}</td>

                  <td>{policy.companyId}</td>

                  <td>{policy.workHours}</td>

                  <td>
                    {policy.halfdayThreshold}
                  </td>

                  <td>
                    {policy.shiftStart}
                    {' - '}
                    {policy.shiftEnd}
                  </td>

      {hasPolicyAccess && (
  <td>
    <button
      className="act-edit-btn"
      onClick={() =>
        handleEdit(policy)
      }
    >
      Edit
    </button>
  </td>
)}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

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
                  {editingPolicyId
                    ? 'Edit Policy'
                    : 'New Policy'}
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

                    <span>
                      Company Id
                    </span>

                    <input
                      type="number"
                      value={form.companyId}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          companyId:
                            e.target.value
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Work Hours
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={form.workHours}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          workHours:
                            Number(e.target.value)
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Halfday Threshold
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={
                        form.halfdayThreshold
                      }
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          halfdayThreshold:
                            Number(e.target.value)
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Work Days
                    </span>

                    <input
                      type="text"
                      value={form.workDays}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          workDays:
                            e.target.value
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Checkin Grace Period
                    </span>

                    <input
                      type="number"
                      value={
                        form.checkinGracePeriod
                      }
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          checkinGracePeriod:
                            Number(e.target.value)
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Checkout Grace Period
                    </span>

                    <input
                      type="number"
                      value={
                        form.checkoutGracePeriod
                      }
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          checkoutGracePeriod:
                            Number(e.target.value)
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Shift Start
                    </span>

                    <input
                      type="time"
                      value={form.shiftStart}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          shiftStart:
                            e.target.value
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Shift End
                    </span>

                    <input
                      type="time"
                      value={form.shiftEnd}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          shiftEnd:
                            e.target.value
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
                    {editingPolicyId
                      ? 'Update Policy'
                      : 'Create Policy'}
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