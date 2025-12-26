/**
 * Products Service
 * Handles all product API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

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
  
  // Eye Hygiene specific fields (only present for Eye Hygiene category/subcategory)
  size_volume?: string | null; // e.g., "5ml", "10ml", "30ml"
  pack_type?: string | null; // e.g., "Single", "Pack of 2", "Pack of 3"
  expiry_date?: string | null; // ISO 8601 format date string
  
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
  gender?: string;
  lensType?: string; // Filter by lens type
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean; // Filter featured products (true/false)
  [key: string]: any; // Allow for additional filter properties
}

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
    const apiFilters: Record<string, any> = { ...filters };
    if (apiFilters.subcategory !== undefined) {
      apiFilters.subCategory = apiFilters.subcategory;
      delete apiFilters.subcategory;
    }
    
    // Ensure boolean filters are properly formatted
    if (apiFilters.isFeatured !== undefined) {
      apiFilters.isFeatured = apiFilters.isFeatured === true || apiFilters.isFeatured === 'true';
    }
    
    const endpoint = buildQueryString(API_ROUTES.PRODUCTS.LIST, apiFilters);
    
    if (import.meta.env.DEV && filters.subcategory) {
      console.log('🔍 API Request - Filtering by subcategory:', {
        subcategory: filters.subcategory,
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

    console.error('Failed to fetch products:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};

/**
 * Get product by slug
 * Matches Postman collection structure: GET /api/products/slug/:slug
 * @param slug - Product slug
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
 * @param id - Product ID
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

