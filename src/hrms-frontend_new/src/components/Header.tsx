import {
  HiOutlineBars3,
} from 'react-icons/hi2'

import type { SessionInfo } from '../../types/auth'

interface HeaderProps {
  title: string
  session: SessionInfo | null
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
  {session?.fullName
    ? session.fullName
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '--'}
</div>

<div>

  <h4>
    {session?.fullName ?? 'Loading...'}
  </h4>

  <p>
    {session?.emailId ?? ''}
  </p>

</div>

</div>

    </header>
  )
}