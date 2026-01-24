/**
 * Product Gifts Service
 * Handles product gift API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';
import { Product } from './productsService';

export interface ProductGift {
  id: number;
  product_id: number;
  gift_product_id: number;
  min_quantity: number;
  max_quantity?: number;
  is_active: boolean;
  description?: string;
  gift_product?: Product;
}

export interface ProductGiftsResponse {
  success: boolean;
  message: string;
  data: {
    gifts: ProductGift[];
  };
}

/**
 * Get all active product gifts
 */
export const getProductGifts = async (productId?: number | string): Promise<ProductGift[]> => {
  try {
    const response = await apiClient.get<ProductGiftsResponse>(
      API_ROUTES.PRODUCT_GIFTS.LIST(productId),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data.gifts || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching product gifts:', error);
    return [];
  }
};

/**
 * Get gifts for a specific product
 */
export const getGiftsByProduct = async (productId: number | string): Promise<ProductGift[]> => {
  try {
    const response = await apiClient.get<ProductGiftsResponse>(
      API_ROUTES.PRODUCT_GIFTS.BY_PRODUCT(productId),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data.gifts || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching gifts for product:', error);
    return [];
  }
};

// ============================================
// ADMIN FUNCTIONS (requires admin authentication)
// ============================================

/**
 * Get all product gifts (Admin view)
 */
export const adminGetProductGifts = async (): Promise<ProductGift[]> => {
  try {
    const response = await apiClient.get<ProductGiftsResponse>(
      '/admin/product-gifts',
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data.gifts || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin product gifts:', error);
    return [];
  }
};

/**
 * Get specific product gift by ID (Admin)
 */
export const adminGetProductGift = async (id: number | string): Promise<ProductGift | null> => {
  try {
    const response = await apiClient.get<{success: boolean; data: {gift?: ProductGift}}>(
      `/admin/product-gifts/${id}`,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.gift) {
      return response.data.gift;
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin product gift:', error);
    return null;
  }
};

/**
 * Create product gift (Admin)
 */
export const adminCreateProductGift = async (giftData: Omit<ProductGift, 'id' | 'gift_product'>): Promise<ProductGift | null> => {
  try {
    const response = await apiClient.post<{success: boolean; data: {gift?: ProductGift}}>(
      '/admin/product-gifts',
      giftData,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.gift) {
      return response.data.gift;
    }
    return null;
  } catch (error) {
    console.error('Error creating product gift:', error);
    return null;
  }
};

/**
 * Update product gift (Admin)
 */
export const adminUpdateProductGift = async (id: number | string, giftData: Partial<ProductGift>): Promise<ProductGift | null> => {
  try {
    const response = await apiClient.put<{success: boolean; data: {gift?: ProductGift}}>(
      `/admin/product-gifts/${id}`,
      giftData,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.gift) {
      return response.data.gift;
    }
    return null;
  } catch (error) {
    console.error('Error updating product gift:', error);
    return null;
  }
};

/**
 * Delete product gift (Admin)
 */
export const adminDeleteProductGift = async (id: number | string): Promise<boolean> => {
  try {
    const response = await apiClient.delete<{success: boolean}>(
      `/admin/product-gifts/${id}`,
      true // ADMIN endpoint
    );

    return response.success;
  } catch (error) {
    console.error('Error deleting product gift:', error);
    return false;
  }
};
