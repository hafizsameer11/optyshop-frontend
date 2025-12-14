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
  lens_option_id: number;
  name: string;
  color_code?: string;
  hex_code?: string;
  image_url?: string;
  price_adjustment?: number;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LensOption {
  id: number;
  name: string;
  slug: string;
  type: string; // classic, mirror, gradient, polarized, photochromic, etc.
  description?: string;
  base_price?: number;
  is_active: boolean;
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
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const url = buildQueryString(API_ROUTES.LENS.OPTIONS.LIST, queryParams);
    const response = await apiClient.get<LensOptionsResponse>(url, false);

    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }

    console.error('Failed to fetch lens options:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching lens options:', error);
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

