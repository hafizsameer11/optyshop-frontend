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
  category?: Category;
  frame_shape?: string;
  frame_material?: string;
  gender?: string;
  brand?: string;
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
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
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
 * @param filters - Filter parameters (page, limit, frameShape, frameMaterial, minPrice, maxPrice, etc.)
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
    const endpoint = buildQueryString(API_ROUTES.PRODUCTS.LIST, filters);
    
    const response = await apiClient.get<ProductsListResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle both possible response structures
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
 * @param slug - Product slug
 */
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.PRODUCTS.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle nested structure: data.product or just data
      const product = (response.data as any).product || response.data;
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
 * @param id - Product ID
 */
export const getProductById = async (id: number | string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<Product>(
      API_ROUTES.PRODUCTS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
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

