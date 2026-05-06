import { httpClient } from './httpClient'
import type { CreateRequestPayload, EmployeeRequest } from '../types/hrms'

export async function getRequests() {
  const response = await httpClient.get<EmployeeRequest[]>('/requests')
  return response.data
}

export async function getMyRequests() {
  const response = await httpClient.get<EmployeeRequest[]>('/requests/my')
  return response.data
}

export async function createRequest(payload: CreateRequestPayload) {
  const response = await httpClient.post<EmployeeRequest>('/requests', payload)
  return response.data
}