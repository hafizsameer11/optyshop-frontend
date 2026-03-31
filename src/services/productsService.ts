/**
 * Products Service
 * Handles all product API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize subcategory field names from product data
 * Handles various API response formats for subcategory information
 */
export const normalizeProductSubcategory = (product: Product | any): { 
  slug: string | null; 
  name: string | null;
  parentSlug: string | null;
  parentName: string | null;
  fullPath: string[];
} => {
  const p = product as any
  
  // Try multiple possible field names for subcategory
  const slug = p.subCategory?.slug || 
               p.sub_category?.slug || 
               p.subcategory?.slug ||
               p.category?.sub_category?.slug ||
               p.category?.subcategory?.slug ||
               null
  
  const name = p.subCategory?.name || 
               p.sub_category?.name || 
               p.subcategory?.name ||
               p.category?.sub_category?.name ||
               p.category?.subcategory?.name ||
               null
  
  // Get parent information
  const parentSlug = p.subCategory?.parent?.slug || 
                    p.sub_category?.parent?.slug || 
                    p.subcategory?.parent?.slug ||
                    p.category?.sub_category?.parent?.slug ||
                    p.category?.subcategory?.parent?.slug ||
                    null
  
  const parentName = p.subCategory?.parent?.name || 
                    p.sub_category?.parent?.name || 
                    p.subcategory?.parent?.name ||
                    p.category?.sub_category?.parent?.name ||
                    p.category?.subcategory?.parent?.name ||
                    null
  
  // Build full path for hierarchy matching
  const fullPath = []
  if (parentSlug) fullPath.push(parentSlug)
  if (slug) fullPath.push(slug)
  
  return { slug, name, parentSlug, parentName, fullPath }
}

// ============================================
// Type Definitions
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface LensType {
  id: number;
  name: string;
  slug: string;
  index: number;
  thickness_factor: number | null;
  price_adjustment: number;
}

export interface LensCoating {
  id: number;
  name: string;
  slug: string;
  type: string;
  price_adjustment: number;
}

export interface FrameSize {
  id: number;
  size_label: string;
  lens_width: string;
  bridge_width: string;
  temple_length: string;
  frame_width: string;
  frame_height: string;
}

export interface ProductOptions {
  categories: Category[];
  frameShapes: string[];
  frameMaterials: string[];
  genders: string[];
  lensTypes: LensType[];
  lensCoatings: LensCoating[];
  lensIndexOptions: number[];
  frameSizes: FrameSize[];
  lensTypeEnums: string[];
  brands?: string[]; // Add brands property as optional
}

export interface ProductOptionsResponse {
  success: boolean;
  message: string;
  data: ProductOptions;
}

export interface ColorImage {
  color: string;
  name?: string;
  display_name?: string;
  price?: number; // Variant-specific price (optional - uses base product price if not provided)
  images: string[];
}

export interface SizeVolumeVariant {
  id: number;
  size_volume: string; // e.g., "5ml", "10ml", "30ml"
  pack_type?: string | null; // e.g., "Single", "Pack of 2"
  price: number; // Price for this variant
  compare_at_price?: number | null; // Compare at price (for showing discounts)
  cost_price?: number | null; // Cost price (internal use)
  stock_quantity: number; // Available quantity for this variant
  stock_status: 'in_stock' | 'out_of_stock' | 'backorder'; // Stock status
  sku?: string | null; // SKU for this variant
  expiry_date?: string | null; // Expiry date (ISO 8601 format)
  image_url?: string | null; // Image URL for this variant (max 500 characters, optional)
  is_active: boolean; // Whether variant is active
  sort_order: number; // Display order (lower = first)
}

export interface MMCaliber {
  mm: number | string; // e.g., 58, "78" - handle both number and string from API
  image_url: string; // URL to caliber-specific image (matches API response)
  price?: number; // Optional price adjustment for this caliber
  stock_quantity?: number; // Stock for this specific caliber
  is_active?: boolean; // Whether this caliber is available
}

