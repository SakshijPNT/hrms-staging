import { httpClient } from './httpClient'
import type { AttendanceRecord } from '../types/hrms'

export async function getAttendance() {
  const response = await httpClient.get<AttendanceRecord[]>('/attendance')
  return response.data
}

export async function checkInAttendance() {
  const response = await httpClient.post<AttendanceRecord>('/attendance/check-in')
  return response.data
}

export async function checkOutAttendance() {
  const response = await httpClient.post<AttendanceRecord>('/attendance/check-out')
  return response.data
}