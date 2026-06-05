import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import '../styles/Style.css'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

import api from '../services/api'

import type {
  SessionInfo,
  ModuleGroup,
} from '../../types/auth' 
 

interface LayoutProps {
  title: string
  children: React.ReactNode
}




/*interface ModuleItem {
  id: number
  moduleName: string
  description?: string
  iconUrl?: string
}

interface ModuleGroup {
  groupId: number
  groupName: string
  modules: ModuleItem[]
}*/

export default function Layout({
  title,
  children,
}: LayoutProps) {

  // SESSION
  const [session, setSession] =
    useState<SessionInfo | null>(null)

  // MODULE GROUPS
  const [groups, setGroups] =
    useState<ModuleGroup[]>([])

  // OPEN GROUP
  const [openGroup, setOpenGroup] =
    useState<string | null>('Settings')

  // SIDEBAR
  const [sidebarOpen, setSidebarOpen] =
    useState(true)

    const navigate = useNavigate()

    useEffect(() => {
  
      async function loadData() {
  
        try {
  
          const sessionResponse =
            await api.get('/auth/session')
  
          setSession(
            sessionResponse.data
          )
  
          const moduleResponse =
            await api.get(
              `/auth/session-data/${sessionResponse.data.userId}`
            )
  
          setGroups(
            moduleResponse.data.groups || []
          )
  
        } catch (error) {
  
          console.error(
            'Failed to load session',
            error
          )
  
          navigate('/login', { replace: true })
        }
      }
  
      loadData()
  
    }, [navigate])

  function toggleGroup(group: string) {

    setOpenGroup((prev) =>
      prev === group ? null : group
    )
  }

  if (!session) {
    return null
  }


  return (

    <div className="layout">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <Sidebar
        groups={groups}
        openGroup={openGroup}
        toggleGroup={toggleGroup}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />  

      <main className="main-content">

        <Header
          title={title}
          session={session}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="page-body">
          {children}
        </div>

      </main>

    </div>
  )
}