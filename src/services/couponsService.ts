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

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string | number;
  max_discount?: string | number;
  min_order_amount?: string | number;
  usage_limit?: number | null;
  usage_per_user?: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  applicable_to?: string | null;
  conditions?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponsListResponse {
  success: boolean;
  message: string;
  data?: {
    coupons: Coupon[];
  };
}

/**
 * Apply a coupon code to the cart
 * @param code - Coupon code (e.g., "SAVE20")
 * @param subtotal - Cart subtotal
 * @param cartItems - Array of cart items with product_id, quantity, and unit_price
 */
/**
 * Apply a coupon code to the cart
 * @param code - Coupon code (e.g., "SAVE20")
 * @param subtotal - Cart subtotal
 * @param cartItems - Array of cart items with product_id, quantity, and unit_price
 * @returns CouponDiscount object if successful
 * @throws Error with backend error message if failed
 */
export const applyCoupon = async (
  code: string,
  subtotal: number,
  cartItems: CartItemForCoupon[]
): Promise<CouponDiscount> => {
  const requestBody: ApplyCouponRequest = {
    code: code.toUpperCase().trim(),
    subtotal,
    cartItems,
  };

  // Log request for debugging
  if (import.meta.env.DEV) {
    console.log('[Coupon Service] Applying coupon:', {
      code: requestBody.code,
      subtotal,
      cartItemsCount: cartItems.length,
      endpoint: API_ROUTES.COUPONS.APPLY,
      requestBody
    });
  }

  const response = await apiClient.post<CouponDiscount>(
    API_ROUTES.COUPONS.APPLY,
    requestBody,
    false // PUBLIC endpoint (may require auth for user-specific limits)
  );

  if (response.success && response.data) {
    // The apiClient already extracts data.data || data, so response.data should be the CouponDiscount object
    if (import.meta.env.DEV) {
      console.log('[Coupon Service] Coupon applied successfully:', response.data);
    }
    return response.data;
  }

  // Log detailed error for debugging
  const errorMessage = response.message || response.error || 'Invalid or expired coupon code';
  console.error('[Coupon Service] Failed to apply coupon:', {
    success: response.success,
    message: response.message,
    error: response.error,
    fullResponse: response
  });
  
    // Throw error with backend message so components can display it
    throw new Error(errorMessage);
};

/**
 * Get list of available coupons
 * @returns Array of available coupons
 */
export const getAvailableCoupons = async (): Promise<Coupon[]> => {
  // Try admin endpoint first (based on user's response, this is the working endpoint)
  // The admin endpoint might be accessible publicly or might require auth
  try {
    const response = await apiClient.get<{ coupons: Coupon[] }>(
      '/admin/coupons',
      false // Try without auth first
    );

    if (response.success && response.data) {
      // Filter only active coupons that are currently valid
      const now = new Date();
      const coupons = Array.isArray(response.data) ? response.data : response.data.coupons || [];
      const activeCoupons = coupons.filter((coupon: Coupon) => {
        if (!coupon.is_active) return false;
        
        const startsAt = new Date(coupon.starts_at);
        const endsAt = new Date(coupon.ends_at);
        
        return now >= startsAt && now <= endsAt;
      });
      
      if (import.meta.env.DEV) {
        console.log('[Coupon Service] Fetched coupons from admin endpoint:', activeCoupons.length);
      }
      
      return activeCoupons;
    }
  } catch (adminError: any) {
    // If admin endpoint fails (404 or auth required), try public endpoint
    if (import.meta.env.DEV) {
      console.log('[Coupon Service] Admin endpoint failed, trying public endpoint...', adminError?.message);
    }
    
    try {
      const response = await apiClient.get<{ coupons: Coupon[] }>(
        API_ROUTES.COUPONS.LIST,
        false // PUBLIC endpoint
      );

      if (response.success && response.data) {
        const now = new Date();
        const coupons = Array.isArray(response.data) ? response.data : response.data.coupons || [];
        const activeCoupons = coupons.filter((coupon: Coupon) => {
          if (!coupon.is_active) return false;
          
          const startsAt = new Date(coupon.starts_at);
          const endsAt = new Date(coupon.ends_at);
          
          return now >= startsAt && now <= endsAt;
        });
        
        return activeCoupons;
      }
    } catch (publicError: any) {
      // Both endpoints failed - log and return empty array
      if (import.meta.env.DEV) {
        console.warn('[Coupon Service] Both endpoints failed. Coupons dropdown will be hidden.', {
          adminError: adminError?.message || 'Admin endpoint not accessible',
          publicError: publicError?.message || 'Public endpoint not found (404)'
        });
      }
    }
  }

  // Return empty array if both endpoints fail - dropdown will be hidden
  return [];
};

