import { ShoppingCart, Home, Package, User, LogOut } from 'lucide-react'
import Logo from './Logo'

export default function Navbar({ cartCount, currentPage, setCurrentPage, apiStatus, user, onLogout }) {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-gray-800">NITTE Merch Shop</h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPage === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              Shop
            </button>
            <button
              onClick={() => setCurrentPage('cart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition relative ${
                currentPage === 'cart'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentPage('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPage === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-5 h-5" />
              Orders
            </button>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4 pl-6 border-l border-gray-300">
            {/* API Status Indicator */}
            <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
              apiStatus === 'online'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {apiStatus === 'online' ? '[OK] Online' : '[DOWN] Offline'}
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                {/* Profile Button */}
                <button
                  onClick={() => setCurrentPage('profile')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    currentPage === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="View Profile"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-semibold">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
