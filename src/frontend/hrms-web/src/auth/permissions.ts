import type { AuthenticatedUser } from '../types/hrms'

const pathToActivityCodes: Record<string, string[]> = {
  '/dashboard': ['A9', 'DASHBOARD'],
  '/users': ['A3'],
  '/my-reportees': ['A4'],
  '/requests': ['A5'],
  '/approvals': ['A6'],
  '/my-leaves': ['A7'],
  '/reports': ['A8'],
  '/activities': ['A2'],
  '/roles': ['A2'],
  '/settings': ['A1'],
}

const legacyCodeExpansion: Record<string, string[]> = {
  USER_MANAGEMENT: ['A3', 'A4'],
  REQUEST_APPROVAL: ['A5', 'A6', 'A7'],
  REPORTS: ['A8', 'A9'],
  ROLE_MANAGEMENT: ['A1', 'A2'],
  SETTINGS_VIEW: ['A1'],
  SETTINGS_EDIT: ['A1'],
  ROLE_VIEW: ['A2'],
  ROLE_EDIT: ['A2'],
  USERS_MANAGE: ['A3'],
  REPORTEES_VIEW: ['A4'],
  REQUEST_VIEW: ['A5'],
  REQUEST_MANAGE: ['A5'],
  APPROVAL_VIEW: ['A6'],
  APPROVAL_MANAGE: ['A6'],
  MY_LEAVES_VIEW: ['A7'],
  MY_LEAVES_MANAGE: ['A7'],
  REPORTS_VIEW: ['A8'],
  REPORTS_EDIT: ['A8'],
}

function buildNormalizedCodeSet(rawCodes: string[] | undefined) {
  const normalized = new Set((rawCodes ?? []).map((code) => code.toUpperCase()))

  for (const code of Array.from(normalized)) {
    const expanded = legacyCodeExpansion[code]
    if (expanded) {
      for (const nextCode of expanded) {
        normalized.add(nextCode)
      }
    }
  }

  return normalized
}

function normalizePath(path: string) {
  if (!path || path === '/') {
    return '/dashboard'
  }

  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
}

export function canAccessPath(user: AuthenticatedUser | undefined, path: string) {
  if (!user) {
    return false
  }

  const normalizedRole = user.role.trim().toLowerCase()
  if (normalizedRole === 'admin' || normalizedRole.includes('admin')) {
    return true
  }

  const normalizedPath = normalizePath(path)
  if (normalizedPath === '/profile') {
    return true
  }

  const requiredCodes = pathToActivityCodes[normalizedPath]
  if (!requiredCodes || requiredCodes.length === 0) {
    return false
  }

  const normalizedUserCodes = buildNormalizedCodeSet(user.assignedActivityCodes)
  return requiredCodes.some((code) => normalizedUserCodes.has(code))
}
