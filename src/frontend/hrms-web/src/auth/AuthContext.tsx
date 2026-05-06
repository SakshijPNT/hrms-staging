import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/authApi'
import {
  clearStoredSession,
  getStoredSession,
  isSessionExpired,
  setStoredSession,
} from './tokenStorage'
import type { AuthResponse, LoginPayload, StoredSession } from '../types/hrms'

interface AuthContextValue {
  session: StoredSession | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const storedSession = getStoredSession()
    if (storedSession && !isSessionExpired(storedSession.expiresAtUtc)) {
      setSession(storedSession)
    } else {
      clearStoredSession()
    }

    setIsBootstrapping(false)
  }, [])

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload)
    const nextSession: StoredSession = {
      token: response.token,
      expiresAtUtc: response.expiresAtUtc,
      user: response.user,
    }

    setStoredSession(nextSession)
    setSession(nextSession)
    return response
  }

  function logout() {
    clearStoredSession()
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isBootstrapping,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}