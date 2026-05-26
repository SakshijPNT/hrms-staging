import { useEffect, useMemo, useState, type FormEvent } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'
import type { AxiosError } from 'axios'

interface CompanyItem {
  id: number
  companyName: string
  companyCode: string
  companyPhone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  timezone: string
  statusCode: number
}

export function CompanyPage() {

  const [companies, setCompanies] =
    useState<CompanyItem[]>([])

  const [search, setSearch] =
    useState('')

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingCompanyId, setEditingCompanyId] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  const session = JSON.parse(
  localStorage.getItem('session') || '{}'
)

const hasCompanyAccess =
  session.activities?.some(
    (activity: { activityCode: string }) =>
      activity.activityCode === 'A0'
  )

  const [form, setForm] = useState({
    companyName: '',
    companyCode: '',
    companyPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    timezone: 'Asia/Kolkata',
    statusCode: 1,
  })

  const timezones = [
    'Asia/Kolkata',
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Dubai',
    'Asia/Singapore',
  ]

 



  async function fetchCompanies() {

    try {

      const response = await api.get(
        '/Company/GetCompanies'
      )

      setCompanies(response.data)

    } catch (error) {

      console.error(
        'Failed to fetch companies',
        error
      )
    }
  }

            useEffect(() => {

            async function loadCompanies() {

                await fetchCompanies()
            }

            loadCompanies()

            }, [])

  const filteredCompanies = useMemo(() => {

    const q = search.toLowerCase()

    return companies.filter(
      (company) =>
        company.companyName
          .toLowerCase()
          .includes(q) ||
        company.companyCode
          .toLowerCase()
          .includes(q) ||
        company.country
          ?.toLowerCase()
          .includes(q)
    )

  }, [companies, search])

  function openModal() {

    setEditingCompanyId(null)

    setForm({
      companyName: '',
      companyCode: '',
      companyPhone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      timezone: 'Asia/Kolkata',
      statusCode: 1,
    })

    setError('')

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function handleEdit(company: CompanyItem) {

    setEditingCompanyId(company.id)

    setForm({
      companyName: company.companyName,
      companyCode: company.companyCode,
      companyPhone: company.companyPhone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      pincode: company.pincode || '',
      timezone: company.timezone,
      statusCode: company.statusCode,
    })

    setModalOpen(true)
  }

  /*async function handleDelete(
    companyId: number
  ) {

    const confirmed = window.confirm(
      'Are you sure you want to delete this company?'
    )

    if (!confirmed) {
      return
    }

    try {

      await api.delete(
        `/Company/${companyId}`
      )

      await fetchCompanies()

    } catch (error) {

      console.error(
        'Failed to delete company',
        error
      )

      alert('Failed to delete company')
    }
  }*/

  async function toggleCompanyStatus(
  companyId: number,
  currentStatus: number
  ) {

  try {

    const newStatus =
      currentStatus === 1 ? 0 : 1

    const confirmMessage =
      currentStatus === 1
        ? 'Are you sure you want to deactivate this company?'
        : 'Are you sure you want to activate this company?'

    const confirmed =
      window.confirm(confirmMessage)

    if (!confirmed) {
      return
    }

    await api.put('/Company/status', {
      id: companyId,
      statusCode: newStatus,
    })

    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId
          ? {
              ...company,
              statusCode: newStatus,
            }
          : company
      )
    )

  } catch (error) {

    console.error(
      'Failed to update company status',
      error
    )

    alert(
      'Failed to update company status'
    )
  }
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault()

    if (
      !form.companyName.trim() ||
      !form.companyCode.trim()
    ) {
      setError(
        'Company Name and Company Code are required.'
      )

      return
    }

    try {

      const payload = {
        id: editingCompanyId,
        companyName: form.companyName,
        companyCode: form.companyCode,
        companyPhone: form.companyPhone,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        timezone: form.timezone,
        statusCode: form.statusCode,
      }

      // EDIT
      if (editingCompanyId) {

        await api.put(
          '/Company',
          payload
        )

      } else {

        // CREATE
        await api.post(
          '/Company/CreateCompany',
          payload
        )
      }

      await fetchCompanies()

      closeModal()

    } catch (error: unknown) {

      const axiosError =
        error as AxiosError<{
          message?: string
        }>

      console.error(axiosError)

      setError(
        axiosError.response?.data?.message ||
        'Failed to save company'
      )
    }
  }

  return (
    <Layout title="Company Management">

      <div className="act-page">

        {/* Header */}
        <div className="act-page-header">

          <div>

            <nav className="act-breadcrumb">
              <span className="act-breadcrumb-link">
                Company
              </span>
            </nav>

            <h1 className="act-title">
              Companies
            </h1>

          </div>

      {hasCompanyAccess && (
  <button
    className="act-new-btn"
    onClick={openModal}
  >
    + Company
  </button>
)}

        </div>

        {/* Search */}
        <div className="act-toolbar">

          <input
            className="act-search"
            type="text"
            placeholder="Search company"
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
                <th>Company Name</th>
                <th>Company Code</th>
                <th>Country</th>
                <th>Timezone</th>
                <th>Status</th>
                {hasCompanyAccess && (
                <th>Edit</th>
                )}
                
                
              </tr>

            </thead>

            <tbody>

              {filteredCompanies.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="act-empty"
                  >
                    No companies found.
                  </td>
                </tr>

              ) : (

                filteredCompanies.map((company) => (

                  <tr key={company.id}>

                    <td>{company.id}</td>

                    <td>
                      {company.companyName}
                    </td>

                    <td>
                      {company.companyCode}
                    </td>

                    <td>
                      {company.country}
                    </td>

                    <td>
                      {company.timezone}
                    </td>

                    <td>

                    <div className="role-actions">

                    <span
                    className={
                    company.statusCode === 1
                    ? 'role-status role-status-active'
                    : 'role-status role-status-inactive'
                    }
                    >
                    {company.statusCode === 1
                        ? 'Active'
                        : 'Inactive'}
                    </span>

                        {hasCompanyAccess && (
                        <label className="role-switch">

                        <input
                            type="checkbox"
                            aria-label="Toggle company status"
                            checked={company.statusCode === 1}
                            onChange={() =>
                            toggleCompanyStatus(
                            company.id,
                            company.statusCode
                        )
                    }
                    />

                            <span className="role-slider" />

                            </label>
                            )}

                        </div>

                        </td>

                            {hasCompanyAccess && (
                            <td>

                                <button
                                className="edit-btn"
                                onClick={() =>
                                    handleEdit(company)
                                }
                                >
                                Edit
                                </button>

                            </td>
                            )}

                  </tr>

                ))
              )}

            </tbody>

          </table>

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
                  {editingCompanyId
                    ? 'Edit Company'
                    : 'New Company'}
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
                      Company Name *
                    </span>

                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          companyName:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Company Code *
                    </span>

                    <input
                      type="text"
                      value={form.companyCode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          companyCode:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Company Phone
                    </span>

                    <input
                      type="text"
                      value={form.companyPhone}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          companyPhone:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Timezone
                    </span>

                    <select
                      value={form.timezone}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          timezone:
                            e.target.value,
                        }))
                      }
                    >

                      {timezones.map((tz) => (

                        <option
                          key={tz}
                          value={tz}
                        >
                          {tz}
                        </option>

                      ))}

                    </select>

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Address
                    </span>

                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          address:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      City
                    </span>

                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          city:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      State
                    </span>

                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          state:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Country
                    </span>

                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          country:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Pincode
                    </span>

                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          pincode:
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
                    {editingCompanyId
                      ? 'Update Company'
                      : 'Create Company'}
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