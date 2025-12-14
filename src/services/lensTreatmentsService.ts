/**
 * Lens Treatments Service
 * Handles API calls for lens treatments/coatings
 */

import apiClient from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface LensTreatment {
  id: number;
  name: string;
  slug: string;
  type: string; // scratch_proof, anti_glare, blue_light_anti_glare, photochromic, etc.
  description?: string;
  price: number;
  icon?: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LensTreatmentsResponse {
  success: boolean;
  data: LensTreatment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LensTreatmentResponse {
  success: boolean;
  data: LensTreatment;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all lens treatments with optional filtering
 */
export const getLensTreatments = async (params?: {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<LensTreatment[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const url = buildQueryString(API_ROUTES.LENS.TREATMENTS.LIST, queryParams);
    const response = await apiClient.get<LensTreatmentsResponse>(url, false);

    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }

    console.error('Failed to fetch lens treatments:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching lens treatments:', error);
    return null;
  }
};

/**
 * Get a single lens treatment by ID
 */
export const getLensTreatmentById = async (id: number | string): Promise<LensTreatment | null> => {
  try {
    const response = await apiClient.get<LensTreatmentResponse>(
      API_ROUTES.LENS.TREATMENTS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch lens treatment:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching lens treatment:', error);
    return null;
  }
};

export default {
  getLensTreatments,
  getLensTreatmentById,
};

