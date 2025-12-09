import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import CartHeroSection from '../../components/shop/CartHeroSection'
import { useCart } from '../../context/CartContext'

const Cart: React.FC = () => {
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart()

    if (cartItems.length === 0) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />

                {/* Hero Section */}
                <CartHeroSection />

                {/* Empty Cart */}
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl">
                        <div className="text-center space-y-6 md:space-y-8">
                            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                Your cart is empty
                            </h1>
                            <p className="text-lg text-gray-600">
                                Start shopping to add items to your cart
                            </p>
                            <Link
                                to="/shop"
                                className="inline-block px-8 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <CartHeroSection />

            {/* Breadcrumbs */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            SHOP
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">CART</span>
                    </nav>
                </div>
            </div>

            {/* Cart Content */}
            <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Shopping Cart ({getTotalItems()} items)
                        </h1>
                        <button
                            onClick={clearCart}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm md:text-base"
                        >
                            Clear Cart
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl p-4 md:p-6 shadow-md flex flex-col sm:flex-row gap-4"
                                >
                                    {/* Product Image */}
                                    <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-contain p-2"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-grow">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {item.brand} - {item.category}
                                            </p>
                                            <p className="text-lg font-semibold text-blue-950 mt-2">
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border border-gray-300 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="px-4 py-2 min-w-[3rem] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-600 hover:text-red-700 p-2"
                                                aria-label="Remove item"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-md sticky top-4">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({getTotalItems()} items)</span>
                                        <span>${getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Shipping</span>
                                        <span className="text-green-600">Free</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900">
                                            <span>Total</span>
                                            <span>${getTotalPrice().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to="/checkout"
                                    className="block w-full text-center px-6 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 mb-4"
                                >
                                    Proceed to Checkout
                                </Link>

                                <Link
                                    to="/shop"
                                    className="block w-full text-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-300"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default Cart

