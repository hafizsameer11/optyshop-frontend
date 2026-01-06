/**
 * Campaigns Service
 * Handles all campaign API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';
import { buildQueryString } from '../config/apiRoutes';

// Type definitions for campaign data
export interface Campaign {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  link_url?: string | null;
  campaign_type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  position?: string | null;
  sort_order?: number;
  meta?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

/**
 * Get all campaigns
 * @param activeOnly - If true, only return active campaigns
 */
export const getCampaigns = async (activeOnly: boolean = true): Promise<Campaign[]> => {
  try {
    const endpoint = activeOnly 
      ? buildQueryString(API_ROUTES.CAMPAIGNS.LIST, { activeOnly: 'true' })
      : API_ROUTES.CAMPAIGNS.LIST;

    const response = await apiClient.get<CampaignsResponse>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      const campaigns = response.data.campaigns || [];
      // Filter active campaigns if needed and sort by sort_order
      const filtered = activeOnly 
        ? campaigns.filter((campaign) => campaign.is_active)
        : campaigns;
      
      return filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    console.error('Failed to fetch campaigns:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

