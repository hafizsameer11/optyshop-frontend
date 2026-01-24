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
