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
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
  products?: CategoryProduct[];
  subcategories?: Category[]; // Subcategories (children)
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryResponse {
  category: Category;
}

export interface SubcategoriesResponse {
  success: boolean;
  message: string;
  data: {
    subcategories: Category[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    category?: Category;
  };
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
      const activeCategories = categories
        .filter((category) => category.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);

      // Organize categories with subcategories
      return organizeCategoriesWithSubcategories(activeCategories);
    }

    console.error('Failed to fetch categories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Organize categories into parent categories with their subcategories
 */
const organizeCategoriesWithSubcategories = (categories: Category[]): Category[] => {
  // Separate parent categories (no parent_id or parent_id is null) and subcategories
  const parentCategories: Category[] = [];
  const subcategoriesMap: Map<number, Category[]> = new Map();

  categories.forEach((category) => {
    if (!category.parent_id || category.parent_id === null) {
      // This is a parent category
      parentCategories.push({ ...category, subcategories: [] });
    } else {
      // This is a subcategory
      const parentId = category.parent_id;
      if (!subcategoriesMap.has(parentId)) {
        subcategoriesMap.set(parentId, []);
      }
      subcategoriesMap.get(parentId)!.push(category);
    }
  });

  // Attach subcategories to their parent categories
  parentCategories.forEach((parent) => {
    const subcategories = subcategoriesMap.get(parent.id) || [];
    parent.subcategories = subcategories.sort((a, b) => a.sort_order - b.sort_order);
  });

  return parentCategories;
};

/**
 * Get categories organized with subcategories
 * Returns only parent categories with their subcategories nested
 */
export const getCategoriesWithSubcategories = async (): Promise<Category[]> => {
  return getCategories(false);
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

/**
 * Get subcategories by category ID
 * @param categoryId - The ID of the parent category
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 50)
 */
export const getSubcategoriesByCategoryId = async (
  categoryId: number | string,
  page: number = 1,
  limit: number = 50
): Promise<Category[]> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.LIST(categoryId, page, limit);
    const response = await apiClient.get<SubcategoriesResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let subcategories: Category[] = [];
      
      if ('subcategories' in response.data && Array.isArray(response.data.subcategories)) {
        subcategories = response.data.subcategories;
      } else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (innerData && 'subcategories' in innerData && Array.isArray(innerData.subcategories)) {
          subcategories = innerData.subcategories;
        } else if (Array.isArray(innerData)) {
          subcategories = innerData;
        }
      }

      // Filter active subcategories and sort by sort_order
      return subcategories
        .filter((subcategory) => subcategory.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    console.error('Failed to fetch subcategories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
};