export interface EyeHygieneVariant {
  id: number;
  product_id: number;
  name: string; // e.g., "5ml Single", "10ml Pack of 2"
  description?: string; // Description of the variant
  size_volume: string; // e.g., "5ml", "10ml", "30ml"
  pack_type?: string | null; // e.g., "Single", "Pack of 2"
  price: number; // Price for this variant
  compare_at_price?: number | null; // Compare at price (for showing discounts)
  cost_price?: number | null; // Cost price (internal use)
  stock_quantity: number; // Available quantity for this variant
  stock_status: 'in_stock' | 'out_of_stock' | 'backorder'; // Stock status
  sku?: string | null; // SKU for this variant
  expiry_date?: string | null; // Expiry date (ISO 8601 format)
  image_url?: string; // Variant-specific image URL (matches API guide)
  image?: string; // Legacy image field (for backward compatibility)
  is_active: boolean; // Whether variant is active
  sort_order: number; // Display order (lower = first)
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  sku?: string;
  in_stock?: boolean;
  stock_quantity?: number;
  images?: string[];
  image?: string;
  image_url?: string;
  thumbnail?: string;
  model_3d_url?: string | null; // URL to 3D model file (e.g., .glb, .gltf)
  color_images?: ColorImage[]; // Array of color-specific images
  category?: Category;
  frame_shape?: string;
  frame_material?: string;
  gender?: string;
  brand?: string;
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
  can_sleep_with?: boolean;
  is_medical_device?: boolean;
  has_uv_filter?: boolean;
  
  // Frame specific fields
  frameSizes?: FrameSize[];
  lensTypes?: LensType[];
  lensCoatings?: LensCoating[];
  
  // MM Caliber System (for frames/glasses)
  mm_calibers?: MMCaliber[]; // Array of caliber options with images
  
  // Eye Hygiene specific fields (legacy - for backward compatibility)
  size_volume?: string | null; // e.g., "5ml", "10ml", "30ml"
  pack_type?: string | null; // e.g., "Single", "Pack of 2", "Pack of 3"
  expiry_date?: string | null; // ISO 8601 format date string
  
  // Size/Volume Variants (new - only for Eye Hygiene products with variants)
  size_volume_variants?: SizeVolumeVariant[]; // Array of size/volume variants (only active variants in public endpoints)
  
  // Eye Hygiene Variants (new - for Eye Hygiene products with variants)
  eyeHygieneVariants?: EyeHygieneVariant[]; // Array of eye hygiene variants (only active variants in public endpoints)
  
  [key: string]: any; // Allow for additional product properties
}

export interface ProductsListResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface FeaturedProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
  };
}

export interface RelatedProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
  };
}

export interface ProductBySlugResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  frameShape?: string;
  frameMaterial?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string | number;
  subcategory?: string | number;
  subSubcategory?: string | number;
  gender?: string;
  lensType?: string;
  lensCoating?: string;
  brand?: string;
  inStock?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;

  // Contact lens specific filters
  baseCurve?: string;
  diameter?: string;
  replacementPeriod?: string;

  [key: string]: any;
}

// Product section types
export type ProductSection = 'sunglasses' | 'eyeglasses' | 'contact-lenses' | 'eye-hygiene';

// ============================================
// API Functions
// ============================================

/**
 * Get product form options (categories, frame shapes, materials, etc.)
 */
