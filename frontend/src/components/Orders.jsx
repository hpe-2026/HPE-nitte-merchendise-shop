import { useState, useEffect } from 'react'
import { Package, AlertCircle, Loader } from 'lucide-react'
import axios from 'axios'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to view orders')
        setLoading(false)
        return
      }

      const response = await axios.get('http://localhost:3000/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setOrders(response.data.data || response.data || [])
      setError(null)
    } catch (err) {
      setError('Failed to load orders. ' + (err.response?.data?.message || err.message))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Yet</h2>
        <p className="text-gray-600">You haven't placed any orders yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Orders</h2>

      <div className="space-y-6">
        {orders.map(order => {
          const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          return (
            <div key={order.id || order._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    Order #{order.order_id || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Shipping: {order.shipping_address}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}>
                  {order.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>

              {/* Items */}
              <div className="mb-4 pb-4 border-b">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-700">
                        <span>Product {item.product_id} x {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items</p>
                )}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mb-4 pb-4 border-b text-sm">
                  <p className="text-gray-600"><strong>Notes:</strong> {order.notes}</p>
                </div>
              )}

              {/* Total */}
              <div className="text-right">
                <p className="text-gray-600">
                  Total: <span className="font-bold text-lg text-blue-600">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>Showing {orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
