import { NavLink } from 'react-router-dom'

import {
  MdDashboardCustomize,
  MdOutlineSecurity,
  MdLogout,
  MdKeyboardArrowDown,
} from 'react-icons/md'

import {
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2'

import {
  IoSettingsOutline,
} from 'react-icons/io5'

import {
  BsClipboardCheck,
} from 'react-icons/bs'

import {
  RiTeamLine,
} from 'react-icons/ri'

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

  'My Applications': {
    path: '/my-applications',
    label: 'My Applications',
    icon: (
      <BsClipboardCheck className="menu-icon" />
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

export default function Sidebar({
  groups,
  openGroup,
  toggleGroup,
  sidebarOpen,
}: SidebarProps) {

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
      <button className="logout-btn">

        <MdLogout className="menu-icon" />

        <span>Logout</span>

      </button>

    </aside>
  )
}