import { httpClient } from './httpClient'
import type { Activity, CreateActivityPayload } from '../types/hrms'

export async function getActivities() {
  const response = await httpClient.get<Activity[]>('/activities')
  return response.data
}

export async function createActivity(payload: CreateActivityPayload) {
  const response = await httpClient.post<Activity>('/activities', payload)
  return response.data
}

export async function updateActivity(
  activityId: string,
  payload: Omit<CreateActivityPayload, 'code'>,
) {
  const response = await httpClient.put<Activity>(`/activities/${activityId}`, payload)
  return response.data
}