/**
 * Eye Hygiene Forms Service
 * Handles API calls for Eye Hygiene product forms
 */

import { apiClient } from '../utils/api'
import { API_ROUTES } from '../config/apiRoutes'

// ============================================
// Type Definitions
// ============================================

export interface EyeHygieneFormConfig {
  subCategory: {
    id: number
    name: string
    slug: string
  }
  formFields: {
    size_volume?: {
      type: 'select'
      label: string
      options: Array<{ value: string; label: string }>
    }
    pack_type?: {
      type: 'select'
      label: string
      options: Array<{ value: string; label: string }>
    }
    quantity?: {
      type: 'number'
      label: string
      min?: number
      max?: number
    }
  }
  dropdownValues?: {
    size_volume?: Array<{ value: string; label: string }>
    pack_type?: Array<{ value: string; label: string }>
  }
}

export interface EyeHygieneOptions {
  size_volume: string[]
  pack_type: string[]
}

export interface EyeHygieneOptionsResponse {
  success: boolean
  message: string
  data: {
    size_volume?: string[]
    pack_type?: string[]
  }
}

export interface SizeVolumeVariant {
  id: number
  product_id: number
  size_volume: string
  pack_type?: string | null
  price: string | number
  compare_at_price?: string | number | null
  cost_price?: string | number | null
  stock_quantity: number
  stock_status: 'in_stock' | 'out_of_stock' | 'backorder'
  sku?: string | null
  expiry_date?: string | null
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  images?: string[] // Variant-specific images
}

export interface SizeVolumeVariantsResponse {
  success: boolean
  message: string
  data: {
    product_id: number
    variants: SizeVolumeVariant[]
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Get Eye Hygiene form configuration by subcategory ID
 */
export async function getEyeHygieneFormConfig(
  subCategoryId: number | string
): Promise<EyeHygieneFormConfig | null> {
  try {
    const response = await apiClient.get<EyeHygieneFormConfig>(
      API_ROUTES.EYE_HYGIENE_FORMS.GET_CONFIG(subCategoryId),
      false // PUBLIC endpoint
    )

    if (response.success && response.data) {
      return response.data
    }

    console.error('Failed to fetch Eye Hygiene form config:', response.message)
    return null
  } catch (error) {
    console.error('Error fetching Eye Hygiene form config:', error)
    return null
  }
}

/**
 * Get Eye Hygiene dropdown options
 */
export async function getEyeHygieneOptions(
  subCategoryId?: number | string
): Promise<EyeHygieneOptions | null> {
  try {
    const response = await apiClient.get<EyeHygieneOptionsResponse>(
      API_ROUTES.EYE_HYGIENE_FORMS.GET_OPTIONS(subCategoryId),
      false // PUBLIC endpoint
    )

    if (response.success && response.data) {
      return {
        size_volume: response.data.size_volume || [],
        pack_type: response.data.pack_type || []
      }
    }

    console.error('Failed to fetch Eye Hygiene options:', response.message)
    return null
  } catch (error) {
    console.error('Error fetching Eye Hygiene options:', error)
    return null
  }
}

/**
 * Get size/volume variants for a product
 * GET /api/products/:productId/size-volume-variants
 */
export async function getSizeVolumeVariants(
  productId: number | string
): Promise<SizeVolumeVariant[] | null> {
  try {
    const response = await apiClient.get<SizeVolumeVariantsResponse>(
      API_ROUTES.EYE_HYGIENE_FORMS.GET_VARIANTS(productId),
      false // PUBLIC endpoint
    )

    if (response.success && response.data && Array.isArray(response.data.variants)) {
      if (import.meta.env.DEV) {
        console.log('✅ Size/Volume Variants loaded:', {
          productId,
          count: response.data.variants.length,
          variants: response.data.variants
        })
      }
      return response.data.variants
    }

    console.error('Failed to fetch size/volume variants:', response.message)
    return null
  } catch (error) {
    console.error('Error fetching size/volume variants:', error)
    return null
  }
}

