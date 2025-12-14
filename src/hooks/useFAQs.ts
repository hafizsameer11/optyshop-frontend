/**
 * Custom hook for fetching FAQs
 */

import { useState, useEffect } from 'react';
import { getFAQs } from '../services/faqsService';
import type { FAQ } from '../services/faqsService';

interface UseFAQsReturn {
  faqs: FAQ[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage FAQs
 */
export const useFAQs = (): UseFAQsReturn => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFAQs();
      setFaqs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch FAQs');
      console.error('Error in useFAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  return {
    faqs,
    loading,
    error,
    refetch: fetchFAQs,
  };
};

