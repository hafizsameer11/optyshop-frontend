/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Types
// ============================================

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: 'customer' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Register a new user
 * @param data - Registration data
 */
export const register = async (data: RegisterData): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      API_ROUTES.AUTH.REGISTER,
      data,
      false // PUBLIC endpoint
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Registration failed',
      error: error.message,
    };
  }
};

/**
 * Login user
 * @param data - Login credentials
 */
export const login = async (data: LoginData): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      API_ROUTES.AUTH.LOGIN,
      data,
      false // PUBLIC endpoint
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Login failed',
      error: error.message,
    };
  }
};

/**
 * Refresh access token
 * @param refreshToken - Refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> => {
  try {
    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      API_ROUTES.AUTH.REFRESH,
      { refreshToken },
      false // PUBLIC endpoint
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Token refresh failed',
      error: error.message,
    };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  try {
    const response = await apiClient.get<User>(
      API_ROUTES.AUTH.ME,
      true // Requires authentication
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to get user',
      error: error.message,
    };
  }
};

/**
 * Update user profile
 * @param data - Profile update data
 */
export const updateProfile = async (data: UpdateProfileData): Promise<ApiResponse<User>> => {
  try {
    const response = await apiClient.put<User>(
      API_ROUTES.AUTH.PROFILE,
      data,
      true // Requires authentication
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Profile update failed',
      error: error.message,
    };
  }
};

/**
 * Change password
 * @param data - Password change data
 */
export const changePassword = async (data: ChangePasswordData): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.put<void>(
      API_ROUTES.AUTH.CHANGE_PASSWORD,
      data,
      true // Requires authentication
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Password change failed',
      error: error.message,
    };
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.post<void>(
      API_ROUTES.AUTH.LOGOUT,
      {},
      true // Requires authentication
    );
    return response;
  } catch (error: any) {
    // Even if logout fails, we should clear tokens
    return {
      success: false,
      message: error.message || 'Logout failed',
      error: error.message,
    };
  }
};

// Re-export ApiResponse type for convenience
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

