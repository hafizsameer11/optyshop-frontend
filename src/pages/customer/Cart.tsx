import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../utils/api'
import { API_ROUTES } from '../../config/apiRoutes'

interface CartItem {
  id: number
  product_id: number
  product_name?: string
  quantity: number
  unit_price: number
  lens_index?: number
  lens_coating?: string
}

interface Cart {
  items: CartItem[]
  subtotal: number | string // Can be number or string (Prisma Decimal)
  total: number | string // Can be number or string (Prisma Decimal)
}

const Cart: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ROUTES.CART.GET, true)
      if (response.success && response.data) {
        const data = response.data as any
        // Normalize the response to ensure it has the expected structure
        const normalizedCart: Cart = {
          items: data.items || data.cart_items || [],
          subtotal: typeof data.subtotal === 'number' ? data.subtotal : Number(data.subtotal || 0),
          total: typeof data.total === 'number' ? data.total : Number(data.total || 0),
        }
        setCart(normalizedCart)
      } else {
        // Set empty cart if API call fails or returns no data
        setCart({ items: [], subtotal: 0, total: 0 })
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      // Set empty cart on error
      setCart({ items: [], subtotal: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return
    
    try {
      const response = await apiClient.put(API_ROUTES.CART.UPDATE_ITEM(itemId), { quantity }, true)
      if (response.success) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error updating cart item:', error)
    }
  }

  const removeItem = async (itemId: number) => {
    try {
      const response = await apiClient.delete(API_ROUTES.CART.REMOVE_ITEM(itemId), true)
      if (response.success) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error removing cart item:', error)
    }
  }

  const clearCart = async () => {
    try {
      const response = await apiClient.delete(API_ROUTES.CART.CLEAR, true)
      if (response.success) {
        setCart({ items: [], subtotal: 0, total: 0 })
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  // Helper function to format currency values (handles both number and string types)
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '$0.00'
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return `$${numValue.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </h3>
                      {item.lens_index && (
                        <p className="text-sm text-gray-600 mt-1">
                          Lens Index: {item.lens_index}
                        </p>
                      )}
                      {item.lens_coating && (
                        <p className="text-sm text-gray-600">
                          Coating: {item.lens_coating}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${(Number(item.unit_price || 0) * Number(item.quantity || 0)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${Number(item.unit_price || 0).toFixed(2)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-4 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="w-full block text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/shop"
                className="w-full block text-center mt-3 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

