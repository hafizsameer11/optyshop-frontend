import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { applyCoupon, type CouponDiscount, type CartItemForCoupon } from '../../services/couponsService'
import { createOrder, createGuestOrder, type OrderCartItem } from '../../services/ordersService'
import { createPaymentIntent } from '../../services/paymentsService'
import { getShippingMethods, type ShippingMethod } from '../../services/shippingMethodsService'
import DynamicFormField from '../../components/checkout/DynamicFormField'
import { defaultCheckoutFormConfig, type CheckoutFormConfig } from '../../config/checkoutFormConfig'

interface CheckoutProps {
    formConfig?: CheckoutFormConfig // Allow custom form configuration
}

const Checkout: React.FC<CheckoutProps> = ({ formConfig = defaultCheckoutFormConfig }) => {
    const { t } = useTranslation()
    const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart()
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            // Store the checkout URL to redirect back after login
            navigate('/login?redirect=/checkout', { replace: true })
        }
    }, [isAuthenticated, authLoading, navigate])
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
    const [couponError, setCouponError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    
    // Shipping and Payment methods
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
    const [shippingLoading, setShippingLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<string>('stripe')
    
    // Initialize form data from configuration
    const initializeFormData = () => {
        const data: Record<string, string> = {}
        formConfig.shippingSection.fields.forEach(field => {
            data[field.name] = ''
        })
        formConfig.paymentSection.fields.forEach(field => {
            data[field.name] = ''
        })
        if (formConfig.billingSection) {
            formConfig.billingSection.fields.forEach(field => {
                data[field.name] = ''
            })
        }
        return data
    }
    
    const [formData, setFormData] = useState(initializeFormData())

    // Fetch shipping methods on component mount
    useEffect(() => {
        const fetchShippingMethods = async () => {
            setShippingLoading(true)
            try {
                console.log('🔄 [API] Fetching shipping methods: GET /api/shipping-methods')
                // Public endpoint returns active methods by default
                const methods = await getShippingMethods()
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleFieldChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validateField = (field: typeof formConfig.shippingSection.fields[0], value: string): string | null => {
        if (field.required && !value.trim()) {
            return `${field.label} is required`
        }
        
        if (field.validation?.pattern && value) {
            const regex = new RegExp(field.validation.pattern)
            if (!regex.test(value)) {
                return field.validation.patternMessage || `Invalid ${field.label}`
            }
        }
        
        if (field.validation?.minLength && value.length < field.validation.minLength) {
            return `${field.label} must be at least ${field.validation.minLength} characters`
        }
        
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            return `${field.label} must be no more than ${field.validation.maxLength} characters`
        }
        
        return null
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code')
            return
        }

        setIsApplyingCoupon(true)
        setCouponError('')

        // Convert cart items to API format
        const cartItemsForCoupon: CartItemForCoupon[] = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price
        }))

        const subtotal = getTotalPrice()
        const result = await applyCoupon(couponCode, subtotal, cartItemsForCoupon)

        if (result) {
            setAppliedCoupon(result)
            setCouponError('')
        } else {
            setAppliedCoupon(null)
            setCouponError('Invalid or expired coupon code')
        }

        setIsApplyingCoupon(false)
    }

    const handleRemoveCoupon = () => {
        setCouponCode('')
        setAppliedCoupon(null)
        setCouponError('')
    }

    // Calculate shipping price from selected shipping method
    const getShippingPrice = () => {
        if (selectedShippingMethod) {
            return Number(selectedShippingMethod.price || 0)
        }
        return 0
    }

    const getFinalTotal = () => {
        const subtotal = appliedCoupon ? appliedCoupon.final_total : getTotalPrice()
        const shippingPrice = getShippingPrice()
        return subtotal + shippingPrice
    }

    const getDiscountAmount = () => {
        if (appliedCoupon) {
            return appliedCoupon.discount_amount
        }
        return 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Require authentication before proceeding
        if (!isAuthenticated) {
            setError('Please login to complete your order. Redirecting to login page...')
            setTimeout(() => {
                navigate('/login?redirect=/checkout')
            }, 2000)
            return
        }
        
        setIsProcessing(true)
        setError(null)

        // Validate cart has items
        if (cartItems.length === 0) {
            setError(t('checkout.emptyCartError'))
            setIsProcessing(false)
            return
        }

        // Validate all form fields
        const errors: Record<string, string> = {}
        const allFields = [
            ...formConfig.shippingSection.fields,
            ...formConfig.paymentSection.fields,
            ...(formConfig.billingSection?.fields || []),
        ]

        allFields.forEach((field) => {
            const value = formData[field.name] || ''
            const fieldError = validateField(field, value)
            if (fieldError) {
                errors[field.name] = fieldError
            }
        })

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            setError('Please fix the errors in the form before submitting.')
            setIsProcessing(false)
            return
        }

        try {
            // Map cart items to order format - backend requires items
            const orderItems = cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                // Include any additional product customization if available
                lens_index: (item as any).lens_index,
                lens_coating: (item as any).lens_coating,
                lens_coatings: (item as any).lens_coatings,
                prescription_id: (item as any).prescription_id || null,
                frame_size_id: (item as any).frame_size_id || null,
                customization: (item as any).customization || null,
            }))

            // Validate that we have valid cart items
            if (orderItems.length === 0 || orderItems.some(item => !item.product_id || item.quantity <= 0)) {
                setError('Invalid cart items. Please refresh and try again.')
                setIsProcessing(false)
                return
            }

            // REQUIRE AUTHENTICATION - Orders can only be created by authenticated users
            if (!isAuthenticated) {
                setError('You must be logged in to complete your order. Redirecting to login...')
                setIsProcessing(false)
                setTimeout(() => {
                    navigate('/login?redirect=/checkout')
                }, 2000)
                return
            }

            // User is authenticated, create order via API
            if (isAuthenticated) {
                // Map form data using configuration field names
                const getFieldValue = (fieldName: string) => formData[fieldName] || ''

                const orderData = {
                    items: orderItems, // Backend accepts 'items' or 'cart_items'
                    shipping_address: {
                        first_name: getFieldValue('firstName'),
                        last_name: getFieldValue('lastName'),
                        email: getFieldValue('email'),
                        phone: getFieldValue('phone'),
                        address: getFieldValue('address'),
                        city: getFieldValue('city'),
                        zip_code: getFieldValue('zipCode'),
                        country: getFieldValue('country'),
                    },
                    billing_address: {
                        first_name: getFieldValue('firstName'),
                        last_name: getFieldValue('lastName'),
                        email: getFieldValue('email'),
                        phone: getFieldValue('phone'),
                        address: getFieldValue('address'),
                        city: getFieldValue('city'),
                        zip_code: getFieldValue('zipCode'),
                        country: getFieldValue('country'),
                    },
                    payment_method: (paymentMethod || 'stripe').toLowerCase(), // Backend expects lowercase (stripe, paypal, cod)
                    shipping_method_id: selectedShippingMethod?.id,
                    coupon_code: appliedCoupon ? couponCode : undefined,
                }

                const order = await createOrder(orderData)
                
                if (order) {
                    // Backend automatically clears cart when order is created
                    // No need to manually clear cart
                    
                    // If payment method is Stripe, redirect to payment page
                    if (paymentMethod && paymentMethod.toLowerCase() === 'stripe') {
                        navigate(`/payment?orderId=${order.id}`)
                        return
                    }
                    
                    // For other payment methods (PayPal, COD), show success
                    setOrderNumber(order.order_number)
                    setIsCompleted(true)
                } else {
                    setError('Failed to create order. Please try again.')
                    setIsProcessing(false)
                }
            } else {
                // For guest users, the backend requires authentication for order creation
                // Prompt user to login or register
                setError('Please login or create an account to complete your order. Guest checkout is not available.')
                setIsProcessing(false)
                
                // Optionally redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login?redirect=/checkout')
                }, 3000)
                
                // Alternative: Try to create guest order anyway (if backend supports it in future)
                // Uncomment below if backend adds guest order support
                /*
                const getFieldValue = (fieldName: string) => formData[fieldName] || ''

                const guestOrderData = {
                    cart_items: orderCartItems,
                    first_name: getFieldValue('firstName'),
                    last_name: getFieldValue('lastName'),
                    email: getFieldValue('email'),
                    phone: getFieldValue('phone'),
                    address: getFieldValue('address'),
                    city: getFieldValue('city'),
                    zip_code: getFieldValue('zipCode'),
                    country: getFieldValue('country'),
                    coupon_code: appliedCoupon ? couponCode : undefined,
                    payment_info: {
                        payment_method: 'CARD',
                        card_number: getFieldValue('cardNumber').replace(/\s/g, ''),
                        cardholder_name: getFieldValue('cardName'),
                        expiry_date: getFieldValue('expiryDate'),
                        cvv: getFieldValue('cvv'),
                    },
                }

                const order = await createGuestOrder(guestOrderData)
                
                if (order) {
                    setOrderNumber(order.order_number)
                    setIsCompleted(true)
                    await clearCart()
                } else {
                    setError('Failed to create order. Please login or try again.')
                    setIsProcessing(false)
                }
                */
            }
        } catch (error: any) {
            console.error('Error creating order:', error)
            
            // Enhanced error handling as per documentation
            if (error.response?.status === 400) {
                // Validation error
                setError(error.response.data?.message || 'Please check your order details and try again.')
            } else if (error.response?.status === 401) {
                // Unauthorized - redirect to login
                setError('Your session has expired. Please login again.')
                setTimeout(() => {
                    navigate('/login?redirect=/checkout')
                }, 2000)
            } else {
                // Other errors
                setError(error.message || 'Failed to create order. Please try again.')
            }
            
            setIsProcessing(false)
        }
    }

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    // REQUIRE AUTHENTICATION - Show message and redirect if not logged in
    if (!isAuthenticated) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl text-center">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Login Required:</strong> You must be logged in to complete your order.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Login to Complete Order
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Please login or create an account to proceed with checkout.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/login?redirect=/checkout"
                                className="inline-block px-8 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register?redirect=/checkout"
                                className="inline-block px-8 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors duration-300"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    if (cartItems.length === 0 && !isCompleted) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t('cart.empty')}
                        </h1>
                        <Link
                            to="/shop"
                            className="inline-block px-8 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300"
                        >
                            {t('cart.continueShopping')}
                        </Link>
                    </div>
                </section>
                <Footer />
            </div>
        )
    }

    if (isCompleted) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-4xl">
                        <div className="text-center space-y-6 md:space-y-8">
                            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                Order Placed Successfully!
                            </h1>
                            {orderNumber && (
                                <p className="text-lg text-gray-700 font-semibold">
                                    Order Number: {orderNumber}
                                </p>
                            )}
                            <p className="text-lg text-gray-600">
                                Thank you for your purchase. Your order has been confirmed.
                            </p>
                            <p className="text-base text-gray-500">
                                You will receive an email confirmation shortly.
                            </p>
                            <div className="flex gap-4 justify-center">
                                {isAuthenticated && (
                                    <Link
                                        to="/customer/orders"
                                        className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300"
                                    >
                                        View Orders
                                    </Link>
                                )}
                                <Link
                                    to="/shop"
                                    className="inline-block px-8 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300"
                                >
                                    {t('cart.continueShopping')}
                                </Link>
                            </div>
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
                        <Link to="/cart" className="hover:text-gray-700 transition-colors">
                            CART
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">CHECKOUT</span>
                    </nav>
                </div>
            </div>

            {/* Checkout Content */}
            <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                        Checkout
                    </h1>

                    {/* Guest User Notice */}
                    {!isAuthenticated && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm text-blue-800 font-medium mb-1">
                                        Account Required
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Please{' '}
                                        <Link to="/login?redirect=/checkout" className="underline font-semibold hover:text-blue-900">
                                            login
                                        </Link>
                                        {' '}or{' '}
                                        <Link to="/register?redirect=/checkout" className="underline font-semibold hover:text-blue-900">
                                            create an account
                                        </Link>
                                        {' '}to complete your order.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Shipping Information - Dynamic Fields */}
                                <div className="bg-white rounded-xl p-6 md:p-8 shadow-md">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                        {formConfig.shippingSection.title}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {formConfig.shippingSection.fields.map((field) => (
                                            <DynamicFormField
                                                key={field.name}
                                                field={field}
                                                value={formData[field.name] || ''}
                                                onChange={handleFieldChange}
                                                error={fieldErrors[field.name]}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Information - Dynamic Fields */}
                                <div className="bg-white rounded-xl p-6 md:p-8 shadow-md">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                        {formConfig.paymentSection.title}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {formConfig.paymentSection.fields.map((field) => (
                                            <DynamicFormField
                                                key={field.name}
                                                field={field}
                                                value={formData[field.name] || ''}
                                                onChange={handleFieldChange}
                                                error={fieldErrors[field.name]}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Billing Information - Optional Dynamic Fields */}
                                {formConfig.showBillingSection && formConfig.billingSection && (
                                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-md">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                            {formConfig.billingSection.title}
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            {formConfig.billingSection.fields.map((field) => (
                                                <DynamicFormField
                                                    key={field.name}
                                                    field={field}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleFieldChange}
                                                    error={fieldErrors[field.name]}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex gap-4">
                                    <Link
                                        to="/cart"
                                        className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-300 text-center"
                                    >
                                        Back to Cart
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isProcessing || !isAuthenticated}
                                        className="flex-1 px-6 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {!isAuthenticated 
                                            ? 'Login to Place Order' 
                                            : isProcessing 
                                                ? 'Processing...' 
                                                : `Place Order ($${Number(getFinalTotal()).toFixed(2)})`}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-md sticky top-4">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200">
                                            {/* 
                                                Image Priority (per API documentation):
                                                1. display_image - From API, shows selected color variant image if color was selected
                                                2. customization.variant_images[0] - Fallback for local cart items
                                                3. item.image - Final fallback
                                            */}
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                <img
                                                    src={
                                                        // Priority: display_image (from API) > variant_images > item.image
                                                        (item as any).display_image ||
                                                        (item.customization as any)?.variant_images?.[0] || 
                                                        item.image
                                                    }
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-1"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/assets/images/frame1.png'
                                                    }}
                                                />
                                                {/* Lens Color Image Indicator (if applicable) */}
                                                {(item as any).lens_color_image && (
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border border-white shadow-sm overflow-hidden">
                                                        <img
                                                            src={(item as any).lens_color_image}
                                                            alt="Lens color"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.style.display = 'none'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    {item.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="text-sm font-semibold text-blue-950">
                                                    ${(Number(item.price || 0) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

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

                                <div className="space-y-3 border-t border-gray-200 pt-4">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal ({getTotalItems()} items)</span>
                                        <span>${getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    {appliedCoupon && getDiscountAmount() > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-${Number(getDiscountAmount()).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {/* Shipping Method Selection */}
                                    {shippingMethods.length > 0 && (
                                        <div className="pt-4 border-t border-gray-200 mt-4">
                                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                {t('common.shipping')}
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {shippingMethods.map((method) => (
                                                    <label
                                                        key={method.id}
                                                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                                            selectedShippingMethod?.id === method.id
                                                                ? 'border-blue-600 bg-blue-50'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="shipping-method"
                                                            checked={selectedShippingMethod?.id === method.id}
                                                            onChange={() => setSelectedShippingMethod(method)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900">{method.name}</div>
                                                                    {method.description && (
                                                                        <div className="text-xs text-gray-600 mt-0.5 truncate">{method.description}</div>
                                                                    )}
                                                                    {(method.estimated_days || method.estimatedDays) && (
                                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                                            {(method.estimated_days || method.estimatedDays)} {t('shop.businessDays', 'business days')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-2">
                                                                    {method.price === 0 ? (
                                                                        <span className="text-green-600">{t('shop.free', 'Free')}</span>
                                                                    ) : (
                                                                        `$${method.price.toFixed(2)}`
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {shippingLoading && (
                                        <div className="pt-4 border-t border-gray-200 mt-4">
                                            <div className="text-sm text-gray-500">{t('shop.loadingShipping', 'Loading shipping options...')}</div>
                                        </div>
                                    )}

                                    {/* Payment Method Selection */}
                                    <div className="pt-4 border-t border-gray-200 mt-4">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            {t('shop.paymentMethod', 'Payment Method')}
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'stripe', name: 'Credit/Debit Card', description: 'Pay securely with Stripe', icon: '💳' },
                                                { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal account', icon: '🔵' },
                                                { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '💵' }
                                            ].map((method) => (
                                                <label
                                                    key={method.id}
                                                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                                        paymentMethod === method.id
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment-method"
                                                        value={method.id}
                                                        checked={paymentMethod === method.id}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-lg">{method.icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900">{method.name}</div>
                                                                    {method.description && (
                                                                        <div className="text-xs text-gray-600 mt-0.5">{method.description}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shipping Cost Display */}
                                    {selectedShippingMethod && (
                                        <div className="flex justify-between items-center text-gray-700 pt-2">
                                            <div className="flex flex-col">
                                                <span>Shipping</span>
                                                {selectedShippingMethod.name && (
                                                    <span className="text-xs text-gray-500">
                                                        {selectedShippingMethod.name}
                                                        {(selectedShippingMethod.estimated_days || selectedShippingMethod.estimatedDays) && (
                                                            <span className="ml-1">
                                                                ({(selectedShippingMethod.estimated_days || selectedShippingMethod.estimatedDays)} {t('shop.businessDays', 'business days')})
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={getShippingPrice() === 0 ? 'text-green-600 font-medium' : 'text-gray-900 font-medium'}>
                                                {getShippingPrice() === 0 ? 'Free' : `$${getShippingPrice().toFixed(2)}`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                                        <span>Total</span>
                                        <span>${Number(getFinalTotal()).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default Checkout

