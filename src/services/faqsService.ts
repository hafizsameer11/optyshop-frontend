/**
 * FAQs Service
 * Handles all FAQ API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FAQsResponse {
  success: boolean;
  message: string;
  data: {
    faqs: FAQ[];
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all FAQs
 */
export const getFAQs = async (): Promise<FAQ[]> => {
  try {
    const response = await apiClient.get<{ faqs: FAQ[] }>(
      API_ROUTES.FAQS.LIST,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // The API client extracts the inner 'data' field, so response.data = { faqs: [] }
      // Handle both possible response structures for safety
      const faqs = data.faqs || (data.data && data.data.faqs) || [];
      
      // Filter active FAQs if is_active field exists, and sort by sort_order
      return faqs
        .filter((faq: FAQ) => faq.is_active !== false)
        .sort((a: FAQ, b: FAQ) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    console.error('Failed to fetch FAQs:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
};

