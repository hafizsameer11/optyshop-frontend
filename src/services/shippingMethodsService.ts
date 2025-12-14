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
  estimated_days?: number;
  is_active: boolean;
  sort_order?: number;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingMethodsResponse {
  success: boolean;
  data: ShippingMethod[];
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
 */
export const getShippingMethods = async (params?: {
  type?: string;
  isActive?: boolean;
}): Promise<ShippingMethod[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

    const url = buildQueryString(API_ROUTES.SHIPPING_METHODS.LIST, queryParams);
    const response = await apiClient.get<ShippingMethodsResponse>(url, false);

    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }

    console.error('Failed to fetch shipping methods:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
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

