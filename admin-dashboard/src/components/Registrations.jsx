import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const STATUS_COLORS = {
  pending:  { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  denied:   { bg: '#fee2e2', text: '#991b1b', label: 'Denied' },
}
const ROLE_COLORS = {
  supplier: { bg: '#ede9fe', text: '#6d28d9' },
  customer: { bg: '#dbeafe', text: '#1e40af' },
}

export default function Registrations() {
  const [users, setUsers]       = useState([])
  const [filter, setFilter]     = useState('pending')
  const [loading, setLoading]   = useState(true)
  const [actionId, setActionId] = useState(null)
  const [error, setError]       = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: 'Bearer ' + token }

  const fetchUsers = async (status = filter) => {
    setLoading(true); setError('')
    try {
      const res = await axios.get(API_URL + '/api/v1/auth/admin/registrations?status=' + status, { headers })
      setUsers(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers(filter) }, [filter])

  const doAction = async (url, method = 'post') => {
    try { await axios({ method, url: API_URL + url, headers }); fetchUsers(filter) }
    catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setActionId(null) }
  }

  const approve = id => { setActionId(id); doAction('/api/v1/auth/admin/registrations/' + id + '/approve') }
  const deny    = id => { setActionId(id); doAction('/api/v1/auth/admin/registrations/' + id + '/deny') }
  const kick    = id => {
    if (!confirm('Deactivate this user?')) return
    setActionId(id); doAction('/api/v1/auth/admin/users/' + id, 'delete')
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>User Registrations</h2>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Review and approve new supplier & customer registrations</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending','approved','denied'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: '6px 18px', borderRadius: 20, border: '1px solid', borderColor: filter===t?'#1a56db':'#d1d5db', background: filter===t?'#1a56db':'#fff', color: filter===t?'#fff':'#374151', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
        ))}
        <button onClick={() => fetchUsers(filter)} style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>↺ Refresh</button>
      </div>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>
      : users.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No {filter} registrations</div>
      : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(u => {
            const sc = STATUS_COLORS[u.status] || STATUS_COLORS.pending
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.customer
            const busy = actionId === u._id
            return (
              <div key={u._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'#dbeafe', color:'#1e40af', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, flexShrink:0 }}>{u.name?.[0]?.toUpperCase()||'?'}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontWeight:600, fontSize:15 }}>{u.name}</div>
                  <div style={{ color:'#6b7280', fontSize:13 }}>{u.email}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Registered: {new Date(u.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:rc.bg, color:rc.text, textTransform:'capitalize' }}>{u.role}</span>
                <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:sc.bg, color:sc.text }}>{sc.label}</span>
                <div style={{ display:'flex', gap:8 }}>
                  {u.status==='pending' && <>
                    <button onClick={()=>approve(u._id)} disabled={busy} style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', fontWeight:500, cursor:busy?'not-allowed':'pointer', fontSize:13 }}>{busy?'…':'Approve'}</button>
                    <button onClick={()=>deny(u._id)} disabled={busy} style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#dc2626', color:'#fff', fontWeight:500, cursor:busy?'not-allowed':'pointer', fontSize:13 }}>{busy?'…':'Deny'}</button>
                  </>}
                  {u.status==='approved' && <button onClick={()=>kick(u._id)} disabled={busy} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #dc2626', background:'#fff', color:'#dc2626', fontWeight:500, cursor:busy?'not-allowed':'pointer', fontSize:13 }}>{busy?'…':'Revoke Access'}</button>}
                  {u.status==='denied'   && <button onClick={()=>approve(u._id)} disabled={busy} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #16a34a', background:'#fff', color:'#16a34a', fontWeight:500, cursor:busy?'not-allowed':'pointer', fontSize:13 }}>{busy?'…':'Re-approve'}</button>}
                </div>
              </div>
            )
          })}
        </div>}
    </div>
  )
}