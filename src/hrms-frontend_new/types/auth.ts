export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface LoginResponse {
  message: string;
}

export interface SessionInfo {
  userId: number
  fullName: string
  emailId: string
  companyId: number
  companyName: string
  roleId: number
  roleName: string
  timezone: string
}

export interface ModuleItem {
  id: number
  moduleName: string
  description?: string
  iconUrl?: string
}

export interface ModuleGroup {
  groupId: number
  groupName: string
  modules: ModuleItem[]
}