export type RegularizationCorrectionType =
  | 'FULL_DAY'
  | 'HALF_DAY'
  | 'SHORT_DAY'
  | 'FORGOT_CHECK_IN'
  | 'FORGOT_CHECK_OUT'

export interface RegularizationPreview {
  logDate: string
  attendanceLogId: number | null
  originalAttendanceStatus: string | null
  originalCheckInTime: string | null
  originalCheckOutTime: string | null
  workedMinutes: number | null
  canSubmit: boolean
  blockReason: string | null
  allowedCorrectionTypes: string[]
}

export interface RegularizationApplication {
  id: number
  logDate: string
  originalAttendanceStatus: string
  requestedCorrectionType: string
  session?: string | null
  originalCheckInTime: string | null
  originalCheckOutTime: string | null
  requestedCheckInTime: string | null
  requestedCheckOutTime: string | null
  reason: string
  approvalStatus: string
  approvedBy: number | null
  approverEmailId: string | null
  approvedOn: string | null
  approverRemark: string | null
  reviewChannel?: string | null
  createdOn: string
}

export interface ManagerRegularizationApplication
  extends RegularizationApplication {
  userId: number
  employeeName: string
  employeeEmail: string
}

export interface AdminRegularizationQueueItem
  extends ManagerRegularizationApplication {
  managerId: number | null
  managerName: string | null
  managerEmail: string | null
  pendingDays: number
  isOverdue: boolean
  isNoApprover: boolean
  adminCanAct: boolean
}

export interface AdminManualCorrectionResult {
  id: number
  userId: number
  logDate: string
  attendanceLogId: number | null
  requestedCorrectionType: string
  session?: string | null
  reason: string
  createdOn: string
}

export interface CreateAdminManualCorrectionPayload {
  userId: number
  logDate: string
  requestedCorrectionType: RegularizationCorrectionType
  reason: string
  session?: string
  requestedCheckInTime?: string
  requestedCheckOutTime?: string
}

export interface CreateRegularizationPayload {
  logDate: string
  requestedCorrectionType: RegularizationCorrectionType
  reason: string
  session?: string
  requestedCheckInTime?: string
  requestedCheckOutTime?: string
}

export function formatCorrectionTypeLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
