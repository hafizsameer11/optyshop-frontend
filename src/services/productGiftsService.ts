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
