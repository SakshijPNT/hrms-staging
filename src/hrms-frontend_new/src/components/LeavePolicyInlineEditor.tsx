import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Select from 'react-select'
import '../styles/Style.css'

export interface LeaveTypeRow {
  id?: number
  leaveTypeName: string
  maxDaysAllowed: number
  isCarryForward: boolean
  maxCarryForward: number | ''
  description: string
}

interface LeavePolicyInlineEditorProps {
  leaveTypes: LeaveTypeRow[]
  onChange: (rows: LeaveTypeRow[]) => void
  readOnly?: boolean
}

const CARRY_FORWARD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
]

const emptyRow = (): LeaveTypeRow => ({
  leaveTypeName: '',
  maxDaysAllowed: 0,
  isCarryForward: false,
  maxCarryForward: '',
  description: '',
})

export default function LeavePolicyInlineEditor({
  leaveTypes,
  onChange,
  readOnly = false,
}: LeavePolicyInlineEditorProps) {
  function updateRow(
    index: number,
    field: keyof LeaveTypeRow,
    value: string | number | boolean
  ) {
    onChange(
      leaveTypes.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row
        }

        const updated = { ...row, [field]: value }

        if (field === 'isCarryForward' && value === false) {
          updated.maxCarryForward = ''
        }

        return updated
      })
    )
  }

  function removeRow(index: number) {
    onChange(leaveTypes.filter((_, rowIndex) => rowIndex !== index))
  }

  function addRow() {
    onChange([...leaveTypes, emptyRow()])
  }

  return (
    <div className="leave-policy-section">
      <div className="leave-policy-header">
        <div>
          <h3 className="act-form-section-title">Leave Types</h3>
          <p className="leave-policy-subtitle">
            Define leave types, annual limits, and carry-forward rules for this
            company.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="leave-policy-add-btn"
            onClick={addRow}
            title="Add leave type row"
          >
            <FiPlus />
          </button>
        )}
      </div>

      <div className="holiday-calendar-table-wrap">
        <table className="holiday-calendar-table leave-policy-table">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Leave Type</th>
              <th>Max Days / Year</th>
              <th>Carry Forward</th>
              <th>Max Carry Forward Days/ Accumulation</th>
              <th>Description</th>
              {!readOnly && <th aria-label="Remove leave type" />}
            </tr>
          </thead>
          <tbody>
            {leaveTypes.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="holiday-calendar-empty">
                  {readOnly
                    ? 'No leave types configured.'
                    : 'No leave types yet. Click + to add a row.'}
                </td>
              </tr>
            )}

            {leaveTypes.map((row, index) => (
              <tr key={row.id ?? `leave-${index}`}>
                <td>{index + 1}</td>
                <td>
                  {readOnly ? (
                    row.leaveTypeName
                  ) : (
                    <input
                      type="text"
                      className="holiday-calendar-input"
                      value={row.leaveTypeName}
                      placeholder="e.g. Casual Leave"
                      onChange={(e) =>
                        updateRow(index, 'leaveTypeName', e.target.value)
                      }
                    />
                  )}
                </td>
                <td>
                  {readOnly ? (
                    row.maxDaysAllowed
                  ) : (
                    <input
                      type="number"
                      min={1}
                      className="holiday-calendar-input"
                      value={row.maxDaysAllowed || ''}
                      placeholder="12"
                      onChange={(e) =>
                        updateRow(
                          index,
                          'maxDaysAllowed',
                          Number(e.target.value)
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  {readOnly ? (
                    row.isCarryForward ? 'Yes' : 'No'
                  ) : (
                    <Select
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      menuShouldScrollIntoView={false}
                      classNamePrefix="act-select"
                      isSearchable={false}
                      options={CARRY_FORWARD_OPTIONS}
                      value={
                        CARRY_FORWARD_OPTIONS.find(
                          (option) =>
                            option.value ===
                            (row.isCarryForward ? 'yes' : 'no')
                        ) ?? null
                      }
                      onChange={(selected) =>
                        updateRow(
                          index,
                          'isCarryForward',
                          selected?.value === 'yes'
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  {readOnly ? (
                    row.isCarryForward ? row.maxCarryForward || '—' : '—'
                  ) : (
                    <input
                      type="number"
                      min={0}
                      className="holiday-calendar-input"
                      value={row.maxCarryForward}
                      disabled={!row.isCarryForward}
                      placeholder={row.isCarryForward ? '6' : ''}
                      onChange={(e) =>
                        updateRow(
                          index,
                          'maxCarryForward',
                          e.target.value === ''
                            ? ''
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  {readOnly ? (
                    row.description || '—'
                  ) : (
                    <input
                      type="text"
                      className="holiday-calendar-input"
                      value={row.description}
                      placeholder="Optional"
                      onChange={(e) =>
                        updateRow(index, 'description', e.target.value)
                      }
                    />
                  )}
                </td>
                {!readOnly && (
                  <td className="holiday-calendar-actions">
                    <button
                      type="button"
                      className="holiday-calendar-remove"
                      title="Remove leave type"
                      onClick={() => removeRow(index)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <p className="holiday-calendar-hint">
          Click the + button to add a row, then fill in leave type details.
        </p>
      )}
    </div>
  )
}
