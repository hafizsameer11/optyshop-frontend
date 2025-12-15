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

// Fallback testimonials used when API returns no data
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    customer_name: 'Stefan WOLK',
    text: 'Virtual try-ons are definitely a huge boost for our online sales. With a virtual try-on experience, sunglasses purchase conversions are 2 to 3 times higher than those without a virtual try-on.',
    rating: 5,
    avatar_url: '/assets/images/Stefan-Wolk.webp',
    sort_order: 1,
  },
  {
    id: 2,
    customer_name: 'Branislav RAMSAK',
    text: 'Since we increased the number of templates offering the virtual try-on feature, the conversion rate increase has been stable at around 90%.',
    rating: 5,
    avatar_url: '/assets/images/branislav-ramsak.webp',
    sort_order: 2,
  },
  {
    id: 3,
    customer_name: 'Jean-Francois JUPILLE',
    text: "We're thrilled with the performance of VTO and how it's simplified our customers' shopping experience. We've seen a significant increase in conversion rates among users who use this feature.",
    rating: 5,
    avatar_url: '/assets/images/Kits-Jean-Francois-Jupille.webp',
    sort_order: 3,
  },
];

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
      const testimonials =
        data.testimonials || (data.data && data.data.testimonials) || [];

      const sorted = testimonials.sort(
        (a: Testimonial, b: Testimonial) => (a.sort_order || 0) - (b.sort_order || 0)
      );

      // If backend has no testimonials configured yet, fall back to curated defaults
      if (sorted.length === 0) {
        return DEFAULT_TESTIMONIALS;
      }

      return sorted;
    }

    console.error('Failed to fetch testimonials:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};

