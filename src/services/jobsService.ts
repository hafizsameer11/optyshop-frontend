/**
 * Jobs Service
 * Handles all job-related API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Types
// ============================================

export interface Job {
  id: number;
  title: string;
  slug?: string;
  description: string;
  requirements?: string;
  location?: string;
  type?: string; // e.g., 'full-time', 'part-time', 'contract'
  department?: string;
  salary_range?: string;
  is_active: boolean;
  application_deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface JobsListResponse {
  jobs: Job[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all jobs
 * @param params - Optional query parameters (page, limit, type, location, etc.)
 */
export const getJobs = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  location?: string;
  department?: string;
  search?: string;
}): Promise<Job[]> => {
  try {
    let endpoint = API_ROUTES.JOBS.LIST;
    
    // Build query string if params provided
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.type) queryParams.append('type', params.type);
      if (params.location) queryParams.append('location', params.location);
      if (params.department) queryParams.append('department', params.department);
      if (params.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      if (queryString) {
        endpoint = `${endpoint}?${queryString}`;
      }
    }
    
    const response = await apiClient.get<Job[] | JobsListResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data.jobs && Array.isArray(data.jobs)) {
        return data.jobs;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
    }

    console.error('Failed to fetch jobs:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

/**
 * Get job by ID
 * @param id - Job ID
 */
export const getJobById = async (id: number | string): Promise<Job | null> => {
  try {
    const response = await apiClient.get<Job>(
      API_ROUTES.JOBS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle nested data structure
      return data.job || data.data || data;
    }

    console.error('Failed to fetch job:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
};

