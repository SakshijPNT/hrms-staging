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
}

export default function HolidayInlineEditor({
  holidays,
  onChange,
  readOnly = false,
}: HolidayInlineEditorProps) {
  function addRow() {
    onChange([
      ...holidays,
      { holidayDate: '', holidayName: '', description: '' },
    ])
  }

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

  return (
    <div className="holiday-inline-editor">
      <div className="holiday-inline-header">
        <h3>Holidays</h3>
        {!readOnly && (
          <button
            type="button"
            className="act-new-btn holiday-add-btn"
            onClick={addRow}
          >
            + Holiday
          </button>
        )}
      </div>

      {holidays.length === 0 ? (
        <p className="holiday-inline-empty">
          No holidays added yet.
        </p>
      ) : (
        holidays.map((holiday, index) => (
          <div key={holiday.id ?? `new-${index}`} className="holiday-inline-row">
            <label className="act-form-field">
              <span>Date</span>
              <input
                type="date"
                value={holiday.holidayDate}
                disabled={readOnly || Boolean(holiday.id)}
                onChange={(e) =>
                  updateRow(index, 'holidayDate', e.target.value)
                }
              />
            </label>

            <label className="act-form-field">
              <span>Name</span>
              <input
                type="text"
                value={holiday.holidayName}
                disabled={readOnly}
                onChange={(e) =>
                  updateRow(index, 'holidayName', e.target.value)
                }
              />
            </label>

            <label className="act-form-field">
              <span>Description</span>
              <input
                type="text"
                value={holiday.description}
                disabled={readOnly}
                onChange={(e) =>
                  updateRow(index, 'description', e.target.value)
                }
              />
            </label>

            {!readOnly && (
              <button
                type="button"
                className="act-cancel-btn holiday-remove-btn"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}
