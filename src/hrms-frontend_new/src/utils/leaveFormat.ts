export type SubLeaveType = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF'

export const SUB_LEAVE_TYPE_OPTIONS: {
  value: SubLeaveType
  label: string
}[] = [
  { value: 'FULL_DAY', label: 'Full Day' },
  { value: 'FIRST_HALF', label: 'Half Day - First Half' },
  { value: 'SECOND_HALF', label: 'Half Day - Second Half' },
]

export function isHalfDayLeave(subLeaveType: SubLeaveType) {
  return subLeaveType !== 'FULL_DAY'
}

export function sessionFromSubLeaveType(
  subLeaveType: SubLeaveType,
): string | null {
  if (subLeaveType === 'FIRST_HALF') {
    return 'FIRST_HALF'
  }

  if (subLeaveType === 'SECOND_HALF') {
    return 'SECOND_HALF'
  }

  return null
}

export function subLeaveTypeFromApi(
  isHalfDay: boolean,
  session: string | null,
): SubLeaveType {
  if (!isHalfDay) {
    return 'FULL_DAY'
  }

  if (session === 'SECOND_HALF') {
    return 'SECOND_HALF'
  }

  return 'FIRST_HALF'
}

export function formatSubLeaveType(
  isHalfDay: boolean,
  session: string | null,
): string {
  const option = SUB_LEAVE_TYPE_OPTIONS.find(
    (item) => item.value === subLeaveTypeFromApi(isHalfDay, session),
  )

  return option?.label ?? 'Full Day'
}
