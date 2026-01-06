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
  // Backend may return either `campaigns` array or a plain array
  campaigns?: Campaign[];
  data?: Campaign[];
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

    const response = await apiClient.get<CampaignsResponse | Campaign[]>(
      endpoint,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle different response structures
      let campaigns: Campaign[] = [];
      
      // Check if response.data is an array directly
      if (Array.isArray(response.data)) {
        campaigns = response.data;
      } 
      // Check if response.data has a campaigns property
      else if ('campaigns' in response.data && Array.isArray((response.data as CampaignsResponse).campaigns)) {
        campaigns = (response.data as CampaignsResponse).campaigns as Campaign[];
      }
      // Check if response.data has a data property with campaigns
      else if ('data' in response.data && Array.isArray((response.data as any).data)) {
        campaigns = (response.data as any).data;
      }
      // Check if response.data is a single campaign object
      else if ('id' in response.data && 'name' in response.data) {
        campaigns = [response.data as Campaign];
      }

      // Filter active campaigns if needed
      let filteredCampaigns = campaigns;
      if (activeOnly) {
        filteredCampaigns = campaigns.filter((campaign) => campaign.is_active);
      }
      
      // Sort by sort_order
      return filteredCampaigns.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    console.error('Failed to fetch campaigns:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

