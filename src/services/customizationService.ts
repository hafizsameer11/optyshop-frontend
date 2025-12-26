/**
 * Product Customization Service
 * Handles API calls for product customization options and price calculations
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Interfaces
// ============================================

export interface CustomizationOptions {
  lensOptions: LensOption[];
  lensFinishes: LensFinish[];
  lensColors: LensColor[];
  treatments: Treatment[];
}

export interface LensOption {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  sort_order?: number;
  colors?: LensColor[];
}

export interface LensFinish {
  id: number;
  lens_option_id: number;
  name: string;
  slug: string;
  description?: string;
  price_adjustment: number;
  is_active: boolean;
  sort_order?: number;
}

export interface LensColor {
  id: number;
  lens_option_id: number;
  name: string;
  color_code: string;
  hex_code?: string;
  image_url?: string;
  price_adjustment: number;
  is_active: boolean;
  sort_order?: number;
}

export interface Treatment {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  price: number;
  icon?: string;
  is_active: boolean;
  sort_order?: number;
}

export interface ProductCustomizationOptions {
  product_id: number;
  available_lens_options: LensOption[];
  available_finishes: LensFinish[];
  available_colors: LensColor[];
  available_treatments: Treatment[];
}

export interface CalculatePriceRequest {
  lens_option_id?: number;
  lens_finish_id?: number;
  lens_color_id?: number;
  treatment_ids?: number[];
  prescription_lens_type?: string | null;
  prescription_lens_color_id?: number | null;
  prescription_data?: {
    pd?: number;
    pd_binocular?: number;
    h?: number; // Height for progressive vision
    add?: string; // ADD value for progressive vision
    year_of_birth?: number; // Year of birth for progressive vision
    od_sphere?: number;
    od_cylinder?: number;
    od_axis?: number;
    os_sphere?: number;
    os_cylinder?: number;
    os_axis?: number;
  } | null;
  quantity?: number;
}

export interface PrescriptionLensType {
  id: string;
  name: string;
  description: string;
  type: 'distance_vision' | 'near_vision' | 'progressive';
  progressive_options?: ProgressiveOption[]; // Sub-options for progressive lenses
}

export interface ProgressiveOption {
  id: string;
  name: string;
  price: number;
  description: string;
  recommended?: boolean;
  icon?: string;
}

export interface CalculatePriceResponse {
  base_price: number;
  lens_option_price: number;
  finish_price: number;
  color_price: number;
  treatments_price: number;
  subtotal: number;
  total: number;
  currency: string;
  breakdown: {
    item: string;
    price: number;
  }[];
}

// ============================================
// API Functions
// ============================================

/**
 * Get all available customization options
 * GET /api/customization/options
 */
export const getCustomizationOptions = async (): Promise<CustomizationOptions> => {
  const response = await apiClient.get<{ success: boolean; data: CustomizationOptions }>(
    API_ROUTES.CUSTOMIZATION.OPTIONS
  );
  
  if (!response.data.success) {
    throw new Error('Failed to fetch customization options');
  }
  
  return response.data.data;
};

/**
 * Get customization options for a specific product
 * GET /api/customization/products/:id/customization
 */
export const getProductCustomizationOptions = async (
  productId: number | string
): Promise<ProductCustomizationOptions | null> => {
  try {
    console.log(`[API] GET /api/customization/products/${productId}/customization`)
    const response = await apiClient.get<ProductCustomizationOptions>(
      API_ROUTES.CUSTOMIZATION.PRODUCT_CUSTOMIZATION(productId),
      false // Public endpoint
    );
    
    // apiClient.get returns ApiResponse<T> which has { success, data, message, error }
    if (response.success && response.data) {
      console.log(`[API] ✅ Product customization options loaded`)
      // Handle different response structures
      const data = response.data as any;
      
      // If data is already ProductCustomizationOptions
      if (data.product_id || data.available_lens_options !== undefined) {
        return data as ProductCustomizationOptions;
      }
      
      // If data is wrapped in another structure
      if (data.data && (data.data.product_id || data.data.available_lens_options !== undefined)) {
        return data.data as ProductCustomizationOptions;
      }
      
      // Try to return as-is
      return data as ProductCustomizationOptions;
    }
    
    console.warn(`[API] ⚠️ Failed to fetch product customization options:`, response.message || response.error || 'Unknown error');
    return null;
  } catch (error: any) {
    // Ensure we never throw - always return null on error
    console.error(`[API] ❌ Error fetching product customization options:`, error?.message || error);
    return null;
  }
};

/**
 * Calculate the total price for a product with selected customizations
 * POST /api/customization/products/:id/customization/calculate
 */
