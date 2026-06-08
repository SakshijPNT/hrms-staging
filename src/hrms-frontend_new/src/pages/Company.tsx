import { useEffect, useMemo, useState, type FormEvent } from 'react'
import '../styles/Style.css'
import api from '../services/api'
import Layout from '../pages/Layout'
import type { AxiosError } from 'axios'
import { FiSearch, FiEye } from 'react-icons/fi'
import { MdEdit } from "react-icons/md";
import Select from 'react-select'

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
  fiscalYearStartMonth: number
  fiscalYearStartDay: number
  statusCode: number
}

interface TimezoneOption {
  value: string
  label: string
}

const DEFAULT_TIMEZONE = 'Asia/Kolkata'
const DEFAULT_FISCAL_START_MONTH = 4
const DEFAULT_FISCAL_START_DAY = 1

const FISCAL_MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

type CompanyFieldErrors = {
  companyName?: string
  companyCode?: string
  timezone?: string
  fiscalYearStartMonth?: string
  fiscalYearStartDay?: string
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

  const [isViewMode, setIsViewMode] = useState(false)

  const [error, setError] =
    useState('')

  const [fieldErrors, setFieldErrors] =
    useState<CompanyFieldErrors>({})

const [hasCompanyAccess, setHasCompanyAccess] =
  useState(false)

  const [form, setForm] = useState({
    companyName: '',
    companyCode: '',
    companyPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    timezone: DEFAULT_TIMEZONE,
    fiscalYearStartMonth: DEFAULT_FISCAL_START_MONTH,
    fiscalYearStartDay: DEFAULT_FISCAL_START_DAY,
    statusCode: 1,
  })

  const [timezoneOptions, setTimezoneOptions] = useState<TimezoneOption[]>([])

  const [currentPage, setCurrentPage] = useState(1)

  const companiesPerPage = 10

  const indexOfLastCompany =
    currentPage * companiesPerPage

  const indexOfFirstCompany =
    indexOfLastCompany - companiesPerPage

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

  async function fetchTimezones() {
    try {
      const response = await api.get<
        { value: string; label: string }[]
      >('/Company/timezones')

      setTimezoneOptions(
        (response.data ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))
      )
    } catch (fetchError) {
      console.error('Failed to fetch timezones', fetchError)
      setTimezoneOptions([])
    }
  }

  function buildTimezoneSelectOptions(currentValue?: string) {
    const options = [...timezoneOptions]

    if (
      currentValue &&
      !options.some((option) => option.value === currentValue)
    ) {
      options.unshift({
        value: currentValue,
        label: currentValue,
      })
    }

    return options
  }

            useEffect(() => {
            async function loadCompanies() {
              try {
                const sessionResponse = await api.get('/auth/session')

                const sessionDataResponse = await api.get(
                  `/auth/session-data/${sessionResponse.data.userId}`
                )

                const hasA0 =
                  sessionDataResponse.data.activities?.some(
                    (activity: { activityCode: string }) =>
                      activity.activityCode === 'A0'
                  ) || false

                setHasCompanyAccess(hasA0)

                await fetchTimezones()

                const response = await api.get(
                  '/Company/GetCompanies'
                )

                setCompanies(response.data)
              } catch (error) {
                console.error(error)
              }
            }

            loadCompanies()

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

  const filteredCompanies = useMemo(() => {

    const q = search.toLowerCase()

    return companies
      .filter(
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
      .sort((a, b) => a.id - b.id)

  }, [companies, search])


  const currentCompanies =
    filteredCompanies.slice(
      indexOfFirstCompany,
      indexOfLastCompany
    )

  const totalPages = Math.ceil(
    filteredCompanies.length / companiesPerPage
  )

  function openModal() {

    setEditingCompanyId(null)
    setIsViewMode(false)

    setForm({
      companyName: '',
      companyCode: '',
      companyPhone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      timezone: DEFAULT_TIMEZONE,
      fiscalYearStartMonth: DEFAULT_FISCAL_START_MONTH,
      fiscalYearStartDay: DEFAULT_FISCAL_START_DAY,
      statusCode: 1,
    })

    setError('')
    setFieldErrors({})

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setIsViewMode(false)
    setFieldErrors({})
  }

  function clearFieldError(field: keyof CompanyFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validateForm(): CompanyFieldErrors {
    const errors: CompanyFieldErrors = {}

    if (!form.companyName.trim()) {
      errors.companyName = 'Company Name is required.'
    }

    if (!form.companyCode.trim()) {
      errors.companyCode = 'Company Code is required.'
    }

    if (!form.timezone.trim()) {
      errors.timezone = 'Timezone is required.'
    }

    if (
      form.fiscalYearStartMonth < 1 ||
      form.fiscalYearStartMonth > 12
    ) {
      errors.fiscalYearStartMonth = 'Select a valid fiscal start month.'
    }

    if (
      form.fiscalYearStartDay < 1 ||
      form.fiscalYearStartDay > 31
    ) {
      errors.fiscalYearStartDay = 'Fiscal start day must be between 1 and 31.'
    }

    return errors
  }

  function handleView(company: CompanyItem) {
    setIsViewMode(true)
    setEditingCompanyId(null)
    setError('')
    setFieldErrors({})

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
      fiscalYearStartMonth: company.fiscalYearStartMonth ?? DEFAULT_FISCAL_START_MONTH,
      fiscalYearStartDay: company.fiscalYearStartDay ?? DEFAULT_FISCAL_START_DAY,
      statusCode: company.statusCode,
    })

    setModalOpen(true)
  }

  function handleEdit(company: CompanyItem) {

    setIsViewMode(false)
    setEditingCompanyId(company.id)
    setError('')
    setFieldErrors({})

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
      fiscalYearStartMonth: company.fiscalYearStartMonth ?? DEFAULT_FISCAL_START_MONTH,
      fiscalYearStartDay: company.fiscalYearStartDay ?? DEFAULT_FISCAL_START_DAY,
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

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Please fill all required fields.')
      return
    }

    try {
      setError('')
      setFieldErrors({})

      const payload = {
        companyName: form.companyName.trim(),
        companyCode: form.companyCode.trim(),
        companyPhone: form.companyPhone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        pincode: form.pincode.trim() || null,
        timezone: form.timezone,
        fiscalYearStartMonth: form.fiscalYearStartMonth,
        fiscalYearStartDay: form.fiscalYearStartDay,
        statusCode: form.statusCode,
      }

      // EDIT
      if (editingCompanyId) {

        await api.put(
          '/Company',
          {
            id: editingCompanyId,
            ...payload,
          }
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
        <div className="act-toolbar">

          <div className="act-search-wrapper">
            <FiSearch className="act-search-icon" />
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

          {hasCompanyAccess && (
            <button
              className="act-new-btn"
              onClick={openModal}
            >
              + Company
            </button>
          )}

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
                <th>Action</th>


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

                currentCompanies.map((company) => (

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

                    <td>
                      <div className="policy-table-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          title="View company"
                          aria-label={`View company ${company.companyName}`}
                          onClick={() => handleView(company)}
                        >
                          <FiEye />
                        </button>

                        {hasCompanyAccess && (
                          <button
                            type="button"
                            className="edit-btn"
                            title="Edit company"
                            aria-label={`Edit company ${company.companyName}`}
                            onClick={() => handleEdit(company)}
                          >
                            <MdEdit />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

          <div className="role-pagination">

            <div className="pagination-info">
              Showing {currentCompanies.length} of {filteredCompanies.length}
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

          <div
            className="act-modal-overlay"
          >

            <div
              className="act-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="act-modal-header">

                <h2>
                  {isViewMode
                    ? 'View Company'
                    : editingCompanyId
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
                id="company-form"
                className="act-modal-form"
                onSubmit={handleSubmit}
              >

                <div className="act-form-row">

                  <label
                    className={`act-form-field${fieldErrors.companyName ? ' act-form-field--invalid' : ''}`}
                  >

                    <span>
                      Company Name *
                    </span>

                    <input
                      type="text"
                      value={form.companyName}
                      readOnly={isViewMode}
                      onChange={(e) => {
                        clearFieldError('companyName')
                        setForm((c) => ({
                          ...c,
                          companyName: e.target.value,
                        }))
                      }}
                    />
                    {fieldErrors.companyName && (
                      <span className="field-error-message">
                        {fieldErrors.companyName}
                      </span>
                    )}

                  </label>

                  <label
                    className={`act-form-field${fieldErrors.companyCode ? ' act-form-field--invalid' : ''}`}
                  >

                    <span>
                      Company Code *
                    </span>

                    <input
                      type="text"
                      value={form.companyCode}
                      readOnly={isViewMode}
                      onChange={(e) => {
                        clearFieldError('companyCode')
                        setForm((c) => ({
                          ...c,
                          companyCode: e.target.value,
                        }))
                      }}
                    />
                    {fieldErrors.companyCode && (
                      <span className="field-error-message">
                        {fieldErrors.companyCode}
                      </span>
                    )}

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
                      readOnly={isViewMode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          companyPhone:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label
                    className={`act-form-field${fieldErrors.timezone ? ' act-form-field--invalid' : ''}`}
                  >

                    <span>
                      Timezone *
                    </span>

                    {/* <select
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

                    </select> */}

                    <Select
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      menuShouldScrollIntoView={false}
                      classNamePrefix="act-select"
                      isDisabled={isViewMode}
                      options={buildTimezoneSelectOptions(form.timezone).map(
                        (option) => ({
                          value: option.value,
                          label: option.label,
                        })
                      )}
                      value={{
                        value: form.timezone,
                        label:
                          buildTimezoneSelectOptions(form.timezone).find(
                            (option) => option.value === form.timezone
                          )?.label ?? form.timezone,
                      }}
                      onChange={(selected) => {
                        clearFieldError('timezone')
                        setForm((c) => ({
                          ...c,
                          timezone: selected
                            ? selected.value
                            : DEFAULT_TIMEZONE,
                        }))
                      }}
                    />
                    {fieldErrors.timezone && (
                      <span className="field-error-message">
                        {fieldErrors.timezone}
                      </span>
                    )}

                  </label>

                </div>

                <div className="act-form-row">

                  <label
                    className={`act-form-field${fieldErrors.fiscalYearStartMonth ? ' act-form-field--invalid' : ''}`}
                  >
                    <span>Fiscal Year Start Month *</span>

                    <Select
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      menuShouldScrollIntoView={false}
                      classNamePrefix="act-select"
                      isDisabled={isViewMode}
                      options={FISCAL_MONTH_OPTIONS}
                      value={
                        FISCAL_MONTH_OPTIONS.find(
                          (option) =>
                            option.value === form.fiscalYearStartMonth
                        ) ?? FISCAL_MONTH_OPTIONS[3]
                      }
                      onChange={(selected) => {
                        clearFieldError('fiscalYearStartMonth')
                        setForm((current) => ({
                          ...current,
                          fiscalYearStartMonth: selected
                            ? Number(selected.value)
                            : DEFAULT_FISCAL_START_MONTH,
                        }))
                      }}
                    />
                    {fieldErrors.fiscalYearStartMonth && (
                      <span className="field-error-message">
                        {fieldErrors.fiscalYearStartMonth}
                      </span>
                    )}
                  </label>

                  <label
                    className={`act-form-field${fieldErrors.fiscalYearStartDay ? ' act-form-field--invalid' : ''}`}
                  >
                    <span>Fiscal Year Start Day *</span>

                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.fiscalYearStartDay}
                      readOnly={isViewMode}
                      onChange={(e) => {
                        clearFieldError('fiscalYearStartDay')
                        setForm((current) => ({
                          ...current,
                          fiscalYearStartDay: Number(e.target.value),
                        }))
                      }}
                    />
                    {fieldErrors.fiscalYearStartDay && (
                      <span className="field-error-message">
                        {fieldErrors.fiscalYearStartDay}
                      </span>
                    )}
                  </label>

                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Address
                    </span>

                    <textarea
                      rows={3}
                      value={form.address}
                      readOnly={isViewMode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          address:
                            e.target.value,
                        }))
                      }
                    />

                  </label>



                </div>

                <div className="act-form-row">


                  <label className="act-form-field">

                    <span>
                      City
                    </span>

                    <input
                      type="text"
                      value={form.city}
                      readOnly={isViewMode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          city:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      State
                    </span>

                    <input
                      type="text"
                      value={form.state}
                      readOnly={isViewMode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          state:
                            e.target.value,
                        }))
                      }
                    />

                  </label>



                </div>

                <div className="act-form-row">

                  <label className="act-form-field">

                    <span>
                      Country
                    </span>

                    <input
                      type="text"
                      value={form.country}
                      readOnly={isViewMode}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          country:
                            e.target.value,
                        }))
                      }
                    />

                  </label>

                  <label className="act-form-field">

                    <span>
                      Pincode
                    </span>

                    <input
                      type="text"
                      value={form.pincode}
                      readOnly={isViewMode}
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

              </form>

              <div className="act-modal-actions">

                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeModal}
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>

                {!isViewMode && (
                <button
                  type="submit"
                  form="company-form"
                  className="act-submit-btn"
                >
                  {editingCompanyId
                    ? 'Update Company'
                    : 'Create Company'}
                </button>
                )}

              </div>

            </div>

          </div>
        )}

      </div>

    </Layout>
  )
}