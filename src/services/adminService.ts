/**
 * Admin Service
 * Handles all admin API calls for MM caliber and Eye Hygiene variant management
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';
import type { MMCaliber, EyeHygieneVariant } from './productsService';

// ============================================
// Type Definitions for Admin APIs
// ============================================

export interface CreateMMCaliberRequest {
  mm: number;
  image: string;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface UpdateMMCaliberRequest {
  image?: string;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface CreateEyeHygieneVariantRequest {
  product_id: number;
  name: string;
  size_volume: string;
  pack_type?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  stock_quantity: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'backorder';
  sku?: string | null;
  expiry_date?: string | null;
  image?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateEyeHygieneVariantRequest {
  name?: string;
  size_volume?: string;
  pack_type?: string | null;
  price?: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  stock_quantity?: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'backorder';
  sku?: string | null;
  expiry_date?: string | null;
  image?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface AdminResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// MM Caliber Management Functions
// ============================================

/**
 * Get all calibers for a product
 * @param productId - Product ID
 * @returns Array of MMCaliber objects or null if error
 */
export const getProductCalibers = async (productId: number | string): Promise<MMCaliber[] | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.ADMIN.MM_CALIBERS.BY_PRODUCT(productId),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as MMCaliber[];
    }

    console.error('Failed to fetch product calibers:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product calibers:', error);
    return null;
  }
};

/**
 * Create a new caliber for a product
 * @param productId - Product ID
 * @param caliberData - Caliber data to create
 * @returns Created MMCaliber object or null if error
 */
export const createProductCaliber = async (
  productId: number | string,
  caliberData: CreateMMCaliberRequest
): Promise<MMCaliber | null> => {
  try {
    const response = await apiClient.post<any>(
      API_ROUTES.ADMIN.MM_CALIBERS.CREATE(productId, caliberData.mm),
      caliberData,
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as MMCaliber;
    }

    console.error('Failed to create product caliber:', response.message);
    return null;
  } catch (error) {
    console.error('Error creating product caliber:', error);
    return null;
  }
};

/**
 * Update an existing caliber
 * @param productId - Product ID
 * @param mm - Caliber size
 * @param caliberData - Updated caliber data
 * @returns Updated MMCaliber object or null if error
 */
export const updateProductCaliber = async (
  productId: number | string,
  mm: number,
  caliberData: UpdateMMCaliberRequest
): Promise<MMCaliber | null> => {
  try {
    const response = await apiClient.put<any>(
      API_ROUTES.ADMIN.MM_CALIBERS.UPDATE(productId, mm),
      caliberData,
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as MMCaliber;
    }

    console.error('Failed to update product caliber:', response.message);
    return null;
  } catch (error) {
    console.error('Error updating product caliber:', error);
    return null;
  }
};

/**
 * Delete a caliber
 * @param productId - Product ID
 * @param mm - Caliber size
 * @returns Success boolean or null if error
 */
export const deleteProductCaliber = async (
  productId: number | string,
  mm: number
): Promise<boolean | null> => {
  try {
    const response = await apiClient.delete<any>(
      API_ROUTES.ADMIN.MM_CALIBERS.DELETE(productId, mm),
      true // ADMIN endpoint
    );

    if (response.success) {
      return true;
    }

    console.error('Failed to delete product caliber:', response.message);
    return false;
  } catch (error) {
    console.error('Error deleting product caliber:', error);
    return null;
  }
};

// ============================================
// Eye Hygiene Variant Management Functions
// ============================================

/**
 * Get eye hygiene variants (optionally filtered by product)
 * @param productId - Optional product ID to filter variants
 * @returns Array of EyeHygieneVariant objects or null if error
 */
export const getEyeHygieneVariants = async (productId?: number | string): Promise<EyeHygieneVariant[] | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.LIST(productId),
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant[];
    }

    console.error('Failed to fetch eye hygiene variants:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching eye hygiene variants:', error);
    return null;
  }
};

/**
 * Get a specific eye hygiene variant by ID
 * @param variantId - Variant ID
 * @returns EyeHygieneVariant object or null if error
 */
export const getEyeHygieneVariantById = async (variantId: number | string): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.BY_ID(variantId),
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to fetch eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching eye hygiene variant:', error);
    return null;
  }
};

/**
 * Create a new eye hygiene variant
 * @param variantData - Variant data to create
 * @returns Created EyeHygieneVariant object or null if error
 */
export const createEyeHygieneVariant = async (
  variantData: CreateEyeHygieneVariantRequest
): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.post<any>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.CREATE,
      variantData,
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to create eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error creating eye hygiene variant:', error);
    return null;
  }
};

/**
 * Update an existing eye hygiene variant
 * @param variantId - Variant ID
 * @param variantData - Updated variant data
 * @returns Updated EyeHygieneVariant object or null if error
 */
export const updateEyeHygieneVariant = async (
  variantId: number | string,
  variantData: UpdateEyeHygieneVariantRequest
): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.put<any>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.UPDATE(variantId),
      variantData,
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to update eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error updating eye hygiene variant:', error);
    return null;
  }
};

/**
 * Delete an eye hygiene variant
 * @param variantId - Variant ID
 * @returns Success boolean or null if error
 */
export const deleteEyeHygieneVariant = async (variantId: number | string): Promise<boolean | null> => {
  try {
    const response = await apiClient.delete<any>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.DELETE(variantId),
      true // ADMIN endpoint
    );

    if (response.success) {
      return true;
    }

    console.error('Failed to delete eye hygiene variant:', response.message);
    return false;
  } catch (error) {
    console.error('Error deleting eye hygiene variant:', error);
    return null;
  }
};
