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

