/**
 * Custom hook for fetching case studies
 */

import { useState, useEffect } from 'react';
import { getCaseStudies } from '../services/caseStudiesService';
import type { CaseStudy } from '../services/caseStudiesService';

interface UseCaseStudiesReturn {
  caseStudies: CaseStudy[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage case studies
 */
export const useCaseStudies = (): UseCaseStudiesReturn => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCaseStudies();
      setCaseStudies(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch case studies');
      console.error('Error in useCaseStudies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  return {
    caseStudies,
    loading,
    error,
    refetch: fetchCaseStudies,
  };
};

