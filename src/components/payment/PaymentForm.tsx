import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { confirmPayment } from '../../services/paymentsService'

interface PaymentFormProps {
  orderId: number
  clientSecret: string
}

/**
 * Payment Form Component (used inside Stripe Elements provider)
 */
const PaymentForm: React.FC<PaymentFormProps> = ({ orderId, clientSecret }) => {
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

      // Step 2: If payment intent exists and succeeded, confirm payment on backend
      if (paymentIntent && paymentIntent.status === 'succeeded' && paymentIntent.id) {
        // Confirm payment on backend to create/update transaction
        const confirmResult = await confirmPayment(paymentIntent.id)

        if (confirmResult) {
          // Payment successful! Transaction is created/updated automatically by backend
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
      } else if (paymentIntent && paymentIntent.status !== 'succeeded') {
        // Payment intent exists but not succeeded
        setError(`Payment status: ${paymentIntent.status}. Please try again or contact support.`)
        setIsProcessing(false)
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

export default PaymentForm

