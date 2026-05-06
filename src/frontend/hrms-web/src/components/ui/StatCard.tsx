import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number
  hint: string
  icon: ReactNode
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div>
        <p className="stat-card-label">{label}</p>
        <h3>{value}</h3>
        <span>{hint}</span>
      </div>
    </article>
  )
}