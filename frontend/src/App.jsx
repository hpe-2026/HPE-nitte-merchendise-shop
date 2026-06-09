import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from './features/auth/store/authStore'
import { useCartStore } from './features/cart/store/cartStore'
import { useProductStore } from './features/products/store/productStore'
import { useOrderStore } from './features/orders/store/orderStore'
import { useFlag } from '@unleash/proxy-client-react'
import { useBooleanFlagValue } from '@openfeature/react-sdk'
import flagsmith from './flagsmith.js'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import Orders from './components/Orders'
import Profile from './components/Profile'
import Navbar from './components/Navbar'
import Logo from './components/Logo'
import AuthPage from './components/Login'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('products')
  const [apiStatus, setApiStatus] = useState('checking')
  const [initialized, setInitialized] = useState(false)

  const { user, isAuthenticated, restoreSession, logout: zustandLogout } = useAuthStore()
  const { items: cartItems, addItem: addToCart, removeItem: removeFromCart, updateQuantity: updateCartQuantity, clearCart } = useCartStore()
  const { fetchProducts } = useProductStore()
  const { fetchOrders } = useOrderStore()

  const unleashAddToCart = useFlag('show-add-to-cart')
  const unleashOrdersPage = useFlag('show-orders-page')
  const ofAddToCart = useBooleanFlagValue('show-add-to-cart', false)
  const ofOrdersPage = useBooleanFlagValue('show-orders-page', false)
  const fsAddToCart = flagsmith.hasFeature('show-add-to-cart')
  const fsOrdersPage = flagsmith.hasFeature('show-orders-page')

  const showAddToCart = unleashAddToCart || ofAddToCart || fsAddToCart
  const showOrdersPage = unleashOrdersPage || ofOrdersPage || fsOrdersPage

  useEffect(() => {
    const initSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        try {
          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'nitte-shop-app',
            client_secret: 'vrQhCb3rZAiGB4devhqC28Y0IbDmdtnr',
            code: code,
            redirect_uri: 'http://localhost:5173'
          })
          const response = await axios.post(
            'http://localhost:8081/realms/nitte-shop-app/protocol/openid-connect/token',
            body,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          )
          const { access_token } = response.data
          const parsed = JSON.parse(atob(access_token.split('.')[1]))
          const roles = parsed.realm_access?.roles || []
          const email = parsed.email || ''
          const isNITTEEmail = email.endsWith('@nmamit.in') || email.endsWith('@nitte.edu.in') || email.endsWith('@nitte.ac.in')
          const userData = {
            userId: parsed.sub,
            email: parsed.email,
            name: parsed.name || parsed.preferred_username,
            role: roles.includes('admin') ? 'admin' : isNITTEEmail ? 'staff' : 'customer',
            userType: isNITTEEmail ? 'internal' : 'external',
            source: 'keycloak',
            tokenExpiry: parsed.exp * 1000,
            privileges: isNITTEEmail
              ? ['view_products', 'place_orders', 'manage_products', 'view_all_orders']
              : ['view_products', 'place_orders']
          }
          useAuthStore.getState().setUser(userData)
          useAuthStore.getState().setToken(access_token)
          useAuthStore.setState({ isAuthenticated: true })
          window.history.replaceState({}, document.title, '/')
        } catch (err) {
          console.error('Keycloak token exchange failed:', err)
        }
      } else {
        await restoreSession()
      }
      setInitialized(true)
    }
    initSession()
  }, [restoreSession])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    if (isAuthenticated) {
      const token = useAuthStore.getState().token
      if (token) fetchOrders(token)
    }
  }, [isAuthenticated, fetchOrders])

  useEffect(() => {
    const checkHealth = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const response = await axios.get('http://localhost:3000/api/v1/health', { timeout: 5000 })
          if (response.status === 200) { setApiStatus('online'); return }
        } catch (error) {
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000))
          else setApiStatus('offline')
        }
      }
    }
    checkHealth()
    const healthInterval = setInterval(checkHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const u = useAuthStore.getState().user
    if (!u?.tokenExpiry) return
    const timeLeft = u.tokenExpiry - Date.now()
    if (timeLeft <= 0) { handleLogout(); return }
    const timer = setTimeout(() => { alert('Session expired. Please login again.'); handleLogout() }, timeLeft)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleLogout = () => {
    zustandLogout()
    clearCart()
    setCurrentPage('products')
    localStorage.removeItem('auth-store')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = 'http://localhost:8081/realms/nitte-shop-app/protocol/openid-connect/logout?post_logout_redirect_uri=http://localhost:5173&client_id=nitte-shop-app'
  }

  const handleSignupSuccess = () => setCurrentPage('products')
  const handleAddToCart = (product) => {
    if (!isAuthenticated) setCurrentPage('login')
    else addToCart(product)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!initialized ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">Loading...</div>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
          {isAuthenticated ? (
            <>
              <Navbar
                cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                apiStatus={apiStatus}
                user={user}
                onLogout={handleLogout}
              />
              <main className="container py-8">
                {apiStatus === 'offline' && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    API Server is offline. Please ensure the backend is running on port 3000.
                  </div>
                )}
                {currentPage === 'products' && (
                  <ProductList onAddToCart={showAddToCart ? addToCart : null} />
                )}
                {currentPage === 'cart' && (
                  <Cart
                    cartItems={cartItems}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateCartQuantity}
                    setCurrentPage={setCurrentPage}
                  />
                )}
                {currentPage === 'orders' && showOrdersPage && <Orders />}
                {currentPage === 'profile' && <Profile user={user} onLogout={handleLogout} />}
              </main>
              <footer className="bg-gray-800 text-white py-8 mt-16">
                <div className="container text-center">
                  <p className="text-gray-400">NITTE Merchandise Shop - Powered by React + Node.js + Python + MongoDB</p>
                  <p className="text-gray-500 text-sm mt-2">
                    API Status: <span className={apiStatus === 'online' ? 'text-green-400' : 'text-red-400'}>
                      {apiStatus === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </footer>
            </>
          ) : currentPage === 'login' ? (
            <AuthPage onAuthSuccess={handleSignupSuccess} />
          ) : (
            <>
              <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Logo size="medium" />
                    <h1 className="text-2xl font-bold text-gray-800">NITTE Merch Shop</h1>
                  </div>
                  <button
                    onClick={() => setCurrentPage('login')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Login / Sign Up
                  </button>
                </div>
              </nav>
              <main className="container py-8">
                {apiStatus === 'offline' && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    API Server is offline. Please ensure the backend is running on port 3000.
                  </div>
                )}
                <ProductList onAddToCart={showAddToCart ? handleAddToCart : null} />
              </main>
              <footer className="bg-gray-800 text-white py-8 mt-16">
                <div className="container text-center">
                  <p className="text-gray-400">NITTE Merchandise Shop - Powered by React + Node.js + Python + MongoDB</p>
                  <p className="text-gray-500 text-sm mt-2">
                    API Status: <span className={apiStatus === 'online' ? 'text-green-400' : 'text-red-400'}>
                      {apiStatus === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </footer>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App