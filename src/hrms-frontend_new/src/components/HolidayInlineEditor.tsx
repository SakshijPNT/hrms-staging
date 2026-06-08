import { FiPlus, FiTrash2 } from 'react-icons/fi'
import '../styles/Style.css'

export interface HolidayRow {
  id?: number
  holidayDate: string
  holidayName: string
  description: string
}

interface HolidayInlineEditorProps {
  holidays: HolidayRow[]
  onChange: (holidays: HolidayRow[]) => void
  readOnly?: boolean
  year?: number
  onYearChange?: (year: number) => void
  companyLabel?: string
  timezone?: string
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}-${month}-${year}`
}

function getDayName(isoDate: string): string {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return DAY_NAMES[date.getDay()]
}

function buildYearOptions(baseYear: number): number[] {
  const years: number[] = []
  for (let offset = -1; offset <= 2; offset += 1) {
    years.push(baseYear + offset)
  }
  return years
}

function isPastHoliday(isoDate: string): boolean {
  if (!isoDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const holidayDate = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(holidayDate.getTime())) return false
  return holidayDate < today
}

const emptyRow = (): HolidayRow => ({
  holidayDate: '',
  holidayName: '',
  description: '',
})

export default function HolidayInlineEditor({
  holidays,
  onChange,
  readOnly = false,
  year,
  onYearChange,
  companyLabel,
  timezone,
}: HolidayInlineEditorProps) {
  const currentYear = new Date().getFullYear()
  const selectedYear = year ?? currentYear
  const yearOptions = buildYearOptions(currentYear)

  const subtitle = companyLabel
    ? `Holiday List – ${selectedYear} for ${companyLabel}${
        timezone ? ` (${timezone})` : ''
      }`
    : `Holiday List – ${selectedYear}${
        timezone ? ` (${timezone})` : ''
      }`

  const yearDateMin = `${selectedYear}-01-01`
  const yearDateMax = `${selectedYear}-12-31`

  function updateRow(
    index: number,
    field: keyof HolidayRow,
    value: string
  ) {
    onChange(
      holidays.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    )
  }

  function removeRow(index: number) {
    onChange(holidays.filter((_, rowIndex) => rowIndex !== index))
  }

  function addRow() {
    onChange([...holidays, emptyRow()])
  }

  const sortedHolidays = [...holidays]
    .map((holiday, index) => ({ holiday, index }))
    .sort((a, b) => {
      if (!a.holiday.holidayDate) return 1
      if (!b.holiday.holidayDate) return -1
      return a.holiday.holidayDate.localeCompare(b.holiday.holidayDate)
    })

  return (
    <div className="holiday-calendar-section">
      <div className="holiday-calendar-header">
        <div>
          <h3 className="act-form-section-title">Holiday Calendar</h3>
          <p className="holiday-calendar-subtitle">{subtitle}</p>
        </div>

        <div className="holiday-calendar-header-actions">
          {onYearChange && (
            <label className="holiday-year-field">
              <span>Year</span>
              <select
                value={selectedYear}
                disabled={readOnly && !onYearChange}
                onChange={(e) =>
                  onYearChange(Number(e.target.value))
                }
              >
                {yearOptions.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!readOnly && (
            <button
              type="button"
              className="leave-policy-add-btn"
              onClick={addRow}
              title="Add holiday row"
            >
              <FiPlus />
            </button>
          )}
        </div>
      </div>

      <div className="holiday-calendar-table-wrap">
        <table className="holiday-calendar-table">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Holiday</th>
              <th>Date</th>
              <th>Day</th>
              {!readOnly && <th aria-label="Remove holiday" />}
            </tr>
          </thead>

          <tbody>
            {holidays.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="holiday-calendar-empty">
                  {readOnly
                    ? `No holidays for ${selectedYear}.`
                    : 'No holidays yet. Click + to add a row.'}
                </td>
              </tr>
            )}

            {sortedHolidays.map(({ holiday, index: sourceIndex }, displayIndex) => {
              const isSaved = Boolean(holiday.id)
              const isPast = isPastHoliday(holiday.holidayDate)

              return (
                <tr key={holiday.id ?? `row-${sourceIndex}`}>
                  <td>{displayIndex + 1}</td>
                  <td>
                    {readOnly ? (
                      holiday.holidayName
                    ) : (
                      <input
                        type="text"
                        className="holiday-calendar-input"
                        value={holiday.holidayName}
                        placeholder="Holiday name"
                        onChange={(e) =>
                          updateRow(
                            sourceIndex,
                            'holidayName',
                            e.target.value
                          )
                        }
                      />
                    )}
                  </td>
                  <td>
                    {readOnly || isSaved ? (
                      formatDisplayDate(holiday.holidayDate)
                    ) : (
                      <input
                        type="date"
                        className="holiday-calendar-input"
                        value={holiday.holidayDate}
                        min={yearDateMin}
                        max={yearDateMax}
                        onChange={(e) =>
                          updateRow(
                            sourceIndex,
                            'holidayDate',
                            e.target.value
                          )
                        }
                      />
                    )}
                  </td>
                  <td>{getDayName(holiday.holidayDate)}</td>
                  {!readOnly && (
                    <td className="holiday-calendar-actions">
                      <button
                        type="button"
                        className="holiday-calendar-remove"
                        title={
                          isPast
                            ? 'Past holidays cannot be removed'
                            : 'Remove holiday'
                        }
                        disabled={isPast}
                        onClick={() => removeRow(sourceIndex)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <p className="holiday-calendar-hint">
          Click + to add a row. Past holidays can be renamed but not removed.
        </p>
      )}
    </div>
  )
}
