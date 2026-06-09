import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Register({ onBack }) {
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'customer' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleChange = (e) => { const{name,value}=e.target; setFormData(p=>({...p,[name]:value})); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await axios.post(API_URL + '/api/v1/auth/signup', { name: formData.name, email: formData.email, password: formData.password, role: formData.role })
      setSuccess(true)
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <div style={s.container}><div style={s.card}><div style={{textAlign:'center',padding:'24px 0'}}>
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <h2 style={{margin:'0 0 12px',color:'#166534'}}>Registration Submitted!</h2>
      <p style={{color:'#4b5563',marginBottom:24}}>Your account is pending admin approval.<br/>You can log in once an admin approves your request.</p>
      <button onClick={onBack} style={s.btnPrimary}>Back to Login</button>
    </div></div></div>
  )

  return (
    <div style={s.container}><div style={s.card}>
      <h1 style={s.title}>Create Account</h1>
      <p style={s.subtitle}>NITTE Merchandise Shop</p>
      <form onSubmit={handleSubmit}>
        <div style={s.formGroup}>
          <label style={s.label}>Account Type</label>
          <div style={{display:'flex',gap:12}}>
            {['customer','supplier'].map(r => (
              <label key={r} style={{flex:1,display:'flex',alignItems:'center',gap:10,padding:'12px 16px',border:'2px solid '+(formData.role===r?'#1a56db':'#d1d5db'),borderRadius:8,cursor:'pointer',background:formData.role===r?'#eff6ff':'#fff'}}>
                <input type="radio" name="role" value={r} checked={formData.role===r} onChange={handleChange} style={{accentColor:'#1a56db'}} />
                <div><div style={{fontWeight:600,textTransform:'capitalize',color:formData.role===r?'#1a56db':'#374151'}}>{r}</div><div style={{fontSize:11,color:'#6b7280'}}>{r==='customer'?'Buy merchandise':'Supply & manage products'}</div></div>
              </label>
            ))}
          </div>
        </div>
        <div style={s.formGroup}><label style={s.label}>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required disabled={loading} style={s.input} /></div>
        <div style={s.formGroup}><label style={s.label}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required disabled={loading} style={s.input} /></div>
        <div style={s.formGroup}><label style={s.label}>Password</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" required disabled={loading} style={s.input} /></div>
        <div style={s.formGroup}><label style={s.label}>Confirm Password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" required disabled={loading} style={s.input} /></div>
        {error && <div style={{background:'#fee2e2',color:'#991b1b',padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:14}}>{error}</div>}
        <div style={{background:'#fef9c3',border:'1px solid #fbbf24',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#92400e'}}>New accounts require admin approval before login.</div>
        <button type="submit" disabled={loading} style={{...s.btnPrimary,width:'100%'}}>{loading?'Submitting…':'Register'}</button>
      </form>
      <div style={{textAlign:'center',marginTop:20}}><span style={{color:'#6b7280',fontSize:14}}>Already have an account? </span><button onClick={onBack} style={s.linkBtn}>Sign in</button></div>
    </div></div>
  )
}

const s = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', padding:'24px 16px' },
  card: { background:'#fff', borderRadius:12, padding:'32px 28px', width:'100%', maxWidth:460, boxShadow:'0 4px 24px rgba(0,0,0,.08)' },
  title: { margin:'0 0 4px', fontSize:24, fontWeight:700, textAlign:'center', color:'#111827' },
  subtitle: { margin:'0 0 28px', textAlign:'center', color:'#6b7280', fontSize:14 },
  formGroup: { marginBottom:16 },
  label: { display:'block', marginBottom:6, fontWeight:500, fontSize:14, color:'#374151' },
  input: { width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' },
  btnPrimary: { padding:'12px 24px', background:'#1a56db', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer' },
  linkBtn: { background:'none', border:'none', color:'#1a56db', fontWeight:600, cursor:'pointer', fontSize:14 },
}