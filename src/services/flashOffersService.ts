/**
 * Flash Offers Service
 * Handles flash offer API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

export interface FlashOffer {
  id: number;
  title: string;
  description: string;
  product_ids: number[];
  discount_type?: string;
  discount_value?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  image_url?: string;
  link_url?: string;
  countdown?: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  is_expired?: boolean;
}

export interface FlashOffersResponse {
  success: boolean;
  message: string;
  data: {
    offers?: FlashOffer[];
    offer?: FlashOffer;
    flashOffers?: FlashOffer[];
    flashOffer?: FlashOffer;
  };
}

/**
 * Get all flash offers
 */
export const getFlashOffers = async (activeOnly: boolean = true): Promise<FlashOffer[]> => {
  try {
    const response = await apiClient.get<FlashOffersResponse>(
      API_ROUTES.FLASH_OFFERS.LIST(activeOnly),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data.offers || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching flash offers:', error);
    return [];
  }
};

/**
 * Get currently active flash offer with countdown
 */
export const getActiveFlashOffer = async (): Promise<FlashOffer | null> => {
  try {
    const response = await apiClient.get<FlashOffersResponse>(
      API_ROUTES.FLASH_OFFERS.ACTIVE,
      false // PUBLIC endpoint
    );

    if (response.success && response.data && response.data.offer) {
      return response.data.offer;
    }
    return null;
  } catch (error) {
    console.error('Error fetching active flash offer:', error);
    return null;
  }
};

// ============================================
// ADMIN FUNCTIONS (requires admin authentication)
// ============================================

/**
 * Get all flash offers (Admin view)
 */
export const adminGetFlashOffers = async (): Promise<FlashOffer[]> => {
  try {
    const response = await apiClient.get<FlashOffersResponse>(
      '/admin/flash-offers',
      true // ADMIN endpoint
    );

    if (response.success && response.data) {
      return response.data.offers || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin flash offers:', error);
    return [];
  }
};

/**
 * Get specific flash offer by ID (Admin)
 */
export const adminGetFlashOffer = async (id: number | string): Promise<FlashOffer | null> => {
  try {
    const response = await apiClient.get<FlashOffersResponse>(
      `/admin/flash-offers/${id}`,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.offer) {
      return response.data.offer;
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin flash offer:', error);
    return null;
  }
};

/**
 * Create flash offer (Admin)
 */
export const adminCreateFlashOffer = async (flashOfferData: Omit<FlashOffer, 'id' | 'countdown' | 'is_expired'>): Promise<FlashOffer | null> => {
  try {
    const response = await apiClient.post<FlashOffersResponse>(
      '/admin/flash-offers',
      flashOfferData,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.offer) {
      return response.data.offer;
    }
    return null;
  } catch (error) {
    console.error('Error creating flash offer:', error);
    return null;
  }
};

/**
 * Update flash offer (Admin)
 */
export const adminUpdateFlashOffer = async (id: number | string, flashOfferData: Partial<FlashOffer>): Promise<FlashOffer | null> => {
  try {
    const response = await apiClient.put<FlashOffersResponse>(
      `/admin/flash-offers/${id}`,
      flashOfferData,
      true // ADMIN endpoint
    );

    if (response.success && response.data && response.data.offer) {
      return response.data.offer;
    }
    return null;
  } catch (error) {
    console.error('Error updating flash offer:', error);
    return null;
  }
};

/**
 * Delete flash offer (Admin)
 */
export const adminDeleteFlashOffer = async (id: number | string): Promise<boolean> => {
  try {
    const response = await apiClient.delete<FlashOffersResponse>(
      `/admin/flash-offers/${id}`,
      true // ADMIN endpoint
    );

    return response.success;
  } catch (error) {
    console.error('Error deleting flash offer:', error);
    return false;
  }
};
