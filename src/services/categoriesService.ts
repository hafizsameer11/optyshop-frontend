/**
 * Categories Service
 * Handles all category API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';
import type { Product } from './productsService';

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
  parent_id?: number | null; // For sub-subcategories: parent subcategory ID
  category_id?: number; // For subcategories: parent category ID
  created_at: string;
  updated_at: string;
  products?: CategoryProduct[];
  subcategories?: Category[]; // Subcategories (children) - for top-level categories
  children?: Category[]; // Nested subcategories (children of a subcategory)
  parent?: Category | null; // Parent subcategory (if nested) - from API response
  category?: Category; // Main category this subcategory belongs to - from API response
}

export interface CategoriesResponse {
  success?: boolean;
  message?: string;
  data?: {
    categories?: Category[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  categories?: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CategoryResponse {
  category: Category;
}

export interface SubcategoriesResponse {
  success?: boolean;
  message?: string;
  data?: {
    subcategories?: Category[];
    topLevelSubcategories?: Category[];
    subSubcategories?: Category[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    category?: Category;
    parentSubcategory?: Category;
  };
  subcategories?: Category[];
  topLevelSubcategories?: Category[];
  subSubcategories?: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SubcategoryResponse {
  success?: boolean;
  message?: string;
  data?: {
    subcategory: Category & {
      category?: Category;
      parent?: Category | null;
      children?: Category[];
    };
  };
  subcategory?: Category & {
    category?: Category;
    parent?: Category | null;
    children?: Category[];
  };
}

/**
 * Get all categories
 * API response structure: { success: true, message: "...", data: { categories: [], pagination: {} } }
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
      // API response: { success: true, message: "...", data: { categories: [], pagination: {} } }
      let categories: Category[] = [];
      
      // Check if response.data has a categories property (most common structure)
      if ('categories' in response.data && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      }
      // Check if response.data is an array directly (fallback)
      else if (Array.isArray(response.data)) {
        categories = response.data;
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
      // Check if response has categories at root level (fallback)
      else if (response.categories && Array.isArray(response.categories)) {
        categories = response.categories;
      }

      // When includeSubcategories=true, API returns categories with subcategories that have children field
      // The structure is already nested, so we just need to ensure it's properly formatted
      // IMPORTANT: Filter out inactive categories, subcategories, and sub-subcategories
      
      // Debug: Log raw categories to see structure
      if (import.meta.env.DEV) {
        console.log('📦 Raw categories from API:', categories)
        console.log('📦 Full response structure:', JSON.stringify(categories, null, 2).substring(0, 2000))
        categories.forEach(cat => {
          if (cat.subcategories && cat.subcategories.length > 0) {
            console.log(`📁 Category "${cat.name}" has ${cat.subcategories.length} subcategories:`)
            cat.subcategories.forEach(sub => {
              console.log(`  └─ Subcategory "${sub.name}" (id: ${sub.id}, parent_id: ${sub.parent_id})`, {
                hasChildren: !!(sub.children && sub.children.length > 0),
                childrenCount: sub.children?.length || 0,
                children: sub.children,
                fullSubcategory: sub
              })
            })
          } else {
            console.log(`📁 Category "${cat.name}" has NO subcategories`)
          }
        })
      }
      
      // Process categories and ALWAYS fetch subcategories with children using by-category endpoint
      // This ensures we get the complete 3-level hierarchy (Category → Subcategory → Sub-subcategory)
      const processedCategories = await Promise.all(
        categories
          .filter((category) => category.is_active === true) // Only active categories
          .map(async (category) => {
            let subcategories: Category[] = []
            
            // ALWAYS fetch subcategories using by-category endpoint which includes children (sub-subcategories)
            // This is more reliable than relying on includeSubcategories parameter
            try {
              if (import.meta.env.DEV) {
                console.log(`🔄 Fetching subcategories with children for category "${category.name}" (id: ${category.id})`)
              }
              const subcategoriesWithChildren = await getSubcategoriesByCategoryId(category.id)
              if (subcategoriesWithChildren && subcategoriesWithChildren.length > 0) {
                subcategories = subcategoriesWithChildren
                if (import.meta.env.DEV) {
                  console.log(`✅ Fetched ${subcategories.length} subcategories for "${category.name}"`)
                  subcategories.forEach(sub => {
                    const childrenCount = sub.children?.length || 0
                    if (childrenCount > 0) {
                      console.log(`  └─ Subcategory "${sub.name}" has ${childrenCount} children:`, sub.children?.map(c => c.name))
                    }
                  })
                }
              } else {
                // Fallback to subcategories from category if by-category endpoint returns nothing
                subcategories = category.subcategories || []
                if (import.meta.env.DEV) {
                  console.log(`⚠️ No subcategories from by-category endpoint, using category.subcategories for "${category.name}"`)
                }
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn(`⚠️ Failed to fetch subcategories for category ${category.id}:`, error)
              }
              // Fallback to subcategories from category if fetch fails
              subcategories = category.subcategories || []
            }
            
            // Process subcategories - filter and ensure children are properly structured
            // If children are missing, fetch them using by-parent endpoint
            const processedSubcategories = await Promise.all(
              subcategories
                .filter(sub => sub.is_active === true) // Only active subcategories
                .map(async (subcategory) => {
                  let children = subcategory.children || []
                  
                  // If children are missing, try fetching them using by-parent endpoint
                  if (children.length === 0) {
                    try {
                      if (import.meta.env.DEV) {
                        console.log(`🔄 No children found for "${subcategory.name}", fetching from /api/subcategories/by-parent/${subcategory.id}`)
                      }
                      const subSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                      if (subSubcategories && subSubcategories.length > 0) {
                        children = subSubcategories
                        if (import.meta.env.DEV) {
                          console.log(`✅ Fetched ${children.length} sub-subcategories for "${subcategory.name}":`, children.map(c => c.name))
                        }
                      } else {
                        if (import.meta.env.DEV) {
                          console.log(`⚠️ No sub-subcategories found for "${subcategory.name}" (id: ${subcategory.id})`)
                        }
                      }
                    } catch (error) {
                      if (import.meta.env.DEV) {
                        console.warn(`⚠️ Failed to fetch sub-subcategories for "${subcategory.name}" (id: ${subcategory.id}):`, error)
                      }
                    }
                  } else {
                    // Check if children exist and log for debugging
                    if (import.meta.env.DEV && children.length > 0) {
                      console.log(`✅ Subcategory "${subcategory.name}" already has ${children.length} children from API:`, children)
                      children.forEach((child, idx) => {
                        console.log(`  Child ${idx + 1}:`, {
                          name: child.name,
                          id: child.id,
                          parent_id: child.parent_id,
                          is_active: child.is_active,
                          hasIsActive: 'is_active' in child
                        })
                      })
                    }
                  }
                  
                  // Process children - ensure all required fields are present
                  const processedChildren = children
                    .map(child => {
                      // Ensure required fields are present with defaults
                      // If is_active is missing, default to true (assume active)
                      const processedChild = {
                        ...child,
                        is_active: child.is_active !== undefined ? child.is_active : true,
                        category_id: child.category_id || subcategory.category_id,
                        description: child.description || null,
                        created_at: child.created_at || new Date().toISOString(),
                        updated_at: child.updated_at || new Date().toISOString(),
                        // Ensure name, slug, and id are present
                        name: child.name || '',
                        slug: child.slug || '',
                        id: child.id || 0,
                        parent_id: child.parent_id || subcategory.id,
                        sort_order: child.sort_order || 0,
                      }
                      
                      if (import.meta.env.DEV) {
                        console.log(`  Processing child "${processedChild.name}":`, {
                          original: child,
                          processed: processedChild
                        })
                      }
                      
                      return processedChild
                    })
                    .filter(child => {
                      // Only filter out if explicitly set to false
                      const isActive = child.is_active !== false
                      if (import.meta.env.DEV && !isActive) {
                        console.log(`⚠️ Filtering out inactive sub-subcategory: "${child.name}"`)
                      }
                      return isActive
                    })
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  
                  if (import.meta.env.DEV && processedChildren.length > 0) {
                    console.log(`✅ Subcategory "${subcategory.name}" will have ${processedChildren.length} processed children:`, processedChildren.map(c => c.name))
                  }
                  
                  return {
                    ...subcategory,
                    // Children field contains sub-subcategories - filter inactive ones
                    children: processedChildren
                  }
                })
            )
            
            const sortedSubcategories = processedSubcategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            
            return {
              ...category,
              subcategories: sortedSubcategories
            }
          })
      )
      
      const sortedCategories = processedCategories.sort((a, b) => a.sort_order - b.sort_order)

      // Debug: Log processed categories
      if (import.meta.env.DEV) {
        console.log('✅ Processed categories:', sortedCategories)
        sortedCategories.forEach(cat => {
          if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => {
              if (sub.children && sub.children.length > 0) {
                console.log(`✅ Final: "${cat.name}" > "${sub.name}" has ${sub.children.length} sub-subcategories:`, sub.children.map(c => c.name))
              } else {
                console.log(`⚠️ Final: "${cat.name}" > "${sub.name}" has NO sub-subcategories`)
              }
            })
          }
        })
      }

      return sortedCategories;
    }

    console.error('Failed to fetch categories:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Organize categories into parent categories with their subcategories (3-level hierarchy)
 * Supports: Category → Subcategory (parent_id: null) → Sub-subcategory (parent_id: subcategory.id)
 * 
 * The API returns categories with nested subcategories when includeSubcategories=true.
 * This function handles both:
 * 1. Nested structure from API (preserves children field)
 * 2. Flat structure (organizes into hierarchy)
 */
