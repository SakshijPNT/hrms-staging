import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const titleMap: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/attendance': 'Attendance Overview',
  '/attendance-status': 'Attendance Status',
  '/users': 'Users',
  '/my-reportees': 'My Reportees',
  '/requests': 'Request Management',
  '/approvals': 'Approval Center',
  '/my-leaves': 'My Leaves',
  '/reports': 'Reports',
  '/activities': 'Activities',
  '/roles': 'Roles',
  '/settings': 'Settings',
  '/profile': 'Employee Profile',
}

export function Topbar() {
  const location = useLocation()
  const { session } = useAuth()

  return (
    <header className="topbar">
      <div>
        <p className="topbar-kicker">Secure HR operations</p>
        <h2>{titleMap[location.pathname] ?? 'PNTHR HRMS'}</h2>
      </div>

      <div className="topbar-user">
        <div className="topbar-user-copy">
          <strong>{session?.user.fullName}</strong>
          <span>{session?.user.email}</span>
        </div>
        <div className="topbar-avatar">
          {session?.user.fullName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
    </header>
  )
}