import type { StoredSession } from '../types/hrms'

const SESSION_STORAGE_KEY = 'pnthr-hrms-session'

export function getStoredSession(): StoredSession | null {
  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredSession
  } catch {
    clearStoredSession()
    return null
  }
}

export function setStoredSession(session: StoredSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function isSessionExpired(expiresAtUtc: string) {
  return new Date(expiresAtUtc).getTime() <= Date.now()
}