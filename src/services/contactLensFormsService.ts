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
    qty?: DropdownValue[]
    base_curve?: DropdownValue[]
    diameter?: DropdownValue[]
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
  field_type: 'qty' | 'base_curve' | 'diameter' | 'power' | 'cylinder' | 'axis'
  value: string
  label: string
  eye_type: 'left' | 'right' | 'both' | null
  is_active: boolean
  sort_order: number
}

export interface SphericalConfig {
  id: number
  name: string
  sub_category_id?: number
  subCategory?: {
    id: number
    name: string
    slug: string
  }
  right_qty: number[] | string[]
  right_base_curve: number[] | string[]
  right_diameter: number[] | string[]
  right_power?: number[] | string[] | null
  left_qty: number[] | string[]
  left_base_curve: number[] | string[]
  left_diameter: number[] | string[]
  left_power?: number[] | string[] | null
  price?: number | string
  display_name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface AstigmatismConfig {
  id: number
  name: string
  slug?: string | null
  sku?: string | null
  description?: string | null
  short_description?: string | null
  price: string | number
  compare_at_price?: string | number | null
  cost_price?: string | number | null
  stock_quantity?: number
  stock_status?: string
  images?: string | string[] | null
  color_images?: string | null
  frame_shape?: string | null
  frame_material?: string | null
  frame_color?: string | null
  gender?: string
  lens_type?: string | null
  category_id?: number
  sub_category_id?: number
  product_id?: number | null
  configuration_type: 'astigmatism'
  spherical_lens_type?: string | null
  right_qty: number[] | string[]
  right_base_curve: number[] | string[]
  right_diameter: number[] | string[]
  right_power: number[] | string[]
  right_cylinder: number[] | string[]
  right_axis: number[] | string[]
  left_qty: number[] | string[]
  left_base_curve: number[] | string[]
  left_diameter: number[] | string[]
  left_power: number[] | string[]
  left_cylinder: number[] | string[]
  left_axis: number[] | string[]
  display_name?: string
  is_active?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
  subCategory?: {
    id: number
    name: string
    slug: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
}

export interface ContactLensCheckoutRequest {
  product_id: number
  form_type: 'spherical' | 'astigmatism'
  right_qty: string | number  // API expects string, but we accept both for flexibility
  right_base_curve: string | number  // API expects string
  right_diameter: string | number  // API expects string
  left_qty: string | number  // API expects string
  left_base_curve: string | number  // API expects string
  left_diameter: string | number  // API expects string
  // Power is required for both Spherical and Astigmatism
  right_power: string
  left_power: string
  // Astigmatism fields (optional) - all as strings per Postman collection
  left_cylinder?: string
  right_cylinder?: string
  left_axis?: string | number  // API expects string (e.g., "180", "90")
  right_axis?: string | number  // API expects string (e.g., "180", "90")
}

export interface ContactLensCheckoutResponse {
  success: boolean
  message: string
  data: {
    item: {
      id: number
      cart_id?: number
      product_id: number
      quantity: number
      unit_price: string | number  // API returns as string (e.g., "77.96")
      contact_lens_right_qty: number
      contact_lens_right_base_curve: number
      contact_lens_right_diameter: number
      contact_lens_right_power?: number | string
      contact_lens_left_qty: number
      contact_lens_left_base_curve: number
      contact_lens_left_diameter: number
      contact_lens_left_power?: number | string
      customization?: {
        left_cylinder?: number
        right_cylinder?: number
        left_axis?: number
        right_axis?: number
      } | null
      product?: {
        id: number
        name: string
        slug: string
        price: string | number
        images?: string[] | null
      }
      // Additional fields that may be present
      lens_index?: null
      lens_coatings?: null
      frame_size_id?: null
      prescription_id?: null
      lens_type?: null
      prescription_data?: null
      progressive_variant_id?: null
      lens_thickness_material_id?: null
      lens_thickness_option_id?: null
      treatment_ids?: null
      photochromic_color_id?: null
      prescription_sun_color_id?: null
      created_at?: string
      updated_at?: string
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
    const response = await apiClient.get<{ 
      success: boolean
      message: string
      data: {
        values?: DropdownValue[]
        grouped?: {
          power?: DropdownValue[]
          cylinder?: DropdownValue[]
          axis?: DropdownValue[]
        }
      }
    }>(
      API_ROUTES.CONTACT_LENS_FORMS.GET_ASTIGMATISM_DROPDOWN_VALUES(fieldType, eyeType),
      false // Public endpoint
    )

    if (response.success && response.data) {
      let values: DropdownValue[] = []
      
      // Handle new response structure with grouped data
      if (response.data.grouped) {
        if (fieldType === 'power' && response.data.grouped.power) {
          values = response.data.grouped.power
        } else if (fieldType === 'cylinder' && response.data.grouped.cylinder) {
          values = response.data.grouped.cylinder
        } else if (fieldType === 'axis' && response.data.grouped.axis) {
          values = response.data.grouped.axis
        } else if (!fieldType) {
          // If no fieldType specified, return all grouped values
          values = [
            ...(response.data.grouped.power || []),
            ...(response.data.grouped.cylinder || []),
            ...(response.data.grouped.axis || [])
          ]
        }
      } else if (response.data.values) {
        // Fallback to old structure
        values = response.data.values
      }
      
      // Filter to only active values and sort by sort_order and value
      return values
        .filter((value: DropdownValue) => value.is_active !== false)
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
    const response = await apiClient.get<{ 
      success: boolean
      message: string
      data: {
        configs?: SphericalConfig[]
        pagination?: {
          total: number
          page: number
          limit: number
          pages: number
        }
      }
    }>(
      API_ROUTES.CONTACT_LENS_FORMS.GET_SPHERICAL_CONFIGS(subCategoryId),
      false // Public endpoint
    )

    if (response.success && response.data) {
      // Handle new response structure with data.configs
      let configs: SphericalConfig[] = []
      
      if (response.data.configs && Array.isArray(response.data.configs)) {
        configs = response.data.configs
      } else if (Array.isArray(response.data)) {
        // Fallback to old structure (direct array)
        configs = response.data as any
      }
      
      // Filter to only active configs (if is_active field exists)
      return configs.filter((config: SphericalConfig) => config.is_active !== false)
    }

    console.error('Failed to fetch spherical configs:', response.message)
    return []
  } catch (error) {
    console.error('Error fetching spherical configs:', error)
    return []
  }
}

/**
 * Get astigmatism configurations
 * @param subCategoryId - Optional filter by sub-sub-category ID
 */
export const getAstigmatismConfigs = async (
  subCategoryId?: number | string
): Promise<AstigmatismConfig[]> => {
  try {
    const endpoint = API_ROUTES.CONTACT_LENS_FORMS.GET_ASTIGMATISM_CONFIGS(subCategoryId)
    
    // Get the base URL to show full URL in logs
    const baseURL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV 
        ? 'http://localhost:5000/api'
        : 'https://optyshop-frontend.hmstech.org/api'
      )
    const fullURL = `${baseURL}${endpoint}`
    
    if (import.meta.env.DEV) {
      console.log('🔍 Fetching astigmatism configs:', {
        endpoint,
        fullURL,
        subCategoryId,
        routePath: '/contact-lens-forms/astigmatism',
        queryParams: subCategoryId ? `?sub_category_id=${subCategoryId}` : ''
      })
      console.log('📍 EXACT ROUTE BEING CALLED:', fullURL)
    }
    
    const response = await apiClient.get<{ 
      success: boolean
      message: string
      data: {
        configs?: AstigmatismConfig[]
        pagination?: {
          total: number
          page: number
          limit: number
          pages: number
        }
      }
    }>(
      endpoint,
      false // Public endpoint
    )

    if (import.meta.env.DEV) {
      console.log('📥 Astigmatism configs response:', {
        success: response.success,
        hasData: !!response.data,
        hasConfigs: !!response.data?.configs,
        configsCount: response.data?.configs?.length || 0,
        message: response.message,
        error: response.error,
        fullResponse: response
      })
    }

    if (response.success && response.data) {
      // Handle response structure with data.configs
      let configs: AstigmatismConfig[] = []
      
      if (response.data.configs && Array.isArray(response.data.configs)) {
        configs = response.data.configs
      } else if (Array.isArray(response.data)) {
        // Fallback to old structure (direct array)
        configs = response.data as any
      }
      
      // Filter to only active configs (if is_active field exists)
      const activeConfigs = configs.filter((config: AstigmatismConfig) => config.is_active !== false)
      
      if (import.meta.env.DEV) {
        console.log('✅ Astigmatism configs processed:', {
          total: configs.length,
          active: activeConfigs.length
        })
      }
      
      return activeConfigs
    }

    console.error('❌ Failed to fetch astigmatism configs:', {
      message: response.message,
      success: response.success,
      hasData: !!response.data,
      error: response.error,
      endpoint,
      fullURL,
      subCategoryId
    })
    
    // If it's a 404, provide helpful message
    if (response.message?.includes('Route not found') || response.error?.includes('Route not found')) {
      console.error('⚠️ Backend route not found. Please verify:')
      console.error('   1. The backend route is registered: GET /api/contact-lens-forms/astigmatism')
      console.error('   2. The route is placed AFTER /astigmatism/dropdown-values to avoid conflicts')
      console.error('   3. The backend server has been restarted after adding the route')
      console.error(`   4. The full URL being called: ${fullURL}`)
    }
    
    return []
  } catch (error: any) {
    console.error('❌ Error fetching astigmatism configs:', error)
    // Check if it's a 404 error
    if (error?.message?.includes('404') || error?.message?.includes('Route not found')) {
      console.error('⚠️ 404 Error: The astigmatism configs endpoint may not be available yet')
      console.error('   Please verify the backend route is properly registered and the server is restarted')
    }
    return []
  }
}

/**
 * Contact Lens Options Response (aggregated from products in sub-subcategory)
 */
export interface ContactLensOptionsResponse {
  subcategory: {
    id: number
    name: string
    slug: string
    parent?: {
      id: number
      name: string
      slug: string
    }
    category?: {
      id: number
      name: string
      slug: string
    }
  }
  powerOptions: string[]
  baseCurveOptions: number[]
  diameterOptions: number[]
  productCount: number
  type: 'spherical' | 'astigmatism'
  // Astigmatism-specific fields
  cylinderOptions?: number[]
  axisOptions?: number[]
}

/**
 * Get aggregated contact lens options from all products in a sub-subcategory
 * @param subCategoryId - The sub-sub-category ID (must have parent_id)
 */
export const getContactLensOptions = async (
  subCategoryId: number | string
): Promise<ContactLensOptionsResponse | null> => {
  try {
    // Ensure subCategoryId is a valid number (not a slug)
    const numericId = typeof subCategoryId === 'string' ? parseInt(subCategoryId, 10) : subCategoryId
    
    if (isNaN(numericId) || numericId <= 0) {
      console.error('Invalid sub-category ID provided:', subCategoryId, '- must be a positive number')
      return null
    }
    
    const response = await apiClient.get<ContactLensOptionsResponse>(
      API_ROUTES.SUBCATEGORIES.CONTACT_LENS_OPTIONS(numericId),
      false // Public endpoint
    )

    if (response.success && response.data) {
      return response.data
    }

    console.error('Failed to fetch contact lens options:', response.message, {
      subCategoryId: numericId,
      error: response.error
    })
    return null
  } catch (error: any) {
    console.error('Error fetching contact lens options:', error)
    if (error?.message) {
      console.error('Error details:', error.message)
    }
    return null
  }
}

/**
 * Get aggregated contact lens options from all products in a sub-subcategory by slug
 * @param slug - The sub-sub-category slug
 */
export const getContactLensOptionsBySlug = async (
  slug: string
): Promise<ContactLensOptionsResponse | null> => {
  try {
    if (!slug || slug.trim() === '') {
      console.error('Invalid sub-category slug provided:', slug)
      return null
    }
    
    const response = await apiClient.get<ContactLensOptionsResponse>(
      API_ROUTES.SUBCATEGORIES.CONTACT_LENS_OPTIONS_BY_SLUG(slug),
      false // Public endpoint
    )

    if (response.success && response.data) {
      return response.data
    }

    console.error('Failed to fetch contact lens options by slug:', response.message, {
      slug,
      error: response.error
    })
    return null
  } catch (error: any) {
    console.error('Error fetching contact lens options by slug:', error)
    if (error?.message) {
      console.error('Error details:', error.message)
    }
    return null
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
    // Convert all numeric values to strings as API expects strings (per Postman collection)
    // All values must be strings: qty, base_curve, diameter, power, cylinder, axis
    const apiRequest: Record<string, string | number> = {
      product_id: request.product_id,
      form_type: request.form_type,
      right_qty: String(request.right_qty),
      right_base_curve: String(request.right_base_curve),
      right_diameter: String(request.right_diameter),
      right_power: request.right_power, // Already a string
      left_qty: String(request.left_qty),
      left_base_curve: String(request.left_base_curve),
      left_diameter: String(request.left_diameter),
      left_power: request.left_power // Already a string
    }

    // Add astigmatism fields if provided (all as strings per Postman collection)
    if (request.right_cylinder) {
      apiRequest.right_cylinder = request.right_cylinder
    }
    if (request.left_cylinder) {
      apiRequest.left_cylinder = request.left_cylinder
    }
    if (request.right_axis !== undefined) {
      apiRequest.right_axis = String(request.right_axis) // Convert to string
    }
    if (request.left_axis !== undefined) {
      apiRequest.left_axis = String(request.left_axis) // Convert to string
    }

    if (import.meta.env.DEV) {
      console.log('📤 Sending contact lens checkout request:', apiRequest)
    }

    const response = await apiClient.post<{
      success: boolean
      message: string
      data: {
        item: ContactLensCheckoutResponse['data']['item']
      }
    }>(
      API_ROUTES.CONTACT_LENS_FORMS.CHECKOUT,
      apiRequest,
      true // Requires authentication
    )

    if (import.meta.env.DEV) {
      console.log('📥 Contact lens checkout response:', response)
    }

    // The API returns { success, message, data: { item } }
    // apiClient.post returns { success, data, message } where data is the inner data object
    // So response.data is { item: {...} }
    if (response.success && response.data && response.data.item) {
      // Return the full ContactLensCheckoutResponse structure
      const result = {
        success: true,
        message: response.message || 'Contact lens added to cart successfully',
        data: {
          item: response.data.item
        }
      } as ContactLensCheckoutResponse
      
      if (import.meta.env.DEV) {
        console.log('✅ Contact lens checkout successful:', result)
      }
      
      return result
    }

    console.error('❌ Failed to add contact lens to cart:', {
      message: response.message,
      success: response.success,
      hasData: !!response.data,
      hasItem: !!response.data?.item,
      fullResponse: response
    })
    return null
  } catch (error) {
    console.error('Error adding contact lens to cart:', error)
    return null
  }
}

