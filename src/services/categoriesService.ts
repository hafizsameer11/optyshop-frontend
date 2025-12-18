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
  subcategories?: Category[]; // Subcategories (children) - for top-level categories
  children?: Category[]; // Nested subcategories (children of a subcategory)
  parent?: Category | null; // Parent subcategory (if nested)
  category?: Category; // Main category this subcategory belongs to
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

export interface SubcategoryResponse {
  success: boolean;
  message: string;
  data: {
    subcategory: Category & {
      category?: Category;
    };
  };
}

/**
 * Get all categories
 * @param options - Options for fetching categories
 * @param options.includeProducts - If true, include products in each category
 * @param options.includeSubcategories - If true, include top-level subcategories with nested children
 */
export const getCategories = async (options?: {
  includeProducts?: boolean;
  includeSubcategories?: boolean;
}): Promise<Category[]> => {
  try {
    const includeProducts = options?.includeProducts || false;
    const includeSubcategories = options?.includeSubcategories || false;
    
    const endpoint = API_ROUTES.CATEGORIES.LIST(includeProducts, includeSubcategories);

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
 * @param includeProducts - If true, include products in each category
 */
export const getCategoriesWithSubcategories = async (includeProducts: boolean = false): Promise<Category[]> => {
  return getCategories({ includeProducts, includeSubcategories: true });
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
 * Uses the new /api/subcategories/by-category/{categoryId} endpoint
 * @param categoryId - The ID of the parent category
 */
export const getSubcategoriesByCategoryId = async (
  categoryId: number | string
): Promise<Category[]> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.BY_CATEGORY(categoryId);
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

      console.log('Fetched subcategories:', subcategories);

      // Filter active subcategories (default to true if is_active is not present) and sort by sort_order
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active !== false) // Include if is_active is true, undefined, or null
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      console.log('Filtered subcategories:', filteredSubcategories);
      
      return filteredSubcategories;
    }

    console.error('Failed to fetch subcategories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
};

/**
 * Get subcategory by ID
 * @param id - The ID of the subcategory
 * @param includeProducts - If true, include products associated with this subcategory
 */
export const getSubcategoryById = async (
  id: number | string,
  includeProducts: boolean = false
): Promise<Category | null> => {
  try {
    let endpoint = API_ROUTES.SUBCATEGORIES.BY_ID(id);
    if (includeProducts) {
      endpoint = `${endpoint}?includeProducts=true`;
    }
    
    const response = await apiClient.get<SubcategoryResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      if ('subcategory' in response.data) {
        return response.data.subcategory;
      } else if ('data' in response.data && 'subcategory' in (response.data as any).data) {
        return (response.data as any).data.subcategory;
      } else if ('id' in response.data) {
        return response.data as Category;
      }
    }

    console.error('Failed to fetch subcategory:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return null;
  }
};

/**
 * Get nested subcategories by parent ID
 * Uses the /api/subcategories/by-parent/{parentId} endpoint
 * Perfect for cascading dropdowns when a parent subcategory is selected
 * @param parentId - The ID of the parent subcategory
 */
export const getNestedSubcategoriesByParentId = async (
  parentId: number | string
): Promise<Category[]> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.BY_PARENT(parentId);
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
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      return filteredSubcategories;
    }

    console.error('Failed to fetch nested subcategories by parent ID:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching nested subcategories by parent ID:', error);
    return [];
  }
};

/**
 * Get nested subcategories (subcategories of a subcategory)
 * Uses the /api/subcategories/{subcategoryId}/subcategories endpoint
 * Alternative endpoint to getNestedSubcategoriesByParentId
 * @param subcategoryId - The ID of the parent subcategory
 */
export const getNestedSubcategories = async (
  subcategoryId: number | string
): Promise<Category[]> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.NESTED(subcategoryId);
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
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      return filteredSubcategories;
    }

    console.error('Failed to fetch nested subcategories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching nested subcategories:', error);
    return [];
  }
};

/**
 * Get subcategory by slug
 * Uses the API endpoint directly for better performance
 * @param slug - The slug of the subcategory
 */
