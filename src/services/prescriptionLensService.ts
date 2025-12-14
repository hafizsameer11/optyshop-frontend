/**
 * Prescription Lens Service
 * Handles API calls for prescription lens types and variants
 */

import { apiClient } from '../utils/api';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface PrescriptionLensColor {
  id: number;
  prescription_lens_type_id?: number;
  prescription_lens_variant_id?: number;
  name: string;
  color_code?: string;
  hex_code?: string;
  image_url?: string;
  price_adjustment?: number;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PrescriptionLensVariant {
  id: number;
  prescription_lens_type_id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  is_recommended?: boolean;
  viewing_range?: string | null;
  use_cases?: string;
  is_active: boolean;
  sort_order?: number;
  colors?: PrescriptionLensColor[];
  prescription_lens_type?: PrescriptionLensType;
  created_at?: string;
  updated_at?: string;
}

export interface PrescriptionLensType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  prescription_type: 'single_vision' | 'bifocal' | 'trifocal' | 'progressive';
  base_price?: number;
  is_active: boolean;
  sort_order?: number;
  colors?: PrescriptionLensColor[];
  variants?: PrescriptionLensVariant[];
  created_at?: string;
  updated_at?: string;
}

export interface PrescriptionLensTypesResponse {
  success: boolean;
  data: PrescriptionLensType[] | {
    prescriptionLensTypes?: PrescriptionLensType[];
    count?: number;
    [key: string]: any; // Allow for flexible response formats
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PrescriptionLensTypeResponse {
  success: boolean;
  data: PrescriptionLensType | {
    prescriptionLensType?: PrescriptionLensType;
    variants?: PrescriptionLensVariant[];
    count?: number;
    [key: string]: any; // Allow for flexible response formats
  };
}

export interface PrescriptionLensVariantsResponse {
  success: boolean;
  data: PrescriptionLensVariant[] | {
    data?: PrescriptionLensVariant[];
    variants?: PrescriptionLensVariant[];
    [key: string]: any; // Allow for flexible response formats
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PrescriptionLensVariantResponse {
  success: boolean;
  data: PrescriptionLensVariant;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all prescription lens types with their colors
 * GET /api/lens/prescription-lens-types
 */
export const getPrescriptionLensTypes = async (params?: {
  prescriptionType?: 'single_vision' | 'bifocal' | 'trifocal' | 'progressive';
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<PrescriptionLensType[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.prescriptionType) queryParams.prescriptionType = params.prescriptionType;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const url = buildQueryString(API_ROUTES.LENS.PRESCRIPTION_LENS_TYPES.LIST, queryParams);
    console.log('🔗 Fetching prescription lens types from:', url);
    const response = await apiClient.get<PrescriptionLensTypesResponse>(url, false);
    console.log('📥 Prescription lens types API response:', JSON.stringify(response, null, 2));

    if (response.success && response.data) {
      let types: PrescriptionLensType[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        types = response.data;
        console.log('✅ Response is direct array');
      } else if ((response.data as any).prescriptionLensTypes && Array.isArray((response.data as any).prescriptionLensTypes)) {
        types = (response.data as any).prescriptionLensTypes;
        console.log('✅ Response has data.prescriptionLensTypes array');
      } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        types = (response.data as any).data;
        console.log('✅ Response has data.data array');
      }
      
      // Map camelCase to snake_case if needed
      const mappedTypes = types.map((type: any) => ({
        id: type.id,
        name: type.name,
        slug: type.slug,
        description: type.description,
        prescription_type: type.prescriptionType || type.prescription_type,
        base_price: type.basePrice || type.base_price,
        is_active: type.isActive !== undefined ? type.isActive : type.is_active,
        sort_order: type.sortOrder || type.sort_order,
        colors: type.colors,
        created_at: type.createdAt || type.created_at,
        updated_at: type.updatedAt || type.updated_at
      }));
      
      if (mappedTypes.length === 0) {
        console.info('ℹ️ API returned empty array - no prescription lens types in database');
      } else {
        console.log(`✅ Fetched ${mappedTypes.length} prescription lens types`);
      }
      return mappedTypes;
    }

    // API call succeeded but response structure is unexpected
    if (response.success) {
      console.warn('⚠️ API returned success but no data structure matched. Response:', response.data);
    } else {
      console.warn('⚠️ API call failed:', response.message || response.error || 'Unknown error');
    }
    return null;
  } catch (error) {
    console.error('Error fetching prescription lens types:', error);
    return null;
  }
};

/**
 * Get a single prescription lens type by ID with its colors and variants
 * GET /api/lens/prescription-lens-types/:id
 */
export const getPrescriptionLensTypeById = async (
  id: number | string
): Promise<PrescriptionLensType | null> => {
  try {
    console.log('🔗 Fetching prescription lens type by ID:', id);
    const response = await apiClient.get<PrescriptionLensTypeResponse>(
      API_ROUTES.LENS.PRESCRIPTION_LENS_TYPES.BY_ID(id),
      false // PUBLIC endpoint
    );
    console.log('📥 Prescription lens type by ID response:', JSON.stringify(response, null, 2));

    if (response.success && response.data) {
      let typeData: any = response.data;
      
      // Handle different response structures
      if ((response.data as any).prescriptionLensType) {
        typeData = (response.data as any).prescriptionLensType;
        console.log('✅ Response has data.prescriptionLensType');
      } else if ((response.data as any).data) {
        typeData = (response.data as any).data;
        console.log('✅ Response has data.data');
      } else if (typeof (response.data as any).id === 'number') {
        // It's already a PrescriptionLensType object
        typeData = response.data;
        console.log('✅ Response is direct PrescriptionLensType object');
      }
      
      // Map camelCase to snake_case
      const mappedType: PrescriptionLensType = {
        id: typeData.id,
        name: typeData.name,
        slug: typeData.slug,
        description: typeData.description,
        prescription_type: typeData.prescriptionType || typeData.prescription_type,
        base_price: typeData.basePrice || typeData.base_price,
        is_active: typeData.isActive !== undefined ? typeData.isActive : typeData.is_active,
        sort_order: typeData.sortOrder || typeData.sort_order,
        colors: typeData.colors,
        created_at: typeData.createdAt || typeData.created_at,
        updated_at: typeData.updatedAt || typeData.updated_at
      };
      
      console.log('✅ Mapped prescription lens type:', mappedType);
      return mappedType;
    }

    console.error('❌ Failed to fetch prescription lens type:', response.message);
    return null;
  } catch (error) {
    console.error('❌ Error fetching prescription lens type:', error);
    return null;
  }
};

/**
 * Get all active variants for a prescription lens type
 * GET /api/lens/prescription-lens-types/:id/variants
 */
export const getPrescriptionLensVariantsByType = async (
  typeId: number | string,
  params?: {
    isActive?: boolean;
    isRecommended?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<PrescriptionLensVariant[] | null> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params?.isRecommended !== undefined) queryParams.isRecommended = params.isRecommended;
    // Set a higher limit to ensure we get all variants (admin-inserted data)
    queryParams.limit = params?.limit || 100; // Default to 100 to get all variants
    if (params?.page) queryParams.page = params.page;

    const baseUrl = API_ROUTES.LENS.PRESCRIPTION_LENS_TYPES.VARIANTS(typeId);
    const url = buildQueryString(baseUrl, queryParams);
    const fullUrl = `https://optyshop-frontend.hmstech.org/api${url}`;
    console.log('🔗 Fetching variants from URL:', url);
    console.log('🔗 Full API endpoint:', fullUrl);
    console.log('🔗 Expected endpoint: https://optyshop-frontend.hmstech.org/api/lens/prescription-lens-types/' + typeId + '/variants');
    const response = await apiClient.get<PrescriptionLensVariantsResponse>(url, false);
    console.log('📥 Raw API Response:', JSON.stringify(response, null, 2));

    if (response.success && response.data) {
      // Handle the API response structure: { success: true, data: { variants: [...], prescriptionLensType: {...}, count: N } }
      let variants: PrescriptionLensVariant[] = [];
      
      // Check for variants array in different possible locations
      if (Array.isArray(response.data)) {
        // Direct array response
        variants = response.data;
        console.log('✅ [API] Response is direct array, found', variants.length, 'variants');
      } else if (response.data.variants && Array.isArray(response.data.variants)) {
        // Nested variants: { data: { variants: [...] } }
        variants = response.data.variants;
        console.log('✅ [API] Response has data.variants array, found', variants.length, 'variants');
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Double nested: { data: { data: [...] } }
        variants = response.data.data;
        console.log('✅ [API] Response has data.data array, found', variants.length, 'variants');
      } else {
        console.warn('⚠️ [API] Unexpected response structure. Available keys:', Object.keys(response.data || {}));
        console.warn('⚠️ [API] Full response.data:', JSON.stringify(response.data, null, 2));
      }
      
      // Map camelCase API response to snake_case TypeScript interface
      const mappedVariants: PrescriptionLensVariant[] = variants.map((variant: any) => {
        // Handle is_active as both boolean and number (1/0)
        let isActive = false;
        if (variant.isActive !== undefined) {
          isActive = variant.isActive === true || variant.isActive === 1 || variant.isActive === '1';
        } else if (variant.is_active !== undefined) {
          isActive = variant.is_active === true || variant.is_active === 1 || variant.is_active === '1';
        }
        
        return {
          id: variant.id,
          prescription_lens_type_id: variant.prescriptionLensTypeId || variant.prescription_lens_type_id,
          name: variant.name,
          slug: variant.slug,
          description: variant.description,
          price: variant.price,
          is_recommended: variant.isRecommended !== undefined 
            ? (variant.isRecommended === true || variant.isRecommended === 1 || variant.isRecommended === '1')
            : (variant.is_recommended === true || variant.is_recommended === 1 || variant.is_recommended === '1'),
          viewing_range: variant.viewingRange || variant.viewing_range,
          use_cases: variant.useCases || variant.use_cases,
          is_active: isActive,
          sort_order: variant.sortOrder || variant.sort_order,
          colors: variant.colors,
          prescription_lens_type: variant.prescriptionLensType || variant.prescription_lens_type,
          created_at: variant.createdAt || variant.created_at,
          updated_at: variant.updatedAt || variant.updated_at
        };
      });
      
      console.log(`✅ Fetched ${mappedVariants.length} variants for type ID ${typeId}`);
      console.log('📋 Mapped variants:', mappedVariants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
        is_active: v.is_active,
        is_recommended: v.is_recommended,
        sort_order: v.sort_order
      })));
      
      // Log active variants count
      const activeCount = mappedVariants.filter(v => v.is_active).length;
      console.log(`📊 Active variants: ${activeCount} out of ${mappedVariants.length} total`);
      
      return mappedVariants;
    }

    console.error('❌ Failed to fetch prescription lens variants:', response.message);
    return null;
  } catch (error) {
    console.error('❌ Error fetching prescription lens variants:', error);
    return null;
  }
};

/**
 * Get a single prescription lens variant by ID with its prescription lens type info
 * GET /api/lens/prescription-lens-variants/:id
 */
export const getPrescriptionLensVariantById = async (
  id: number | string
): Promise<PrescriptionLensVariant | null> => {
  try {
    const response = await apiClient.get<PrescriptionLensVariantResponse>(
      API_ROUTES.LENS.PRESCRIPTION_LENS_VARIANTS.BY_ID(id),
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Failed to fetch prescription lens variant:', response.message);
    return null;
  } catch (error) {
    console.error('Error fetching prescription lens variant:', error);
    return null;
  }
};

export default {
  getPrescriptionLensTypes,
  getPrescriptionLensTypeById,
  getPrescriptionLensVariantsByType,
  getPrescriptionLensVariantById,
};

