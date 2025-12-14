/**
 * Case Studies Service
 * Handles all case study API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface CaseStudyPerson {
  name: string;
  role: string;
}

export interface CaseStudy {
  id: number;
  slug: string;
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  category: string;
  person?: CaseStudyPerson;
  image: string;
  content: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CaseStudiesResponse {
  success: boolean;
  message: string;
  data: CaseStudy[];
}

// ============================================
// API Functions
// ============================================

/**
 * Get all case studies
 */
export const getCaseStudies = async (): Promise<CaseStudy[]> => {
  try {
    const response = await apiClient.get<CaseStudy[]>(
      API_ROUTES.CASE_STUDIES.LIST,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // The API client extracts the inner 'data' field, so response.data should be the array
      // Handle both possible response structures for safety
      let caseStudies: CaseStudy[] = [];
      
      if (Array.isArray(data)) {
        caseStudies = data;
      } else if (data && Array.isArray(data.caseStudies)) {
        caseStudies = data.caseStudies;
      } else if (data && Array.isArray(data.data)) {
        caseStudies = data.data;
      }
      
      return caseStudies;
    }

    console.error('Failed to fetch case studies:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return [];
  }
};

/**
 * Get case study by slug
 */
export const getCaseStudyBySlug = async (slug: string): Promise<CaseStudy | null> => {
  try {
    const response = await apiClient.get<CaseStudy>(
      API_ROUTES.CASE_STUDIES.BY_SLUG(slug),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as CaseStudy;
    }

    console.error('Failed to fetch case study by slug:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching case study by slug:', error);
    return null;
  }
};

