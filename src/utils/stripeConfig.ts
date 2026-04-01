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
  
  // Stripe appearance options (aligned with shop blue-950)
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#172554',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#b91c1c',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
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

/** Currency for Stripe PaymentElement / createPaymentIntent (lowercase ISO 4217) */
export const getStripeDefaultCurrency = (): string => {
  const c = import.meta.env.VITE_STRIPE_DEFAULT_CURRENCY
  if (typeof c === 'string' && c.trim() !== '') {
    return c.trim().toLowerCase()
  }
  return 'eur'
}

