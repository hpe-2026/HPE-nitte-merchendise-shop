import { useState, useEffect } from 'react'
import { BarChart3, Activity, Zap, SettingsIcon } from 'lucide-react'
import axios from 'axios'
import AdminNavbar from './components/AdminNavbar'
import AdminLogin from './components/AdminLogin'
import Dashboard from './components/Dashboard'
import Metrics from './components/Metrics'
import Traces from './components/Traces'
import Users from './components/Users'
import Products from './components/Products'
import Orders from './components/Orders'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('dashboard')
  }

  useEffect(() => {
    if (user) {
      fetchStats()
      const interval = setInterval(fetchStats, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch products count
      const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const products = productsResponse.data.data || []
      const totalProducts = products.length

      // Fetch orders
      const ordersResponse = await axios.get('http://localhost:3000/api/v1/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const orders = ordersResponse.data.data || []
      const totalOrders = orders.length

      // Calculate total revenue from orders
      const totalRevenue = orders.reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
        return sum + orderTotal
      }, 0)

      // Calculate active users (unique users who have placed orders)
      const uniqueUsers = new Set(orders.map(order => order.user_id))
      const activeUsers = uniqueUsers.size

      setStats({
        totalProducts: totalProducts,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        activeUsers: activeUsers
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeUsers: 0
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!user ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <AdminNavbar 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            user={user}
            onLogout={handleLogout}
          />

          <main className="py-8">
            {currentPage === 'dashboard' && <Dashboard stats={stats} />}
            {currentPage === 'metrics' && <Metrics />}
            {currentPage === 'traces' && <Traces />}
            {currentPage === 'users' && <Users />}
            {currentPage === 'products' && <Products />}
            {currentPage === 'orders' && <Orders />}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-6 mt-12">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-400">
                NITTE Admin Dashboard • Prometheus Metrics • Jaeger Tracing • Jenkins CI/CD
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
