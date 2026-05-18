export interface AuthenticatedUser { //“Data will come in this format”
  id: string
  EmailId: string
  fullName: string
  role: string
  employeeCode: string
  assignedActivityCodes: string[]
  dateOfJoining?: string
}

export interface AuthResponse {
  token: string
  expiresAtUtc: string
  user: AuthenticatedUser
}

export interface LoginPayload {
  EmailId: string
  password: string
}

export interface DashboardSummary {
  totalEmployees: number
  pendingRequests: number
  approvedRequests: number
  presentToday: number
  currentUser: AuthenticatedUser
  recentRequests: EmployeeRequest[]
}

export interface AttendanceRecord {
  id: string
  employeeName: string
  employeeCode: string
  workDate: string
  checkInUtc: string | null
  checkOutUtc: string | null
  status: string
  notes: string
}

export interface EmployeeRequest {
  id: string
  employeeName: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
  submittedAtUtc: string
}

export interface CreateRequestPayload {
  title: string
  description: string
  startDate: string
  endDate: string
}

export interface Activity {
  id: string
  name: string
  code: string
  description: string
  type: string
  moduleCode: string
  moduleName: string  
  assignedRoleCount: number
}

export interface ActivityLookup {
  id: string
  name: string
  code: string
}

export interface CreateActivityPayload {
  name: string
  code: string
  description: string
  type: string
  moduleCode: string
  moduleName: string
}

export interface RoleManagementItem {
  id: string
  name: string
  description: string
  activities: ActivityLookup[]
}

export interface Permission {
  id: string
  activityId: string
  activityName: string
  activityCode: string
  permissionName: string
  permissionType: 'View' | 'Edit'
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  permissionName: string
  permissionType: 'View' | 'Edit'
  activityName: string
  activityCode: string
}

export interface CreateRolePayload {
  name: string
  description: string
  activityIds: string[]
}

export interface CompanyUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  EmailId: string
  employeeCode: string
  department: string
  jobTitle: string
  phoneNumber: string
  roleName: string
  assignedActivities: string[]
  isActive: boolean
  isEditable: boolean
  dateOfJoining: string
}

export interface CreateCompanyUserPayload {
  EmailId: string
  firstName: string
  lastName: string
  department: string
  jobTitle: string
  phoneNumber: string
  dateOfJoining: string
  roleName: string
}

export interface UpdateCompanyUserPayload {
  EmailId: string
  firstName: string
  lastName: string
  employeeCode: string
  department: string
  jobTitle: string
  phoneNumber: string
  dateOfJoining: string
  roleName: string
}

export interface EmployeeProfile {
  userId: string
  fullName: string
  EmailId: string
  role: string
  employeeCode: string
  department: string
  jobTitle: string
  phoneNumber: string
  dateOfJoining: string
}

export interface StoredSession {
  token: string
  expiresAtUtc: string
  user: AuthenticatedUser
}