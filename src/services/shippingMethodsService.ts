/**
 * Shipping Methods Service
 * Handles API calls for shipping methods
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface ShippingMethod {
  id: number;
  name: string;
  slug: string;
  type: string; // standard, express, overnight, international, free
  description?: string;
  price: number;
  estimated_days?: number; // API may return as estimatedDays (camelCase) or estimated_days (snake_case)
  estimatedDays?: number; // Support both formats
  is_active?: boolean;
  isActive?: boolean; // Support both formats
  sort_order?: number;
  sortOrder?: number; // Support both formats
  icon?: string;
  created_at?: string;
  createdAt?: string; // Support both formats
  updated_at?: string;
  updatedAt?: string; // Support both formats
}

export interface ShippingMethodsResponse {
  success: boolean;
  message?: string;
  data: ShippingMethod[] | {
    methods: ShippingMethod[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ShippingMethodResponse {
  success: boolean;
  data: ShippingMethod;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all active shipping methods with optional filtering
 * According to Postman collection: 
 * - Public endpoint: GET /api/shipping-methods
 * - Supports 'type' query parameter only (standard, express, overnight, international, free)
 * - Returns only active shipping methods by default (no isActive parameter needed)
 */
export const getShippingMethods = async (params?: {
  type?: string;
  isActive?: boolean; // Note: Public endpoint doesn't support this - it returns active methods by default
}): Promise<ShippingMethod[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    // Public endpoint only supports 'type' parameter according to Postman collection
    // The endpoint returns active methods by default, so we don't send isActive
    if (params?.type) {
      queryParams.type = params.type;
    }
    // Note: isActive parameter is not supported by the public endpoint
    // The endpoint description says "Get all active shipping methods" - it returns active by default

    const url = buildQueryString(API_ROUTES.SHIPPING_METHODS.LIST, queryParams);
    if (import.meta.env.DEV) {
      console.log('🔄 [Shipping Methods] Fetching from:', url);
    }
    const response = await apiClient.get<ShippingMethodsResponse>(url, false);

    if (response.success && response.data) {
      // Handle different response structures
      if (Array.isArray(response.data)) {
        // Direct array response
        return response.data;
      } else if (typeof response.data === 'object') {
        // Handle structure: { data: { methods: [...], pagination: {...} } }
        if ('methods' in response.data && Array.isArray((response.data as any).methods)) {
          return (response.data as any).methods;
        }
        // Handle nested data structure
        if ('data' in response.data) {
          const nestedData = (response.data as any).data;
          if (Array.isArray(nestedData)) {
            return nestedData;
          } else if (nestedData && typeof nestedData === 'object' && 'methods' in nestedData) {
            return nestedData.methods || [];
          }
        }
      }
      return [];
    }

    console.error('Failed to fetch shipping methods:', response.message || 'Unknown error');
    return null;
  } catch (error: any) {
    // Log detailed error information for debugging
    if (import.meta.env.DEV) {
      console.error('Error fetching shipping methods:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        url: error?.config?.url || url
      });
    } else {
      console.error('Error fetching shipping methods:', error?.message || 'Unknown error');
    }
    return null;
  }
};

/**
 * Get a single shipping method by ID
 */
export const getShippingMethodById = async (id: number | string): Promise<ShippingMethod | null> => {
  try {
    const response = await apiClient.get<ShippingMethodResponse>(
      API_ROUTES.SHIPPING_METHODS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch shipping method:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    return null;
  }
};

export default {
  getShippingMethods,
  getShippingMethodById,
};

