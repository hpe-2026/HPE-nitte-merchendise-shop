import { useState } from 'react'
import { Trash2, ShoppingBag, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function Cart({ cartItems, onRemove, onUpdateQuantity, setCart, setCurrentPage }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get token from localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Please log in first to place an order')
        setLoading(false)
        return
      }

      const orderData = {
        items: cartItems.map(item => ({
          product_id: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: 'Demo Address, City, State 12345',
        notes: 'Demo order - please deliver ASAP',
        status: 'pending'
      }

      const response = await axios.post(
        'http://localhost:3000/api/v1/orders',
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      setOrderPlaced(true)
      setCart([])
      
      setTimeout(() => {
        setCurrentPage('orders')
        setOrderPlaced(false)
      }, 2000)
    } catch (err) {
      setError('Failed to place order. ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-600">Start shopping to add items to your cart</p>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-green-50 border-2 border-green-200 rounded-lg text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h2>
        <p className="text-green-700 mb-4">Your order has been submitted and is being processed.</p>
        <p className="text-gray-600">Redirecting to orders page...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Shopping Cart</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow">
            {cartItems.map(item => (
              <div key={item._id} className="flex gap-4 p-6 border-b last:border-b-0 hover:bg-gray-50">
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/96x96?text=${encodeURIComponent(item.name)}`
                      }}
                    />
                  ) : (
                    <img 
                      src={`https://via.placeholder.com/96x96?text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                  <p className="text-gray-600">₹{item.price?.toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-24">
                  <div className="font-semibold text-gray-800">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => onRemove(item._id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Order Summary</h3>

          <div className="space-y-3 mb-6 pb-6 border-b">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax (8%)</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
            <span>Total</span>
            <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          <p className="text-sm text-gray-500 mt-4 text-center">
             Secure checkout • Free shipping
          </p>
        </div>
      </div>
    </div>
  )
}
