/**
 * Banners Service
 * Handles all banner API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Type definitions for banner data
export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string | null;
  sort_order: number;
  is_active: boolean;
  meta: string;
  created_at: string;
  updated_at: string;
}

export interface BannersResponse {
  banners: Banner[];
}

/**
 * Get all active banners
 * @param position - Optional position filter (e.g., 'home', 'hero', etc.)
 * @returns Array of active banners, sorted by sort_order
 */
export const getBanners = async (position?: string | null): Promise<Banner[]> => {
  try {
    const response = await apiClient.get<BannersResponse | Banner[]>(
      API_ROUTES.BANNERS.LIST,
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
      else if ('banners' in response.data && Array.isArray(response.data.banners)) {
        banners = response.data.banners;
      }
      // Check if response.data is a single banner object
      else if ('id' in response.data && 'image_url' in response.data) {
        banners = [response.data as Banner];
      }

      // Filter active banners
      let filteredBanners = banners.filter((banner) => banner.is_active);

      // Filter by position if specified
      if (position) {
        filteredBanners = filteredBanners.filter(
          (banner) => banner.position === position || banner.position === null
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

