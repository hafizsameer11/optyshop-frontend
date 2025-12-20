import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import CartHeroSection from '../../components/shop/CartHeroSection'
import { useCart } from '../../context/CartContext'
import { applyCoupon, type CouponDiscount, type CartItemForCoupon } from '../../services/couponsService'
import { getShippingMethods, type ShippingMethod } from '../../services/shippingMethodsService'

const Cart: React.FC = () => {
    const { t } = useTranslation()
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart()
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
    const [couponError, setCouponError] = useState('')
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
    const [shippingLoading, setShippingLoading] = useState(true)

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError(t('cart.enterCouponCode'))
            return
        }

        setIsApplyingCoupon(true)
        setCouponError('')

        // Convert cart items to API format
        const cartItemsForCoupon: CartItemForCoupon[] = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: Number(item.price || 0)
        }))

        const subtotal = getTotalPrice()
        const result = await applyCoupon(couponCode, subtotal, cartItemsForCoupon)

        if (result) {
            setAppliedCoupon(result)
            setCouponError('')
        } else {
            setAppliedCoupon(null)
            setCouponError(t('cart.invalidCoupon'))
        }

        setIsApplyingCoupon(false)
    }

    const handleRemoveCoupon = () => {
        setCouponCode('')
        setAppliedCoupon(null)
        setCouponError('')
    }

    const getFinalTotal = () => {
        if (appliedCoupon) {
            return Number(appliedCoupon.final_total || 0)
        }
        return getTotalPrice()
    }

    const getDiscountAmount = () => {
        if (appliedCoupon) {
            return Number(appliedCoupon.discount_amount || 0)
        }
        return 0
    }

    // Fetch shipping methods
    useEffect(() => {
        const fetchShippingMethods = async () => {
            setShippingLoading(true)
            try {
                console.log('🔄 [API] Fetching shipping methods: GET /api/shipping-methods')
                const methods = await getShippingMethods({ isActive: true })
                if (methods && methods.length > 0) {
                    setShippingMethods(methods)
                    // Auto-select free shipping if available, otherwise first method
                    const freeShipping = methods.find(m => m.price === 0 || m.type === 'free')
                    setSelectedShippingMethod(freeShipping || methods[0])
                    console.log('✅ [API] Shipping methods loaded:', methods.length)
                } else {
                    console.warn('⚠️ [API] No shipping methods available')
                }
            } catch (error) {
                console.error('❌ [API] Error fetching shipping methods:', error)
            } finally {
                setShippingLoading(false)
            }
        }

        fetchShippingMethods()
    }, [])

    const getShippingPrice = () => {
        if (selectedShippingMethod) {
            return Number(selectedShippingMethod.price || 0)
        }
        return 0
    }

    const getSubtotal = () => {
        return getTotalPrice()
    }

    const getTotal = () => {
        const subtotal = getSubtotal()
        const discount = getDiscountAmount()
        const shipping = getShippingPrice()
        const total = subtotal - discount + shipping
        
        if (appliedCoupon) {
            // If coupon is applied, use the coupon's final_total and add shipping
            return Number(appliedCoupon.final_total || 0) + shipping
        }
        
        return total
    }

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
                                {t('cart.empty')}
                            </h1>
                            <p className="text-lg text-gray-600">
                                {t('cart.startShopping')}
                            </p>
                            <Link
                                to="/shop"
                                className="inline-block px-8 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300"
                            >
                                {t('cart.continueShopping')}
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
                            <span>{t('common.home').toUpperCase()}</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            {t('common.shop').toUpperCase()}
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">{t('common.cart').toUpperCase()}</span>
                    </nav>
                </div>
            </div>

            {/* Cart Content */}
            <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {t('cart.title')} ({getTotalItems()} {t('cart.items')})
                        </h1>
                        <button
                            onClick={clearCart}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm md:text-base"
                        >
                            {t('cart.clearCart') || 'Clear Cart'}
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
                                            <div className="mt-2">
                                                <p className="text-lg font-semibold text-blue-950">
                                                    ${(() => {
                                                        // Ensure price is properly converted to number
                                                        let price = 0
                                                        if (typeof item.price === 'string') {
                                                            // Remove any non-numeric characters except decimal point
                                                            const cleaned = item.price.replace(/[^0-9.]/g, '')
                                                            price = parseFloat(cleaned) || 0
                                                        } else {
                                                            price = Number(item.price) || 0
                                                        }
                                                        
                                                        // For contact lenses, price is already the total
                                                        if (item.category === 'contact-lenses' || (item as any).isContactLens || (item as any).customization?.contactLens) {
                                                            return price.toFixed(2)
                                                        }
                                                        
                                                        // For products with lens customizations, price is already the total
                                                        if ((item as any).hasLensCustomization || (item as any).customization?.lensType || (item as any).customization?.progressiveOption) {
                                                            return price.toFixed(2)
                                                        }
                                                        
                                                        // For regular products, show price per item (not multiplied by quantity)
                                                        return price.toFixed(2)
                                                    })()}
                                                </p>
                                                {/* Show item total if quantity > 1 for regular products */}
                                                {item.quantity > 1 && item.category !== 'contact-lenses' && !(item as any).isContactLens && !(item as any).customization?.contactLens && (
                                                    <p className="text-sm text-gray-500">
                                                        ${(() => {
                                                            let price = 0
                                                            if (typeof item.price === 'string') {
                                                                const cleaned = item.price.replace(/[^0-9.]/g, '')
                                                                price = parseFloat(cleaned) || 0
                                                            } else {
                                                                price = Number(item.price) || 0
                                                            }
                                                            return (price * item.quantity).toFixed(2)
                                                        })()} total ({item.quantity} × ${(() => {
                                                            let price = 0
                                                            if (typeof item.price === 'string') {
                                                                const cleaned = item.price.replace(/[^0-9.]/g, '')
                                                                price = parseFloat(cleaned) || 0
                                                            } else {
                                                                price = Number(item.price) || 0
                                                            }
                                                            return price.toFixed(2)
                                                        })()})
                                                    </p>
                                                )}
                                                {(item.category === 'contact-lenses' || item.category === 'eye-hygiene' || (item as any).customization?.contactLens) && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {(() => {
                                                            const custom = (item as any).customization?.contactLens
                                                            if (custom) {
                                                                const rightQty = custom.right?.qty || 0
                                                                const leftQty = custom.left?.qty || 0
                                                                const unit = custom.unit || 'unit'
                                                                return `Right: ${rightQty} ${unit} | Left: ${leftQty} ${unit}`
                                                            }
                                                            return item.category === 'eye-hygiene' ? 'Eye Hygiene' : 'Contact Lens'
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
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

                                {/* Coupon Code Section */}
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Have a coupon code?</h3>
                                    {!appliedCoupon ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value.toUpperCase())
                                                    setCouponError('')
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleApplyCoupon()
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon || !couponCode.trim()}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                                            >
                                                {isApplyingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-sm font-semibold text-green-800">
                                                    {couponCode} Applied
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveCoupon}
                                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    {couponError && (
                                        <p className="mt-2 text-sm text-red-600">{couponError}</p>
                                    )}
                                </div>

                                {/* Shipping Method Selection */}
                                {shippingMethods.length > 0 && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('common.shipping')}</h3>
                                        {shippingLoading ? (
                                            <div className="text-sm text-gray-500">{t('shop.loadingShipping', 'Loading shipping options...')}</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {shippingMethods.map((method) => {
                                                    const isSelected = selectedShippingMethod?.id === method.id
                                                    return (
                                                        <label
                                                            key={method.id}
                                                            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'border-blue-600 bg-blue-50'
                                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="shippingMethod"
                                                                checked={isSelected}
                                                                onChange={() => setSelectedShippingMethod(method)}
                                                                className="mt-1 w-4 h-4 text-blue-950 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-900">{method.name}</span>
                                                                    <span className={`text-sm font-semibold ${method.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                                        {method.price === 0 ? t('shop.free', 'Free') : `$${method.price.toFixed(2)}`}
                                                                    </span>
                                                                </div>
                                                                {method.description && (
                                                                    <div className="text-xs text-gray-600 mt-0.5 truncate">{method.description}</div>
                                                                )}
                                                                {(method.estimated_days || method.estimatedDays) && (
                                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                                        {(method.estimated_days || method.estimatedDays)} {t('shop.businessDays', 'business days')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({getTotalItems()} items)</span>
                                        <span>${getSubtotal().toFixed(2)}</span>
                                    </div>
                                    {appliedCoupon && getDiscountAmount() > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-${getDiscountAmount().toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-700">
                                        <span>{t('common.shipping')}</span>
                                        <span className={selectedShippingMethod?.price === 0 ? 'text-green-600' : 'text-gray-900'}>
                                            {selectedShippingMethod ? (
                                                selectedShippingMethod.price === 0 ? (
                                                    t('shop.free', 'Free')
                                                ) : (
                                                    `$${selectedShippingMethod.price.toFixed(2)}`
                                                )
                                            ) : (
                                                t('shop.calculatedAtCheckout', 'Calculated at checkout')
                                            )}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900">
                                            <span>{t('common.total')}</span>
                                            <span>${getTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to="/checkout"
                                    className="block w-full text-center px-6 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 mb-4"
                                >
                                    {t('cart.proceedToCheckout')}
                                </Link>

                                <Link
                                    to="/shop"
                                    className="block w-full text-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-300"
                                >
                                    {t('cart.continueShopping')}
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

