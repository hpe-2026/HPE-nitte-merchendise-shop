import { useState } from 'react'
import axios from 'axios'
import './AdminLogin.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function AdminLogin({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

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
      const response = await axios.post(API_URL + '/api/v1/auth/admin/login', { email: formData.email, password: formData.password })
      const { tokens, data } = response.data
      if (!tokens?.access_token) throw new Error('No token received')
      localStorage.setItem('token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(data))
      onLoginSuccess(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed.')
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
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter admin email" required disabled={loading} autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter admin password" required disabled={loading} autoComplete="current-password" />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="admin-login-button">
            {loading ? 'Logging In...' : 'Login to Admin Panel'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16 }}>Restricted to admin accounts only.</p>
      </div>
    </div>
  )
}

export default AdminLogin