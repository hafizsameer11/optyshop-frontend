/**
 * API Client Utility for OptyShop Frontend
 * Handles all API calls to the backend with authentication
 */

// API Base URL Configuration
// Postman collection uses: base_url = http://localhost:5000
// All API endpoints follow pattern: {{base_url}}/api/...
// For production: https://optyshop-frontend.hmstech.org/api
// For local development: http://localhost:5000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:5000/api'  // Local development (matches Postman collection)
    : 'https://optyshop-frontend.hmstech.org/api'  // Production
  );

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from localStorage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  /**
   * Clear tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // If refresh token is invalid, clear tokens
        if (response.status === 401 || response.status === 403) {
          this.clearTokens();
        }
        return false;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Backend may return token/refreshToken or access_token/refresh_token
        const accessToken = data.data.token || data.data.access_token;
        const newRefreshToken = data.data.refreshToken || data.data.refresh_token;
        if (accessToken) {
          this.saveTokens(accessToken, newRefreshToken);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('Failed to refresh token:', error);
      // If it's a network error, don't clear tokens (might be temporary)
      if (error.message && !error.message.includes('Failed to fetch')) {
        this.clearTokens();
      }
      return false;
    }
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      } else {
        // If response is not JSON, try to get text
        const text = await response.text();
        return {
          success: false,
          message: `Server error: ${response.status} ${response.statusText}`,
          error: `Server returned non-JSON response: ${response.status}. Response: ${text.substring(0, 100)}`,
        };
      }
    } catch (e) {
      // If response is not JSON, return error
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
        error: `Server returned non-JSON response: ${response.status}`,
      };
    }

    // If unauthorized, try to refresh token (but don't throw - let caller handle retry)
    if (response.status === 401 && this.getRefreshToken()) {
      try {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
          // Return a special response indicating token was refreshed
          // The caller can retry the request if needed
          return {
            success: false,
            message: 'Token expired. Please retry your request.',
            error: 'TOKEN_REFRESHED',
          };
        }
      } catch (refreshError) {
        // Refresh failed, continue with normal error handling
        console.error('Token refresh failed:', refreshError);
      }
    }

    if (!response.ok) {
      // Extract validation errors if available
      let errorMessage = data.message || 'An error occurred'
      
      // Handle validation issues array (from backend validation)
      if (data.data && data.data.issues && Array.isArray(data.data.issues)) {
        errorMessage = data.data.issues.join(', ')
      } else if (data.issues && Array.isArray(data.issues)) {
        errorMessage = data.issues.join(', ')
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.join(', ')
      } else if (data.errors && typeof data.errors === 'object') {
        // Handle object with field-specific errors
        const errorFields = Object.entries(data.errors).map(([field, msg]) => `${field}: ${msg}`)
        errorMessage = errorFields.join(', ')
      } else if (data.error) {
        errorMessage = data.error
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, requireAuth: boolean = false): Promise<ApiResponse<T>> {
    try {
      // Add cache-busting parameter to prevent stale data
      const separator = endpoint.includes('?') ? '&' : '?';
      const cacheBuster = `_t=${Date.now()}`;
      const url = `${this.baseURL}${endpoint}${separator}${cacheBuster}`;
      if (import.meta.env.DEV) {
        console.log(`[API] GET ${url}`);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(requireAuth),
        cache: 'no-store', // Prevent browser caching
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`[API] GET Error:`, error);
      }
      // Handle network errors (backend not running, CORS, etc.)
      const errorMessage = error.message || 'Network error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('Network request failed');
      
      return {
        success: false,
        message: isNetworkError 
          ? 'Unable to connect to server. This could be due to:\n1. Backend server not running on http://localhost:5000\n2. CORS configuration issue - check browser console for CORS errors\n3. Network connectivity issue'
          : errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    requireAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      if (import.meta.env.DEV) {
        console.log(`[API] POST ${url}`, body);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(requireAuth),
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`[API] POST Error:`, error);
      }
      // Handle network errors (backend not running, CORS, etc.)
      const errorMessage = error.message || 'Network error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('Network request failed');
      
      return {
        success: false,
        message: isNetworkError 
          ? 'Unable to connect to server. This could be due to:\n1. Backend server not running on http://localhost:5000\n2. CORS configuration issue - check browser console for CORS errors\n3. Network connectivity issue'
          : errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    requireAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.buildHeaders(requireAuth),
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      const errorMessage = error.message || 'Network error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('Network request failed');
      
      return {
        success: false,
        message: isNetworkError 
          ? 'Unable to connect to server. This could be due to:\n1. Backend server not running on http://localhost:5000\n2. CORS configuration issue - check browser console for CORS errors\n3. Network connectivity issue'
          : errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, requireAuth: boolean = false): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.buildHeaders(requireAuth),
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      const errorMessage = error.message || 'Network error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('Network request failed');
      
      return {
        success: false,
        message: isNetworkError 
          ? 'Unable to connect to server. This could be due to:\n1. Backend server not running on http://localhost:5000\n2. CORS configuration issue - check browser console for CORS errors\n3. Network connectivity issue'
          : errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * POST request with FormData (for file uploads)
   * Note: Do NOT set Content-Type header - browser will set it automatically with boundary
   */
  async postFormData<T = any>(
    endpoint: string,
    formData: FormData,
    requireAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      if (import.meta.env.DEV) {
        console.log(`[API] POST FormData ${url}`);
      }

      const headers: HeadersInit = {};

      if (requireAuth) {
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // DO NOT set Content-Type - browser will set it automatically with boundary for FormData
      // Setting it manually will break the multipart/form-data encoding

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      const errorMessage = error.message || 'Network error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('Network request failed');
      
      return {
        success: false,
        message: isNetworkError 
          ? 'Unable to connect to server. This could be due to:\n1. Backend server not running on http://localhost:5000\n2. CORS configuration issue - check browser console for CORS errors\n3. Network connectivity issue'
          : errorMessage,
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export class for testing
export default ApiClient;

