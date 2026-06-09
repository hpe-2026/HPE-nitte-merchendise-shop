import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminNavbar from './components/AdminNavbar'
import AdminLogin from './components/AdminLogin'
import Dashboard from './components/Dashboard'
import Metrics from './components/Metrics'
import Traces from './components/Traces'
import Users from './components/Users'
import Products from './components/Products'
import Orders from './components/Orders'
import Registrations from './components/Registrations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser]               = useState(null)
  const [stats, setStats]             = useState({ totalProducts:0, totalOrders:0, totalRevenue:0, activeUsers:0 })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) { try { setUser(JSON.parse(userData)) } catch (_) {} }
  }, [])

  const handleLoginSuccess = (userData) => { setUser(userData); setCurrentPage('dashboard') }

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('user')
    setUser(null); setCurrentPage('dashboard')
  }

  useEffect(() => {
    if (!user) return
    fetchStats()
    const id = setInterval(fetchStats, 30_000)
    return () => clearInterval(id)
  }, [user])

  const fetchStats = async () => {
    try {
      const h = { Authorization: 'Bearer ' + localStorage.getItem('token') }
      const [prodRes, ordRes] = await Promise.all([
        axios.get(API_URL + '/api/v1/products', { headers: h }),
        axios.get(API_URL + '/api/v1/orders',   { headers: h }),
      ])
      const products = prodRes.data.data || []
      const orders   = ordRes.data.data  || []
      const revenue  = orders.reduce((s,o) => s + (o.items||[]).reduce((si,i)=>si+i.price*i.quantity,0), 0)
      setStats({ totalProducts: products.length, totalOrders: orders.length, totalRevenue: revenue, activeUsers: new Set(orders.map(o=>o.user_id)).size })
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!user ? <AdminLogin onLoginSuccess={handleLoginSuccess} /> : (
        <>
          <AdminNavbar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} onLogout={handleLogout} />
          <main className="py-8">
            {currentPage==='dashboard'     && <Dashboard stats={stats} />}
            {currentPage==='registrations' && <Registrations />}
            {currentPage==='metrics'       && <Metrics />}
            {currentPage==='traces'        && <Traces />}
            {currentPage==='users'         && <Users />}
            {currentPage==='products'      && <Products />}
            {currentPage==='orders'        && <Orders />}
          </main>
        </>
      )}
    </div>
  )
}

export default App