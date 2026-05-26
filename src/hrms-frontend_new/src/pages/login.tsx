import { useState } from 'react'
import type { FormEvent } from 'react'

import { useNavigate } from 'react-router-dom'

import api from '../services/api'

import '../styles/Login.css'

import { FiEye, FiEyeOff } from 'react-icons/fi'

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

  const [showPassword, setShowPassword] =
    useState<boolean>(false)

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
        <div className="mobile-branding">
  <h1>HRMS Portal</h1>

  <p>
    Human Resource Management System
  </p>
</div>
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

            <div className="password-input-wrapper">
              <input
                id="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>

            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          {/* Button */}
          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}