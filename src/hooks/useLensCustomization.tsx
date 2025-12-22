/**
 * Hook for fetching lens customization data from API
 * Transforms API data to match component interfaces
 */

import React, { useState, useEffect } from 'react'
import { getLensOptions, getLensOptionById, type LensOption, type LensColor } from '../services/lensOptionsService'
import { getLensTreatments, type LensTreatment } from '../services/lensTreatmentsService'
import { getShippingMethods, type ShippingMethod } from '../services/shippingMethodsService'
import type { TreatmentOption } from '../components/shop/TreatmentSelection'
import type { LensTypeOption, ColorSwatch } from '../components/shop/LensTypeSelection'
import type { ShippingOption, PaymentOption } from '../components/shop/ShippingPaymentSelection'
import { paymentOptions } from '../data/lensCustomizationData' // Keep static payment options for now

interface UseLensCustomizationReturn {
  treatments: TreatmentOption[]
  lensTypes: LensTypeOption[]
  shippingOptions: ShippingOption[]
  paymentOptions: PaymentOption[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Transform API lens treatment to component format
 */
const transformTreatment = (treatment: LensTreatment): TreatmentOption => {
  // Default icons - you can enhance this to use treatment.icon if available
  const iconMap: Record<string, React.ReactNode> = {
    scratch_proof: (
      <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    anti_glare: (
      <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      </svg>
    ),
    blue_light_anti_glare: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" strokeWidth={2} />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
    photochromic: (
      <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  }

  return {
    id: String(treatment.id),
    name: treatment.name,
    price: treatment.price,
    icon: iconMap[treatment.type] || iconMap.scratch_proof,
    description: treatment.description,
  }
}

/**
 * Transform API lens color to component format
 */
const transformColor = (color: LensColor): ColorSwatch => {
  // Support both camelCase and snake_case field names
  const hexCode = color.hexCode || color.hex_code;
  const colorCode = color.colorCode || color.color_code;
  
  return {
    id: String(color.id),
    name: color.name,
    color: hexCode || colorCode || '#000000',
    gradient: false, // Can be enhanced to detect gradients
  }
}

/**
 * Transform API lens option to component format
 */
const transformLensOption = (option: LensOption): LensTypeOption => {
  // Support both camelCase and snake_case field names
  const basePrice = option.basePrice !== undefined ? option.basePrice : option.base_price;
  const isActive = option.isActive !== undefined ? option.isActive : option.is_active;
  
  // Filter colors - support both camelCase and snake_case
  const colors: ColorSwatch[] = (option.colors || [])
    .filter(c => {
      const colorIsActive = c.isActive !== undefined ? c.isActive : c.is_active;
      return colorIsActive !== false; // Include if active or undefined (default to active)
    })
    .map(transformColor)

  return {
    id: String(option.id),
    name: option.name,
    description: option.description || '',
    price: basePrice,
    priceLabel: basePrice && basePrice > 0 
      ? `+$${basePrice.toFixed(2)}` 
      : 'Free',
    colors,
  }
}

/**
 * Transform API shipping method to component format
 */
const transformShippingMethod = (method: ShippingMethod): ShippingOption => {
  return {
    id: String(method.id),
    name: method.name,
    description: method.description,
    price: method.price,
    estimatedDays: method.estimated_days 
      ? `${method.estimated_days} business days`
      : undefined,
  }
}

/**
 * Hook to fetch and transform lens customization data
 */
export const useLensCustomization = (): UseLensCustomizationReturn => {
  const [treatments, setTreatments] = useState<TreatmentOption[]>([])
  const [lensTypes, setLensTypes] = useState<LensTypeOption[]>([])
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all data in parallel
      const [treatmentsData, lensOptionsData, shippingData] = await Promise.all([
        getLensTreatments({ isActive: true }),
        getLensOptions({ isActive: true }),
        getShippingMethods({ isActive: true }),
      ])

      // Transform and set treatments
      if (treatmentsData) {
        setTreatments(treatmentsData.map(transformTreatment))
      }

      // Transform and set lens types
      if (lensOptionsData) {
        // Check if colors are already included in the list response
        const hasColors = lensOptionsData.some(opt => opt.colors && opt.colors.length > 0)
        
        let optionsWithColors = lensOptionsData
        
        // Only fetch individual options if colors are not included
        if (!hasColors && lensOptionsData.length > 0) {
          console.log('🔄 [Hook] Colors not in list response, fetching individual options...')
          // Fetch full details for each option to get colors
          optionsWithColors = await Promise.all(
            lensOptionsData.map(async (option) => {
              const fullOption = await getLensOptionById(option.id)
              return fullOption || option
            })
          )
        } else {
          console.log('✅ [Hook] Colors already included in list response')
        }
        
        setLensTypes(optionsWithColors.map(transformLensOption))
      }

      // Transform and set shipping options
      if (shippingData) {
        setShippingOptions(shippingData.map(transformShippingMethod))
      }
    } catch (err) {
      console.error('Error fetching lens customization data:', err)
      setError('Failed to load customization options')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    treatments,
    lensTypes,
    shippingOptions,
    paymentOptions, // Keep static for now
    loading,
    error,
    refetch: fetchData,
  }
}

export default useLensCustomization