export const getSubcategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.BY_SLUG(slug);
    const response = await apiClient.get<SubcategoryResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      if ('subcategory' in response.data) {
        return response.data.subcategory;
      } else if ('data' in response.data && 'subcategory' in (response.data as any).data) {
        return (response.data as any).data.subcategory;
      } else if ('id' in response.data) {
        return response.data as Category;
      }
    }

    console.error('Failed to fetch subcategory by slug:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching subcategory by slug:', error);
    return null;
  }
};

/**
 * Get all subcategories with pagination and filtering
 * @param options - Options for fetching subcategories
 * @param options.categoryId - Filter by category ID (optional)
 * @param options.page - Page number (default: 1)
 * @param options.limit - Items per page (default: 50)
 * @param options.search - Search subcategories by name (optional)
 */
export const getAllSubcategories = async (options?: {
  categoryId?: number | string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  subcategories: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> => {
  try {
    const categoryId = options?.categoryId;
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const search = options?.search;
    
    const endpoint = API_ROUTES.SUBCATEGORIES.LIST(categoryId, page, limit, search);
    const response = await apiClient.get<SubcategoriesResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      let subcategories: Category[] = [];
      let pagination: SubcategoriesResponse['data']['pagination'] | undefined;
      
      if ('subcategories' in response.data && Array.isArray(response.data.subcategories)) {
        subcategories = response.data.subcategories;
        pagination = response.data.pagination;
      } else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (innerData && 'subcategories' in innerData && Array.isArray(innerData.subcategories)) {
          subcategories = innerData.subcategories;
          pagination = innerData.pagination;
        } else if (Array.isArray(innerData)) {
          subcategories = innerData;
        }
      }

      // Filter active subcategories and sort by sort_order
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      return {
        subcategories: filteredSubcategories,
        pagination,
      };
    }

    console.error('Failed to fetch subcategories:', response.message);
    return { subcategories: [] };
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return { subcategories: [] };
  }
};

/**
 * Get related categories for a subcategory
 * Finds categories that have subcategories with the same or similar name
 * @param subcategoryId - The ID of the subcategory
 * @param includeNested - If true, includes child subcategories and sibling subcategories in the search
 */
export const getRelatedCategoriesForSubcategory = async (
  subcategoryId: number | string,
  includeNested: boolean = false
): Promise<{
  subcategory: Category;
  relatedCategories: Array<{
    id: number;
    name: string;
    slug: string;
    matchingSubcategories: Category[];
  }>;
} | null> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.RELATED_CATEGORIES(subcategoryId, includeNested);
    const response = await apiClient.get<{
      subcategory: Category;
      relatedCategories: Array<{
        id: number;
        name: string;
        slug: string;
        matchingSubcategories: Category[];
      }>;
    }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch related categories:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching related categories:', error);
    return null;
  }
};

/**
 * Get related categories for a category
 * Finds categories that have similar subcategories (including nested subcategories)
 * @param categoryId - The ID of the category
 * @param limit - Maximum number of related categories to return (optional)
 * @param includeNested - If true, includes nested subcategories in the similarity search
 */
export const getRelatedCategories = async (
  categoryId: number | string,
  limit?: number,
  includeNested: boolean = false
): Promise<Category[]> => {
  try {
    const endpoint = API_ROUTES.CATEGORIES.RELATED(categoryId, limit, includeNested);
    const response = await apiClient.get<Category[] | { categories: Category[] }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      let categories: Category[] = [];
      
      if (Array.isArray(response.data)) {
        categories = response.data;
      } else if ('categories' in response.data && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      } else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (Array.isArray(innerData)) {
          categories = innerData;
        } else if (innerData && Array.isArray(innerData.categories)) {
          categories = innerData.categories;
        }
      }

      return categories.filter((cat) => cat.is_active).sort((a, b) => a.sort_order - b.sort_order);
    }

    console.error('Failed to fetch related categories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching related categories:', error);
    return [];
  }
};

