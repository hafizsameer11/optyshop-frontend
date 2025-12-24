/**
 * Contact Lens Configuration Service
 * Handles fetching contact lens configurations from the API
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface ContactLensConfiguration {
  id: number;
  name: string;
  display_name: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  price: number | string;
  compare_at_price?: number | string;
  cost_price?: number | string;
  stock_quantity?: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'backorder' | 'preorder';
  images?: string[];
  color_images?: Array<{
    color: string;
    images: string[];
  }>;
  configuration_type: 'spherical' | 'astigmatism';
  category_id?: number;
  sub_category_id?: number;
  product_id?: number;
  is_active: boolean;
  sort_order?: number;
  
  // Parameter fields (returned as arrays from API)
  right_qty?: number | number[];
  right_base_curve?: number | string | (number | string)[];
  right_diameter?: number | string | (number | string)[];
  right_power?: number | string | (number | string)[];
  right_cylinder?: number | string | (number | string)[]; // Only for astigmatism
  right_axis?: number | string | (number | string)[]; // Only for astigmatism
  
  left_qty?: number | number[];
  left_base_curve?: number | string | (number | string)[];
  left_diameter?: number | string | (number | string)[];
  left_power?: number | string | (number | string)[];
  left_cylinder?: number | string | (number | string)[]; // Only for astigmatism
  left_axis?: number | string | (number | string)[]; // Only for astigmatism
  
  // Category relationships
  category?: {
    id: number;
    name: string;
    slug?: string;
  };
  subCategory?: {
    id: number;
    name: string;
    slug?: string;
    parent?: {
      id: number;
      name: string;
    };
  };
}

export interface ContactLensConfigsResponse {
  success: boolean;
  message: string;
  data: {
    configurations: ContactLensConfiguration[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface ContactLensConfigsFilters {
  product_id?: number;
  category_id?: number;
  sub_category_id?: number;
  configuration_type?: 'spherical' | 'astigmatism';
}

// ============================================
// API Functions
// ============================================

/**
 * Get contact lens configurations for frontend
 * Returns only active configurations
 * 
 * @param filters - Filter parameters (product_id, category_id, sub_category_id, configuration_type)
 */
export const getContactLensConfigs = async (
  filters?: ContactLensConfigsFilters
): Promise<ContactLensConfiguration[] | null> => {
  try {
    const endpoint = API_ROUTES.PRODUCTS.CONTACT_LENS_CONFIGS(filters);
    
    const response = await apiClient.get<ContactLensConfigsResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle different response structures
      const configurations = data.configurations || 
                           (data.data && data.data.configurations) || 
                           (Array.isArray(data) ? data : []);
      
      if (import.meta.env.DEV) {
        console.log('✅ Contact Lens Configurations fetched:', {
          count: configurations.length,
          filters,
          configurations: configurations.map((c: ContactLensConfiguration) => ({
            id: c.id,
            display_name: c.display_name,
            type: c.configuration_type,
            is_active: c.is_active
          }))
        });
      }
      
      return configurations;
    }

    console.error('Failed to fetch contact lens configurations:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching contact lens configurations:', error);
    return null;
  }
};

/**
 * Get contact lens configurations for a specific product
 * 
 * @param productId - Product ID
 */
export const getContactLensConfigsByProduct = async (
  productId: number
): Promise<ContactLensConfiguration[] | null> => {
  return getContactLensConfigs({ product_id: productId });
};

/**
 * Get contact lens configurations by category
 * 
 * @param categoryId - Category ID
 * @param configurationType - Optional filter by type
 */
export const getContactLensConfigsByCategory = async (
  categoryId: number,
  configurationType?: 'spherical' | 'astigmatism'
): Promise<ContactLensConfiguration[] | null> => {
  return getContactLensConfigs({ 
    category_id: categoryId,
    ...(configurationType && { configuration_type: configurationType })
  });
};

/**
 * Get contact lens configurations by sub-subcategory
 * 
 * @param subCategoryId - Sub-subcategory ID (must have parent_id)
 * @param configurationType - Optional filter by type
 */
export const getContactLensConfigsBySubCategory = async (
  subCategoryId: number,
  configurationType?: 'spherical' | 'astigmatism'
): Promise<ContactLensConfiguration[] | null> => {
  return getContactLensConfigs({ 
    sub_category_id: subCategoryId,
    ...(configurationType && { configuration_type: configurationType })
  });
};


