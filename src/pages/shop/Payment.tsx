import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getStripe } from '../../services/stripeService'
import { createPaymentIntent, confirmPayment } from '../../services/paymentsService'
import type { PaymentIntentData, ConfirmPaymentData } from '../../services/paymentsService'

/**
 * Payment Form Component (used inside Stripe Elements provider)
 */
const PaymentForm: React.FC<{ orderId: number; clientSecret: string }> = ({ orderId, clientSecret }) => {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  useEffect(() => {
    // Extract payment intent ID from client secret
    // Client secret format: pi_xxx_secret_xxx
    const match = clientSecret.match(/pi_([^_]+)/)
    if (match) {
      setPaymentIntentId(`pi_${match[1]}`)
    }
  }, [clientSecret])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe is not ready. Please wait a moment and try again.')
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Confirm payment with Stripe.js
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/customer/orders/${orderId}`,
        },
        redirect: 'if_required', // Only redirect if required (3D Secure)
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.')
        setIsProcessing(false)
        return
      }

      // Step 2: If payment intent exists, confirm payment on backend
      if (paymentIntent && paymentIntent.id) {
        // Confirm payment on backend to create transaction
        const confirmResult = await confirmPayment(paymentIntent.id)

        if (confirmResult) {
          // Payment successful! Transaction is created automatically by backend
          // Redirect to order detail page
          navigate(`/customer/orders/${orderId}`, {
            state: { paymentSuccess: true }
          })
        } else {
          // Payment succeeded with Stripe but backend confirmation failed
          // Still redirect but show warning
          console.warn('Payment succeeded with Stripe but backend confirmation failed')
          navigate(`/customer/orders/${orderId}`, {
            state: { 
              paymentSuccess: true,
              paymentWarning: 'Payment processed but transaction may not be recorded. Please contact support if you don\'t see a transaction record.'
            }
          })
        }
      } else {
        setError('Payment processing completed but no payment intent was returned. Please contact support.')
        setIsProcessing(false)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('payment.cardDetails', 'Card Details')}
        </h3>
        <div className="mb-4">
          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate(`/customer/orders/${orderId}`)}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-300 disabled:opacity-50"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-6 py-3 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing 
            ? t('payment.processing', 'Processing...') 
            : t('payment.payNow', 'Pay Now')}
        </button>
      </div>
    </form>
  )
}

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

        // Initialize Stripe
        const stripe = await getStripe()
        if (!stripe) {
          setError('Stripe is not configured. Please contact support.')
          setLoading(false)
          return
        }
        setStripePromise(Promise.resolve(stripe))

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
        setError(err.message || 'Failed to initialize payment. Please try again.')
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
          <Elements 
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <PaymentForm orderId={orderId} clientSecret={clientSecret} />
          </Elements>

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