const organizeCategoriesWithSubcategories = (categories: Category[]): Category[] => {
  // If categories already have nested subcategories with children, return as-is
  // Otherwise, organize flat list into hierarchy
  
  // Check if data is already nested (has subcategories with children)
  const hasNestedStructure = categories.some(
    cat => cat.subcategories && cat.subcategories.some(sub => sub.children && sub.children.length > 0)
  );
  
  if (hasNestedStructure) {
    // Data is already nested, filter inactive items and ensure children are sorted
    return categories
      .filter(category => category.is_active === true) // Only active categories
      .map(category => ({
        ...category,
        subcategories: (category.subcategories || [])
          .filter(sub => sub.is_active === true) // Only active subcategories
          .map(subcategory => ({
            ...subcategory,
            children: (subcategory.children || [])
              .filter(child => child.is_active === true) // Only active sub-subcategories
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          }))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  // Organize flat list into hierarchy
  const parentCategories: Category[] = [];
  const topLevelSubcategoriesMap: Map<number, Category[]> = new Map(); // category_id → subcategories
  const subSubcategoriesMap: Map<number, Category[]> = new Map(); // parent_subcategory_id → sub-subcategories

  categories.forEach((item) => {
    // Only process active items
    if (item.is_active !== true) {
      return;
    }
    
    // Categories don't have parent_id or category_id
    // Top-level subcategories have parent_id = null and category_id set
    // Sub-subcategories have parent_id = subcategory.id
    
    const hasCategoryId = !!(item as any).category_id || !!(item as any).category;
    
    if (!item.parent_id || item.parent_id === null) {
      if (hasCategoryId) {
        // This is a top-level subcategory (parent_id = null, has category_id)
        const categoryId = (item as any).category_id || ((item as any).category?.id);
        if (categoryId) {
          if (!topLevelSubcategoriesMap.has(categoryId)) {
            topLevelSubcategoriesMap.set(categoryId, []);
          }
          topLevelSubcategoriesMap.get(categoryId)!.push({ ...item, children: item.children || [] });
        }
      } else {
        // This is a parent category
        parentCategories.push({ ...item, subcategories: [], children: [] });
      }
    } else {
      // This has a parent_id - it's a sub-subcategory
      const parentId = item.parent_id;
      if (!subSubcategoriesMap.has(parentId)) {
        subSubcategoriesMap.set(parentId, []);
      }
      subSubcategoriesMap.get(parentId)!.push(item);
    }
  });

  // Attach sub-subcategories to their parent subcategories
  topLevelSubcategoriesMap.forEach((subcategories) => {
    subcategories.forEach((subcategory) => {
      const children = subSubcategoriesMap.get(subcategory.id) || subcategory.children || [];
      // Filter inactive children and sort
      subcategory.children = children
        .filter(child => child.is_active === true) // Only active sub-subcategories
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });
  });

  // Attach top-level subcategories to their parent categories
  parentCategories.forEach((category) => {
    const subcategories = topLevelSubcategoriesMap.get(category.id) || category.subcategories || [];
    // Filter inactive subcategories and sort
    category.subcategories = subcategories
      .filter(sub => sub.is_active === true) // Only active subcategories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

  // Return only active parent categories, sorted
  return parentCategories
    .filter(category => category.is_active === true) // Only active categories
    .sort((a, b) => a.sort_order - b.sort_order);
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
      let category: Category | null = null;
      
      if ('category' in response.data) {
        category = response.data.category;
      } else if ('data' in response.data && 'category' in (response.data as any).data) {
        category = (response.data as any).data.category;
      } else if ('id' in response.data) {
        category = response.data as Category;
      }

      if (category) {
        // Only return if category is active
        if (category.is_active !== true) {
          return null;
        }
        
        // Filter inactive subcategories and sub-subcategories
        if (category.subcategories) {
          category.subcategories = category.subcategories
            .filter(sub => sub.is_active === true)
            .map(subcategory => ({
              ...subcategory,
              children: (subcategory.children || [])
                .filter(child => child.is_active === true)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            }))
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        
        return category;
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
      let category: Category | null = null;
      
      if ('category' in response.data) {
        category = response.data.category;
      } else if ('data' in response.data && 'category' in (response.data as any).data) {
        category = (response.data as any).data.category;
      } else if ('id' in response.data) {
        category = response.data as Category;
      }

      if (category) {
        // Only return if category is active
        if (category.is_active !== true) {
          return null;
        }
        
        // Filter inactive subcategories and sub-subcategories
        if (category.subcategories) {
          category.subcategories = category.subcategories
            .filter(sub => sub.is_active === true)
            .map(subcategory => ({
              ...subcategory,
              children: (subcategory.children || [])
                .filter(child => child.is_active === true)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            }))
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        
        return category;
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
      // API endpoint: GET /api/subcategories/by-category/:categoryId
      // Returns top-level subcategories (parent_id = null) with their children (sub-subcategories)
      let subcategories: Category[] = [];
      
      // Debug: Log raw response
      if (import.meta.env.DEV) {
        console.log(`📦 Raw response from /api/subcategories/by-category/${categoryId}:`, response.data)
      }
      
      // Check response.data structure - try multiple possible structures
      if ('subcategories' in response.data && Array.isArray(response.data.subcategories)) {
        subcategories = response.data.subcategories;
        if (import.meta.env.DEV) {
          console.log(`✅ Found subcategories in response.data.subcategories: ${subcategories.length}`)
        }
      } else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (innerData && 'subcategories' in innerData && Array.isArray(innerData.subcategories)) {
          subcategories = innerData.subcategories;
          if (import.meta.env.DEV) {
            console.log(`✅ Found subcategories in response.data.data.subcategories: ${subcategories.length}`)
          }
        } else if (Array.isArray(innerData)) {
          subcategories = innerData;
          if (import.meta.env.DEV) {
            console.log(`✅ Found subcategories in response.data.data (array): ${subcategories.length}`)
          }
        }
      } else if (Array.isArray(response.data)) {
        subcategories = response.data;
        if (import.meta.env.DEV) {
          console.log(`✅ Found subcategories in response.data (array): ${subcategories.length}`)
        }
      } else if ((response as any).subcategories && Array.isArray((response as any).subcategories)) {
        subcategories = (response as any).subcategories;
        if (import.meta.env.DEV) {
          console.log(`✅ Found subcategories in response.subcategories: ${subcategories.length}`)
        }
      }

      // Debug: Log subcategories structure
      if (import.meta.env.DEV && subcategories.length > 0) {
        console.log(`📋 Processing ${subcategories.length} subcategories:`)
        subcategories.forEach((sub, idx) => {
          const childrenCount = sub.children?.length || 0
          console.log(`  ${idx + 1}. "${sub.name}" (id: ${sub.id}, parent_id: ${sub.parent_id}) - ${childrenCount} children`)
          if (childrenCount > 0) {
            console.log(`     Children:`, sub.children?.map(c => `${c.name} (id: ${c.id}, parent_id: ${c.parent_id})`))
          }
        })
      }

      // Filter active subcategories and ensure children (sub-subcategories) are properly structured
      // IMPORTANT: Only return active subcategories and sub-subcategories
      const filteredSubcategories = subcategories
        .filter((subcategory) => {
          const isActive = subcategory.is_active === true
          if (import.meta.env.DEV && !isActive) {
            console.log(`⚠️ Filtering out inactive subcategory: "${subcategory.name}"`)
          }
          return isActive
        })
        .map((subcategory) => {
          const children = subcategory.children || []
          if (import.meta.env.DEV && children.length > 0) {
            console.log(`✅ Subcategory "${subcategory.name}" has ${children.length} children before filtering`)
          }
          
          const filteredChildren = children
            .map(child => ({
              ...child,
              // Ensure required fields are present with defaults
              // If is_active is missing, default to true (assume active)
              is_active: child.is_active !== undefined ? child.is_active : true,
              category_id: child.category_id || subcategory.category_id,
              description: child.description || null,
              created_at: child.created_at || new Date().toISOString(),
              updated_at: child.updated_at || new Date().toISOString(),
            }))
            .filter((child) => {
              // Only filter out if explicitly set to false
              const isActive = child.is_active !== false
              if (import.meta.env.DEV && !isActive) {
                console.log(`⚠️ Filtering out inactive sub-subcategory: "${child.name}"`)
              }
              return isActive
            })
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          
          if (import.meta.env.DEV && filteredChildren.length > 0) {
            console.log(`✅ Subcategory "${subcategory.name}" has ${filteredChildren.length} active children:`, filteredChildren.map(c => c.name))
          }
          
          return {
            ...subcategory,
            // Preserve and sort children (sub-subcategories) - filter inactive ones
            children: filteredChildren
          }
        })
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      
      if (import.meta.env.DEV) {
        console.log(`✅ Returning ${filteredSubcategories.length} filtered subcategories with children`)
      }
      
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
      // API endpoint: GET /api/subcategories/:id
      // Returns subcategory with category, parent, and children information
      let subcategory: Category | null = null;
      
      if ('subcategory' in response.data) {
        subcategory = response.data.subcategory;
      } else if ('data' in response.data && 'subcategory' in (response.data as any).data) {
        subcategory = (response.data as any).data.subcategory;
      } else if ('id' in response.data) {
        subcategory = response.data as Category;
      } else if (response.subcategory) {
        subcategory = response.subcategory;
      }

      if (subcategory) {
        // Only return if subcategory is active
        if (subcategory.is_active !== true) {
          return null;
        }
        
        // Ensure nested objects (category, parent) are properly preserved
        // The API returns: { subcategory: { ..., category: {...}, parent: {...}, children: [] } }
        // Preserve category and parent objects from API response
        // These are nested objects that provide additional context
        
        // Ensure children (sub-subcategories) are properly structured - filter inactive ones
        if (subcategory.children) {
          subcategory.children = subcategory.children
            .filter((child) => child.is_active === true) // Strict check for active
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        
        return subcategory;
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
      // API endpoint: GET /api/subcategories/by-parent/:parentId
      // Returns: { parentSubcategory: {...}, subcategories: [...] }
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
      } else if (Array.isArray(response.data)) {
        subcategories = response.data;
      }

      // Filter active sub-subcategories and sort by sort_order
      // IMPORTANT: Only return active sub-subcategories
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active === true) // Strict check for active
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
      // IMPORTANT: Only return active subcategories
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active === true) // Strict check for active
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
 * @param categoryId - Optional category ID for validation (not sent to API, used for client-side validation)
 */
export const getSubcategoryBySlug = async (
  slug: string,
  categoryId?: number | string
): Promise<Category | null> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.BY_SLUG(slug);
    const response = await apiClient.get<SubcategoryResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      // API endpoint: GET /api/subcategories/slug/:slug
      // Returns subcategory with category, parent, and children information
      let subcategory: Category | null = null;
      
      if ('subcategory' in response.data) {
        subcategory = response.data.subcategory;
      } else if ('data' in response.data && 'subcategory' in (response.data as any).data) {
        subcategory = (response.data as any).data.subcategory;
      } else if ('id' in response.data) {
        subcategory = response.data as Category;
      } else if (response.subcategory) {
        subcategory = response.subcategory;
      }

      if (subcategory) {
        // Validate categoryId if provided (client-side validation)
        if (categoryId !== undefined) {
          // Check category_id field or nested category object
          const subcategoryCategoryId = subcategory.category_id || subcategory.category?.id;
          if (subcategoryCategoryId && String(subcategoryCategoryId) !== String(categoryId)) {
            console.warn(`Subcategory ${slug} does not belong to category ${categoryId}`);
            // Still return the subcategory, but log a warning
          }
        }

        // Only return if subcategory is active
        if (subcategory.is_active !== true) {
          return null;
        }
        
        // Preserve nested objects from API response:
        // - category: { id, name, slug } - Main category this subcategory belongs to
        // - parent: { id, name, slug } - Parent subcategory (if this is a sub-subcategory)
        // - children: [] - Array of sub-subcategories (if this is a parent subcategory)
        // API response structure: { success: true, data: { subcategory: { ..., category: {...}, parent: {...}, children: [] } } }
        
        // Ensure children (sub-subcategories) are properly included and sorted - filter inactive ones
        if (subcategory.children) {
          subcategory.children = subcategory.children
            .filter((child) => child.is_active === true) // Strict check for active
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        return subcategory;
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
      // Handle different response structures
      // API endpoint: GET /api/subcategories?page=1&limit=50&category_id=1
      // Returns paginated subcategories with parent/children info
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
      } else if (response.subcategories && Array.isArray(response.subcategories)) {
        subcategories = response.subcategories;
        pagination = response.pagination;
      }

      // Filter active subcategories and ensure children are properly structured
      // IMPORTANT: Only return active subcategories and sub-subcategories
      const filteredSubcategories = subcategories
        .filter((subcategory) => subcategory.is_active === true) // Strict check for active
        .map((subcategory) => ({
          ...subcategory,
          // Preserve and sort children (sub-subcategories) - filter inactive ones
          children: (subcategory.children || [])
            .filter((child) => child.is_active === true) // Strict check for active
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        }))
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

/**
 * Get products by subcategory ID
 * API endpoint: GET /api/subcategories/:id/products
 * Returns products for the subcategory (includes products from sub-subcategories if it's a parent)
 * @param subcategoryId - The ID of the subcategory
 * @param options - Options for fetching products
 * @param options.page - Page number (default: 1)
 * @param options.limit - Items per page (default: 12)
 * @param options.sortBy - Sort field: created_at, price, name, rating, updated_at (default: created_at)
 * @param options.sortOrder - Sort order: asc or desc (default: desc)
 */
/**
 * Get aggregated contact lens options for a sub-subcategory
 * API endpoint: GET /api/subcategories/:id/contact-lens-options
 * or GET /api/subcategories/slug/:slug/contact-lens-options
 * Returns aggregated power, base curve, diameter options (and cylinder/axis for astigmatism)
 * from all products in the sub-subcategory
 */
export interface ContactLensOptions {
  subcategory: Category;
  powerOptions: string[];
  baseCurveOptions: number[];
  diameterOptions: number[];
  cylinderOptions?: number[]; // Only for astigmatism/toric
  axisOptions?: number[]; // Only for astigmatism/toric
  productCount: number;
  type: 'spherical' | 'astigmatism';
}

export const getContactLensOptionsBySubSubcategoryId = async (
  subSubcategoryId: number | string
): Promise<ContactLensOptions | null> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.CONTACT_LENS_OPTIONS_BY_ID(subSubcategoryId);
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      data?: ContactLensOptions;
    }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch contact lens options:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching contact lens options:', error);
    return null;
  }
};

export const getContactLensOptionsBySubSubcategorySlug = async (
  subSubcategorySlug: string
): Promise<ContactLensOptions | null> => {
  try {
    const endpoint = API_ROUTES.SUBCATEGORIES.CONTACT_LENS_OPTIONS_BY_SLUG(subSubcategorySlug);
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      data?: ContactLensOptions;
    }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch contact lens options:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching contact lens options:', error);
    return null;
  }
};

export const getProductsBySubcategoryId = async (
  subcategoryId: number | string,
  options?: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'price' | 'name' | 'rating' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{
  subcategory: Category | null;
  products: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> => {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 12;
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';

    const endpoint = API_ROUTES.SUBCATEGORIES.PRODUCTS(subcategoryId, page, limit, sortBy, sortOrder);
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      data?: {
        subcategory?: Category;
        products?: Product[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      };
      subcategory?: Category;
      products?: Product[];
      pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let subcategory: Category | null = null;
      let products: Product[] = [];
      let pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      } | undefined;

      if ('subcategory' in response.data && 'products' in response.data) {
        subcategory = response.data.subcategory || null;
        products = response.data.products || [];
        pagination = response.data.pagination;
      } else if ('data' in response.data) {
        const innerData = (response.data as any).data;
        if (innerData) {
          subcategory = innerData.subcategory || null;
          products = innerData.products || [];
          pagination = innerData.pagination;
        }
      } else if (response.subcategory || response.products) {
        subcategory = response.subcategory || null;
        products = response.products || [];
        pagination = response.pagination;
      }

      return {
        subcategory,
        products,
        pagination,
      };
    }

    console.error('Failed to fetch products by subcategory:', response.message);
    return {
      subcategory: null,
      products: [],
    };
  } catch (error) {
    console.error('Error fetching products by subcategory:', error);
    return {
      subcategory: null,
      products: [],
    };
  }
};

