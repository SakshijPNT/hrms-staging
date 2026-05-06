import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <div className="route-loader">Preparing your workspace...</div>
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}