import { BarChart3, Activity, Zap, Users, Package, ShoppingCart, LogOut } from 'lucide-react'
import Logo from './Logo'

export default function AdminNavbar({ currentPage, setCurrentPage, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'metrics', label: 'Prometheus Metrics', icon: Activity },
    { id: 'traces', label: 'Jaeger Traces', icon: Zap },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart }
  ]

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Logo size="medium" variant="admin" />
            <h1 className="text-2xl font-bold">NITTE Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              System Status: <span className="text-green-400 font-semibold">[OK] Online</span>
            </div>
            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                <span className="text-sm text-gray-300">{user.name}</span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
