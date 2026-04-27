import { useState } from 'react'
import axios from 'axios'
import './AdminLogin.css'

function AdminLogin({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const ADMIN_EMAIL = 'admin@nitte.com'
  const ADMIN_PASSWORD = 'Admin@123'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate credentials (hardcoded for demo purposes)
      if (formData.email !== ADMIN_EMAIL || formData.password !== ADMIN_PASSWORD) {
        setError('Invalid admin credentials. Please try again.')
        setLoading(false)
        return
      }

      // Generate demo admin token that backend will recognize
      const token = 'admin-token-' + btoa(ADMIN_EMAIL + ':' + Date.now())
      const userData = {
        userId: 'admin-user',
        email: ADMIN_EMAIL,
        name: 'Administrator',
        isAdmin: true
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      onLoginSuccess(userData)
    } catch (err) {
      setError('Admin login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Admin Dashboard</h1>
          <p>NITTE Merchandise Shop Management</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin email"
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
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="admin-login-button"
          >
            {loading ? 'Logging In...' : 'Login to Admin Panel'}
          </button>
        </form>

        <div className="admin-credentials">
          <p>Use your admin credentials to access the dashboard</p>
          <div className="demo-info">
            <strong>Demo Access:</strong><br/>
            Email: admin@nitte.com<br/>
            Password: Admin@123
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
