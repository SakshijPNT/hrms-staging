interface AdminSectionPageProps {
  kicker: string
  title: string
  description: string
  highlights: string[]
  focusAreas: Array<{ label: string; value: string }>
}

export function AdminSectionPage({
  kicker,
  title,
  description,
  highlights,
  focusAreas,
}: AdminSectionPageProps) {
  return (
    <div className="page-grid">
      <section className="hero-panel admin-hero-panel">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="hero-chip-group">
          {highlights.map((item) => (
            <span key={item} className="hero-chip">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="panel span-two">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Operational Focus</p>
            <h2>{title}</h2>
          </div>
        </div>

        <div className="admin-focus-grid">
          {focusAreas.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">What This Covers</p>
            <h2>Responsibilities</h2>
          </div>
        </div>

        <div className="detail-list">
          {highlights.map((item) => (
            <div key={item}>
              <dt>{item}</dt>
              <dd>Configured in this admin workspace for HR operations and audit visibility.</dd>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}