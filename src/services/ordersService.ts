/**
 * Orders Service
 * Handles order creation and management
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface Address {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  country: string;
}

export interface ContactLensDetails {
  form_type: 'spherical' | 'astigmatism';
  unit: string;
  right_eye: {
    qty: number;
    base_curve: number;
    diameter: number;
    power: number;
    cylinder?: number;
    axis?: number;
  };
  left_eye: {
    qty: number;
    base_curve: number;
    diameter: number;
    power: number;
    cylinder?: number;
    axis?: number;
  };
}

export interface OrderCartItem {
  product_id: number;
  quantity: number;
  lens_index?: number | string;
  lens_coating?: string;
  lens_coatings?: string[];
  prescription_id?: number | null;
  frame_size_id?: number | null;
  customization?: any;
  // Contact lens fields (for adding to cart/order)
  contact_lens_right_qty?: number;
  contact_lens_right_base_curve?: number;
  contact_lens_right_diameter?: number;
  contact_lens_right_power?: number | string;
  contact_lens_left_qty?: number;
  contact_lens_left_base_curve?: number;
  contact_lens_left_diameter?: number;
  contact_lens_left_power?: number | string;
  contact_lens_details?: ContactLensDetails;
}

export interface PaymentInfo {
  card_number?: string;
  cardholder_name?: string;
  expiry_date?: string;
  cvv?: string;
  payment_method: string;
}

export interface CreateOrderRequest {
  // For authenticated users - include cart items explicitly
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: string;
  shipping_method_id?: number; // Shipping method ID selected by user
  coupon_code?: string;
  items?: OrderCartItem[]; // Preferred field name (per documentation)
  cart_items?: OrderCartItem[]; // Alternative field name (also accepted by backend)
  
  // For guest checkout - include cart items and full details
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  payment_info?: PaymentInfo;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_slug?: string;
  quantity: number;
  price: number;
  unit_price?: number;
  subtotal: number;
  lens_index?: number | string;
  lens_coating?: string;
  lens_coatings?: string[];
  prescription_id?: number | null;
  frame_size_id?: number | null;
  customization?: any;
  // Contact lens fields (legacy - for backward compatibility)
  contact_lens_right_qty?: number;
  contact_lens_right_base_curve?: number;
  contact_lens_right_diameter?: number;
  contact_lens_right_power?: number | string;
  contact_lens_left_qty?: number;
  contact_lens_left_base_curve?: number;
  contact_lens_left_diameter?: number;
  contact_lens_left_power?: number | string;
  // New formatted contact_lens_details field from API
  contact_lens_details?: ContactLensDetails;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  total: number;
  subtotal: number;
  discount_amount?: number;
  shipping_cost: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  coupon_code?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[]; // Order items with contact_lens_details
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data?: Order;
  error?: string;
}

/**
 * Create a new order from the current cart (authenticated users)
 * @param orderData - Order data including shipping/billing addresses, payment method, cart items, and optional coupon code
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<Order | null> => {
  try {
    // Ensure cart_items are included - backend requires this
    // If cart_items not provided, try to use items from the request
    // Payment method should be lowercase (stripe, paypal, cod) per Postman collection
    const validPaymentMethods = ['stripe', 'paypal', 'cod'];
    let normalizedPaymentMethod = orderData.payment_method 
      ? orderData.payment_method.toLowerCase() 
      : 'stripe';
    
    // Validate payment method
    if (!validPaymentMethods.includes(normalizedPaymentMethod)) {
      console.warn(`Invalid payment method: ${normalizedPaymentMethod}. Defaulting to 'stripe'.`);
      normalizedPaymentMethod = 'stripe';
    }

    // Backend accepts addresses as objects (will be JSON stringified automatically)
    // Backend accepts 'items' or 'cart_items' - prefer 'items' as per documentation
    const orderPayload: any = {
      ...orderData,
      // Use 'items' from orderData if provided, otherwise use 'cart_items'
      items: orderData.items || orderData.cart_items || [],
      // Payment method should be lowercase (stripe, paypal, cod)
      payment_method: normalizedPaymentMethod,
      // Include shipping_method_id if provided
      shipping_method_id: orderData.shipping_method_id,
      // Addresses can be sent as objects (backend will handle JSON stringification)
      // Remove cart_items if items is provided to avoid confusion
      ...(orderData.items ? {} : { cart_items: orderData.cart_items || [] }),
    };

    // Validate that we have items
    if ((!orderPayload.items || orderPayload.items.length === 0) && 
        (!orderPayload.cart_items || orderPayload.cart_items.length === 0)) {
      console.error('Cannot create order: items are required');
      return null;
    }

    const response = await apiClient.post<Order>(
      API_ROUTES.ORDERS.CREATE,
      orderPayload,
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      return response.data;
    }

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('Failed to create order:', response.message || response.error);
      console.error('Response details:', response);
    }
    
    // Throw error with message so caller can handle it
    if (response.error || response.message) {
      const error = new Error(response.message || response.error || 'Failed to create order');
      (error as any).response = response;
      throw error;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

/**
 * Create a guest order with cart items and customer details
 * This endpoint handles guest checkout and sends email notifications
 * @param orderData - Order data including cart items, customer info, payment details, and coupon code
 */
