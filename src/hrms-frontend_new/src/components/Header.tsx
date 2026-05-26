import {
  HiOutlineBars3,
} from 'react-icons/hi2'

interface HeaderProps {
  title: string
  session: any
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >
}

export default function Header({
  title,
  session,
  sidebarOpen,
  setSidebarOpen,
}: HeaderProps) {

  return (

    <header className="page-header">

      <div className="header-left">

        <button
          className="sidebar-toggle-btn"
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        >

          <HiOutlineBars3 />

        </button>

        <div className="header-text">

          <p className="header-small">
            HR Management System
          </p>

          <h1>{title}</h1>

        </div>

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
  )
}