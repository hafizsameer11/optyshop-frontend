/**
 * Testimonials Service
 * Handles all testimonial API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export type Testimonial = {
  id: number;
  customer_name: string;
  text: string;
  rating?: number;
  avatar_url?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type TestimonialsResponse = {
  success: boolean;
  message: string;
  data: {
    testimonials: Testimonial[];
  };
};

// ============================================
// API Functions
// ============================================

/**
 * Get all testimonials
 */
export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const response = await apiClient.get<{ testimonials: Testimonial[] }>(
      API_ROUTES.CMS.TESTIMONIALS,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // The API client extracts the inner 'data' field, so response.data = { testimonials: [] }
      // Handle both possible response structures for safety
      const testimonials = data.testimonials || (data.data && data.data.testimonials) || [];
      
      // Sort by sort_order (featured testimonials could be prioritized if needed)
      return testimonials
        .sort((a: Testimonial, b: Testimonial) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    console.error('Failed to fetch testimonials:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};

