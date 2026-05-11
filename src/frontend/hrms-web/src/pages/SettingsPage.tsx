import { useMemo, useState, type FormEvent } from 'react'

interface Company {
  id: string
  name: string
  code: string
  industry: string
  companyPhone: string
  city: string
  state: string
  country: string
  pincode: string
  timezone: string
  status: boolean
}

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'COMP-101',
    name: 'Tech Solutions Pvt Ltd',
    code: 'TS-001',
    industry: 'IT',
    companyPhone: '9876543210',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    timezone: 'IST',
    status: true,
  },
  {
    id: 'COMP-102',
    name: 'FinCorp India',
    code: 'FC-002',
    industry: 'Finance',
    companyPhone: '9988776655',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    pincode: '411001',
    timezone: 'IST',
    status: true,
  },
]

export function SettingsPage() {
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

 const [form, setForm] = useState({
  id: '',
  name: '',
  code: '',
  industry: '',
  companyPhone: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  timezone: '',
})

  const [error, setError] = useState('')

  // Search
  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase()

    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q),
    )
  }, [companies, search])

  function openModal() {
    setForm({
      id: '',
      name: '',
      code: '',
      industry: '',
      companyPhone: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      timezone: '',
    })

    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function toggleStatus(id: string) {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id
          ? { ...company, status: !company.status }
          : company,
      ),
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!form.id || !form.name || !form.code) {
  setError('Id, Name and Code are required')
  return
}

    const newCompany: Company = {
      
      ...form,
      status: true,
    }

    setCompanies((prev) => [newCompany, ...prev])

    closeModal()
  }

  return (
    <div className="act-page">
      {/* Header */}
      <div className="act-page-header">
        <div>
          <h1 className="act-title">Settings</h1>
        </div>

        <button className="act-new-btn" onClick={openModal}>
          + New Company
        </button>
      </div>

      {/* Search */}
      <div className="act-toolbar">
        <input
          className="act-search"
          placeholder="Search company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="act-table-wrapper">
        <table className="act-table">
          <thead>
            <tr>
              <th>Company ID</th>
              <th>Company Name</th>
              <th>Code</th>
              <th>City</th>
              <th>State</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={6} className="act-empty">
                  No companies found
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td>{company.id}</td>
                  <td>{company.name}</td>
                  <td>{company.code}</td>
                  <td>{company.city}</td>
                  <td>{company.state}</td>

                  <td>
                    <div className="role-actions">
                      <span
                        className={
                          company.status
                            ? 'role-status role-status-active'
                            : 'role-status role-status-inactive'
                        }
                      >
                        {company.status ? 'Active' : 'Inactive'}
                      </span>

                      <label className="role-switch">
                        <input
                          type="checkbox"
                          checked={company.status}
                          onChange={() => toggleStatus(company.id)}
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
            className="act-modal users-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="act-modal-header">
              <h2>Add Company</h2>

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
                  <span>Company ID *</span>

                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        id: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Company Name *</span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Row 2 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Company Code *</span>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Industry</span>

                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        industry: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Row 3 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Company Phone</span>

                  <input
                    type="text"
                    value={form.companyPhone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        companyPhone: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>City</span>

                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Row 4 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>State</span>

                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        state: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Country</span>

                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        country: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Row 5 */}
              <div className="act-form-row">
                <label className="act-form-field">
                  <span>Pincode</span>

                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pincode: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="act-form-field">
                  <span>Timezone</span>

                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        timezone: e.target.value,
                      })
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
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}