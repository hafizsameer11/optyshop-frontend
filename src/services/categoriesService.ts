/**
 * Categories Service
 * Handles all category API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// Type definitions for category data
export interface CategoryProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  images: string; // JSON string array
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  products?: CategoryProduct[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryResponse {
  category: Category;
}

/**
 * Get all categories
 * @param includeProducts - If true, include products in each category
 */
export const getCategories = async (includeProducts: boolean = false): Promise<Category[]> => {
  try {
    const endpoint = includeProducts
      ? buildQueryString(API_ROUTES.CATEGORIES.LIST, { includeProducts: 'true' })
      : API_ROUTES.CATEGORIES.LIST;

    const response = await apiClient.get<CategoriesResponse | Category[]>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let categories: Category[] = [];
      
      // Check if response.data is an array directly
      if (Array.isArray(response.data)) {
        categories = response.data;
      } 
      // Check if response.data has a categories property
      else if ('categories' in response.data && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      }
      // Check if response.data has a data.categories structure (nested)
      else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (Array.isArray(innerData)) {
          categories = innerData;
        } else if (innerData && Array.isArray(innerData.categories)) {
          categories = innerData.categories;
        }
      }

      // Filter active categories and sort by sort_order
      return categories
        .filter((category) => category.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    console.error('Failed to fetch categories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: number | string): Promise<Category | null> => {
  try {
    const response = await apiClient.get<CategoryResponse>(
      API_ROUTES.CATEGORIES.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      if ('category' in response.data) {
        return response.data.category;
      } else if ('data' in response.data && 'category' in (response.data as any).data) {
        return (response.data as any).data.category;
      } else if ('id' in response.data) {
        return response.data as Category;
      }
    }

    console.error('Failed to fetch category:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const response = await apiClient.get<CategoryResponse>(
      API_ROUTES.CATEGORIES.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      if ('category' in response.data) {
        return response.data.category;
      } else if ('data' in response.data && 'category' in (response.data as any).data) {
        return (response.data as any).data.category;
      } else if ('id' in response.data) {
        return response.data as Category;
      }
    }

    console.error('Failed to fetch category:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

