/**
 * Health & API Info Service
 * Handles health check and API information endpoints
 */

import apiClient from './api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Interfaces
// ============================================

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime?: number;
  version?: string;
  environment?: string;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description?: string;
  endpoints?: {
    [key: string]: string;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Health check endpoint
 * GET /health
 */
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>(
    API_ROUTES.HEALTH.CHECK
  );
  return response.data;
};

/**
 * Get API information
 * GET /api
 */
export const getApiInfo = async (): Promise<ApiInfoResponse> => {
  const response = await apiClient.get<ApiInfoResponse>(
    API_ROUTES.HEALTH.API_INFO
  );
  return response.data;
};

export default {
  checkHealth,
  getApiInfo,
};

