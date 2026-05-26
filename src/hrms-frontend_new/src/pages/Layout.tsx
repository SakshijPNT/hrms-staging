import { useState } from 'react'

import '../styles/Style.css'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

interface LayoutProps {
  title: string
  children: React.ReactNode
}

export default function Layout({
  title,
  children,
}: LayoutProps) {

  const session = JSON.parse(
    localStorage.getItem('session') || '{}'
  )

  const groups =
    session.groups || []

  /* SUBMENU STATE */
  const [openGroup, setOpenGroup] =
    useState<string | null>('Settings')

  /* SIDEBAR STATE */
  const [sidebarOpen, setSidebarOpen] =
    useState(true)

  function toggleGroup(group: string) {

    setOpenGroup((prev) =>
      prev === group ? null : group
    )
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