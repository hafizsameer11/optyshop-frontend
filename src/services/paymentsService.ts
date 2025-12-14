/**
 * Payments Service
 * Handles API calls for payment processing (Stripe integration)
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface CreatePaymentIntentRequest {
  order_id: number;
  amount?: number; // If not provided, uses order total
  currency?: string; // Default: 'USD'
}

/**
 * Payment Intent Data (what the backend returns in response.data)
 */
export interface PaymentIntentData {
  client_secret: string;
  payment_intent_id: string;
  order_id: number;
  amount: number;
  currency: string;
}

/**
 * Confirm Payment Data (what the backend returns in response.data)
 */
export interface ConfirmPaymentData {
  transaction_id: number;
  payment_intent_id: string;
  status: string;
  order_id: number;
}

/**
 * Payment Intent Status Data (what the backend returns in response.data)
 */
export interface PaymentIntentStatusData {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret?: string;
  order_id?: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a payment intent for an order
 * Returns client_secret for frontend Stripe integration
 * 
 * @param request - Payment intent creation request
 * @returns Payment intent data with client_secret, or null if failed
 */
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentData | null> => {
  try {
    const response = await apiClient.post<PaymentIntentData>(
      API_ROUTES.PAYMENTS.CREATE_INTENT,
      request,
      true // Requires authentication
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to create payment intent:', response.message || response.error);
    return null;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
};

/**
 * Confirm a payment intent after frontend Stripe.js confirmation
 * Updates transaction and order status
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Confirmation data with transaction_id and status, or null if failed
 */
export const confirmPayment = async (
  paymentIntentId: string
): Promise<ConfirmPaymentData | null> => {
  try {
    const response = await apiClient.post<ConfirmPaymentData>(
      API_ROUTES.PAYMENTS.CONFIRM,
      { payment_intent_id: paymentIntentId },
      true // Requires authentication
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to confirm payment:', response.message || response.error);
    return null;
  } catch (error) {
    console.error('Error confirming payment:', error);
    return null;
  }
};

/**
 * Get the current status of a payment intent from Stripe
 * Users can only access their own payment intents
 * 
 * @param intentId - Stripe payment intent ID (e.g., "pi_1234567890")
 * @returns Payment intent status data, or null if failed
 */
export const getPaymentIntentStatus = async (
  intentId: string
): Promise<PaymentIntentStatusData | null> => {
  try {
    const response = await apiClient.get<PaymentIntentStatusData>(
      API_ROUTES.PAYMENTS.INTENT_STATUS(intentId),
      true // Requires authentication
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to get payment intent status:', response.message || response.error);
    return null;
  } catch (error) {
    console.error('Error getting payment intent status:', error);
    return null;
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntentStatus,
};

