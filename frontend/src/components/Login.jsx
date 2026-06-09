import { useState } from 'react'
import { Shield } from 'lucide-react'
import axios from 'axios'
import Register from './Register'
import './Login.css'

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081'
const REALM        = 'nitte-shop-app'
const CLIENT_ID    = 'nitte-shop-app'
const REDIRECT_URI = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
const API_URL      = import.meta.env.VITE_API_URL  || 'http://localhost:3000'

export default function AuthPage({ onAuthSuccess }) {
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [formData, setFormData]         = useState({ email: '', password: '' })

  const handleChange = (e) => { const {name,value}=e.target; setFormData(p=>({...p,[name]:value})); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await axios.post(API_URL + '/api/v1/auth/login', { email: formData.email, password: formData.password })
      if (res.data.tokens?.access_token) {
        localStorage.setItem('token', res.data.tokens.access_token)
        localStorage.setItem('refresh_token', res.data.tokens.refresh_token)
        localStorage.setItem('user', JSON.stringify(res.data.data))
        onAuthSuccess(res.data.data)
      }
    } catch (err) { setError(err.response?.data?.message || 'Login failed.') }
    finally { setLoading(false) }
  }

  const handleKeycloakLogin = () => {
    const params = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code', scope: 'openid profile email' })
    window.location.href = KEYCLOAK_URL + '/realms/' + REALM + '/protocol/openid-connect/auth?' + params
  }

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">NITTE Merchandise Shop</p>
        <button onClick={handleKeycloakLogin} disabled={loading} style={{ width:'100%', padding:12, background:'#4a90d9', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20 }}>
          <Shield size={18} />Login with Keycloak SSO
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <hr style={{ flex:1, borderColor:'#ddd' }} />
          <span style={{ color:'#aaa', fontSize:13 }}>or sign in with email</span>
          <hr style={{ flex:1, borderColor:'#ddd' }} />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required disabled={loading} /></div>
          <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required disabled={loading} /></div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="login-button">{loading ? 'Logging In…' : 'Login'}</button>
        </form>
        <div className="auth-toggle"><p>Don't have an account? <button onClick={()=>setShowRegister(true)} className="toggle-link" disabled={loading}>Register here</button></p></div>
      </div>
    </div>
  )
}
