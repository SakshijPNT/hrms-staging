import { NavLink, useNavigate } from 'react-router-dom'
import {
  LuActivity,
  LuCalendarDays,
  LuChartNoAxesCombined,
  LuFileClock,
  LuFileSpreadsheet,
  LuFolders,
  LuLogOut,
  LuSettings2,
  LuShieldCheck,
  LuUserRound,
  LuUsersRound,
} from 'react-icons/lu'
import { useAuth } from '../../auth/AuthContext'
import { canAccessPath } from '../../auth/permissions'

const navGroups = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LuChartNoAxesCombined },
      { to: '/attendance-status', label: 'Attendance Status', icon: LuCalendarDays },
      { to: '/users', label: 'Users', icon: LuUsersRound },
      { to: '/my-reportees', label: 'My Reportees', icon: LuUserRound },
      { to: '/requests', label: 'Requests', icon: LuFileClock },
      { to: '/approvals', label: 'Approval', icon: LuShieldCheck },
      { to: '/my-leaves', label: 'My Leaves', icon: LuFolders },
      { to: '/reports', label: 'Reports', icon: LuFileSpreadsheet },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/activities', label: 'Activities', icon: LuActivity },
      { to: '/roles', label: 'Roles', icon: LuShieldCheck },
      { to: '/settings', label: 'Settings', icon: LuSettings2 },
    ],
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { logout, session } = useAuth()
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPath(session?.user, item.to)),
    }))
    .filter((group) => group.items.length > 0)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-mark">PN</div>
        <div className="brand-copy">
          <p className="brand-kicker">Planet Next</p>
          <h1>PNTHR HRMS</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleNavGroups.map((group) => (
          <div key={group.label} className="sidebar-group">
            <p className="sidebar-group-label">{group.label}</p>
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <button type="button" className="sidebar-link sidebar-button" onClick={handleLogout}>
          <LuLogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-profile">
        <p className="sidebar-profile-role">{session?.user.role}</p>
        <h2>{session?.user.fullName}</h2>
        <p>{session?.user.email}</p>
      </div>
    </aside>
  )
}