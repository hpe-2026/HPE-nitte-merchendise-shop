import { useState, useEffect } from 'react'
import { ShoppingCart, AlertCircle, Loader } from 'lucide-react'
import axios from 'axios'

export default function ProductList({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3000/api/v1/products')
      setProducts(response.data.data || response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load products. Please ensure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Products</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-xl">No products available</p>
        <button
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Our Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product._id} className="product-card bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden relative">
              {product.image_url ? (
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Try multiple fallback options
                    if (!e.target.dataset.retried) {
                      e.target.dataset.retried = 'true'
                      // First fallback: Try with crossorigin attribute
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=300&background=random&bold=true`
                    } else {
                      // Second fallback: Solid color with product initial
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                          <div class="text-center">
                            <div class="text-4xl font-bold text-blue-600 mb-2">${product.name.charAt(0).toUpperCase()}</div>
                            <span class="text-gray-600 text-sm px-2">${product.name}</span>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{product.name.charAt(0).toUpperCase()}</div>
                    <span className="text-gray-600 text-sm px-2">{product.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description || 'High-quality merchandise'}
              </p>

              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  ₹{product.price?.toLocaleString('en-IN') || 'N/A'}
                </span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  product.stock > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {product.category && (
                <p className="text-xs text-gray-500 mb-4">
                  Category: <span className="capitalize">{product.category}</span>
                </p>
              )}

              {onAddToCart && (
  <button
    onClick={() => onAddToCart(product)}
    disabled={product.stock <= 0}
    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-semibold"
  >
    <ShoppingCart className="w-5 h-5" />
    Add to Cart
  </button>
)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>Showing {products.length} products</p>
      </div>
    </div>
  )
}
