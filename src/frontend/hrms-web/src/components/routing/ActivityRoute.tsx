import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { canAccessPath } from '../../auth/permissions'

export function ActivityRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { session } = useAuth()

  if (!canAccessPath(session?.user, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
