import { useState } from 'react'
import { LogIn, UserPlus, Shield } from 'lucide-react'
import axios from 'axios'
import './Login.css'

const KEYCLOAK_URL = 'http://localhost:8081'
const REALM = 'nitte-shop'
const CLIENT_ID = 'nitte-shop-app'
const REDIRECT_URI = 'http://localhost:5173'

function AuthPage({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isSignup ? '/api/v1/auth/signup' : '/api/v1/auth/login'
      const payload = isSignup
        ? formData
        : { email: formData.email, password: formData.password }

      const response = await axios.post(`http://localhost:3000${endpoint}`, payload)

      if (response.data.tokens?.access_token) {
        const token = response.data.tokens.access_token
        const userData = {
          userId: response.data.data.user_id,
          email: response.data.data.email,
          name: response.data.data.name
        }
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
      }
    } catch (err) {
      setError(err.response?.data?.message || (isSignup ? 'Signup failed.' : 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  // Direct redirect to Keycloak - most reliable approach
  const handleKeycloakLogin = () => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
    })
    window.location.href = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?${params}`
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="login-subtitle">NITTE Merchandise Shop</p>

        {/* Keycloak SSO Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleKeycloakLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4a90d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}
          >
            <Shield size={18} />
            Login with Keycloak SSO
          </button>
          <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', margin: '0' }}>
            For HPE staff & registered external users
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <hr style={{ flex: 1, borderColor: '#ddd' }} />
          <span style={{ color: '#aaa', fontSize: '13px' }}>or continue with email</span>
          <hr style={{ flex: 1, borderColor: '#ddd' }} />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required={isSignup}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? (isSignup ? 'Creating Account...' : 'Logging In...') : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
                setFormData({ email: '', password: '', name: '' })
              }}
              className="toggle-link"
              disabled={loading}
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage