import React, { useState } from 'react'
import TreatmentSelection, { type TreatmentOption } from './TreatmentSelection'
import LensTypeSelection, { type LensTypeOption } from './LensTypeSelection'
import ShippingPaymentSelection, { type ShippingOption, type PaymentOption } from './ShippingPaymentSelection'
import {
  treatmentOptions,
  lensTypeOptions,
  shippingOptions,
  paymentOptions
} from '../../data/lensCustomizationData'

interface EnhancedLensCustomizationProps {
  onComplete?: (customization: LensCustomizationData) => void
  currency?: string
}

export interface LensCustomizationData {
  treatment?: string
  lensType?: string
  lensColor?: string
  shippingMethod?: string
  paymentMethod?: string
}

const EnhancedLensCustomization: React.FC<EnhancedLensCustomizationProps> = ({
  onComplete,
  currency = '€'
}) => {
  const [currentStep, setCurrentStep] = useState<'treatment' | 'lensType' | 'shippingPayment'>('treatment')
  const [selectedTreatment, setSelectedTreatment] = useState<string>()
  const [selectedLensType, setSelectedLensType] = useState<string>()
  const [selectedColor, setSelectedColor] = useState<string>()
  const [selectedShipping, setSelectedShipping] = useState<string>()
  const [selectedPayment, setSelectedPayment] = useState<string>()

  const handleTreatmentSelect = (treatmentId: string) => {
    setSelectedTreatment(treatmentId)
    // Auto-advance to next step after selection
    setTimeout(() => setCurrentStep('lensType'), 300)
  }

  const handleLensTypeSelect = (lensTypeId: string) => {
    setSelectedLensType(lensTypeId)
  }

  const handleColorSelect = (lensTypeId: string, colorId: string) => {
    setSelectedLensType(lensTypeId)
    setSelectedColor(colorId)
  }

  const handleShippingSelect = (shippingId: string) => {
    setSelectedShipping(shippingId)
  }

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPayment(paymentId)
    // Complete customization
    if (onComplete) {
      onComplete({
        treatment: selectedTreatment,
        lensType: selectedLensType,
        lensColor: selectedColor,
        shippingMethod: selectedShipping,
        paymentMethod: paymentId
      })
    }
  }

  const handleNext = () => {
    if (currentStep === 'treatment') {
      setCurrentStep('lensType')
    } else if (currentStep === 'lensType') {
      setCurrentStep('shippingPayment')
    }
  }

  const handleBack = () => {
    if (currentStep === 'lensType') {
      setCurrentStep('treatment')
    } else if (currentStep === 'shippingPayment') {
      setCurrentStep('lensType')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'treatment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            currentStep === 'lensType' || currentStep === 'shippingPayment' ? 'bg-blue-600' : 'bg-gray-200'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'lensType' ? 'bg-blue-600 text-white' : 
            currentStep === 'shippingPayment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${
            currentStep === 'shippingPayment' ? 'bg-blue-600' : 'bg-gray-200'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'shippingPayment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Treatment Selection Step */}
      {currentStep === 'treatment' && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Treatment</h2>
          </div>
          <TreatmentSelection
            treatments={treatmentOptions as TreatmentOption[]}
            selectedTreatment={selectedTreatment}
            onSelect={handleTreatmentSelect}
            currency={currency}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedTreatment}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lens Type Selection Step */}
      {currentStep === 'lensType' && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Lens Type & Color</h2>
          </div>
          <LensTypeSelection
            lensTypes={lensTypeOptions as LensTypeOption[]}
            selectedLensTypeId={selectedLensType}
            selectedColorId={selectedColor}
            onSelectLensType={handleLensTypeSelect}
            onSelectColor={handleColorSelect}
            currency={currency}
          />
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedLensType || !selectedColor}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Shipping & Payment Step */}
      {currentStep === 'shippingPayment' && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Shipping & Payment</h2>
          </div>
          <ShippingPaymentSelection
            shippingOptions={shippingOptions as ShippingOption[]}
            paymentOptions={paymentOptions as PaymentOption[]}
            selectedShippingId={selectedShipping}
            selectedPaymentId={selectedPayment}
            onShippingSelect={handleShippingSelect}
            onPaymentSelect={handlePaymentSelect}
            currency={currency}
          />
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add Comments About Your Order
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Any special instructions or notes for your order..."
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedLensCustomization

