/**
 * Banners Service
 * Handles all banner API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Raw meta coming from API can be:
// - JSON string
// - plain text string
// - already-parsed object
// - null
export type BannerMetaRaw = string | Record<string, any> | null;

// Type definitions for banner data
export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  image_url: string | null;
  link_url: string | null;
  position: string | null;
  page_type?: 'home' | 'category' | 'subcategory' | 'sub_subcategory' | null;
  category_id?: number | null;
  sub_category_id?: number | null;
  category?: Category | null;
  subCategory?: Category | null;
  sort_order: number;
  is_active: boolean;
  meta: BannerMetaRaw;
  created_at: string;
  updated_at: string;
}

export interface BannersResponse {
  // Backend may return either `banners` array or a plain array
  banners?: Banner[];
}

export interface GetBannersOptions {
  position?: string | null;
  page_type?: 'home' | 'category' | 'subcategory' | 'sub_subcategory' | null;
  category_id?: number | null;
  sub_category_id?: number | null;
}

/**
 * Get all active banners
 * @param options - Optional filters for banners
 * @param options.position - Optional position filter (e.g., 'home', 'hero', etc.) - DEPRECATED, use page_type instead
 * @param options.page_type - Filter by page type: 'home', 'category', 'subcategory', or 'sub_subcategory'
 * @param options.category_id - Filter by category ID (required for category/subcategory/sub_subcategory page types)
 * @param options.sub_category_id - Filter by subcategory ID (required for subcategory/sub_subcategory page types)
 * @returns Array of active banners, sorted by sort_order
 */
export const getBanners = async (options?: GetBannersOptions | string | null): Promise<Banner[]> => {
  try {
    // Handle legacy position parameter for backwards compatibility
    let filters: GetBannersOptions = {};
    if (typeof options === 'string' || options === null) {
      filters = { position: options || undefined };
    } else if (options) {
      filters = options;
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (filters.page_type) {
      params.append('page_type', filters.page_type);
    }
    if (filters.category_id !== undefined && filters.category_id !== null) {
      params.append('category_id', String(filters.category_id));
    }
    if (filters.sub_category_id !== undefined && filters.sub_category_id !== null) {
      params.append('sub_category_id', String(filters.sub_category_id));
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${API_ROUTES.BANNERS.LIST}?${queryString}` : API_ROUTES.BANNERS.LIST;

    const response = await apiClient.get<BannersResponse | Banner[]>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let banners: Banner[] = [];
      
      // Check if response.data is an array directly
      if (Array.isArray(response.data)) {
        banners = response.data;
      } 
      // Check if response.data has a banners property
      else if ('banners' in response.data && Array.isArray((response.data as BannersResponse).banners)) {
        banners = (response.data as BannersResponse).banners as Banner[];
      }
      // Check if response.data is a single banner object
      else if ('id' in response.data && 'image_url' in response.data) {
        banners = [response.data as Banner];
      }

      // Filter active banners
      let filteredBanners = banners.filter((banner) => banner.is_active);

      // Filter by position if specified (legacy support)
      if (filters.position) {
        filteredBanners = filteredBanners.filter(
          (banner) => banner.position === filters.position || banner.position === null
        );
      }

      // Sort by sort_order
      return filteredBanners.sort((a, b) => a.sort_order - b.sort_order);
    }

    console.error('Failed to fetch banners:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

