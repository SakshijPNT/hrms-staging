export interface RegularizationPreview {
  logDate: string
  originalCheckInTime: string | null
  originalCheckOutTime: string | null
  attendanceLogId: number | null
  canSubmit: boolean
  blockReason: string | null
}

export interface RegularizationApplication {
  id: number
  logDate: string
  originalCheckInTime: string | null
  originalCheckOutTime: string | null
  requestedCheckInTime: string
  requestedCheckOutTime: string
  reason: string
  approvalStatus: string
  approvedBy: number | null
  approverEmailId: string | null
  approvedOn: string | null
  approverRemark: string | null
  createdOn: string
}

export interface ManagerRegularizationApplication
  extends RegularizationApplication {
  userId: number
  employeeName: string
  employeeEmail: string
}

export interface CreateRegularizationPayload {
  logDate: string
  requestedCheckInTime: string
  requestedCheckOutTime: string
  reason: string
}
