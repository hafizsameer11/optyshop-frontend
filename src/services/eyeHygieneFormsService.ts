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
  data?: {
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
  image_url?: string | null
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  images?: string[] // Variant-specific images
}

export interface SizeVolumeVariantsResponse {
  success: boolean
  message: string
  data?: {
    product_id: number
    variants?: SizeVolumeVariant[]
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
      const data = response.data as any;
      return {
        size_volume: data?.size_volume || [],
        pack_type: data?.pack_type || []
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

    if (response.success && response.data) {
      const data = response.data as any;
      if (data.variants && Array.isArray(data.variants)) {
        if (import.meta.env.DEV) {
          console.log('✅ Size/Volume Variants loaded:', {
            productId,
            count: data.variants.length,
            variants: data.variants
          })
        }
        return data.variants
      }
    }

    // Handle 500 errors and other server issues gracefully
    if (response.error && (response.error.includes('500') || response.error.includes('Internal Server Error'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Size-volume variants endpoint not available for product ${productId}. Backend may not have this feature implemented.`)
      }
      // Return empty array instead of null to prevent frontend crashes
      return []
    }

    // Handle other API errors quietly
    if (response.error) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Size-volume variants API error for product ${productId}:`, response.error)
      }
      return []
    }

    // Handle case where API returns success but no data
    if (!response.data) {
      if (import.meta.env.DEV) {
        console.log(`ℹ️ No size-volume variants data available for product ${productId}`)
      }
      return []
    }

    return null
  } catch (error: any) {
    // Check if it's a network error or 500 error
    if (error.message && (error.message.includes('500') || error.message.includes('Internal Server Error'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Size-volume variants endpoint not available for product ${productId}. Backend may not have this feature implemented.`)
      }
      // Return empty array instead of null to prevent frontend crashes
      return []
    }
    
    // Handle network errors quietly
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Network error fetching size-volume variants for product ${productId}. Using fallback.`)
      }
      return []
    }
    
    // Other errors - only log in development
    if (import.meta.env.DEV) {
      console.error(`Unexpected error fetching size-volume variants for product ${productId}:`, error)
    }
    return null
  }
}

