/**
 * Blog Service
 * Handles all blog-related API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Types
// ============================================

export interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  author?: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  category?: string;
  tags?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
  views?: number;
}

export interface BlogListResponse {
  articles: BlogArticle[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all blog articles
 * @param params - Optional query parameters (page, limit, category, etc.)
 */
export const getBlogArticles = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<BlogArticle[]> => {
  try {
    let endpoint = API_ROUTES.BLOG.LIST;
    
    // Build query string if params provided
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      if (queryString) {
        endpoint = `${endpoint}?${queryString}`;
      }
    }
    
    const response = await apiClient.get<BlogArticle[] | BlogListResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data.articles && Array.isArray(data.articles)) {
        return data.articles;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
    }

    console.error('Failed to fetch blog articles:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return [];
  }
};

/**
 * Get blog article by slug
 * @param slug - Article slug
 */
export const getBlogArticleBySlug = async (slug: string): Promise<BlogArticle | null> => {
  try {
    const response = await apiClient.get<BlogArticle>(
      API_ROUTES.BLOG.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle nested data structure
      return data.article || data.data || data;
    }

    console.error('Failed to fetch blog article:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching blog article:', error);
    return null;
  }
};

