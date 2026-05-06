import { httpClient } from './httpClient'
import type { CompanyUser, CreateCompanyUserPayload, UpdateCompanyUserPayload } from '../types/hrms'

export async function getUsers() {
  const response = await httpClient.get<CompanyUser[]>('/users')
  return response.data
}

export async function createUser(payload: CreateCompanyUserPayload) {
  const response = await httpClient.post<CompanyUser>('/users', payload)
  return response.data
}

export async function updateUser(userId: string, payload: UpdateCompanyUserPayload) {
  const response = await httpClient.put<CompanyUser>(`/users/${userId}`, payload)
  return response.data
}

export async function updateUserRole(userId: string, roleName: string) {
  const response = await httpClient.put<CompanyUser>(`/users/${userId}/role`, { roleName })
  return response.data
}

export async function setUserActive(userId: string, isActive: boolean) {
  const response = await httpClient.patch<CompanyUser>(`/users/${userId}/status`, { isActive })
  return response.data
}

export async function setUserEditable(userId: string, isEditable: boolean) {
  const response = await httpClient.patch<CompanyUser>(`/users/${userId}/editable`, { isEditable })
  return response.data
}
