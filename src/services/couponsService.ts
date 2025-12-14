/**
 * Coupons Service
 * Handles coupon application and validation
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface CartItemForCoupon {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface ApplyCouponRequest {
  code: string;
  subtotal: number;
  cartItems: CartItemForCoupon[];
}

export interface CouponDiscount {
  discount_amount: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  final_total: number;
  original_total: number;
}

export interface ApplyCouponResponse {
  success: boolean;
  message: string;
  data?: CouponDiscount;
  error?: string;
}

/**
 * Apply a coupon code to the cart
 * @param code - Coupon code (e.g., "SAVE20")
 * @param subtotal - Cart subtotal
 * @param cartItems - Array of cart items with product_id, quantity, and unit_price
 */
export const applyCoupon = async (
  code: string,
  subtotal: number,
  cartItems: CartItemForCoupon[]
): Promise<CouponDiscount | null> => {
  try {
    const requestBody: ApplyCouponRequest = {
      code: code.toUpperCase().trim(),
      subtotal,
      cartItems,
    };

    const response = await apiClient.post<CouponDiscount>(
      API_ROUTES.COUPONS.APPLY,
      requestBody,
      false // PUBLIC endpoint (may require auth for user-specific limits)
    );

    if (response.success && response.data) {
      // The apiClient already extracts data.data || data, so response.data should be the CouponDiscount object
      return response.data;
    }

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('Failed to apply coupon:', response.message || response.error);
    }
    return null;
  } catch (error) {
    console.error('Error applying coupon:', error);
    return null;
  }
};

