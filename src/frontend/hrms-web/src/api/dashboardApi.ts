import { httpClient } from './httpClient'
import type { DashboardSummary } from '../types/hrms'

export async function getDashboardSummary() {
  const response = await httpClient.get<DashboardSummary>('/dashboard/summary')
  return response.data
}