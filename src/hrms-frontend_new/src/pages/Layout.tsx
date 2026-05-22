import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import '../styles/Style.css'

interface ModuleItem {
  id: number
  moduleName: string
  description: string
  iconUrl: string | null
}

interface ModuleGroup {
  groupId: number
  groupName: string
  modules: ModuleItem[]
}

interface LayoutProps {
  title: string
  children: React.ReactNode
}

/* Routes */
const moduleRoutes: Record<
  string,
  {
    path: string
    label: string
  }
> = {

  Dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
  },

  Roles: {
    path: '/roles',
    label: 'Roles',
  },

  Users: {
    path: '/users',
    label: 'Users',
  },

  Settings: {
    path: '/settings',
    label: 'Settings',
  },

  'Company Configuration': {
    path: '/company-configuration',
    label: 'Company Configuration',
  },

  'Policy Configuration': {
    path: '/policy-configuration',
    label: 'Policy Configuration',
  },

  'My Applications': {
    path: '/my-applications',
    label: 'My Applications',
  },

  'My Team': {
    path: '/my-team',
    label: 'My Team',
  },
}

export default function Layout({
  title,
  children,
}: LayoutProps) {

  const session = JSON.parse(
    localStorage.getItem('session') || '{}'
  )

  /* GET GROUPS */
  const groups: ModuleGroup[] =
    session.groups || []

  const [openGroup, setOpenGroup] =
    useState<string | null>(null)

  function toggleGroup(group: string) {

    setOpenGroup((prev) =>
      prev === group ? null : group
    )
  }

  return (

    <div className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-circle">
            HR
          </div>

          <h2>HRMS</h2>

          <p>Management Portal</p>

        </div>

        <nav className="sidebar-menu">

          {groups.map((group) => {

            const hasChildren =
              group.modules.length > 1

            /* SINGLE MENU */
            if (!hasChildren) {

              const module =
                group.modules[0]

              const route =
                moduleRoutes[module.moduleName]

              if (!route) return null

              return (

                <NavLink
                  key={module.id}
                  to={route.path}
                  className={({ isActive }) =>
                    isActive
                      ? 'menu-item active'
                      : 'menu-item'
                  }
                >
                  {route.label}
                </NavLink>
              )
            }

            /* PARENT + CHILD */
            return (

              <div
                key={group.groupId}
                className="menu-group"
              >

                <div
                  className="menu-parent"
                  onClick={() =>
                    toggleGroup(group.groupName)
                  }
                >

                  <span>
                    {group.groupName}
                  </span>

                  <span>
                    {openGroup ===
                    group.groupName
                      ? '▲'
                      : '▼'}
                  </span>

                </div>

                {openGroup ===
                  group.groupName && (

                  <div className="submenu">

                    {group.modules.map(
                      (module) => {

                        const route =
                          moduleRoutes[
                            module.moduleName
                          ]

                        if (!route)
                          return null

                        return (

                          <NavLink
                            key={module.id}
                            to={route.path}
                            className={({
                              isActive,
                            }) =>
                              isActive
                                ? 'submenu-item active'
                                : 'submenu-item'
                            }
                          >

                            {route.label}

                          </NavLink>
                        )
                      }
                    )}

                  </div>
                )}

              </div>
            )
          })}

        </nav>

      </aside>

      {/* MAIN */}
      <main className="main-content">

        <header className="page-header">

          <div>

            <p className="header-small">
              HR Management System
            </p>

            <h1>{title}</h1>

          </div>

          <div className="profile-box">

            <div className="profile-avatar">
              SA
            </div>

            <div>

              <h4>
                {session.user?.fullName ||
                  'System Admin'}
              </h4>

              <p>
                {session.user?.emailId ||
                  'admin@hrms.com'}
              </p>

            </div>

          </div>

        </header>

        <div className="page-body">
          {children}
        </div>

      </main>

    </div>
  )
}