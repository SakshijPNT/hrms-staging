import { useEffect, useState, type FormEvent } from 'react'
import Layout from '../pages/Layout'
import api from '../services/api'
import '../styles/Style.css'
import { MdEdit } from "react-icons/md";
import { FiSearch, FiPlus, FiEye } from 'react-icons/fi'
import HolidayInlineEditor, {
  type HolidayRow,
} from '../components/HolidayInlineEditor'
import LeavePolicyInlineEditor, {
  type LeaveTypeRow,
} from '../components/LeavePolicyInlineEditor'

type PolicyModalTab = 'work' | 'holiday' | 'leave'
type PolicyViewModalType = 'holidays' | 'leaves'

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
  regularizationWindowDays: number
}

export function PolicyPage() {

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingPolicyId, setEditingPolicyId] =
    useState<number | null>(null)

  const [isViewMode, setIsViewMode] = useState(false)

  const [hasPolicyAccess, setHasPolicyAccess] =
    useState(false)

  const [policies, setPolicies] =
    useState<PolicyItem[]>([])

  const [error, setError] =
    useState('')

    const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    companyId: '',
    workHours: 8,
    halfdayThreshold: 4,
    checkinGracePeriod: 15,
    checkoutGracePeriod: 15,
    workDays: 'MON,TUE,WED,THU,FRI',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    regularizationWindowDays: 30,
  })

  const [holidays, setHolidays] = useState<HolidayRow[]>([])
  const [holidayYear, setHolidayYear] = useState(
    () => new Date().getFullYear()
  )
  const [companyContext, setCompanyContext] = useState<{
    companyId: number
    companyName: string
    timezone: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<PolicyModalTab>('work')
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1)
  const [workTabMessage, setWorkTabMessage] = useState('')
  const [holidayTabMessage, setHolidayTabMessage] = useState('')
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRow[]>([])
  const [viewModal, setViewModal] = useState<{
    type: PolicyViewModalType
    companyId: number
  } | null>(null)
  const [viewHolidays, setViewHolidays] = useState<HolidayRow[]>([])
  const [viewLeaveTypes, setViewLeaveTypes] = useState<LeaveTypeRow[]>([])
  const [viewHolidayYear, setViewHolidayYear] = useState(
    () => new Date().getFullYear()
  )
  const [viewCompanyContext, setViewCompanyContext] = useState<{
    companyId: number
    companyName: string
    timezone: string
  } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')

  const [currentPage, setCurrentPage] =
    useState(1)

  const policiesPerPage = 10

  const indexOfLastPolicy =
    currentPage * policiesPerPage

  const indexOfFirstPolicy =
    indexOfLastPolicy - policiesPerPage

  const currentPolicies =
    policies.slice(
      indexOfFirstPolicy,
      indexOfLastPolicy
    )

  function isWorkPolicyComplete() {
    const companyId = Number(form.companyId)
    return (
      Number.isFinite(companyId) &&
      companyId > 0 &&
      form.workDays.trim().length > 0 &&
      form.shiftStart.trim().length > 0 &&
      form.shiftEnd.trim().length > 0 &&
      form.workHours > 0
    )
  }

  function canAccessTab(tab: PolicyModalTab) {
    if (editingPolicyId || isViewMode) {
      return true
    }

    if (tab === 'work') {
      return true
    }

    if (tab === 'holiday') {
      return setupStep >= 2
    }

    return setupStep >= 3
  }

  function resetModalFlow() {
    setActiveTab('work')
    setSetupStep(1)
    setWorkTabMessage('')
    setHolidayTabMessage('')
    setLeaveTypes([])
    setCompanyContext(null)
  }

  function buildHolidayPayload() {
    return holidays
      .filter(
        (holiday) =>
          holiday.holidayDate.trim() && holiday.holidayName.trim()
      )
      .map((holiday) => ({
        ...(holiday.id && holiday.id > 0 ? { id: holiday.id } : {}),
        holidayDate: holiday.holidayDate,
        holidayName: holiday.holidayName.trim(),
        description: holiday.description || null,
      }))
  }

  function buildLeaveTypePayload() {
    return leaveTypes
      .filter(
        (leaveType) =>
          leaveType.leaveTypeName.trim() && leaveType.maxDaysAllowed > 0
      )
      .map((leaveType) => ({
        ...(leaveType.id && leaveType.id > 0 ? { id: leaveType.id } : {}),
        leaveTypeName: leaveType.leaveTypeName.trim(),
        description: leaveType.description || null,
        maxDaysAllowed: leaveType.maxDaysAllowed,
        isCarryForward: leaveType.isCarryForward,
        maxCarryForward:
          leaveType.isCarryForward && leaveType.maxCarryForward !== ''
            ? Number(leaveType.maxCarryForward)
            : null,
      }))
  }

  function validateLeaveTypesBeforeSave(): string | null {
    for (const leaveType of leaveTypes) {
      if (!leaveType.leaveTypeName.trim() && leaveType.maxDaysAllowed <= 0) {
        continue
      }

      if (!leaveType.leaveTypeName.trim()) {
        return 'Each leave type row must have a name.'
      }

      if (leaveType.maxDaysAllowed <= 0) {
        return `Max days per year is required for "${leaveType.leaveTypeName}".`
      }

      if (
        leaveType.isCarryForward &&
        (leaveType.maxCarryForward === '' ||
          Number(leaveType.maxCarryForward) <= 0)
      ) {
        return `Max carry forward is required when carry forward is Yes for "${leaveType.leaveTypeName}".`
      }
    }

    return null
  }

  function buildPolicyPayload() {
    return {
      companyId: Number(form.companyId),
      workHours: form.workHours,
      halfdayThreshold: form.halfdayThreshold,
      checkinGracePeriod: form.checkinGracePeriod,
      checkoutGracePeriod: form.checkoutGracePeriod,
      workDays: form.workDays,
      shiftStart: `${form.shiftStart}:00`,
      shiftEnd: `${form.shiftEnd}:00`,
      regularizationWindowDays: form.regularizationWindowDays,
    }
  }

  function handleContinueToHoliday() {
    if (!isWorkPolicyComplete()) {
      setError(
        'Please fill Company Id, Work Hours, Work Days, Shift Start, and Shift End.'
      )
      return
    }

    setError('')
    setWorkTabMessage(
      'Work policy details look good. Continue to the Holiday Calendar tab to add company holidays.'
    )
    setSetupStep(2)
    setActiveTab('holiday')
  }

  function handleContinueToLeave() {
    setError('')
    setHolidayTabMessage(
      'Holiday calendar saved for this step. Continue to Leave Policy to configure leave types.'
    )
    setSetupStep(3)
    setActiveTab('leave')
  }

  function handleTabClick(tab: PolicyModalTab) {
    if (!canAccessTab(tab)) {
      setError(
        tab === 'holiday'
          ? 'Complete Work Policy and click Continue to Holiday Calendar first.'
          : 'Complete Holiday Calendar and click Continue to Leave Policy first.'
      )
      return
    }

    setError('')
    setActiveTab(tab)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(
      policies.length / policiesPerPage
    )
  )

  const tableColumnCount = 8

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

  async function fetchHolidays(
    companyId: number,
    year: number = holidayYear
  ) {
    try {
      const response = await api.get('/Holiday', {
        params: { companyId, year },
      })

      const rows: HolidayRow[] = (response.data ?? []).map(
        (holiday: {
          id: number
          holidayDate: string
          holidayName: string
          description: string | null
        }) => ({
          id: holiday.id,
          holidayDate: holiday.holidayDate,
          holidayName: holiday.holidayName,
          description: holiday.description ?? '',
        })
      )

      setHolidays(rows)
    } catch (error) {
      console.error('Failed to load holidays', error)
      setHolidays([])
    }
  }

  async function fetchLeaveTypes(companyId: number) {
    try {
      const response = await api.get('/LeaveType', {
        params: { companyId },
      })

      const rows: LeaveTypeRow[] = (response.data ?? []).map(
        (leaveType: {
          id: number
          leaveTypeName: string
          description: string | null
          maxDaysAllowed: number
          isCarryForward: boolean
          maxCarryForward: number | null
        }) => ({
          id: leaveType.id,
          leaveTypeName: leaveType.leaveTypeName,
          description: leaveType.description ?? '',
          maxDaysAllowed: leaveType.maxDaysAllowed,
          isCarryForward: leaveType.isCarryForward,
          maxCarryForward: leaveType.maxCarryForward ?? '',
        })
      )

      setLeaveTypes(rows)
    } catch (error) {
      console.error('Failed to load leave types', error)
      setLeaveTypes([])
    }
  }

  async function fetchCompanyContext(companyId: number) {
    try {
      const response = await api.get('/Policy/company-context', {
        params: { companyId },
      })

      setCompanyContext(response.data)
    } catch (error) {
      console.error('Failed to load company context', error)
      setCompanyContext(null)
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

  useEffect(() => {

    if (modalOpen || viewModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }

  }, [modalOpen, viewModal])

  function openModal() {

    setEditingPolicyId(null)
    setIsViewMode(false)

    setForm({
      companyId: '',
      workHours: 8,
      halfdayThreshold: 4,
      checkinGracePeriod: 15,
      checkoutGracePeriod: 15,
      workDays: 'MON,TUE,WED,THU,FRI',
      shiftStart: '09:00',
      shiftEnd: '17:00',
      regularizationWindowDays: 30,
    })

    setHolidays([])
    setHolidayYear(new Date().getFullYear())
    resetModalFlow()

    setError('')

    setModalOpen(true)
  }

  function closeModal() {

    setModalOpen(false)
    setIsViewMode(false)
    setEditingPolicyId(null)
  }

  function handleView(policy: PolicyItem) {
    setIsViewMode(true)
    setEditingPolicyId(null)

    setForm({
      companyId: policy.companyId.toString(),
      workHours: policy.workHours,
      halfdayThreshold: policy.halfdayThreshold,
      checkinGracePeriod: policy.checkinGracePeriod,
      checkoutGracePeriod: policy.checkoutGracePeriod,
      workDays: policy.workDays,
      shiftStart: policy.shiftStart.substring(0, 5),
      shiftEnd: policy.shiftEnd.substring(0, 5),
      regularizationWindowDays: policy.regularizationWindowDays ?? 30,
    })

    setHolidays([])
    setHolidayYear(new Date().getFullYear())
    setActiveTab('work')
    setSetupStep(3)
    setWorkTabMessage('')
    setHolidayTabMessage('')
    setError('')

    setModalOpen(true)
  }

  function handleEdit(policy: PolicyItem) {

    setIsViewMode(false)
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
        policy.shiftEnd.substring(0, 5),
      regularizationWindowDays: policy.regularizationWindowDays ?? 30,
    })

    setHolidays([])
    setHolidayYear(new Date().getFullYear())
    setActiveTab('work')
    setSetupStep(3)
    setWorkTabMessage('')
    setHolidayTabMessage('')

    setModalOpen(true)
  }

  useEffect(() => {
    if (!modalOpen || !form.companyId) {
      return
    }

    const companyId = Number(form.companyId)
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return
    }

    fetchHolidays(companyId, holidayYear)
    fetchLeaveTypes(companyId)
    fetchCompanyContext(companyId)
  }, [form.companyId, modalOpen, holidayYear])

  useEffect(() => {
    if (!viewModal) {
      return
    }

    const modal = viewModal

    async function loadViewModalData() {
      setViewLoading(true)
      setViewError('')

      try {
        const contextResponse = await api.get('/Policy/company-context', {
          params: { companyId: modal.companyId },
        })
        setViewCompanyContext(contextResponse.data)

        if (modal.type === 'holidays') {
          const holidayResponse = await api.get('/Holiday', {
            params: {
              companyId: modal.companyId,
              year: viewHolidayYear,
            },
          })

          setViewHolidays(
            (holidayResponse.data ?? []).map(
              (holiday: {
                id: number
                holidayDate: string
                holidayName: string
                description: string | null
              }) => ({
                id: holiday.id,
                holidayDate: holiday.holidayDate,
                holidayName: holiday.holidayName,
                description: holiday.description ?? '',
              })
            )
          )
        } else {
          const leaveResponse = await api.get('/LeaveType', {
            params: { companyId: modal.companyId },
          })

          setViewLeaveTypes(
            (leaveResponse.data ?? []).map(
              (leaveType: {
                id: number
                leaveTypeName: string
                description: string | null
                maxDaysAllowed: number
                isCarryForward: boolean
                maxCarryForward: number | null
              }) => ({
                id: leaveType.id,
                leaveTypeName: leaveType.leaveTypeName,
                description: leaveType.description ?? '',
                maxDaysAllowed: leaveType.maxDaysAllowed,
                isCarryForward: leaveType.isCarryForward,
                maxCarryForward: leaveType.maxCarryForward ?? '',
              })
            )
          )
        }
      } catch (error) {
        console.error('Failed to load policy view data', error)
        setViewError('Failed to load data for this company.')
        setViewHolidays([])
        setViewLeaveTypes([])
      } finally {
        setViewLoading(false)
      }
    }

    loadViewModalData()
  }, [viewModal, viewHolidayYear])

  function openHolidaysView(companyId: number) {
    setViewHolidayYear(new Date().getFullYear())
    setViewError('')
    setViewModal({ type: 'holidays', companyId })
  }

  function openLeavesView(companyId: number) {
    setViewError('')
    setViewModal({ type: 'leaves', companyId })
  }

  function closeViewModal() {
    setViewModal(null)
    setViewHolidays([])
    setViewLeaveTypes([])
    setViewCompanyContext(null)
    setViewError('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault()

    if (!isWorkPolicyComplete()) {
      setError(
        'Please complete Work Policy details before saving.'
      )
      setActiveTab('work')
      return
    }

    const leaveValidationError = validateLeaveTypesBeforeSave()
    if (leaveValidationError) {
      setError(leaveValidationError)
      setActiveTab('leave')
      return
    }

    try {
      setError('')

      if (editingPolicyId) {
        await api.put('/Policy/setup', {
          policy: {
            id: editingPolicyId,
            ...buildPolicyPayload(),
          },
          holidayYear,
          holidays: buildHolidayPayload(),
          leaveTypes: buildLeaveTypePayload(),
        })
      } else {
        await api.post('/Policy/setup', {
          policy: buildPolicyPayload(),
          holidayYear,
          holidays: buildHolidayPayload(),
          leaveTypes: buildLeaveTypePayload(),
        })
      }

      closeModal()
      fetchPolicies()
    } catch (error: unknown) {

      const axiosError = error as {
        response?: {
          data?: { message?: string }
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

<div className="act-toolbar">

  <div className="act-search-wrapper">
    <FiSearch className="act-search-icon" />

    <input
      className="act-search"
      type="text"
      placeholder="Search policy"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {hasPolicyAccess && (
    <button
      className="act-new-btn"
      onClick={openModal}
    >
      <FiPlus /> Policy
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
                <th>Holidays Calendar</th>
                <th>Leaves</th>
                <th className="table-action-col">Action</th>
              </tr>

            </thead>

            <tbody>

              {policies.length === 0 ? (

                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="act-empty"
                  >
                    No policies found.
                  </td>
                </tr>

              ) : (

                currentPolicies.map((policy) => (

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

                    <td>
                      <button
                        type="button"
                        className="policy-table-link"
                        onClick={() =>
                          openHolidaysView(policy.companyId)
                        }
                      >
                        Holidays
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="policy-table-link"
                        onClick={() =>
                          openLeavesView(policy.companyId)
                        }
                      >
                        Leaves
                      </button>
                    </td>

                    <td className="table-action-col">
                      <div className="table-action-group policy-table-actions">
                        <button
                          type="button"
                          className="table-action-btn"
                          title="View policy"
                          aria-label={`View policy for company ${policy.companyId}`}
                          onClick={() => handleView(policy)}
                        >
                          <FiEye />
                        </button>

                        {hasPolicyAccess && (
                          <button
                            type="button"
                            className="table-action-btn"
                            title="Edit policy"
                            aria-label={`Edit policy for company ${policy.companyId}`}
                            onClick={() => handleEdit(policy)}
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
              Showing {currentPolicies.length} of {' '}{policies.length}
            </div>

            <div className="pagination-controls">

              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev - 1
                  )
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
                  setCurrentPage(
                    (prev) => prev + 1
                  )
                }
              >
                &#8250;
              </button>

            </div>

          </div>

        </div>

        {modalOpen && (

          <div
            className="act-modal-overlay"
          >

            <div
              className="act-modal policy-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="act-modal-header">

                <h2>
                  {isViewMode
                    ? 'View Policy'
                    : editingPolicyId
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

              <div className="act-tabs policy-modal-tabs">
                <button
                  type="button"
                  className={`act-tab policy-modal-tab${
                    activeTab === 'work' ? ' act-tab--active active' : ''
                  }`}
                  onClick={() => handleTabClick('work')}
                >
                  Work Policy
                </button>

                <button
                  type="button"
                  className={`act-tab policy-modal-tab${
                    activeTab === 'holiday' ? ' act-tab--active active' : ''
                  }${canAccessTab('holiday') ? '' : ' locked'}`}
                  onClick={() => handleTabClick('holiday')}
                  aria-disabled={!canAccessTab('holiday')}
                >
                  Holiday Calendar
                </button>

                <button
                  type="button"
                  className={`act-tab policy-modal-tab${
                    activeTab === 'leave' ? ' act-tab--active active' : ''
                  }${canAccessTab('leave') ? '' : ' locked'}`}
                  onClick={() => handleTabClick('leave')}
                  aria-disabled={!canAccessTab('leave')}
                >
                  Leave Policy
                </button>
              </div>

              <form
                id="policy-form"
                className="act-modal-form policy-modal-form"
                onSubmit={handleSubmit}
              >
                {activeTab === 'work' && (
                  <div className="policy-modal-tab-panel">
                    {workTabMessage && !isViewMode && (
                      <div className="policy-tab-banner">
                        <div>
                          <strong>Next step: Holiday Calendar</strong>
                          {workTabMessage}
                        </div>
                      </div>
                    )}

                    <div className="act-form-row">
                      <label className="act-form-field">
                        <span>Company Id</span>
                        <input
                          type="number"
                          value={form.companyId}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              companyId: e.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="act-form-field">
                        <span>Work Hours</span>
                        <input
                          type="number"
                          step="0.1"
                          value={form.workHours}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              workHours: Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="act-form-row">
                      <label className="act-form-field">
                        <span>Halfday Threshold</span>
                        <input
                          type="number"
                          step="0.1"
                          value={form.halfdayThreshold}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              halfdayThreshold: Number(e.target.value),
                            }))
                          }
                        />
                      </label>

                      <label className="act-form-field">
                        <span>Work Days</span>
                        <input
                          type="text"
                          value={form.workDays}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              workDays: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="act-form-row">
                      <label className="act-form-field">
                        <span>Checkin Grace Period</span>
                        <input
                          type="number"
                          value={form.checkinGracePeriod}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              checkinGracePeriod: Number(e.target.value),
                            }))
                          }
                        />
                      </label>

                      <label className="act-form-field">
                        <span>Checkout Grace Period</span>
                        <input
                          type="number"
                          value={form.checkoutGracePeriod}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              checkoutGracePeriod: Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="act-form-row">
                      <label className="act-form-field">
                        <span>Shift Start</span>
                        <input
                          type="time"
                          value={form.shiftStart}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              shiftStart: e.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="act-form-field">
                        <span>Shift End</span>
                        <input
                          type="time"
                          value={form.shiftEnd}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              shiftEnd: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div className="act-form-row">
                      <label className="act-form-field">
                        <span>Regularisation Window (days)</span>
                        <input
                          type="number"
                          min={1}
                          value={form.regularizationWindowDays}
                          readOnly={isViewMode}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              regularizationWindowDays: Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'holiday' && (
                  <div className="policy-modal-tab-panel">
                    {!form.companyId && (
                      <div className="policy-tab-banner">
                        <div>
                          <strong>Company Id required</strong>
                          Enter a Company Id on the Work Policy tab to add and
                          save holidays.
                        </div>
                      </div>
                    )}

                    {holidayTabMessage && !isViewMode && (
                      <div className="policy-tab-banner">
                        <div>
                          <strong>Next step: Leave Policy</strong>
                          {holidayTabMessage}
                        </div>
                      </div>
                    )}

                    <HolidayInlineEditor
                      holidays={holidays}
                      onChange={setHolidays}
                      year={holidayYear}
                      onYearChange={setHolidayYear}
                      companyLabel={
                        companyContext?.companyName ??
                        (form.companyId
                          ? `Company ${form.companyId}`
                          : undefined)
                      }
                      timezone={companyContext?.timezone}
                      readOnly={isViewMode || !form.companyId}
                    />
                  </div>
                )}

                {activeTab === 'leave' && (
                  <div className="policy-modal-tab-panel">
                    <LeavePolicyInlineEditor
                      leaveTypes={leaveTypes}
                      onChange={setLeaveTypes}
                      readOnly={isViewMode}
                    />
                  </div>
                )}

                {error && (
                  <div className="form-error policy-modal-form-error">
                    {error}
                  </div>
                )}
              </form>

              <div className="policy-modal-actions">
                <button
                  type="button"
                  className="act-cancel-btn"
                  onClick={closeModal}
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>

                {!isViewMode && (
                <div className="policy-modal-actions-right">
                  {activeTab === 'holiday' && (
                    <button
                      type="button"
                      className="act-cancel-btn policy-step-btn"
                      onClick={() => setActiveTab('work')}
                    >
                      Back
                    </button>
                  )}

                  {activeTab === 'leave' && (
                    <button
                      type="button"
                      className="act-cancel-btn policy-step-btn"
                      onClick={() => setActiveTab('holiday')}
                    >
                      Back
                    </button>
                  )}

                  {activeTab === 'work' && !editingPolicyId && (
                    <button
                      type="button"
                      className="act-submit-btn policy-step-btn"
                      onClick={handleContinueToHoliday}
                    >
                      Continue to Holiday Calendar
                    </button>
                  )}

                  {activeTab === 'holiday' && !editingPolicyId && (
                    <button
                      type="button"
                      className="act-submit-btn policy-step-btn"
                      onClick={handleContinueToLeave}
                    >
                      Continue to Leave Policy
                    </button>
                  )}

                  {(activeTab === 'leave' || editingPolicyId) && (
                    <button
                      type="submit"
                      form="policy-form"
                      className="act-submit-btn policy-step-btn"
                    >
                      {editingPolicyId
                        ? 'Update Policy'
                        : 'Add Policy'}
                    </button>
                  )}
                </div>
                )}
              </div>

            </div>

          </div>

        )}

        {viewModal && (
          <div
            className="act-modal-overlay"
            onClick={closeViewModal}
          >
            <div
              className="act-modal policy-view-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="act-modal-header">
                <h2>
                  {viewModal.type === 'holidays'
                    ? 'Holiday Calendar'
                    : 'Leave Policy'}
                  {' — '}
                  {viewCompanyContext?.companyName ??
                    `Company ${viewModal.companyId}`}
                </h2>
                <button
                  type="button"
                  className="act-modal-close"
                  onClick={closeViewModal}
                >
                  &times;
                </button>
              </div>

              <div className="policy-modal-tab-panel">
                {viewLoading && (
                  <p className="policy-view-loading">Loading...</p>
                )}

                {viewError && (
                  <div className="form-error">{viewError}</div>
                )}

                {viewModal.type === 'holidays' && !viewLoading && !viewError && (
                  <HolidayInlineEditor
                    readOnly
                    holidays={viewHolidays}
                    onChange={() => {}}
                    year={viewHolidayYear}
                    onYearChange={setViewHolidayYear}
                    companyLabel={viewCompanyContext?.companyName}
                    timezone={viewCompanyContext?.timezone}
                  />
                )}

                {viewModal.type === 'leaves' && !viewLoading && !viewError && (
                  <LeavePolicyInlineEditor
                    readOnly
                    leaveTypes={viewLeaveTypes}
                    onChange={() => {}}
                  />
                )}
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
        )}

      </div>

    </Layout>
  )
}