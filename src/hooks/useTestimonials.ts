/**
 * Custom hook for fetching testimonials
 */

import { useState, useEffect } from 'react';
import { getTestimonials } from '../services/testimonialsService';
import type { Testimonial } from '../services/testimonialsService';

interface UseTestimonialsReturn {
  testimonials: Testimonial[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage testimonials
 */
export const useTestimonials = (): UseTestimonialsReturn => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch testimonials');
      console.error('Error in useTestimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return {
    testimonials,
    loading,
    error,
    refetch: fetchTestimonials,
  };
};

