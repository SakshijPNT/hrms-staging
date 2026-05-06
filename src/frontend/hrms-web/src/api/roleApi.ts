import { httpClient } from './httpClient'
import type { CreateRolePayload, Permission, RoleManagementItem, RolePermission } from '../types/hrms'

export async function getRoles() {
  const response = await httpClient.get<RoleManagementItem[]>('/roles')
  return response.data
}

export async function createRole(payload: CreateRolePayload) {
  const response = await httpClient.post<RoleManagementItem>('/roles', payload)
  return response.data
}

export async function updateRoleActivities(roleId: string, activityIds: string[]) {
  const response = await httpClient.put<RoleManagementItem>(`/roles/${roleId}/activities`, { activityIds })
  return response.data
}

export async function getAllPermissions() {
  const response = await httpClient.get<Permission[]>('/permissions')
  return response.data
}

export async function getRolePermissions(roleId: string) {
  const response = await httpClient.get<RolePermission[]>(`/permissions/role/${roleId}`)
  return response.data
}

export async function assignRolePermissions(roleId: string, permissionIds: string[]) {
  const response = await httpClient.put<RolePermission[]>(`/permissions/role/${roleId}`, { permissionIds })
  return response.data
}
