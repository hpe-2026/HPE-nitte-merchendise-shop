import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
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
        setError('Not authenticated. Please log in again.')
        setLoading(false)
        console.warn('No token found in localStorage')
        return
      }
      
      console.log('Fetching orders with token:', token.substring(0, 20) + '...')
      
      const response = await axios.get('http://localhost:3000/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Orders response:', response.data)
      setOrders(response.data.data || response.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:3000/api/v1/orders/${orderId}`, { status: newStatus }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      fetchOrders()
    } catch (err) {
      setError('Failed to update order')
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

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-700">Items</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-700">Total</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{order._id?.slice(-8)?.toUpperCase()}</code>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    <div className="text-sm">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      {order.items?.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-600">
                              • {item.productName} x{item.quantity}
                            </li>
                          ))}
                          {order.items.length > 2 && (
                            <li className="text-xs text-gray-600">• +{order.items.length - 2} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className={`px-3 py-1 rounded text-sm font-semibold border-none cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status.toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-600 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-yellow-500">
          <p className="text-gray-600 text-sm mb-2">Pending Orders</p>
          <p className="text-3xl font-bold text-gray-900">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
          <p className="text-gray-600 text-sm mb-2">Processing</p>
          <p className="text-3xl font-bold text-gray-900">{orders.filter(o => o.status === 'processing').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-purple-500">
          <p className="text-gray-600 text-sm mb-2">Shipped</p>
          <p className="text-3xl font-bold text-gray-900">{orders.filter(o => o.status === 'shipped').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
          <p className="text-gray-600 text-sm mb-2">Delivered</p>
          <p className="text-3xl font-bold text-gray-900">{orders.filter(o => o.status === 'delivered').length}</p>
        </div>
      </div>
    </div>
  )
}
