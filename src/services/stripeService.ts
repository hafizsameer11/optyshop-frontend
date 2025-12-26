/**
 * Stripe Service
 * Handles Stripe payment gateway initialization and payment processing
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variable
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Singleton instance
let stripePromise: Promise<Stripe | null> | null = null;
let stripeInstance: Stripe | null = null;

/**
 * Get or create Stripe promise (for Elements component)
 * @returns Promise<Stripe | null> - Stripe promise or null if key is missing
 */
export const getStripePromise = (): Promise<Stripe | null> | null => {
  // If no publishable key is provided, return null
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not found. Set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.');
    return null;
  }

  // Return cached promise if already initializing
  if (stripePromise) {
    return stripePromise;
  }

  // Initialize Stripe and return the promise
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  
  // Cache the instance when resolved
  stripePromise.then((stripe) => {
    stripeInstance = stripe;
  }).catch((error) => {
    console.error('Error initializing Stripe:', error);
    stripePromise = null;
  });
  
  return stripePromise;
};

/**
 * Initialize Stripe with publishable key
 * @returns Promise<Stripe | null> - Stripe instance or null if key is missing
 */
export const initializeStripe = async (): Promise<Stripe | null> => {
  const promise = getStripePromise();
  if (!promise) {
    return null;
  }
  return await promise;
};

/**
 * Get Stripe instance (initializes if not already done)
 * @returns Promise<Stripe | null>
 */
export const getStripe = async (): Promise<Stripe | null> => {
  if (stripeInstance) {
    return stripeInstance;
  }
  return await initializeStripe();
};

/**
 * Check if Stripe is available
 * @returns boolean
 */
export const isStripeAvailable = (): boolean => {
  return !!STRIPE_PUBLISHABLE_KEY;
};

/**
 * Create a payment intent on the backend
 * This should be called from your backend API
 * @param amount - Amount in cents (e.g., 19999 for $199.99)
 * @param currency - Currency code (default: 'usd')
 * @param metadata - Optional metadata to attach to the payment
 */
export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string; // Default: 'usd'
  metadata?: Record<string, string>;
  order_id?: number;
  customer_id?: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Process payment with Stripe
 * @param elements - Stripe Elements instance
 * @param clientSecret - Payment intent client secret from backend
 * @returns Promise with payment result
 */
export interface PaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    status: string;
  };
  error?: {
    type: string;
    message: string;
  };
}

export const processPayment = async (
  elements: any, // StripeElements from @stripe/react-stripe-js
  clientSecret: string
): Promise<PaymentResult> => {
  const stripe = await getStripe();
  
  if (!stripe) {
    return {
      success: false,
      error: {
        type: 'stripe_not_initialized',
        message: 'Stripe is not initialized. Please check your configuration.',
      },
    };
  }

  if (!elements) {
    return {
      success: false,
      error: {
        type: 'elements_not_found',
        message: 'Stripe Elements not found.',
      },
    };
  }

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/customer/orders`,
      },
      redirect: 'if_required', // Only redirect if required (3D Secure)
    });

    if (error) {
      return {
        success: false,
        error: {
          type: error.type || 'payment_failed',
          message: error.message || 'Payment failed',
        },
      };
    }

    if (paymentIntent) {
      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: 'Payment processing completed but no payment intent was returned.',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        type: 'exception',
        message: error.message || 'An unexpected error occurred during payment processing.',
      },
    };
  }
};

/**
 * Get Stripe publishable key (for debugging)
 * @returns string | null
 */
export const getStripePublishableKey = (): string | null => {
  return STRIPE_PUBLISHABLE_KEY || null;
};

/**
 * Reset Stripe instance (useful for testing)
 */
export const resetStripe = (): void => {
  stripePromise = null;
  stripeInstance = null;
};

