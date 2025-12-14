/**
 * Custom hook for fetching a single case study by slug
 */

import { useState, useEffect } from 'react';
import { getCaseStudyBySlug } from '../services/caseStudiesService';
import type { CaseStudy } from '../services/caseStudiesService';

interface UseCaseStudyReturn {
  caseStudy: CaseStudy | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage a single case study
 */
export const useCaseStudy = (slug: string): UseCaseStudyReturn => {
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseStudy = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getCaseStudyBySlug(slug);
      setCaseStudy(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch case study');
      console.error('Error in useCaseStudy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudy();
  }, [slug]);

  return {
    caseStudy,
    loading,
    error,
    refetch: fetchCaseStudy,
  };
};

