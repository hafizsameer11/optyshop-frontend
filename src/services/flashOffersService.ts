/**
 * Flash Offers Service
 * Handles flash offer API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';
import type { Product } from './productsService';

/** Backend Prisma enum + legacy `fixed` seen in older data. */
export type FlashDiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'fixed';

export interface FlashOffer {
  id: number;
  title: string;
  description: string | null;
  product_ids: number[];
  discount_type?: FlashDiscountType | string;
  discount_value?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  image_url?: string | null;
  link_url?: string | null;
  countdown?: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } | null;
  is_expired?: boolean;
  /** Present on GET /flash-offers/:id — whether offer is in its active time window. */
  is_currently_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FlashOffersResponse {
  success: boolean;
  message: string;
  data: {
    offers?: FlashOffer[];
    offer?: FlashOffer;
    flashOffers?: FlashOffer[];
    flashOffer?: FlashOffer;
    products?: Product[];
  };
}

export interface FlashOfferWithProducts {
  offer: FlashOffer;
  products: Product[];
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

/**
 * Single-offer landing: full offer + listing-shaped products (order matches product_ids).
 * 404 if id does not exist. Expired/inactive offers may still return with products for "ended" UI.
 */
export const getFlashOfferWithProducts = async (
  id: number | string
): Promise<FlashOfferWithProducts | null> => {
  try {
    const response = await apiClient.get<{ offer: FlashOffer; products: Product[] }>(
      API_ROUTES.FLASH_OFFERS.BY_ID(id),
      false
    );

    if (response.success && response.data?.offer) {
      return {
        offer: response.data.offer,
        products: Array.isArray(response.data.products) ? response.data.products : [],
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching flash offer by id:', error);
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
export const adminCreateFlashOffer = async (
  flashOfferData: Record<string, unknown>
): Promise<FlashOffer | null> => {
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
export const adminUpdateFlashOffer = async (
  id: number | string,
  flashOfferData: Record<string, unknown>
): Promise<FlashOffer | null> => {
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
