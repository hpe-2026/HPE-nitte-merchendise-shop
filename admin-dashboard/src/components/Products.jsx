import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:3000/api/v1/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setProducts(response.data.data || response.data || [])
      setError(null)
    } catch (err) {
      setError('Failed to load products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
      if (editingId) {
        await axios.put(`http://localhost:3000/api/v1/products/${editingId}`, formData, config)
      } else {
        await axios.post('http://localhost:3000/api/v1/products', formData, config)
      }
      setFormData({ name: '', description: '', price: '', stock: '', category: '' })
      setEditingId(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError('Failed to save product')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:3000/api/v1/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        fetchProducts()
      } catch (err) {
        setError('Failed to delete product')
      }
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: '', description: '', price: '', stock: '', category: '' })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Price"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="3"
            />
            <div className="flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Product
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No products found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-700">Price</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-700">Stock</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.description?.substring(0, 50)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700 capitalize">{product.category || 'N/A'}</td>
                  <td className="py-4 px-6 text-right font-semibold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      product.stock > 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => {
                        setEditingId(product._id)
                        setFormData(product)
                        setShowForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
