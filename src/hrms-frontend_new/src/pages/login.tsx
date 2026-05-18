import { useState } from 'react'
import type { FormEvent } from 'react'

import { useNavigate } from 'react-router-dom'

import api from '../services/api'

import '../styles/Style.css'

export default function Login() {
  const navigate = useNavigate()

  const [emailId, setEmailId] =
    useState<string>('')

  const [password, setPassword] =
    useState<string>('')

  const [error, setError] =
    useState<string>('')

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    try {
      setError('')

      const response = await api.post(
        '/auth/login',
        {
          emailId,
          password,
        }
      )

      // Store session info
      localStorage.setItem(
        'session',
        JSON.stringify(response.data)
      )

      // Redirect to Roles page
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Invalid Email ID or Password'
      )
    }
  }

  return (
    <div className="login-container">
      {/* Left Side */}
      <div className="left-section">
        <div className="branding-content">
          <h1>HRMS Portal</h1>

          <p>
            Human Resource Management
            System
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="right-section">
        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <h2>Login</h2>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="emailId">
              Email ID
            </label>

            <input
              id="emailId"
              type="email"
              autoComplete="email"
              value={emailId}
              onChange={(e) =>
                setEmailId(
                  e.target.value
                )
              }
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="error">
              {error}
            </p>
          )}

          {/* Button */}
          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}