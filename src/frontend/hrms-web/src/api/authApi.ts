import { httpClient } from './httpClient'
import type { AuthResponse, LoginPayload } from '../types/hrms'

export async function login(payload: LoginPayload) {
  const response = await httpClient.post<AuthResponse>('/auth/login', payload)
  return response.data
}