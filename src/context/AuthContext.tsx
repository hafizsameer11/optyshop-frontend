import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!token && !refreshToken) {
      setIsLoading(false);
      return;
    }

    // Add timeout to prevent hanging indefinitely (especially if backend is down)
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second timeout - if auth check takes longer, stop loading

    try {
      // Try to get user info with current token
      let response = await apiClient.get<User>(API_ROUTES.AUTH.ME, true);
      
      // If token is invalid/expired, try to refresh it
      if (!response.success && refreshToken) {
        const refreshed = await apiClient.refreshAccessToken();
        if (refreshed) {
          // Retry getting user info with new token
          response = await apiClient.get<User>(API_ROUTES.AUTH.ME, true);
        }
      }

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token might be invalid, clear it
        apiClient.clearTokens();
        setUser(null);
      }
    } catch (error: any) {
      // Check if it's a 401 (unauthorized) - token expired
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = (error as any).message;
        
        // If it's an auth error (401), try to refresh token
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('unauthorized')) {
          if (refreshToken) {
            try {
              const refreshed = await apiClient.refreshAccessToken();
              if (refreshed) {
                // Retry getting user info
                const retryResponse = await apiClient.get<User>(API_ROUTES.AUTH.ME, true);
                if (retryResponse.success && retryResponse.data) {
                  setUser(retryResponse.data);
                  setIsLoading(false);
                  return;
                }
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens
              apiClient.clearTokens();
              setUser(null);
            }
          } else {
            // No refresh token, clear everything
            apiClient.clearTokens();
            setUser(null);
          }
        } else if (!errorMsg.includes('Failed to fetch') && !errorMsg.includes('Network')) {
          // Other errors (not network), clear tokens
          apiClient.clearTokens();
          setUser(null);
        }
        // Network errors - keep tokens, user might still be valid
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>(API_ROUTES.AUTH.LOGIN, { email, password }, false);

      if (response.success && response.data) {
        // Backend returns: { user, token, refreshToken }
        // Map to our storage format: access_token, refresh_token
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        // Set user
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>(API_ROUTES.AUTH.REGISTER, data, false);

      if (response.success && response.data) {
        // Backend returns: { user, token, refreshToken }
        // Map to our storage format: access_token, refresh_token
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        // Set user
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiClient.post(API_ROUTES.AUTH.LOGOUT, {}, true);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user regardless of API call success
      apiClient.clearTokens();
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiClient.put<User>(API_ROUTES.AUTH.PROFILE, data, true);
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Profile update failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Profile update failed' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.put(
        API_ROUTES.AUTH.CHANGE_PASSWORD,
        { currentPassword, newPassword },
        true
      );
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Password change failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Password change failed' };
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

