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
    FORGOT_PASSWORD: `/auth/forgot-password`, // PUBLIC
    RESET_PASSWORD: `/auth/reset-password`,   // PUBLIC
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
    CONFIGURATION_LENS_TYPES: `/products/configuration/lens-types`, // PUBLIC - Get all prescription lens types with variants and colors
    // MM Caliber endpoints
    CALIBERS: (id: number | string) => `/products/${id}/calibers`, // PUBLIC - Get product with caliber options
    // Section-specific endpoints (filters by product_type)
    SECTION: (section: 'sunglasses' | 'eyeglasses' | 'contact-lenses' | 'eye-hygiene') => `/products/section/${section}`, // PUBLIC - Get products by section
  },

  // ============================================
  // CATEGORIES (PUBLIC)
  // ============================================
  CATEGORIES: {
    LIST: (includeProducts?: boolean, includeSubcategories?: boolean) => {
      const params = new URLSearchParams();
      if (includeProducts) params.append('includeProducts', 'true');
      if (includeSubcategories) params.append('includeSubcategories', 'true');
      const queryString = params.toString();
      return `/categories${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get all categories with optional products and subcategories
    BY_ID: (id: number | string) => `/categories/${id}`,         // PUBLIC
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`, // PUBLIC
    RELATED: (id: number | string, limit?: number, includeNested?: boolean) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', String(limit));
      if (includeNested) params.append('includeNested', 'true');
      const queryString = params.toString();
      return `/categories/${id}/related${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get related categories
    PRODUCTS: (id: number | string, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      const queryString = params.toString();
      return `/categories/${id}/products${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get category products with calibers
  },

  // ============================================
  // SUBCATEGORIES (PUBLIC)
  // ============================================
  SUBCATEGORIES: {
    LIST: (categoryId?: number | string, page: number = 1, limit: number = 50, search?: string) => {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', String(categoryId));
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      return `/subcategories?${params.toString()}`;
    },
    BY_CATEGORY: (categoryId: number | string) => `/subcategories/by-category/${categoryId}`, // PUBLIC - Get top-level subcategories with nested children
    BY_ID: (id: number | string) => `/subcategories/${id}`, // PUBLIC
    BY_SLUG: (slug: string) => `/subcategories/slug/${slug}`, // PUBLIC - Get subcategory by slug
    BY_PARENT: (parentId: number | string) => `/subcategories/by-parent/${parentId}`, // PUBLIC - Get nested subcategories by parent ID
    NESTED: (subcategoryId: number | string) => `/subcategories/${subcategoryId}/subcategories`, // PUBLIC - Get nested subcategories (children of a subcategory)
    PRODUCTS: (id: number | string, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
      const params = new URLSearchParams();
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      const queryString = params.toString();
      return `/subcategories/${id}/products${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get products for a subcategory (includes products from sub-subcategories if parent)
    RELATED_CATEGORIES: (subcategoryId: number | string, includeNested?: boolean) => {
      const params = new URLSearchParams();
      if (includeNested) params.append('includeNested', 'true');
      const queryString = params.toString();
      return `/subcategories/${subcategoryId}/related-categories${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get related categories for a subcategory
    CONTACT_LENS_OPTIONS: (id: number | string) => `/subcategories/${id}/contact-lens-options`, // PUBLIC - Get aggregated contact lens options by sub-subcategory ID
    CONTACT_LENS_OPTIONS_BY_SLUG: (slug: string) => `/subcategories/slug/${slug}/contact-lens-options`, // PUBLIC - Get aggregated contact lens options by sub-subcategory slug
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
    LIST: `/coupons`,                            // PUBLIC - Get available coupons
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
  // BRANDS (PUBLIC)
  // ============================================
  BRANDS: {
    LIST: `/brands`,                                     // PUBLIC (supports ?activeOnly=true)
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
      BY_ID: (id: number | string) => `/lens/thickness-materials/${id}`, // PUBLIC - Get lens thickness material by ID
    },
    THICKNESS_OPTIONS: {
      LIST: `/lens/thickness-options`,                  // PUBLIC - Get lens thickness options
      BY_ID: (id: number | string) => `/lens/thickness-options/${id}`, // PUBLIC - Get lens thickness option by ID
    },
    COLORS: `/lens/colors`,                             // PUBLIC - Get all lens colors
    PRESCRIPTION_SUN_COLORS: `/lens/prescription-sun-colors`, // PUBLIC - Get prescription sun colors
    FINISHES: {
      LIST: `/lens/finishes`,                          // PUBLIC - Get all lens finishes
      BY_ID: (id: number | string) => `/lens/finishes/${id}`, // PUBLIC - Get lens finish by ID
    },
    PRESCRIPTION_SUN_LENSES: {
      LIST: `/prescription-sun-lenses`,                 // PUBLIC - Get all prescription sun lenses organized by category
      BY_ID: (id: number | string) => `/prescription-sun-lenses/${id}`, // PUBLIC - Get prescription sun lens by ID
    },
    PHOTOCHROMIC_LENSES: {
      LIST: `/photochromic-lenses`,                     // PUBLIC - Get all photochromic lenses organized by type
      BY_ID: (id: number | string) => `/photochromic-lenses/${id}`, // PUBLIC - Get photochromic lens by ID
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
  // CONTACT LENS FORMS (PUBLIC & USER)
  // ============================================
  CONTACT_LENS_FORMS: {
    // Public endpoints
    GET_CONFIG: (subCategoryId: number | string) => `/contact-lens-forms/config/${subCategoryId}`, // PUBLIC - Get form configuration
    GET_ASTIGMATISM_DROPDOWN_VALUES: (fieldType?: 'power' | 'cylinder' | 'axis', eyeType?: 'left' | 'right' | 'both') => {
      const params = new URLSearchParams();
      if (fieldType) params.append('field_type', fieldType);
      if (eyeType) params.append('eye_type', eyeType);
      const queryString = params.toString();
      return `/contact-lens-forms/astigmatism/dropdown-values${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get astigmatism dropdown values
    GET_SPHERICAL_CONFIGS: (subCategoryId?: number | string, productId?: number | string) => {
      const params = new URLSearchParams();
      if (subCategoryId) params.append('sub_category_id', String(subCategoryId));
      if (productId) params.append('product_id', String(productId));
      const queryString = params.toString();
      return `/contact-lens-forms/spherical${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get spherical configurations (filtered by product_id if provided)
    GET_ASTIGMATISM_CONFIGS: (subCategoryId?: number | string, productId?: number | string) => {
      const params = new URLSearchParams();
      if (subCategoryId) params.append('sub_category_id', String(subCategoryId));
      if (productId) params.append('product_id', String(productId));
      const queryString = params.toString();
      return `/contact-lens-forms/astigmatism${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get astigmatism configurations (filtered by product_id if provided)
    GET_UNIT_PRICE_AND_IMAGES: (configId: number | string, unit: number | string) => `/contact-lens-forms/config/${configId}/unit/${unit}`, // PUBLIC - Get price and images for a selected unit
    
    // User endpoints (requires authentication)
    CHECKOUT: `/contact-lens-forms/checkout`, // USER - Add contact lens to cart
  },

  // ============================================
  // EYE HYGIENE FORMS (PUBLIC)
  // ============================================
  EYE_HYGIENE_FORMS: {
    GET_CONFIG: (subCategoryId: number | string) => `/eye-hygiene-forms/config/${subCategoryId}`, // PUBLIC - Get form configuration
    GET_OPTIONS: (subCategoryId?: number | string) => {
      const params = new URLSearchParams();
      if (subCategoryId) params.append('sub_category_id', String(subCategoryId));
      const queryString = params.toString();
      return `/eye-hygiene-forms/options${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get dropdown options (size_volume, pack_type)
    GET_VARIANTS: (productId: number | string) => `/products/${productId}/size-volume-variants`, // PUBLIC - Get size/volume variants for a product
  },

  // ============================================
  // PRESCRIPTION FORMS (PUBLIC)
  // ============================================
  PRESCRIPTION_FORMS: {
    // Get form structure by type
    GET_PROGRESSIVE: `/prescription-forms/progressive`, // PUBLIC - Get Progressive Vision form structure
    GET_NEAR_VISION: `/prescription-forms/near_vision`, // PUBLIC - Get Near Vision form structure
    GET_DISTANCE_VISION: `/prescription-forms/distance_vision`, // PUBLIC - Get Distance Vision form structure
    
    // Get dropdown values (with optional filters)
    GET_DROPDOWN_VALUES: (fieldType?: 'pd' | 'sph' | 'cyl' | 'axis' | 'h' | 'year_of_birth' | 'select_option', eyeType?: 'left' | 'right' | 'both', formType?: 'progressive' | 'near_vision' | 'distance_vision') => {
      const params = new URLSearchParams();
      if (fieldType) params.append('field_type', fieldType);
      if (eyeType) params.append('eye_type', eyeType);
      if (formType) params.append('form_type', formType);
      const queryString = params.toString();
      return `/prescription-forms/dropdown-values${queryString ? `?${queryString}` : ''}`;
    }, // PUBLIC - Get active dropdown values
    
    // Submit form
    SUBMIT: `/prescription-forms/submit`, // PUBLIC - Submit prescription form with copy_left_to_right support
  },

  // ============================================
  // FLASH OFFERS (PUBLIC)
  // ============================================
  FLASH_OFFERS: {
    LIST: (activeOnly?: boolean) => `/flash-offers${activeOnly ? '?activeOnly=true' : ''}`, // PUBLIC
    ACTIVE: `/flash-offers/active`, // PUBLIC - Get currently active flash offer with countdown
    /** Offer + listing-shaped products (ordered like product_ids). Public. */
    BY_ID: (id: number | string) => `/flash-offers/${id}`,
  },

  // ============================================
  // PRODUCT GIFTS (PUBLIC)
  // ============================================
  PRODUCT_GIFTS: {
    LIST: (productId?: number | string) => `/product-gifts${productId ? `?product_id=${productId}` : ''}`, // PUBLIC
    BY_PRODUCT: (productId: number | string) => `/product-gifts/product/${productId}`, // PUBLIC - Get gifts for a specific product
  },

  // ============================================
  // IMAGE PROXY (PUBLIC)
  // ============================================
  IMAGE_PROXY: {
    PROXY: (imageUrl: string) => `/proxy/image?url=${encodeURIComponent(imageUrl)}`, // PUBLIC - Proxy external images
  },

  // ============================================
  // HEALTH & API INFO (PUBLIC)
  // ============================================
  HEALTH: {
    CHECK: `/health`,                                   // PUBLIC - Health check endpoint
    API_INFO: `/api`,                                  // PUBLIC - API information endpoint
  },

  // ============================================
  // ADMIN API ENDPOINTS (FOR ADMIN PANEL)
  // ============================================
  ADMIN: {
    // MM Caliber Management
    MM_CALIBERS: {
      BY_PRODUCT: (productId: number | string) => `/admin/products/${productId}/calibers`, // GET all calibers for a product
      CREATE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`, // POST create caliber
      UPDATE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`, // PUT update caliber
      DELETE: (productId: number | string, mm: number) => `/admin/products/${productId}/calibers/${mm}`, // DELETE caliber
    },
    
    // Eye Hygiene Variant Management
    EYE_HYGIENE_VARIANTS: {
      LIST: (productId?: number | string) => `/admin/eye-hygiene-variants${productId ? `?product_id=${productId}` : ''}`, // GET variants (optionally by product)
      BY_ID: (id: number | string) => `/admin/eye-hygiene-variants/${id}`, // GET variant by ID
      CREATE: `/admin/eye-hygiene-variants`, // POST create variant
      UPDATE: (id: number | string) => `/admin/eye-hygiene-variants/${id}`, // PUT update variant
      DELETE: (id: number | string) => `/admin/eye-hygiene-variants/${id}`, // DELETE variant
    },
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

