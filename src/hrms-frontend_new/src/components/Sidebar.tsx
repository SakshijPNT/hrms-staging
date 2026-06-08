import { NavLink } from 'react-router-dom'

import api from '../services/api'

import {
  MdDashboardCustomize,
  MdOutlineSecurity,
  MdLogout,
  MdKeyboardArrowDown,
} from 'react-icons/md'

import {
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineInbox,
} from 'react-icons/hi2'

import {
  IoSettingsOutline,
} from 'react-icons/io5'

import {
  RiTeamLine,
} from 'react-icons/ri'

import type {
  ModuleGroup,
} from '../../types/auth'

/*interface ModuleItem {
  id: number
  moduleName: string
  description?: string
  iconUrl: string | null
}

interface ModuleGroup {
  groupId: number
  groupName: string
  modules: ModuleItem[]
}*/

interface SidebarProps {
  groups: ModuleGroup[]
  openGroup: string | null
  toggleGroup: (group: string) => void

  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >

}

const moduleRoutes: Record<
  string,
  {
    path: string
    label: string
    icon?: React.ReactNode
  }
> = {
  Dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <MdDashboardCustomize className="menu-icon" />
    ),
  },

  Users: {
    path: '/users',
    label: 'Users',
    icon: (
      <HiOutlineUsers className="menu-icon" />
    ),
  },

  Roles: {
    path: '/roles',
    label: 'Roles',
    icon: (
      <MdOutlineSecurity className="menu-icon" />
    ),
  },

  'My Team': {
    path: '/my-team',
    label: 'My Team',
    icon: (
      <RiTeamLine className="menu-icon" />
    ),
  },

  'My Leaves': {
    path: '/my-leaves',
    label: 'My Leaves',
    icon: (
      <HiOutlineCalendarDays className="menu-icon" />
    ),
  },

  'My Approval': {
    path: '/my-approval',
    label: 'My Approval',
    icon: (
      <HiOutlineClipboardDocumentCheck className="menu-icon" />
    ),
  },

  'Other Requests': {
    path: '/other-requests',
    label: 'Other Requests',
    icon: (
      <HiOutlineInbox className="menu-icon" />
    ),
  },

  Settings: {
    path: '/settings',
    label: 'Settings',
    icon: (
      <IoSettingsOutline className="menu-icon" />
    ),
  },

  'Company Configuration': {
    path: '/company-configuration',
    label: 'Company Configuration',
    icon: (
      <HiOutlineBuildingOffice2 className="menu-icon" />
    ),
  },

  'Policy Configuration': {
    path: '/policy-configuration',
    label: 'Policy Configuration',
    icon: (
      <IoSettingsOutline className="menu-icon" />
    ),
  },
}

const SIDEBAR_MODULE_ORDER: Record<string, number> = {
  Dashboard: 0,
  Users: 1,
  Roles: 2,
  'My Leaves': 3,
  'My Approval': 4,
  'My Team': 6,
  'Other Requests': 7,
  Settings: 100,
}

const HIDDEN_SIDEBAR_MODULES = new Set([
  'My Applications',
])

function getSidebarGroups(
  groups: ModuleGroup[]
): ModuleGroup[] {
  const filtered = groups
    .map((group) => ({
      ...group,
      modules: group.modules.filter(
        (module) =>
          !HIDDEN_SIDEBAR_MODULES.has(module.moduleName) &&
          module.moduleName in moduleRoutes,
      ),
    }))
    .filter((group) => group.modules.length > 0)

  return sortSidebarGroups(filtered)
}

function sortSidebarGroups(
  groups: ModuleGroup[]
): ModuleGroup[] {
  const getOrder = (group: ModuleGroup): number => {
    if (group.groupName === 'Settings') {
      return SIDEBAR_MODULE_ORDER.Settings
    }

    if (group.modules.length === 1) {
      const moduleName =
        group.modules[0].moduleName

      if (moduleName in SIDEBAR_MODULE_ORDER) {
        return SIDEBAR_MODULE_ORDER[moduleName]
      }
    }

    return 50
  }

  return [...groups].sort((a, b) => {
    const orderDiff = getOrder(a) - getOrder(b)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return groups.indexOf(a) - groups.indexOf(b)
  })
}

export default function Sidebar({

  groups,
  openGroup,
  toggleGroup,
  sidebarOpen,
}: SidebarProps) {

    async function handleLogout() {
      try {
        await api.post('/auth/logout')
      } catch {
        // Continue logout even if the API call fails.
      }

      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login')
    }

  return (

    <aside className={`sidebar ${sidebarOpen
      ? 'sidebar-open'
      : 'sidebar-collapsed'
      }`}
    >

      <div className="sidebar-top">

        {/* LOGO */}
        <div className="sidebar-logo">

          <div className="logo-circle">
            HR
          </div>

          <div>

            <h2>HRMS</h2>

            <p>
              MANAGEMENT PORTAL
            </p>

          </div>

        </div>

        {/* MENU */}
        <nav className="sidebar-menu">

          {getSidebarGroups(groups).map((group) => {

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
                  title={route.label}
                  key={module.id}
                  to={route.path}
                  className={({ isActive }) =>
                    isActive
                      ? 'menu-item active'
                      : 'menu-item'
                  }
                >

                  {route.icon}

                  <span>
                    {route.label}
                  </span>

                </NavLink>
              )
            }

            /* MENU GROUP */
            return (

              <div
                key={group.groupId}
                className="menu-group"
              >

                <div
                  className={`menu-parent ${openGroup === group.groupName
                      ? 'menu-parent-open'
                      : ''
                    }`}
                  onClick={() =>
                    toggleGroup(group.groupName)
                  }
                >

                  <div className="menu-parent-left">

                    <IoSettingsOutline className="menu-icon" />

                    <span>
                      {group.groupName}
                    </span>

                  </div>

                  <MdKeyboardArrowDown
                    className={`dropdown-arrow ${openGroup === group.groupName
                      ? 'rotate'
                      : ''
                      }`}
                  />

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
                              title={route.label}
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

                              <span>
                                {route.label}
                              </span>

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

      </div>

      {/* LOGOUT */}
      <button
  className="logout-btn"
  onClick={handleLogout}
>

        <MdLogout className="menu-icon" />

        <span>Logout</span>

      </button>

    </aside>
  )
}