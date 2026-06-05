import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        await api.get('/auth/session')
        if (!cancelled) {
          setStatus('authenticated')
        }
      } catch {
        if (!cancelled) {
          setStatus('unauthenticated')
        }
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}