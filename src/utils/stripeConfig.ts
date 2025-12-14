/**
 * Stripe Configuration
 * Centralized configuration for Stripe integration
 */

/**
 * Stripe configuration values
 */
export const STRIPE_CONFIG = {
  // Get publishable key from environment
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  
  // Stripe appearance options
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#6B46C1', // Purple theme matching OptyShop
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
  
  // Payment element options
  paymentElementOptions: {
    layout: 'tabs' as const,
  },
} as const;

/**
 * Check if Stripe is configured
 */
export const isStripeConfigured = (): boolean => {
  return !!STRIPE_CONFIG.publishableKey;
};

/**
 * Get Stripe publishable key
 */
export const getStripePublishableKey = (): string => {
  return STRIPE_CONFIG.publishableKey;
};

