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
 * @param position - Optional position filter (e.g., 'home', 'shop', etc.)
 */
export const getCampaigns = async (activeOnly: boolean = true, position?: string | null): Promise<Campaign[]> => {
  try {
    // Don't send activeOnly to backend - it filters by date range which might exclude valid campaigns
    // Instead, fetch all campaigns and filter by is_active on the frontend
    // This gives us more control and ensures campaigns with is_active=true are shown
    const params: Record<string, string> = {};
    // Note: Don't send position filter to backend either - filter on frontend instead
    // Backend might filter too strictly. We'll filter by position on the frontend.
    
    const endpoint = Object.keys(params).length > 0 
      ? buildQueryString(API_ROUTES.CAMPAIGNS.LIST, params)
      : API_ROUTES.CAMPAIGNS.LIST;
    
    if (import.meta.env.DEV) {
      console.log(`🔍 [Campaigns Service] Fetching ALL campaigns from: ${endpoint} (will filter by is_active=${activeOnly} and position=${position || 'none'} on frontend)`);
    }

    const response = await apiClient.get<CampaignsResponse | Campaign[]>(
      endpoint,
      false // PUBLIC endpoint
    );

    // Log raw response for debugging
    if (import.meta.env.DEV) {
      console.log('📦 Campaigns Service - Raw API Response:', {
        success: response.success,
        message: response.message,
        dataType: typeof response.data,
        data: response.data,
        dataStringified: JSON.stringify(response.data, null, 2).substring(0, 1000) // First 1000 chars
      });
    }

    if (response.success && response.data) {
      // Handle different response structures
      let campaigns: Campaign[] = [];
      
      const responseData = response.data as any;
      
      // Log response data structure
      if (import.meta.env.DEV) {
        console.log('📦 Campaigns Service - Processing response.data:', {
          type: typeof responseData,
          isArray: Array.isArray(responseData),
          keys: typeof responseData === 'object' && responseData !== null ? Object.keys(responseData) : [],
          hasCampaigns: !!(responseData?.campaigns),
          campaignsType: typeof responseData?.campaigns,
          campaignsIsArray: Array.isArray(responseData?.campaigns),
          campaignsValue: responseData?.campaigns,
          campaignsLength: Array.isArray(responseData?.campaigns) ? responseData.campaigns.length : 'not an array',
          fullResponseData: JSON.stringify(responseData, null, 2).substring(0, 500) // First 500 chars
        });
      }
      
      // Check if response.data is an array directly
      if (Array.isArray(responseData)) {
        campaigns = responseData;
        if (import.meta.env.DEV) {
          console.log('✅ Extracted campaigns from array:', campaigns.length);
        }
      } 
      // Check if response.data has a campaigns property (most common case: API returns { data: { campaigns: [...] } })
      // After API client processing, response.data becomes { campaigns: [...] }
      else if (responseData?.campaigns) {
        if (Array.isArray(responseData.campaigns)) {
          campaigns = responseData.campaigns;
          if (import.meta.env.DEV) {
            console.log('✅ Extracted campaigns from responseData.campaigns (array):', campaigns.length);
          }
        } else {
          // campaigns exists but is not an array - log for debugging
          if (import.meta.env.DEV) {
            console.warn('⚠️ responseData.campaigns exists but is not an array:', {
              type: typeof responseData.campaigns,
              value: responseData.campaigns,
              isArray: Array.isArray(responseData.campaigns)
            });
          }
          // Try to handle it anyway - maybe it's an object with data property
          if (typeof responseData.campaigns === 'object' && responseData.campaigns !== null) {
            // Check if it has a data property that is an array
            if (Array.isArray((responseData.campaigns as any).data)) {
              campaigns = (responseData.campaigns as any).data;
              if (import.meta.env.DEV) {
                console.log('✅ Extracted campaigns from responseData.campaigns.data:', campaigns.length);
              }
            } else {
              // Try to convert single object to array
              if ((responseData.campaigns as any).id && (responseData.campaigns as any).name) {
                campaigns = [responseData.campaigns as Campaign];
                if (import.meta.env.DEV) {
                  console.log('✅ Extracted single campaign from responseData.campaigns object');
                }
              }
            }
          }
        }
      }
      // Check if response.data has a data property with campaigns (nested structure: { data: { data: { campaigns: [...] } } })
      else if (responseData?.data) {
        if (responseData.data.campaigns && Array.isArray(responseData.data.campaigns)) {
          campaigns = responseData.data.campaigns;
          if (import.meta.env.DEV) {
            console.log('✅ Extracted campaigns from responseData.data.campaigns:', campaigns.length);
          }
        } else if (Array.isArray(responseData.data)) {
          campaigns = responseData.data;
          if (import.meta.env.DEV) {
            console.log('✅ Extracted campaigns from responseData.data array:', campaigns.length);
          }
        }
      }
      // Check if response.data is a single campaign object
      else if (responseData?.id && responseData?.name) {
        campaigns = [responseData as Campaign];
        if (import.meta.env.DEV) {
          console.log('✅ Extracted single campaign object');
        }
      }
      
      // Log for debugging
      if (import.meta.env.DEV) {
        if (campaigns.length > 0) {
          console.log('✅ Extracted campaigns:', campaigns.map(c => ({ 
            id: c.id, 
            name: c.name, 
            position: c.position || 'null/undefined',
            is_active: c.is_active 
          })));
        } else {
          console.warn('⚠️ No campaigns extracted. Response data structure:', {
            keys: typeof responseData === 'object' && responseData !== null ? Object.keys(responseData) : 'not an object',
            responseData: responseData
          });
        }
      }

      // Filter active campaigns if needed
      // Note: We filter by is_active flag only, not by date ranges
      // This ensures campaigns with is_active=true are shown regardless of date ranges
      let filteredCampaigns = campaigns;
      if (activeOnly) {
        filteredCampaigns = campaigns.filter((campaign) => {
          const isActive = campaign.is_active === true;
          if (import.meta.env.DEV && !isActive) {
            console.log(`   ❌ Campaign "${campaign.name}" (id: ${campaign.id}) filtered out - is_active: ${campaign.is_active}`);
          }
          return isActive;
        });
        
        if (import.meta.env.DEV) {
          console.log(`🔍 Active filter: ${campaigns.length} → ${filteredCampaigns.length} campaigns (filtered by is_active flag only)`);
        }
      }
      
      // Filter by position if specified (also include campaigns with null or undefined position - these show on all pages)
      if (position) {
        const beforeFilter = filteredCampaigns.length;
        filteredCampaigns = filteredCampaigns.filter(
          (campaign) => {
            const matches = campaign.position === position || campaign.position === null || campaign.position === undefined;
            if (import.meta.env.DEV && !matches) {
              console.log(`   ❌ Campaign "${campaign.name}" (id: ${campaign.id}) filtered out - position: "${campaign.position}", filter: "${position}"`);
            }
            return matches;
          }
        );
        if (import.meta.env.DEV) {
          console.log(`🔍 Position filter "${position}": ${beforeFilter} → ${filteredCampaigns.length} campaigns`);
        }
      }
      
      // Sort by sort_order
      const sorted = filteredCampaigns.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      if (import.meta.env.DEV) {
        console.log(`📊 Final campaigns count: ${sorted.length} (position: ${position || 'all'}, activeOnly: ${activeOnly})`);
        if (sorted.length > 0) {
          console.log('✅ Final campaigns list:', sorted.map(c => ({ id: c.id, name: c.name, position: c.position || 'null' })));
        }
      }
      
      return sorted;
    }

    console.error('Failed to fetch campaigns:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

