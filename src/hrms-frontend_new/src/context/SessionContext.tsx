import { createContext, useContext } from 'react'
import type { SessionInfo } from '../../types/auth'

const SessionContext = createContext<SessionInfo | null>(null)

export function useSession(): SessionInfo {
  const session = useContext(SessionContext)

  if (!session) {
    throw new Error('useSession must be used within Layout')
  }

  return session
}

export default SessionContext
