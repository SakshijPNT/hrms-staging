import { NavLink } from 'react-router-dom'
import '../styles/Style.css'

interface LayoutProps {
  title: string
  children: React.ReactNode
}

export default function Layout({
  title,
  children,
}: LayoutProps) {
  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-circle">
            HR
          </div>

          <h2>HRMS</h2>

          <p>Management Portal</p>
        </div>

        <nav className="sidebar-menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? 'menu-item active'
                : 'menu-item'
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/roles"
            className={({ isActive }) =>
              isActive
                ? 'menu-item active'
                : 'menu-item'
            }
          >
            Roles
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? 'menu-item active'
                : 'menu-item'
            }
          >
            Users
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
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
              <h4>System Admin</h4>
              <p>admin@hrms.com</p>
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