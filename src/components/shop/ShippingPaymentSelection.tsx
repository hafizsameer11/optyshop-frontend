import React, { useState } from 'react'

export interface ShippingOption {
  id: string
  name: string
  description?: string
  price: number
  estimatedDays?: string
}

export interface PaymentOption {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
}

interface ShippingPaymentSelectionProps {
  shippingOptions: ShippingOption[]
  paymentOptions: PaymentOption[]
  selectedShippingId?: string
  selectedPaymentId?: string
  onShippingSelect: (shippingId: string) => void
  onPaymentSelect: (paymentId: string) => void
  currency?: string
}

const ShippingPaymentSelection: React.FC<ShippingPaymentSelectionProps> = ({
  shippingOptions,
  paymentOptions,
  selectedShippingId,
  selectedPaymentId,
  onShippingSelect,
  onPaymentSelect,
  currency = '$'
}) => {
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const selectedShipping = shippingOptions.find(s => s.id === selectedShippingId)
  const selectedPayment = paymentOptions.find(p => p.id === selectedPaymentId)

  return (
    <div className="space-y-4">
      {/* Shipping Method */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Shipping Method
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowShippingModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors text-left"
          >
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="flex-1 text-gray-700">
              {selectedShipping ? selectedShipping.name : 'Choose shipping method...'}
            </span>
            <span className="text-blue-600 font-medium">Choose</span>
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors text-left"
          >
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="flex-1 text-gray-700">
              {selectedPayment ? selectedPayment.name : 'Choose payment method...'}
            </span>
            <span className="text-blue-600 font-medium">Choose</span>
          </button>
        </div>
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Choose Shipping Method</h3>
              <button
                onClick={() => setShowShippingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    onShippingSelect(option.id)
                    setShowShippingModal(false)
                  }}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selectedShippingId === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                      {option.estimatedDays && (
                        <div className="text-xs text-gray-500 mt-1">Est. {option.estimatedDays}</div>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {option.price > 0 ? `${currency}${option.price.toFixed(2)}` : 'Free'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Choose Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    onPaymentSelect(option.id)
                    setShowPaymentModal(false)
                  }}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selectedPaymentId === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div className="flex-shrink-0">{option.icon}</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.name}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                    </div>
                    {selectedPaymentId === option.id && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShippingPaymentSelection

