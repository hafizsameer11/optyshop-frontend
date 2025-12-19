/**
 * Custom hook for fetching categories with subcategories
 */

import { useState, useEffect } from 'react';
import { getCategoriesWithSubcategories, type Category } from '../services/categoriesService';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage categories with their subcategories and sub-subcategories
 * Returns categories organized in 3-level hierarchy:
 * - Category → Subcategory (parent_id: null) → Sub-subcategory (parent_id: subcategory.id)
 */
export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoriesWithSubcategories(false); // Don't include products for navbar
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
      console.error('Error in useCategories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};


