import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, AlertCircle, Users as UsersIcon } from 'lucide-react'
import axios from 'axios'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch orders to get unique users
      const ordersResponse = await axios.get('http://localhost:3000/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const orders = ordersResponse.data.data || []
      
      // Extract unique users from orders
      const uniqueUsers = new Map()
      orders.forEach(order => {
        if (!uniqueUsers.has(order.user_id)) {
          uniqueUsers.set(order.user_id, {
            _id: order.user_id,
            name: order.customer_name || `User ${order.user_id}`,
            email: order.customer_email || `user${order.user_id}@nitte.com`,
            orders: 1,
            totalSpent: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            createdAt: order.created_at,
            role: 'user'
          })
        } else {
          const user = uniqueUsers.get(order.user_id)
          user.orders += 1
          user.totalSpent += order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }
      })
      
      setUsers(Array.from(uniqueUsers.values()))
      setError(null)
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Demo implementation - just add/update locally
    if (editingId) {
      setUsers(users.map(u => u._id === editingId ? { ...u, ...formData } : u))
      setEditingId(null)
    } else {
      setUsers([...users, { 
        _id: Date.now().toString(),
        ...formData,
        orders: 0,
        totalSpent: 0,
        createdAt: new Date()
      }])
    }
    setFormData({ name: '', email: '', password: '', role: 'user' })
    setShowForm(false)
  }

  const handleEdit = (user) => {
    setFormData({ name: user.name, email: user.email, password: '', role: user.role })
    setEditingId(user._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u._id !== id))
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: '', email: '', password: '', role: 'user' })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900">
            {editingId ? 'Edit User' : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? 'Leave blank to keep' : 'Password'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update User' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', email: '', password: '', role: 'user' })
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Orders</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Spent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-900">{user.orders || 0}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ₹{(user.totalSpent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500">
        <p>Showing {users.length} user{users.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
