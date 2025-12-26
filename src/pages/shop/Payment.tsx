import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getStripePromise } from '../../services/stripeService'
import { createPaymentIntent } from '../../services/paymentsService'

// Lazy load Stripe Elements and PaymentForm to avoid initialization issues
const StripeElementsWrapper = lazy(async () => {
  const { Elements } = await import('@stripe/react-stripe-js')
  return { default: Elements }
})
const PaymentForm = lazy(() => import('../../components/payment/PaymentForm'))

/**
 * Payment Page Component
 * Handles Stripe payment processing for an order
 */
const Payment: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get order ID from URL params
  const orderIdParam = searchParams.get('orderId')

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Validate order ID
        if (!orderIdParam) {
          setError('Order ID is required. Please return to checkout.')
          setLoading(false)
          return
        }

        const parsedOrderId = parseInt(orderIdParam, 10)
        if (isNaN(parsedOrderId)) {
          setError('Invalid order ID. Please return to checkout.')
          setLoading(false)
          return
        }

        setOrderId(parsedOrderId)

        // Initialize Stripe - get the promise for Elements component
        const stripePromiseValue = getStripePromise()
        if (!stripePromiseValue) {
          setError('Stripe is not configured. Please contact support.')
          setLoading(false)
          return
        }
        setStripePromise(stripePromiseValue)

        // Create payment intent
        const paymentIntent = await createPaymentIntent({
          order_id: parsedOrderId,
          currency: 'USD'
        })

        if (paymentIntent && paymentIntent.client_secret) {
          setClientSecret(paymentIntent.client_secret)
        } else {
          setError('Failed to initialize payment. Please try again or contact support.')
        }
      } catch (err: any) {
        console.error('Error initializing payment:', err)
        
        // Enhanced error handling as per documentation
        if (err.response?.status === 404) {
          // Order not found
          setError('Order not found. Please return to checkout and try again.')
        } else if (err.response?.status === 400) {
          // Order already paid or validation error
          const errorMessage = err.response.data?.message || 'This order may have already been paid.'
          setError(errorMessage)
          // Redirect to order page if already paid
          if (errorMessage && (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('paid'))) {
            setTimeout(() => {
              navigate(`/customer/orders/${parsedOrderId}`)
            }, 3000)
          }
        } else {
          setError(err.message || 'Failed to initialize payment. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [orderIdParam])

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
          <div className="w-[90%] mx-auto max-w-4xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">
              {t('payment.initializing', 'Initializing payment...')}
            </p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error || !clientSecret || !orderId || !stripePromise) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
          <div className="w-[90%] mx-auto max-w-4xl">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">
                {t('payment.error', 'Payment Error')}
              </h2>
              <p className="mb-4">{error || 'Failed to initialize payment.'}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('payment.backToCheckout', 'Back to Checkout')}
                </button>
                <button
                  onClick={() => navigate('/customer/orders')}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('payment.viewOrders', 'View Orders')}
                </button>
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
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>HOME</span>
            </button>
            <span className="text-gray-500">&gt;</span>
            <span className="text-gray-900">{t('payment.title', 'Payment')}</span>
          </nav>
        </div>
      </div>

      {/* Payment Content */}
      <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
        <div className="w-[90%] mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {t('payment.title', 'Complete Payment')}
          </h1>

          <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('payment.orderConfirmed', 'Order Confirmed')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('payment.orderId', 'Order ID')}: #{orderId}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              {t('payment.securePayment', 'Please complete your payment securely using the form below.')}
            </p>
          </div>

          {/* Stripe Elements Provider */}
          {stripePromise && clientSecret && (
            <Suspense fallback={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment form...</p>
              </div>
            }>
              <StripeElementsWrapper 
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm orderId={orderId} clientSecret={clientSecret} />
              </StripeElementsWrapper>
            </Suspense>
          )}

          {/* Security Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  {t('payment.secure', 'Secure Payment')}
                </p>
                <p className="text-sm text-blue-700">
                  {t('payment.secureDescription', 'Your payment is processed securely by Stripe. We never store your card details.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Payment


