/**
 * Cart Service
 * Handles cart API calls for authenticated users
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  lens_index?: number | string;
  lens_coating?: string;
  lens_coatings?: string[];
  prescription_id?: number | null;
  frame_size_id?: number | null;
  customization?: any;
  product?: {
    id: number;
    name: string;
    price: number;
    image?: string;
    images?: string[];
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  discount_amount?: number;
  shipping_cost?: number;
}

export interface PrescriptionData {
  pd?: number;
  pd_right?: number;
  h?: number;
  year_of_birth?: number;
  od?: {
    sph: number;
    cyl?: number;
    axis?: number;
  };
  os?: {
    sph: number;
    cyl?: number;
    axis?: number;
  };
}

export interface AddToCartRequest {
  product_id: number;
  quantity?: number;
  lens_type?: 'distance_vision' | 'near_vision' | 'progressive';
  prescription_data?: PrescriptionData;
  progressive_variant_id?: number;
  lens_thickness_material_id?: number;
  lens_thickness_option_id?: number;
  treatment_ids?: number[];
  photochromic_color_id?: number | null;
  prescription_sun_color_id?: number | null;
  // Legacy fields for backward compatibility
  lens_index?: number | string;
  lens_coating?: string;
  lens_coatings?: string[];
  prescription_id?: number | null;
  frame_size_id?: number | null;
  customization?: any;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data?: Cart;
  cart?: Cart;
}

// ============================================
// API Functions
// ============================================

/**
 * Get user's cart
 */
export const getCart = async (): Promise<Cart | null> => {
  try {
    const response = await apiClient.get<CartResponse>(
      API_ROUTES.CART.GET,
      true // Requires authentication
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle different response structures
      return data.cart || data.data || data;
    }

    console.error('Failed to fetch cart:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

/**
 * Add item to cart
 */
export const addItemToCart = async (
  itemData: AddToCartRequest
): Promise<{ success: boolean; message?: string; cart?: Cart }> => {
  try {
    const response = await apiClient.post<CartResponse>(
      API_ROUTES.CART.ADD_ITEM,
      {
        ...itemData,
        quantity: itemData.quantity || 1
      },
      true // Requires authentication
    );

    if (response.success) {
      const data = response.data as any;
      return {
        success: true,
        message: response.message,
        cart: data.cart || data.data || data
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to add item to cart'
    };
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while adding item to cart'
    };
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  itemId: number | string,
  quantity: number
): Promise<{ success: boolean; message?: string; cart?: Cart }> => {
  try {
    const response = await apiClient.put<CartResponse>(
      API_ROUTES.CART.UPDATE_ITEM(itemId),
      { quantity },
      true // Requires authentication
    );

    if (response.success) {
      const data = response.data as any;
      return {
        success: true,
        message: response.message,
        cart: data.cart || data.data || data
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to update cart item'
    };
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while updating cart item'
    };
  }
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (
  itemId: number | string
): Promise<{ success: boolean; message?: string; cart?: Cart }> => {
  try {
    const response = await apiClient.delete<CartResponse>(
      API_ROUTES.CART.REMOVE_ITEM(itemId),
      true // Requires authentication
    );

    if (response.success) {
      const data = response.data as any;
      return {
        success: true,
        message: response.message,
        cart: data.cart || data.data || data
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to remove cart item'
    };
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while removing cart item'
    };
  }
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiClient.delete<CartResponse>(
      API_ROUTES.CART.CLEAR,
      true // Requires authentication
    );

    return {
      success: response.success,
      message: response.message
    };
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while clearing cart'
    };
  }
};

