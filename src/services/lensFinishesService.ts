/**
 * Lens Finishes Service
 * Handles API calls for lens finishes
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface LensFinish {
  id: number;
  lens_option_id?: number;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  price_adjustment?: number;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  colors?: LensFinishColor[];
  created_at?: string;
  updated_at?: string;
  // Nested lens option object (from API)
  lensOption?: {
    id: number;
    name: string;
    type?: string;
    slug?: string;
  };
}

export interface LensFinishColor {
  id: number;
  lens_finish_id?: number;
  name: string;
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
}

export interface LensFinishesResponse {
  success: boolean;
  message?: string;
  data: LensFinish[] | {
    finishes: LensFinish[];
    count?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface LensFinishResponse {
  success: boolean;
  message?: string;
  data: LensFinish;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all lens finishes with optional filtering
 * GET /api/lens/finishes
 */
export const getLensFinishes = async (params?: {
  lensOptionId?: number | string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<LensFinish[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.lensOptionId) queryParams.lensOptionId = params.lensOptionId;
    if (params?.isActive !== undefined) {
      queryParams.isActive = params.isActive;
      queryParams.is_active = params.isActive;
    }
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const url = buildQueryString(API_ROUTES.LENS.FINISHES.LIST, queryParams);
    
    console.log('🌐 [API] Fetching lens finishes:', url);
    console.log('🌐 [API] Query params:', queryParams);
    
    const response = await apiClient.get<LensFinishesResponse>(url, false);

    console.log('📥 [API] Lens Finishes API response:', {
      success: response.success,
      message: response.message,
      hasData: !!response.data
    });

    if (response.success && response.data) {
      // Handle different response structures
      let finishes: LensFinish[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        finishes = response.data;
        console.log('✅ [API] Direct array response, found', finishes.length, 'finishes');
      } else if (typeof response.data === 'object') {
        // Response with nested data property
        if (Array.isArray((response.data as any).finishes)) {
          finishes = (response.data as any).finishes;
          console.log('✅ [API] data.finishes array, found', finishes.length, 'finishes');
        } else if (Array.isArray((response.data as any).data)) {
          finishes = (response.data as any).data;
          console.log('✅ [API] Nested data.data array, found', finishes.length, 'finishes');
        }
      }
      
      // Log first finish structure for debugging
      if (finishes.length > 0) {
        console.log('📋 [API] First finish structure:', JSON.stringify(finishes[0], null, 2));
        if (finishes[0].colors && finishes[0].colors.length > 0) {
          console.log('🎨 [API] First color structure:', JSON.stringify(finishes[0].colors[0], null, 2));
        }
      }
      
      // If isActive filter was requested, filter client-side as fallback
      let filteredFinishes = finishes;
      if (params?.isActive === true) {
        filteredFinishes = finishes.filter(finish => {
          // Support both camelCase and snake_case
          const isActive = finish.isActive !== undefined ? finish.isActive : finish.is_active;
          return isActive !== false;
        });
        if (filteredFinishes.length !== finishes.length) {
          console.log(`🔍 [API] Client-side filtered: ${finishes.length} → ${filteredFinishes.length} active finishes`);
        }
      }
      
      console.log(`✅ [API] Returning ${filteredFinishes.length} lens finishes`);
      return filteredFinishes;
    }

    if (response.message) {
      console.warn('⚠️ [API] API returned:', response.message);
    }
    
    return [];
  } catch (error) {
    console.error('❌ [API] Error fetching lens finishes:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return null;
  }
};

/**
 * Get a single lens finish by ID with all its colors
 * GET /api/lens/finishes/:id
 */
export const getLensFinishById = async (id: number | string): Promise<LensFinish | null> => {
  try {
    console.log('🌐 [API] Fetching lens finish by ID:', id);
    
    const response = await apiClient.get<LensFinishResponse>(
      API_ROUTES.LENS.FINISHES.BY_ID(id),
      false // PUBLIC endpoint
    );

    console.log('📥 [API] Lens Finish API response:', {
      success: response.success,
      message: response.message,
      hasData: !!response.data
    });

    if (response.success && response.data) {
      console.log('✅ [API] Found lens finish:', response.data.name);
      return response.data;
    }

    if (response.message) {
      console.warn('⚠️ [API] API returned:', response.message);
    }
    
    return null;
  } catch (error) {
    console.error('❌ [API] Error fetching lens finish:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return null;
  }
};

export default {
  getLensFinishes,
  getLensFinishById,
};