export const getProductOptions = async (): Promise<ProductOptions | null> => {
  try {
    const response = await apiClient.get<ProductOptions>(
      API_ROUTES.PRODUCTS.OPTIONS,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch product options:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product options:', error);
    return null;
  }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get<{ products: Product[] }>(
      API_ROUTES.PRODUCTS.FEATURED,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return (response.data as any).products || [];
    }

    console.error('Failed to fetch featured products:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
};

/**
 * Get products with filters
 * Matches Postman collection structure: GET /api/products
 * Supports all filters from Postman collection:
 * - page, limit, category, subCategory, frameShape, frameMaterial, lensType, gender
 * - minPrice, maxPrice, search, sortBy, sortOrder, isFeatured
 * 
 * Response includes for each product:
 * - images: Array of product image URLs
 * - image: First image URL (for easy access)
 * - model_3d_url: URL to 3D model file (null if not available)
 * - color_images: Array of color-specific images
 * 
 * ⚠️ Product Deletion Integration:
 * - Deleted products (removed via DELETE /api/admin/products/:id) are automatically excluded
 * - The backend filters out deleted products from all public endpoints
 * - No manual refresh needed - deleted products disappear automatically from the website
 * 
 * @param filters - Filter parameters matching Postman collection
 */
export const getProducts = async (filters: ProductFilters = {}): Promise<{
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} | null> => {
  try {
    // Map subcategory to subCategory (API expects capital C as per Postman collection)
    // Map subSubcategory to subSubcategory (API expects this parameter name for nested subcategories)
    const apiFilters: Record<string, any> = { ...filters };
    if (apiFilters.subcategory !== undefined) {
      apiFilters.subCategory = apiFilters.subcategory;
      delete apiFilters.subcategory;
    }
    if (apiFilters.subSubcategory !== undefined) {
      apiFilters.subSubcategory = apiFilters.subSubcategory;
    }
    
    // Ensure boolean filters are properly formatted
    if (apiFilters.isFeatured !== undefined) {
      apiFilters.isFeatured = apiFilters.isFeatured === true || apiFilters.isFeatured === 'true';
    }
    
    const endpoint = buildQueryString(API_ROUTES.PRODUCTS.LIST, apiFilters);
    
    if (import.meta.env.DEV && (filters.subcategory || filters.subSubcategory)) {
      console.log('🔍 API Request - Filtering by subcategory:', {
        subcategory: filters.subcategory,
        subSubcategory: filters.subSubcategory,
        category: filters.category,
        endpoint
      })
    }
    
    const response = await apiClient.get<ProductsListResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle Postman collection response structure:
      // { success: true, data: { products: [...], pagination: {...} } }
      const products = data.products || (data.data && data.data.products) || [];
      const pagination = data.pagination || (data.data && data.data.pagination) || {
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
      };
      
      return {
        products,
        pagination,
      };
    }

    // Log detailed error information for debugging
    if (import.meta.env.DEV) {
      console.error('❌ Failed to fetch products:', {
        message: response.message,
        error: response.error,
        filters: filters,
        endpoint: endpoint
      });
    } else {
      console.error('Failed to fetch products:', response.message || response.error);
    }
    return null;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};

/**
 * Get product by slug
 * Matches Postman collection structure: GET /api/products/slug/:slug
 * 
 * ⚠️ Product Deletion Integration:
 * - Returns null if product is deleted (404 from backend)
 * - ProductDetail page handles null by redirecting to /shop
 * - Deleted products cannot be accessed via this endpoint
 * 
 * @param slug - Product slug
 * @returns Product object or null if not found/deleted
 */
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.PRODUCTS.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle Postman collection response structure:
      // { success: true, data: { product: {...} } } or { success: true, data: {...} }
      const product = (response.data as any).product || response.data;
      
      // Log Eye Hygiene fields if present (for debugging)
      if (import.meta.env.DEV && ((product as any).size_volume || (product as any).pack_type || (product as any).expiry_date)) {
        console.log('[Product Service] Eye Hygiene fields detected:', {
          size_volume: (product as any).size_volume,
          pack_type: (product as any).pack_type,
          expiry_date: (product as any).expiry_date,
          category: product.category?.name,
          subcategory: (product as any).subCategory?.name || (product as any).sub_category?.name
        });
      }
      
      // Ensure all Postman collection fields are preserved
      // (model_3d_url, color_images, contact lens fields, Eye Hygiene fields, etc.)
      return product as Product;
    }

    console.error('Failed to fetch product by slug:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
};

/**
 * Get product by ID
 * Matches Postman collection structure: GET /api/products/:id
 * Returns full product details including:
 * - Media fields: images, image, model_3d_url, color_images
 * - Contact lens fields: base_curve_options, diameter_options, powers_range, etc.
 * - Frame fields: frameSizes, lensTypes, lensCoatings
 * 
 * ⚠️ Product Deletion Integration:
 * - Returns null if product is deleted (404 from backend)
 * - Deleted products cannot be accessed via this endpoint
 * 
 * @param id - Product ID
 * @returns Product object or null if not found/deleted
 */
export const getProductById = async (id: number | string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.PRODUCTS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle Postman collection response structure:
      // { success: true, data: { product: {...} } } or { success: true, data: {...} }
      const product = (response.data as any).product || response.data;
      
      // Log Eye Hygiene fields if present (for debugging)
      if (import.meta.env.DEV && ((product as any).size_volume || (product as any).pack_type || (product as any).expiry_date || (product as any).size_volume_variants)) {
        console.log('[Product Service] Eye Hygiene fields detected:', {
          size_volume: (product as any).size_volume,
          pack_type: (product as any).pack_type,
          expiry_date: (product as any).expiry_date,
          variants_count: (product as any).size_volume_variants?.length || 0,
          category: product.category?.name,
          subcategory: (product as any).subCategory?.name || (product as any).sub_category?.name
        });
      }
      
      // Ensure all Postman collection fields are preserved
      return product as Product;
    }

    console.error('Failed to fetch product by ID:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
};

/**
 * Get related products
 * @param id - Product ID
 * @param limit - Maximum number of related products to return (default: 4)
 */
export const getRelatedProducts = async (
  id: number | string,
  limit: number = 4
): Promise<Product[]> => {
  try {
    const endpoint = buildQueryString(API_ROUTES.PRODUCTS.RELATED(id), { limit });
    
    const response = await apiClient.get<{ products: Product[] }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return (response.data as any).products || [];
    }

    console.error('Failed to fetch related products:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
};

/**
 * Get products by section (sunglasses, eyeglasses, contact-lenses, eye-hygiene)
 * @param section - Product section type
 * @param filters - Product filters
 * @returns Products list with pagination or null if error
 */
export const getProductsBySection = async (
  section: ProductSection,
  filters: ProductFilters = {}
): Promise<{
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} | null> => {
  try {
    // Add section filter to existing filters
    const sectionFilters: Record<string, any> = { ...filters };
    
    // Map section to appropriate category or filter
    switch (section) {
      case 'sunglasses':
        sectionFilters.category = 'sunglasses';
        break;
      case 'eyeglasses':
        sectionFilters.category = 'eyeglasses';
        break;
      case 'contact-lenses':
        sectionFilters.category = 'contact-lenses';
        break;
      case 'eye-hygiene':
        sectionFilters.category = 'eye-hygiene';
        break;
    }
    
    // Use the existing getProducts function with section filters
    return await getProducts(sectionFilters);
  } catch (error) {
    console.error('Error fetching products by section:', error);
    return null;
  }
};

// ============================================
// ADMIN API FUNCTIONS (FOR ADMIN PANEL)
// ============================================

/**
 * Get product calibers (mm sizes) for frames/glasses
 * Matches Postman collection structure: GET /api/products/:id/calibers
 * 
 * @param id - Product ID
 * @returns Array of MMCaliber objects or null if error
 */
export const getProductCalibers = async (id: number | string): Promise<MMCaliber[] | null> => {
  try {
    const response = await apiClient.get<{ calibers: MMCaliber[] }>(
      API_ROUTES.PRODUCTS.CALIBERS(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return (response.data as any).calibers || [];
    }

    console.error('Failed to fetch product calibers:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product calibers:', error);
    return null;
  }
};

/**
 * Get eye hygiene variants for a product
 * Matches API guide: GET /api/products/:id/eye-hygiene-variants
 * 
 * @param id - Product ID
 * @returns Array of EyeHygieneVariant objects or null if error
 */
export const getProductEyeHygieneVariants = async (id: number | string): Promise<EyeHygieneVariant[] | null> => {
  try {
    const response = await apiClient.get<{ variants: EyeHygieneVariant[] }>(
      API_ROUTES.EYE_HYGIENE_FORMS.GET_VARIANTS(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return (response.data as any).variants || [];
    }

    // Handle 500 errors and other server issues gracefully
    if (response.error && (response.error.includes('500') || response.error.includes('Internal Server Error'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Eye hygiene variants endpoint not available for product ${id}. Backend may not have this feature implemented.`)
      }
      // Return empty array instead of null to prevent frontend crashes
      return [];
    }

    // Handle other API errors quietly
    if (response.error) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Eye hygiene variants API error for product ${id}:`, response.error)
      }
      return []
    }

    // Handle case where API returns success but no data
    if (!response.data) {
      if (import.meta.env.DEV) {
        console.log(`ℹ️ No eye hygiene variants data available for product ${id}`)
      }
      return []
    }

    return null;
  } catch (error: any) {
    // Check if it's a network error or 500 error
    if (error.message && (error.message.includes('500') || error.message.includes('Internal Server Error'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Eye hygiene variants endpoint not available for product ${id}. Backend may not have this feature implemented.`)
      }
      // Return empty array instead of null to prevent frontend crashes
      return [];
    }
    
    // Handle network errors quietly
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Network error fetching eye hygiene variants for product ${id}. Using fallback.`)
      }
      return []
    }
    
    // Other errors - only log in development
    if (import.meta.env.DEV) {
      console.error(`Unexpected error fetching eye hygiene variants for product ${id}:`, error)
    }
    
    return null;
  }
};

/**
 * Admin: Get all calibers for a product
 * Matches Postman collection structure: GET /api/admin/products/:id/calibers
 * 
 * @param productId - Product ID
 * @returns Array of MMCaliber objects or null if error
 */
export const adminGetProductCalibers = async (productId: number | string): Promise<MMCaliber[] | null> => {
  try {
    const response = await apiClient.get<{ calibers: MMCaliber[] }>(
      API_ROUTES.ADMIN.MM_CALIBERS.BY_PRODUCT(productId),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return (response.data as any).calibers || [];
    }

    console.error('Failed to fetch product calibers:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching product calibers:', error);
    return null;
  }
};

/**
 * Admin: Create a new caliber for a product
 * Matches Postman collection structure: POST /api/admin/products/:id/calibers/:mm
 * 
 * @param productId - Product ID
 * @param mm - Caliber size (e.g., 58, 62, 64)
 * @param caliberData - Caliber data including image URL
 * @returns Created MMCaliber object or null if error
 */
export const adminCreateProductCaliber = async (
  productId: number | string,
  mm: number,
  caliberData: {
    image: string;
    price?: number;
    stock_quantity?: number;
    is_active?: boolean;
  }
): Promise<MMCaliber | null> => {
  try {
    const response = await apiClient.post<MMCaliber>(
      API_ROUTES.ADMIN.MM_CALIBERS.CREATE(productId, mm),
      caliberData,
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as MMCaliber;
    }

    console.error('Failed to create product caliber:', response.message);
    return null;
  } catch (error) {
    console.error('Error creating product caliber:', error);
    return null;
  }
};

/**
 * Admin: Update a caliber for a product
 * Matches Postman collection structure: PUT /api/admin/products/:id/calibers/:mm
 * 
 * @param productId - Product ID
 * @param mm - Caliber size (e.g., 58, 62, 64)
 * @param caliberData - Updated caliber data
 * @returns Updated MMCaliber object or null if error
 */
export const adminUpdateProductCaliber = async (
  productId: number | string,
  mm: number,
  caliberData: {
    image?: string;
    price?: number;
    stock_quantity?: number;
    is_active?: boolean;
  }
): Promise<MMCaliber | null> => {
  try {
    const response = await apiClient.put<MMCaliber>(
      API_ROUTES.ADMIN.MM_CALIBERS.UPDATE(productId, mm),
      caliberData,
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as MMCaliber;
    }

    console.error('Failed to update product caliber:', response.message);
    return null;
  } catch (error) {
    console.error('Error updating product caliber:', error);
    return null;
  }
};

/**
 * Admin: Delete a caliber for a product
 * Matches Postman collection structure: DELETE /api/admin/products/:id/calibers/:mm
 * 
 * @param productId - Product ID
 * @param mm - Caliber size (e.g., 58, 62, 64)
 * @returns Success boolean or null if error
 */
export const adminDeleteProductCaliber = async (
  productId: number | string,
  mm: number
): Promise<boolean | null> => {
  try {
    const response = await apiClient.delete(
      API_ROUTES.ADMIN.MM_CALIBERS.DELETE(productId, mm),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success) {
      return true;
    }

    console.error('Failed to delete product caliber:', response.message);
    return false;
  } catch (error) {
    console.error('Error deleting product caliber:', error);
    return null;
  }
};

/**
 * Admin: Get all eye hygiene variants (optionally by product)
 * Matches Postman collection structure: GET /api/admin/eye-hygiene-variants
 * 
 * @param productId - Optional product ID to filter variants
 * @returns Array of EyeHygieneVariant objects or null if error
 */
export const adminGetEyeHygieneVariants = async (productId?: number | string): Promise<EyeHygieneVariant[] | null> => {
  try {
    const response = await apiClient.get<{ variants: EyeHygieneVariant[] }>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.LIST(productId),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return (response.data as any).variants || [];
    }

    console.error('Failed to fetch eye hygiene variants:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching eye hygiene variants:', error);
    return null;
  }
};

/**
 * Admin: Get eye hygiene variant by ID
 * Matches Postman collection structure: GET /api/admin/eye-hygiene-variants/:id
 * 
 * @param id - Variant ID
 * @returns EyeHygieneVariant object or null if error
 */
export const adminGetEyeHygieneVariantById = async (id: number | string): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.get<EyeHygieneVariant>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.BY_ID(id),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to fetch eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching eye hygiene variant:', error);
    return null;
  }
};

/**
 * Admin: Create a new eye hygiene variant
 * Matches Postman collection structure: POST /api/admin/eye-hygiene-variants
 * 
 * @param variantData - Variant data
 * @returns Created EyeHygieneVariant object or null if error
 */
export const adminCreateEyeHygieneVariant = async (
  variantData: {
    product_id: number;
    name: string;
    size_volume: string;
    pack_type?: string | null;
    price: number;
    compare_at_price?: number | null;
    cost_price?: number | null;
    stock_quantity: number;
    sku?: string | null;
    expiry_date?: string | null;
    image?: string;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.post<EyeHygieneVariant>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.CREATE,
      variantData,
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to create eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error creating eye hygiene variant:', error);
    return null;
  }
};

/**
 * Admin: Update an eye hygiene variant
 * Matches Postman collection structure: PUT /api/admin/eye-hygiene-variants/:id
 * 
 * @param id - Variant ID
 * @param variantData - Updated variant data
 * @returns Updated EyeHygieneVariant object or null if error
 */
export const adminUpdateEyeHygieneVariant = async (
  id: number | string,
  variantData: {
    name?: string;
    size_volume?: string;
    pack_type?: string | null;
    price?: number;
    compare_at_price?: number | null;
    cost_price?: number | null;
    stock_quantity?: number;
    sku?: string | null;
    expiry_date?: string | null;
    image?: string;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<EyeHygieneVariant | null> => {
  try {
    const response = await apiClient.put<EyeHygieneVariant>(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.UPDATE(id),
      variantData,
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success && response.data) {
      return response.data as EyeHygieneVariant;
    }

    console.error('Failed to update eye hygiene variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error updating eye hygiene variant:', error);
    return null;
  }
};

/**
 * Admin: Delete an eye hygiene variant
 * Matches Postman collection structure: DELETE /api/admin/eye-hygiene-variants/:id
 * 
 * @param id - Variant ID
 * @returns Success boolean or null if error
 */
export const adminDeleteEyeHygieneVariant = async (id: number | string): Promise<boolean | null> => {
  try {
    const response = await apiClient.delete(
      API_ROUTES.ADMIN.EYE_HYGIENE_VARIANTS.DELETE(id),
      true // ADMIN endpoint - requires admin authentication
    );

    if (response.success) {
      return true;
    }

    console.error('Failed to delete eye hygiene variant:', response.message);
    return false;
  } catch (error) {
    console.error('Error deleting eye hygiene variant:', error);
    return null;
  }
};


