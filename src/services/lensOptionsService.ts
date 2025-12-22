/**
 * Lens Options Service
 * Handles API calls for lens options and colors
 */

import apiClient from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface LensColor {
  id: number;
  lens_option_id?: number;
  name: string;
  // Support both camelCase (API response) and snake_case (legacy)
  colorCode?: string;
  color_code?: string;
  hexCode?: string;
  hex_code?: string;
  imageUrl?: string;
  image_url?: string;
  priceAdjustment?: number;
  price_adjustment?: number;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  // Nested lens option object (from API)
  lensOption?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface LensOption {
  id: number;
  name: string;
  slug?: string;
  type: string; // classic, mirror, gradient, polarized, photochromic, etc.
  description?: string;
  // Support both camelCase (API response) and snake_case (legacy)
  basePrice?: number;
  base_price?: number;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  colors?: LensColor[];
  created_at?: string;
  updated_at?: string;
}

export interface LensOptionsResponse {
  success: boolean;
  data: LensOption[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LensOptionResponse {
  success: boolean;
  data: LensOption;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all lens options with optional filtering
 */
export const getLensOptions = async (params?: {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<LensOption[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.type) queryParams.type = params.type;
    // Note: Public API might not support isActive parameter - it may default to active only
    // Try with isActive if provided, but API might ignore it
    if (params?.isActive !== undefined) {
      // Try both camelCase and snake_case for compatibility
      queryParams.isActive = params.isActive;
      queryParams.is_active = params.isActive;
    }
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const url = buildQueryString(API_ROUTES.LENS.OPTIONS.LIST, queryParams);
    
    console.log('🌐 [API] Calling:', url);
    console.log('🌐 [API] Query params:', queryParams);
    
    const response = await apiClient.get<LensOptionsResponse>(url, false);

    console.log('📥 [API] Raw Response:', JSON.stringify(response, null, 2));
    console.log('📥 [API] Response Summary:', {
      success: response.success,
      hasData: !!response.data,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 
                  (response.data?.data ? response.data.data.length : 'N/A'),
      message: response.message,
      fullResponse: response
    });

    if (response.success) {
      // Handle different response structures
      let options: LensOption[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        options = response.data;
        console.log('✅ [API] Direct array response, found', options.length, 'options');
      } else if (response.data && typeof response.data === 'object') {
        // Response with nested data property
        // Check for data.options structure (most common)
        if (Array.isArray((response.data as any).options)) {
          options = (response.data as any).options;
          console.log('✅ [API] data.options array, found', options.length, 'options');
        } else if (Array.isArray(response.data.data)) {
          options = response.data.data;
          console.log('✅ [API] Nested data.data array, found', options.length, 'options');
        } else if (Array.isArray((response.data as any).lensOptions)) {
          // Alternative structure
          options = (response.data as any).lensOptions;
          console.log('✅ [API] lensOptions array, found', options.length, 'options');
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          // Double nested
          options = (response.data as any).data;
          console.log('✅ [API] Double nested data, found', options.length, 'options');
        } else {
          // Single object - wrap in array
          options = [response.data as LensOption];
          console.log('✅ [API] Single object, wrapped in array');
        }
      }
      
      // Log first option structure for debugging
      if (options.length > 0) {
        console.log('📋 [API] First option structure:', JSON.stringify(options[0], null, 2));
        if (options[0].colors && options[0].colors.length > 0) {
          console.log('🎨 [API] First color structure:', JSON.stringify(options[0].colors[0], null, 2));
        }
      }
      
      // If isActive filter was requested, filter client-side as fallback
      let filteredOptions = options;
      if (params?.isActive === true) {
        filteredOptions = options.filter(opt => {
          // Support both camelCase and snake_case
          const isActive = opt.isActive !== undefined ? opt.isActive : opt.is_active;
          return isActive !== false;
        });
        if (filteredOptions.length !== options.length) {
          console.log(`🔍 [API] Client-side filtered: ${options.length} → ${filteredOptions.length} active options`);
        }
      }
      
      console.log(`✅ [API] Returning ${filteredOptions.length} lens options`);
      return filteredOptions;
    }

    // If success is false, log the error but return empty array instead of null
    // This prevents errors in the UI when data doesn't exist yet
    if (response.message) {
      console.warn('⚠️ [API] API returned success:false:', response.message);
      console.warn('⚠️ [API] Full response:', JSON.stringify(response, null, 2));
    }
    
    // Also check if response.data exists but is not in expected format
    if (response.data && !Array.isArray(response.data)) {
      console.warn('⚠️ [API] Response data is not an array:', typeof response.data, response.data);
    }
    
    return [];
  } catch (error) {
    console.error('❌ [API] Error fetching lens options:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return null;
  }
};

/**
 * Get a single lens option by ID with all its colors
 */
export const getLensOptionById = async (id: number | string): Promise<LensOption | null> => {
  try {
    const response = await apiClient.get<LensOptionResponse>(
      API_ROUTES.LENS.OPTIONS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch lens option:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching lens option:', error);
    return null;
  }
};

export default {
  getLensOptions,
  getLensOptionById,
};

