/**
 * Contact Lens Forms Service
 * Handles API calls for contact lens forms system
 */

import { apiClient } from '../utils/api'
import { API_ROUTES } from '../config/apiRoutes'

// ============================================
// Type Definitions
// ============================================

export interface ContactLensFormConfig {
  formType: 'spherical' | 'astigmatism'
  subCategory: {
    id: number
    name: string
    slug: string
  }
  formFields: {
    rightEye: Record<string, FormField>
    leftEye: Record<string, FormField>
  }
  dropdownValues?: {
    power?: DropdownValue[]
    cylinder?: DropdownValue[]
    axis?: DropdownValue[]
  }
}

export interface FormField {
  type: 'number' | 'select'
  label: string
  required: boolean
  default?: number | string
  step?: number
  options?: Array<{ value: string; label: string }>
}

export interface DropdownValue {
  id: number
  field_type: 'power' | 'cylinder' | 'axis'
  value: string
  label: string
  eye_type: 'left' | 'right' | 'both' | null
  is_active: boolean
  sort_order: number
}

export interface SphericalConfig {
  id: number
  name: string
  sub_category_id: number
  right_qty: number[]
  right_base_curve: number[]
  right_diameter: number[]
  left_qty: number[]
  left_base_curve: number[]
  left_diameter: number[]
  price?: number
  display_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContactLensCheckoutRequest {
  product_id: number
  form_type: 'spherical' | 'astigmatism'
  right_qty: number
  right_base_curve: number
  right_diameter: number
  left_qty: number
  left_base_curve: number
  left_diameter: number
  // Astigmatism fields (optional)
  left_power?: string
  right_power?: string
  left_cylinder?: string
  right_cylinder?: string
  left_axis?: number
  right_axis?: number
}

export interface ContactLensCheckoutResponse {
  success: boolean
  message: string
  data: {
    item: {
      id: number
      product_id: number
      quantity: number
      contact_lens_right_qty: number
      contact_lens_right_base_curve: number
      contact_lens_right_diameter: number
      contact_lens_left_qty: number
      contact_lens_left_base_curve: number
      contact_lens_left_diameter: number
      contact_lens_left_power?: number
      contact_lens_right_power?: number
      customization?: {
        left_cylinder?: number
        right_cylinder?: number
        left_axis?: number
        right_axis?: number
      }
    }
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Get form configuration for a sub-sub-category
 * @param subCategoryId - The sub-sub-category ID (must have parent_id)
 */
export const getContactLensFormConfig = async (
  subCategoryId: number | string
): Promise<ContactLensFormConfig | null> => {
  try {
    // Ensure subCategoryId is a valid number (not a slug)
    const numericId = typeof subCategoryId === 'string' ? parseInt(subCategoryId, 10) : subCategoryId
    
    if (isNaN(numericId) || numericId <= 0) {
      console.error('Invalid sub-category ID provided:', subCategoryId, '- must be a positive number')
      return null
    }
    
    const response = await apiClient.get<ContactLensFormConfig>(
      API_ROUTES.CONTACT_LENS_FORMS.GET_CONFIG(numericId),
      false // Public endpoint
    )

    if (response.success && response.data) {
      return response.data
    }

    console.error('Failed to fetch contact lens form config:', response.message, {
      subCategoryId: numericId,
      error: response.error
    })
    return null
  } catch (error: any) {
    console.error('Error fetching contact lens form config:', error)
    if (error?.message) {
      console.error('Error details:', error.message)
    }
    return null
  }
}

/**
 * Get astigmatism dropdown values
 * @param fieldType - Optional filter by field type (power, cylinder, axis)
 * @param eyeType - Optional filter by eye type (left, right, both)
 */
export const getAstigmatismDropdownValues = async (
  fieldType?: 'power' | 'cylinder' | 'axis',
  eyeType?: 'left' | 'right' | 'both'
): Promise<DropdownValue[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: DropdownValue[] }>(
      API_ROUTES.CONTACT_LENS_FORMS.GET_ASTIGMATISM_DROPDOWN_VALUES(fieldType, eyeType),
      false // Public endpoint
    )

    if (response.success && response.data) {
      // Filter to only active values and sort by sort_order and value
      const values: DropdownValue[] = Array.isArray(response.data) ? response.data : []
      return values
        .filter((value: DropdownValue) => value.is_active)
        .sort((a: DropdownValue, b: DropdownValue) => {
          // First sort by sort_order
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order
          }
          // Then sort by value (numeric if possible)
          const numA = parseFloat(a.value)
          const numB = parseFloat(b.value)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.value.localeCompare(b.value)
        })
    }

    console.error('Failed to fetch astigmatism dropdown values:', response.message)
    return []
  } catch (error) {
    console.error('Error fetching astigmatism dropdown values:', error)
    return []
  }
}

/**
 * Get spherical configurations
 * @param subCategoryId - Optional filter by sub-sub-category ID
 */
export const getSphericalConfigs = async (
  subCategoryId?: number | string
): Promise<SphericalConfig[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: SphericalConfig[] }>(
      API_ROUTES.CONTACT_LENS_FORMS.GET_SPHERICAL_CONFIGS(subCategoryId),
      false // Public endpoint
    )

    if (response.success && response.data) {
      // Filter to only active configs
      const configs: SphericalConfig[] = Array.isArray(response.data) ? response.data : []
      return configs.filter((config: SphericalConfig) => config.is_active)
    }

    console.error('Failed to fetch spherical configs:', response.message)
    return []
  } catch (error) {
    console.error('Error fetching spherical configs:', error)
    return []
  }
}

/**
 * Add contact lens to cart (checkout)
 * @param request - Contact lens checkout request data
 */
export const addContactLensToCart = async (
  request: ContactLensCheckoutRequest
): Promise<ContactLensCheckoutResponse | null> => {
  try {
    const response = await apiClient.post<ContactLensCheckoutResponse>(
      API_ROUTES.CONTACT_LENS_FORMS.CHECKOUT,
      request,
      true // Requires authentication
    )

    if (response.success && response.data) {
      return response.data
    }

    console.error('Failed to add contact lens to cart:', response.message)
    return null
  } catch (error) {
    console.error('Error adding contact lens to cart:', error)
    return null
  }
}