export const calculateCustomizationPrice = async (
  productId: number | string,
  customization: CalculatePriceRequest
): Promise<CalculatePriceResponse> => {
  try {
    const endpoint = API_ROUTES.CUSTOMIZATION.CALCULATE_PRICE(productId)
    
    if (import.meta.env.DEV) {
      console.log('💰 [API] Calculating price for product:', productId);
      console.log('💰 [API] Endpoint:', endpoint);
      console.log('💰 [API] Customization data:', JSON.stringify(customization, null, 2));
    }
    
    const response = await apiClient.post<CalculatePriceResponse>(
      endpoint,
      customization
    );
    
    // apiClient.post returns ApiResponse<T> which has structure: { success: boolean, data?: T, message?: string }
    if (!response.success) {
      const errorMsg = response.message || response.error || 'Failed to calculate customization price';
      
      // Check if it's a 404 error (route not found)
      if (errorMsg.includes('Route not found') || errorMsg.includes('404') || errorMsg.includes('not found')) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [API] Price calculation endpoint not available (404):', endpoint);
          console.warn('⚠️ [API] This endpoint may not be implemented in the backend yet.');
        }
        throw new Error('Route not found');
      }
      
      console.error('❌ [API] Price calculation failed:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Check if response.data exists and has the expected structure
    if (response.data) {
      // If response.data is the CalculatePriceResponse directly (has 'total' property)
      if (typeof response.data === 'object' && 'total' in response.data) {
        console.log('✅ [API] Price calculated successfully:', response.data);
        return response.data as CalculatePriceResponse;
      }
      // If response.data is wrapped in another object with 'data' property
      if (typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        if (nestedData && typeof nestedData === 'object' && 'total' in nestedData) {
          console.log('✅ [API] Price calculated successfully (nested):', nestedData);
          return nestedData as CalculatePriceResponse;
        }
      }
    }
    
    // If response itself has total (fallback)
    if ('total' in response) {
      console.log('✅ [API] Price calculated successfully (direct):', response);
      return response as any as CalculatePriceResponse;
    }
    
    console.error('❌ [API] Unexpected response structure:', response);
    throw new Error('Unexpected response structure from price calculation API');
  } catch (error: any) {
    console.error('❌ [API] Error in calculateCustomizationPrice:', error);
    console.error('❌ [API] Customization data sent:', customization);
    throw error;
  }
};

/**
 * Calculate the total price for a product with selected customizations including prescription
 * POST /api/customization/products/:id/customization/calculate-with-prescription
 */
export const calculateCustomizationPriceWithPrescription = async (
  productId: number | string,
  customization: CalculatePriceRequest
): Promise<CalculatePriceResponse> => {
  try {
    const endpoint = API_ROUTES.CUSTOMIZATION.CALCULATE_WITH_PRESCRIPTION(productId)
    
    if (import.meta.env.DEV) {
      console.log('💰 [API] Calculating price with prescription for product:', productId);
      console.log('💰 [API] Endpoint:', endpoint);
      console.log('💰 [API] Customization data:', JSON.stringify(customization, null, 2));
    }
    
    const response = await apiClient.post<CalculatePriceResponse>(
      endpoint,
      customization
    );
    
    // Handle different response structures
    if (!response) {
      throw new Error('No response received from API');
    }
    
    // apiClient.post returns ApiResponse<T> which has structure: { success: boolean, data?: T, message?: string }
    // So response.success is the success flag, and response.data contains the actual CalculatePriceResponse
    if (!response.success) {
      const errorMsg = response.message || response.error || 'Failed to calculate customization price with prescription';
      
      // Check if it's a 404 error (route not found)
      if (errorMsg.includes('Route not found') || errorMsg.includes('404') || errorMsg.includes('not found')) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [API] Price calculation endpoint not available (404):', endpoint);
          console.warn('⚠️ [API] This endpoint may not be implemented in the backend yet.');
        }
        throw new Error('Route not found');
      }
      
      console.error('❌ [API] Price calculation failed:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Check if response.data exists and has the expected structure
    if (response.data) {
      // If response.data is the CalculatePriceResponse directly (has 'total' property)
      if (typeof response.data === 'object' && 'total' in response.data) {
        console.log('✅ [API] Price calculated successfully:', response.data);
        return response.data as CalculatePriceResponse;
      }
      // If response.data is wrapped in another object with 'data' property
      if (typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        if (nestedData && typeof nestedData === 'object' && 'total' in nestedData) {
          console.log('✅ [API] Price calculated successfully (nested):', nestedData);
          return nestedData as CalculatePriceResponse;
        }
      }
    }
    
    // If response itself has total (fallback)
    if ('total' in response) {
      console.log('✅ [API] Price calculated successfully (direct):', response);
      return response as any as CalculatePriceResponse;
    }
    
    console.error('❌ [API] Unexpected response structure:', response);
    throw new Error('Unexpected response structure from price calculation API');
  } catch (error: any) {
    console.error('❌ [API] Error in calculateCustomizationPriceWithPrescription:', error);
    console.error('❌ [API] Customization data sent:', customization);
    throw error;
  }
};

/**
 * Get available prescription lens types
 * GET /api/customization/prescription-lens-types
 */
export const getPrescriptionLensTypes = async (): Promise<PrescriptionLensType[]> => {
  const response = await apiClient.get<{ success: boolean; data: PrescriptionLensType[] }>(
    API_ROUTES.CUSTOMIZATION.PRESCRIPTION_LENS_TYPES
  );
  
  if (!response.data.success) {
    throw new Error('Failed to fetch prescription lens types');
  }
  
  return response.data.data || [];
};

export default {
  getCustomizationOptions,
  getProductCustomizationOptions,
  calculateCustomizationPrice,
  calculateCustomizationPriceWithPrescription,
  getPrescriptionLensTypes,
};

