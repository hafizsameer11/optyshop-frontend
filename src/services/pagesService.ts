/**
 * Pages Service
 * Handles all CMS page API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export interface PageResponse {
  success: boolean;
  message?: string;
  data: Page;
}

// ============================================
// API Functions
// ============================================

/**
 * Get page by slug
 * @param slug - Page slug (e.g., 'about-us', 'privacy-policy')
 * @returns Page data or null if not found
 */
export const getPageBySlug = async (slug: string): Promise<Page | null> => {
  try {
    const response = await apiClient.get<PageResponse | Page>(
      API_ROUTES.PAGES.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      if ('id' in response.data && 'title' in response.data) {
        // Direct page object
        return response.data as Page;
      } else if ('data' in response.data && typeof response.data === 'object') {
        // Nested data structure
        return (response.data as any).data as Page;
      }
    }

    console.error('Failed to fetch page:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
};

