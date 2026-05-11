import { AxiosError } from 'axios'
import { startTransition, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await login({ email: email.trim(), password })
      startTransition(() => navigate('/dashboard', { replace: true }))
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setError(
          requestError.response?.data?.message
            ?? requestError.message
            ?? 'Unable to sign in with the provided credentials.',
        )
      } else {
        setError('Unexpected error while signing in. Please retry.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-panel login-panel-brand">
        <div className="login-badge">PNTHR Enterprise HRMS</div>
        <h1>Professional people operations for modern teams.</h1>
        <p>
          Centralize attendance, employee requests, and profile management in a secure,
          executive-grade workspace designed for HR and delivery leaders.
        </p>

        <div className="login-metrics">
          <div>
            <strong>Role-based</strong>
            <span>Employee, Supervisor, Admin</span>
          </div>
          <div>
            <strong>JWT secured</strong>
            <span>Session-aware protected routes</span>
          </div>
          <div>
            <strong>PostgreSQL ready</strong>
            <span>Local-first configuration</span>
          </div>
        </div>
      </section>

      <section className="login-panel login-panel-form">
        <div>
          <p className="section-kicker">Welcome back</p>
          <h2>Sign in to continue</h2>
          <p className="section-copy">Enter your credentials to access your workspace.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="off"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

      </section>
    </div>
  )
}