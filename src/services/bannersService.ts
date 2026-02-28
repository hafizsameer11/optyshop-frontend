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
export const getBanners = async (options?: GetBannersOptions | string | null, _isFallback: boolean = false): Promise<Banner[]> => {
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

    // Add retry logic for network errors
    let response;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        response = await apiClient.get<BannersResponse | Banner[]>(
          endpoint,
          false // PUBLIC endpoint
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;
        if (retryCount > maxRetries) {
          console.error(`Failed to fetch banners after ${maxRetries} retries:`, error);
          return []; // Return empty array on final failure
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 3000);
        console.log(`Retrying banner request in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Ensure response is defined
    if (!response) {
      console.error('No response received from banner API');
      return [];
    }

    if (response.success) {
      // Handle case where response is successful but data is null/undefined
      if (!response.data) {
        if (import.meta.env.DEV) {
          console.log('📋 Response successful but no data available');
        }
        return [];
      }

      // Debug: Log the raw response structure
      if (import.meta.env.DEV) {
        console.log('🔍 Raw API Response:', {
          success: response.success,
          dataKeys: Object.keys(response.data || {}),
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          data: response.data
        });
      }

      // Handle different response structures
      let banners: Banner[] = [];
      
      // Check if response.data is an array directly
      if (Array.isArray(response.data)) {
        banners = response.data;
        if (import.meta.env.DEV) {
          console.log('📋 Response data is direct array:', banners.length, 'banners');
        }
      } 
      // Check if response.data has a banners property
      else if ('banners' in response.data && Array.isArray((response.data as BannersResponse).banners)) {
        banners = (response.data as BannersResponse).banners as Banner[];
        if (import.meta.env.DEV) {
          console.log('📋 Response data has banners property:', banners.length, 'banners');
        }
      }
      // Check if response.data is a single banner object
      else if ('id' in response.data && 'image_url' in response.data) {
        banners = [response.data as Banner];
        if (import.meta.env.DEV) {
          console.log('📋 Response data is single banner object');
        }
      }
      // Handle case where response.data exists but doesn't match expected structure
      else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Unexpected response data structure:', response.data);
        }
        return [];
      }

      // Check if banners array is empty after parsing
      if (banners.length === 0) {
        if (import.meta.env.DEV) {
          console.log('📋 No banners found in response');
        }
        
        // Return empty array - no fallback to all banners
        // This ensures only category-specific banners are shown
        return [];
      }

      // Filter active banners
      let filteredBanners = banners.filter((banner) => banner.is_active);

      // Filter by page_type if specified
      if (filters.page_type) {
        const beforePageTypeFilter = filteredBanners.length;
        filteredBanners = filteredBanners.filter(
          (banner) => banner.page_type === filters.page_type
        );
        if (import.meta.env.DEV) {
          console.log(`🎯 Page type filter (${filters.page_type}): ${beforePageTypeFilter} -> ${filteredBanners.length}`);
        }
      }

      // Filter by category_id if specified
      if (filters.category_id !== undefined && filters.category_id !== null) {
        const beforeCategoryFilter = filteredBanners.length;
        filteredBanners = filteredBanners.filter(
          (banner) => banner.category_id === filters.category_id || banner.category_id === null || banner.category_id === undefined
        );
        if (import.meta.env.DEV) {
          console.log(`🎯 Category ID filter (${filters.category_id}): ${beforeCategoryFilter} -> ${filteredBanners.length}`);
          console.log('🎯 Banner category_ids in filtered list:', filteredBanners.map(b => ({ id: b.id, title: b.title, category_id: b.category_id })));
        }
      }

      // Filter by sub_category_id if specified
      if (filters.sub_category_id !== undefined && filters.sub_category_id !== null) {
        filteredBanners = filteredBanners.filter(
          (banner) => banner.sub_category_id === filters.sub_category_id || banner.sub_category_id === null
        );
      }

      // Filter by position if specified (legacy support)
      if (filters.position) {
        filteredBanners = filteredBanners.filter(
          (banner) => banner.position === filters.position || banner.position === null
        );
      }

      // Sort by sort_order
      const sortedBanners = filteredBanners.sort((a, b) => a.sort_order - b.sort_order);
      
      // Debug logging in development
      if (import.meta.env.DEV) {
        console.log('🎯 Banner Filtering Results:', {
          totalBanners: banners.length,
          activeBanners: banners.filter(b => b.is_active).length,
          filteredBanners: filteredBanners.length,
          finalBanners: sortedBanners.length,
          filters: filters,
          finalBannerIds: sortedBanners.map(b => ({ id: b.id, title: b.title, sort_order: b.sort_order, page_type: b.page_type, category_id: b.category_id }))
        });
      }

      return sortedBanners;
    }

    console.error('Failed to fetch banners:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

