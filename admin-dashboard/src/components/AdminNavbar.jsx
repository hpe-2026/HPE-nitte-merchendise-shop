import { BarChart3, Activity, Zap, Users, Package, ShoppingCart, ClipboardList, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: BarChart3 },
  { id: 'registrations', label: 'Registrations', icon: ClipboardList },
  { id: 'users',         label: 'Users',         icon: Users },
  { id: 'products',      label: 'Products',      icon: Package },
  { id: 'orders',        label: 'Orders',        icon: ShoppingCart },
  { id: 'metrics',       label: 'Metrics',       icon: Activity },
  { id: 'traces',        label: 'Traces',        icon: Zap },
]

export default function AdminNavbar({ currentPage, setCurrentPage, user, onLogout }) {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">N</div>
            <span className="font-semibold text-lg">NITTE Admin</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setCurrentPage(id)}
                className={"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors " + (currentPage === id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white")}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300 hidden sm:block">{user?.email}</span>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700">
              <LogOut size={15} />Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}