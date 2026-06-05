import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

interface PublicRouteProps {
  children: React.ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const [status, setStatus] = useState<'loading' | 'guest' | 'authenticated'>('loading')

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
          setStatus('guest')
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

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}