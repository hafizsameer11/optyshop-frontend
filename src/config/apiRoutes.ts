/**
 * API Routes Configuration for OptyShop Frontend
 * Complete route definitions based on OptyShop API
 * 
 * AUTHENTICATION RULES:
 * - PUBLIC: No Authorization header required
 * - USER: Requires Authorization: Bearer {{access_token}} (customer token)
 * 
 * NOTE: This is the PUBLIC WEBSITE - uses customer access_token for authenticated routes
 * Admin routes (/api/admin/*) should NEVER be called from this frontend
 */

// API routes are relative paths - the API client will prepend the base URL
// This allows the base URL to be configured in one place (api.ts)

export const API_ROUTES = {
  // ============================================
  // AUTHENTICATION (Customer)
  // ============================================
  AUTH: {
    REGISTER: `/auth/register`,        // PUBLIC
    LOGIN: `/auth/login`,              // PUBLIC
    REFRESH: `/auth/refresh`,          // PUBLIC
    ME: `/auth/me`,                     // USER
    PROFILE: `/auth/profile`,           // USER
    CHANGE_PASSWORD: `/auth/change-password`, // USER
    LOGOUT: `/auth/logout`,             // USER
  },

  // ============================================
  // PRODUCTS (PUBLIC)
  // ============================================
  PRODUCTS: {
    LIST: `/products`,                           // PUBLIC
    FEATURED: `/products/featured`,             // PUBLIC
    OPTIONS: `/products/options`,               // PUBLIC
    BY_ID: (id: number | string) => `/products/${id}`,           // PUBLIC
    BY_SLUG: (slug: string) => `/products/slug/${slug}`, // PUBLIC
    RELATED: (id: number | string) => `/products/${id}/related`,  // PUBLIC
    CONFIGURATION: (id: number | string) => `/products/${id}/configuration`, // PUBLIC - Get product configuration
  },

  // ============================================
  // CATEGORIES (PUBLIC)
  // ============================================
  CATEGORIES: {
    LIST: `/categories`,                        // PUBLIC
    BY_ID: (id: number | string) => `/categories/${id}`,         // PUBLIC
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`, // PUBLIC
  },

  // ============================================
  // CART (USER - requires access_token)
  // ============================================
  CART: {
    GET: `/cart`,                               // USER
    ADD_ITEM: `/cart/items`,                    // USER
    UPDATE_ITEM: (id: number | string) => `/cart/items/${id}`,   // USER
    REMOVE_ITEM: (id: number | string) => `/cart/items/${id}`,   // USER
    CLEAR: `/cart`,                             // USER
  },

  // ============================================
  // ORDERS (USER - requires access_token)
  // ============================================
  ORDERS: {
    CREATE: `/orders`,                          // USER
    LIST: `/orders`,                             // USER
    BY_ID: (id: number | string) => `/orders/${id}`,             // USER
    CANCEL: (id: number | string) => `/orders/${id}/cancel`,      // USER
  },

  // ============================================
  // TRANSACTIONS (USER - requires access_token)
  // ============================================
  TRANSACTIONS: {
    LIST: `/transactions`,                       // USER
    BY_ID: (id: number | string) => `/transactions/${id}`,      // USER
  },

  // ============================================
  // PRESCRIPTIONS (USER - requires access_token)
  // ============================================
  PRESCRIPTIONS: {
    LIST: `/prescriptions`,                      // USER
    CREATE: `/prescriptions`,                   // USER
    BY_ID: (id: number | string) => `/prescriptions/${id}`,       // USER
    UPDATE: (id: number | string) => `/prescriptions/${id}`,     // USER
    DELETE: (id: number | string) => `/prescriptions/${id}`,      // USER
    VALIDATE: `/prescriptions/validate`,        // USER
    VERIFY: (id: number | string) => `/prescriptions/${id}/verify`, // USER
  },

  // ============================================
  // SIMULATIONS (PUBLIC - calculation endpoints)
  // ============================================
  SIMULATIONS: {
    CALCULATE_PD: `/simulations/pd`,                    // PUBLIC
    CALCULATE_PUPILLARY_HEIGHT: `/simulations/pupillary-height`, // PUBLIC
    CALCULATE_LENS_THICKNESS: `/simulations/lens-thickness`,     // PUBLIC
    KIDS_LENS_RECOMMENDATION: `/simulations/kids-lens-recommendation`, // PUBLIC
    LIFESTYLE_RECOMMENDATION: `/simulations/lifestyle-recommendation`, // PUBLIC
    CALCULATE_BASE_CURVE: `/simulations/base-curve`,     // PUBLIC
    PHOTOCHROMIC: `/simulations/photochromic`,          // PUBLIC
    AR_COATING: `/simulations/ar-coating`,              // PUBLIC
  },

  // ============================================
  // COUPONS (PUBLIC - apply endpoint)
  // ============================================
  COUPONS: {
    APPLY: `/coupons/apply`,                     // PUBLIC (but may require auth for user-specific limits)
  },

  // ============================================
  // CASE STUDIES (PUBLIC)
  // ============================================
  CASE_STUDIES: {
    LIST: `/case-studies`,                              // PUBLIC
    BY_SLUG: (slug: string) => `/case-studies/${slug}`,         // PUBLIC
  },

  // ============================================
  // BLOG (PUBLIC)
  // ============================================
  BLOG: {
    LIST: `/blog`,                                      // PUBLIC
    BY_SLUG: (slug: string) => `/blog/${slug}`,                 // PUBLIC
  },

  // ============================================
  // JOBS (PUBLIC)
  // ============================================
  JOBS: {
    LIST: `/jobs`,                                      // PUBLIC
    BY_ID: (id: number | string) => `/jobs/${id}`,                       // PUBLIC
  },

  // ============================================
  // FORMS (PUBLIC)
  // ============================================
  FORMS: {
    CONTACT: {
      CONFIG: `/forms/contact`,                         // PUBLIC
      SUBMIT: `/forms/contact/submissions`,             // PUBLIC
    },
    DEMO: {
      CONFIG: `/forms/demo`,                            // PUBLIC
      SUBMIT: `/forms/demo/submissions`,                 // PUBLIC
    },
    PRICING: {
      CONFIG: `/forms/pricing`,                         // PUBLIC
      SUBMIT: `/forms/pricing/submissions`,             // PUBLIC
    },
    JOB_APPLICATION: {
      CONFIG: `/forms/job-application`,                  // PUBLIC
      SUBMIT: `/forms/job-application/submissions`,     // PUBLIC
    },
    SUPPORT: {
      CONFIG: `/forms/support`,                         // PUBLIC
      SUBMIT: `/forms/support/submissions`,             // PUBLIC
    },
    CREDENTIALS: {
      CONFIG: `/forms/credentials`,                      // PUBLIC
      SUBMIT: `/forms/credentials/submissions`,         // PUBLIC
    },
  },

  // ============================================
  // BANNERS (PUBLIC)
  // ============================================
  BANNERS: {
    LIST: `/banners`,                                     // PUBLIC
  },

  // ============================================
  // CAMPAIGNS (PUBLIC)
  // ============================================
  CAMPAIGNS: {
    LIST: `/campaigns`,                                  // PUBLIC (supports ?activeOnly=true)
  },

  // ============================================
  // FAQs (PUBLIC)
  // ============================================
  FAQS: {
    LIST: `/faqs`,                                       // PUBLIC
  },

  // ============================================
  // PAGES (PUBLIC)
  // ============================================
  PAGES: {
    BY_SLUG: (slug: string) => `/pages/${slug}`,        // PUBLIC
  },

  // ============================================
  // CMS (PUBLIC)
  // ============================================
  CMS: {
    TESTIMONIALS: `/cms/testimonials`,                  // PUBLIC
  },

  // ============================================
  // LENS OPTIONS & TREATMENTS (PUBLIC)
  // ============================================
  LENS: {
    OPTIONS: {
      LIST: `/lens/options`,                            // PUBLIC
      BY_ID: (id: number | string) => `/lens/options/${id}`, // PUBLIC
    },
    TREATMENTS: {
      LIST: `/lens/treatments`,                         // PUBLIC
      BY_ID: (id: number | string) => `/lens/treatments/${id}`, // PUBLIC
    },
    PRESCRIPTION_LENS_TYPES: {
      LIST: `/lens/prescription-lens-types`,           // PUBLIC - Get all prescription lens types
      BY_ID: (id: number | string) => `/lens/prescription-lens-types/${id}`, // PUBLIC - Get prescription lens type by ID
      VARIANTS: (id: number | string) => `/lens/prescription-lens-types/${id}/variants`, // PUBLIC - Get variants for a prescription lens type
    },
    PRESCRIPTION_LENS_VARIANTS: {
      BY_ID: (id: number | string) => `/lens/prescription-lens-variants/${id}`, // PUBLIC - Get prescription lens variant by ID
    },
    THICKNESS_MATERIALS: {
      LIST: `/lens/thickness-materials`,                // PUBLIC - Get lens thickness materials
    },
    THICKNESS_OPTIONS: {
      LIST: `/lens/thickness-options`,                  // PUBLIC - Get lens thickness options
    },
  },

  // ============================================
  // SHIPPING METHODS (PUBLIC)
  // ============================================
  SHIPPING_METHODS: {
    LIST: `/shipping-methods`,                          // PUBLIC
    BY_ID: (id: number | string) => `/shipping-methods/${id}`, // PUBLIC
  },

  // ============================================
  // PAYMENTS (USER - requires access_token)
  // ============================================
  PAYMENTS: {
    CREATE_INTENT: `/payments/create-intent`,           // USER
    CONFIRM: `/payments/confirm`,                      // USER
    INTENT_STATUS: (intentId: string) => `/payments/intent/${intentId}`, // USER
  },

  // ============================================
  // PRODUCT CUSTOMIZATION (PUBLIC)
  // ============================================
  CUSTOMIZATION: {
    OPTIONS: `/customization/options`,                  // PUBLIC - Get all available customization options
    PRODUCT_CUSTOMIZATION: (productId: number | string) => `/customization/products/${productId}/customization`, // PUBLIC - Get customization options for a product
    CALCULATE_PRICE: (productId: number | string) => `/customization/products/${productId}/customization/calculate`, // PUBLIC - Calculate customization price
    CALCULATE_WITH_PRESCRIPTION: (productId: number | string) => `/customization/products/${productId}/customization/calculate-with-prescription`, // PUBLIC - Calculate customization price with prescription
    PRESCRIPTION_LENS_TYPES: `/customization/prescription-lens-types`, // PUBLIC - Get prescription lens types (Distance Vision, Near Vision, Progressive)
  },

  // ============================================
  // HEALTH & API INFO (PUBLIC)
  // ============================================
  HEALTH: {
    CHECK: `/health`,                                   // PUBLIC - Health check endpoint
    API_INFO: `/api`,                                  // PUBLIC - API information endpoint
  },
};

/**
 * Helper function to build query strings
 */
export const buildQueryString = (baseUrl: string, params: Record<string, any> = {}): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Common query parameters
 */
export const QUERY_PARAMS = {
  PAGE: 'page',
  LIMIT: 'limit',
  FRAME_SHAPE: 'frameShape',
  FRAME_MATERIAL: 'frameMaterial',
  MIN_PRICE: 'minPrice',
  MAX_PRICE: 'maxPrice',
  STATUS: 'status',
  SEARCH: 'search',
  CATEGORY: 'category',
};

export default API_ROUTES;

