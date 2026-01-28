/**
 * Brands Service
 * Handles all brand API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';
import { buildQueryString } from '../config/apiRoutes';

// Type definitions for brand data
export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  logo_image?: string | null;
  website_url?: string | null;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandsResponse {
  // Backend may return either `brands` array or a plain array
  brands?: Brand[];
  data?: {
    brands?: Brand[];
  };
}

/**
 * Get all brands
 * @param activeOnly - If true, only return active brands
 */
export const getBrands = async (activeOnly: boolean = true): Promise<Brand[]> => {
  try {
    const endpoint = activeOnly 
      ? buildQueryString(API_ROUTES.BRANDS.LIST, { activeOnly: 'true' })
      : API_ROUTES.BRANDS.LIST;

    const response = await apiClient.get<BrandsResponse | Brand[]>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let brands: Brand[] = [];
      
      // Check if response.data is an array directly
      if (Array.isArray(response.data)) {
        brands = response.data;
      } 
      // Check if response.data has a brands property
      else if ('brands' in response.data && Array.isArray((response.data as BrandsResponse).brands)) {
        brands = (response.data as BrandsResponse).brands as Brand[];
      }
      // Check if response.data has a data property with brands
      else if ('brands' in response.data && Array.isArray((response.data as any).brands)) {
        brands = (response.data as any).brands;
      }
      // Check if response.data is a single brand object
      else if ('id' in response.data && 'name' in response.data) {
        brands = [response.data as Brand];
      }

      // Filter active brands if needed
      let filteredBrands = brands;
      if (activeOnly) {
        filteredBrands = brands.filter((brand) => brand.is_active);
      }
      
      // Sort by sort_order (ascending), then by created_at (descending)
      return filteredBrands.sort((a, b) => {
        const sortOrderA = a.sort_order || 0;
        const sortOrderB = b.sort_order || 0;
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }
        // If sort_order is the same, sort by created_at descending
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
    }

    console.error('Failed to fetch brands:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
};

