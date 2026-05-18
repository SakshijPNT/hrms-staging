import { useEffect, useState } from 'react'
import { getMyProfile } from '../api/profileApi'
import type { EmployeeProfile } from '../types/hrms'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch(() => setError('Unable to load profile data.'))
  }, [])

  if (error) {
    return <div className="panel error-panel">{error}</div>
  }

  if (!profile) {
    return <div className="panel loading-panel">Loading employee profile...</div>
  }

  return (
    <section className="panel profile-panel">
      <div className="profile-hero">
        <div className="profile-avatar">
          {profile.fullName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="section-kicker">Employee identity</p>
          <h2>{profile.fullName}</h2>
          <p>{profile.jobTitle}</p>
        </div>
      </div>

      <div className="profile-grid">
        <article>
          <span>EmailId</span>
          <strong>{profile.EmailId}</strong>
        </article>
        <article>
          <span>Role</span>
          <strong>{profile.role}</strong>
        </article>
        <article>
          <span>Employee Code</span>
          <strong>{profile.employeeCode}</strong>
        </article>
        <article>
          <span>Department</span>
          <strong>{profile.department}</strong>
        </article>
        <article>
          <span>Phone</span>
          <strong>{profile.phoneNumber || 'Not provided'}</strong>
        </article>
        <article>
          <span>Date of Joining</span>
          <strong>{formatDate(profile.dateOfJoining)}</strong>
        </article>
      </div>
    </section>
  )
}