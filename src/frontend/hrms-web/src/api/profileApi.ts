import { httpClient } from './httpClient'
import type { EmployeeProfile } from '../types/hrms'

export async function getMyProfile() {
  const response = await httpClient.get<EmployeeProfile>('/profile/me')
  return response.data
}