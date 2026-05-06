import { useState } from 'react'

interface Holiday {
  id: number
  name: string
  date: string
  type: 'National' | 'Optional' | 'Restricted'
}

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 1, name: 'Republic Day', date: '2026-01-26', type: 'National' },
  { id: 2, name: 'Holi', date: '2026-03-03', type: 'National' },
  { id: 3, name: 'Good Friday', date: '2026-04-03', type: 'National' },
  { id: 4, name: 'Eid ul-Fitr', date: '2026-04-21', type: 'National' },
  { id: 5, name: 'Independence Day', date: '2026-08-15', type: 'National' },
  { id: 6, name: 'Gandhi Jayanti', date: '2026-10-02', type: 'National' },
  { id: 7, name: 'Dussehra', date: '2026-10-21', type: 'National' },
  { id: 8, name: 'Diwali', date: '2026-11-08', type: 'National' },
  { id: 9, name: 'Christmas', date: '2026-12-25', type: 'National' },
]

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_WEEKLY_OFF = ['Saturday', 'Sunday']

function formatHolidayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function SettingsPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS)
  const [weeklyOff, setWeeklyOff] = useState<string[]>(DEFAULT_WEEKLY_OFF)
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'National' as Holiday['type'] })
  const [addError, setAddError] = useState('')
  const [saved, setSaved] = useState(false)

  function toggleDay(day: string) {
    setWeeklyOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
    setSaved(false)
  }

  function handleAddHoliday() {
    if (!newHoliday.name.trim() || !newHoliday.date) {
      setAddError('Name and date are required.')
      return
    }
    setHolidays((prev) => [
      ...prev,
      { id: Date.now(), name: newHoliday.name.trim(), date: newHoliday.date, type: newHoliday.type },
    ])
    setNewHoliday({ name: '', date: '', type: 'National' })
    setAddError('')
    setShowAddHoliday(false)
    setSaved(false)
  }

  function handleDeleteHoliday(id: number) {
    setHolidays((prev) => prev.filter((h) => h.id !== id))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
  }

  return (
    <section className="settings-page">
      <header className="settings-topbar">
        <h1 className="settings-kicker">SETTINGS</h1>
      </header>

      {/* Holiday Calendar */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Holiday Calendar</h2>
            <p className="settings-card-sub">Manage official and optional holidays for the organisation.</p>
          </div>
          <button
            className="settings-add-btn"
            onClick={() => { setShowAddHoliday(true); setAddError('') }}
          >
            + Add Holiday
          </button>
        </div>

        {showAddHoliday && (
          <div className="settings-inline-form">
            <div className="settings-form-row">
              <label className="settings-form-field">
                <span>Holiday Name *</span>
                <input
                  type="text"
                  placeholder="e.g. Diwali"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label className="settings-form-field">
                <span>Date *</span>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
              <label className="settings-form-field">
                <span>Type</span>
                <select
                  value={newHoliday.type}
                  onChange={(e) => setNewHoliday((p) => ({ ...p, type: e.target.value as Holiday['type'] }))}
                >
                  <option value="National">National</option>
                  <option value="Optional">Optional</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </label>
            </div>
            {addError && <p className="settings-form-error">{addError}</p>}
            <div className="settings-form-actions">
              <button className="settings-cancel-btn" onClick={() => setShowAddHoliday(false)}>Cancel</button>
              <button className="settings-save-btn" onClick={handleAddHoliday}>Add</button>
            </div>
          </div>
        )}

        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>HOLIDAY</th>
                <th>DATE</th>
                <th>TYPE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="settings-empty">No holidays configured.</td>
                </tr>
              ) : (
                holidays
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday, index) => (
                    <tr key={holiday.id}>
                      <td className="settings-serial">{index + 1}</td>
                      <td><strong>{holiday.name}</strong></td>
                      <td>{formatHolidayDate(holiday.date)}</td>
                      <td>
                        <span className={`settings-type-pill type-${holiday.type.toLowerCase()}`}>
                          {holiday.type}
                        </span>
                      </td>
                      <td>
                        <button
                          className="settings-delete-btn"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          aria-label={`Delete ${holiday.name}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Weekly Off */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Weekly Off</h2>
            <p className="settings-card-sub">Select the days that are non-working days for the organisation.</p>
          </div>
        </div>

        <div className="settings-day-grid">
          {ALL_DAYS.map((day) => {
            const isOff = weeklyOff.includes(day)
            return (
              <button
                key={day}
                type="button"
                className={`settings-day-chip ${isOff ? 'day-off' : 'day-working'}`}
                onClick={() => toggleDay(day)}
              >
                <span className="settings-day-label">{day.slice(0, 3).toUpperCase()}</span>
                <span className="settings-day-status">{isOff ? 'Off' : 'Working'}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="settings-footer">
        <button className="settings-save-btn settings-save-main" onClick={handleSave}>
          Save Changes
        </button>
        {saved && <span className="settings-saved-msg">✓ Changes saved</span>}
      </div>
    </section>
  )
}