export const createGuestOrder = async (
  orderData: CreateOrderRequest
): Promise<Order | null> => {
  try {
    // For guest checkout, we send all data including cart items
    // The backend will create the order and send email notification
    // Validate that we have cart items
    if (!orderData.cart_items || orderData.cart_items.length === 0) {
      console.error('Cannot create guest order: cart_items are required');
      return null;
    }

    // Validate and normalize payment method
    const validPaymentMethods = ['stripe', 'paypal', 'cod'];
    let guestPaymentMethod = (orderData.payment_info?.payment_method || orderData.payment_method || 'stripe').toLowerCase();
    if (!validPaymentMethods.includes(guestPaymentMethod)) {
      console.warn(`Invalid payment method: ${guestPaymentMethod}. Defaulting to 'stripe'.`);
      guestPaymentMethod = 'stripe';
    }

    const guestOrderData: any = {
      cart_items: orderData.cart_items,
      // Backend might expect 'items' as well - include both for compatibility
      items: orderData.cart_items,
      first_name: orderData.first_name,
      last_name: orderData.last_name,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      zip_code: orderData.zip_code,
      country: orderData.country,
      coupon_code: orderData.coupon_code,
      payment_info: orderData.payment_info ? {
        payment_method: guestPaymentMethod,
        card_number: orderData.payment_info.card_number,
        cardholder_name: orderData.payment_info.cardholder_name,
        expiry_date: orderData.payment_info.expiry_date,
        cvv: orderData.payment_info.cvv,
      } : {
        payment_method: guestPaymentMethod,
      },
      // Also include payment_method at top level for backend compatibility (lowercase)
      payment_method: guestPaymentMethod,
      // Include shipping_method_id if provided
      shipping_method_id: orderData.shipping_method_id,
    };

    // For guest checkout, try without authentication first
    // If that fails with authorization error, the backend might require a different approach
    let response = await apiClient.post<Order>(
      API_ROUTES.ORDERS.CREATE,
      guestOrderData,
      false // Guest checkout - try PUBLIC endpoint first (no auth required)
    );

    // Check if the error is authorization-related
    const isAuthError = !response.success && (
      response.error?.toLowerCase().includes('401') ||
      response.error?.toLowerCase().includes('unauthorized') ||
      response.error?.toLowerCase().includes('not authorized') ||
      response.message?.toLowerCase().includes('unauthorized') ||
      response.message?.toLowerCase().includes('not authorized')
    );

    // If we got an authorization error, the backend might not support guest orders on this endpoint
    // Log this for debugging - the backend may need to be updated to support guest checkout
    if (isAuthError) {
      if (import.meta.env.DEV) {
        console.warn('Guest order creation requires authentication. Backend may need to support guest checkout on /orders endpoint.');
      }
    }

    if (response.success && response.data) {
      return response.data;
    }

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('Failed to create guest order:', response.message || response.error);
      console.error('Response details:', response);
    }
    
    // If authorization error, throw with specific message
    if (isAuthError) {
      const error = new Error('Guest checkout requires authentication. Please login to complete your order.');
      (error as any).response = response;
      throw error;
    }
    
    // Throw error with message so caller can handle it
    if (response.error || response.message) {
      const error = new Error(response.message || response.error || 'Failed to create guest order');
      (error as any).response = response;
      throw error;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating guest order:', error);
    return null;
  }
};

/**
 * Get all orders for the current user
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await apiClient.get<Order[]>(
      API_ROUTES.ORDERS.LIST,
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      // Handle both array response and wrapped response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If backend returns { orders: [...] }, extract it
      if (response.data && typeof response.data === 'object' && 'orders' in response.data) {
        return (response.data as any).orders || [];
      }
      return [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

/**
 * Get a specific order by ID
 * @param orderId - Order ID
 */
export const getOrderById = async (orderId: number | string): Promise<Order & { items?: OrderItem[] } | null> => {
  try {
    const response = await apiClient.get<{ 
      success: boolean;
      message?: string;
      data: { 
        order: Order & { items?: OrderItem[] };
      } | (Order & { items?: OrderItem[] });
    }>(
      API_ROUTES.ORDERS.BY_ID(orderId),
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      // API returns { data: { order: {...} } } or { data: {...} }
      const orderData = (response.data as any).order || response.data;
      
      // Parse JSON string addresses if they exist
      if (typeof orderData.shipping_address === 'string') {
        try {
          orderData.shipping_address = JSON.parse(orderData.shipping_address);
        } catch (e) {
          console.error('Error parsing shipping_address:', e);
        }
      }
      if (typeof orderData.billing_address === 'string') {
        try {
          orderData.billing_address = JSON.parse(orderData.billing_address);
        } catch (e) {
          console.error('Error parsing billing_address:', e);
        }
      }
      
      return orderData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

/**
 * Cancel an order
 * @param orderId - Order ID
 */
export const cancelOrder = async (orderId: number | string): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    const response = await apiClient.post<{ 
      success: boolean; 
      message: string; 
      data: { order: any } 
    }>(
      API_ROUTES.ORDERS.CANCEL(orderId),
      {},
      true // Requires authentication (USER endpoint)
    );

    if (response.success && response.data) {
      return { 
        success: true, 
        message: response.data.message || 'Order cancelled successfully',
        data: response.data.data 
      };
    }

    return { 
      success: false, 
      message: response.message || 'Failed to cancel order' 
    };
  } catch (error: any) {
    console.error('Error canceling order:', error);
    return { 
      success: false, 
      message: error.message || 'An error occurred while canceling the order' 
    };
  }
};


