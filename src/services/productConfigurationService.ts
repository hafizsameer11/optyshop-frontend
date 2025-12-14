/**
 * Product Configuration Service
 * Handles product configuration API calls for lens customization
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export interface PrescriptionLensType {
  id: number;
  name: string;
  slug: string;
  description: string;
  prescriptionType: 'single_vision' | 'progressive';
  basePrice: number;
  colors?: LensColor[];
  variants?: ProgressiveVariant[];
}

export interface ProgressiveVariant {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  isRecommended?: boolean;
  viewingRange?: string;
  useCases?: string;
}

export interface LensThicknessMaterial {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
}

export interface LensThicknessOption {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thicknessValue: number;
}

export interface LensTreatment {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  price: number;
  icon?: string;
}

export interface LensColor {
  id: number;
  name: string;
  colorCode: string;
  hexCode: string;
  imageUrl?: string;
  priceAdjustment: number;
}

export interface ProductConfiguration {
  product: {
    id: number;
    name: string;
    price: number;
  };
  prescriptionLensTypes: PrescriptionLensType[];
  lensThicknessMaterials: LensThicknessMaterial[];
  lensThicknessOptions: LensThicknessOption[];
  lensTreatments: LensTreatment[];
  photochromicColors?: LensColor[];
  prescriptionSunColors?: LensColor[];
}

export interface ProductConfigurationResponse {
  success: boolean;
  message: string;
  data: ProductConfiguration;
}

// ============================================
// API Functions
// ============================================

/**
 * Get product configuration options
 */
/**
 * Get product configuration - PRIMARY API endpoint per API guide
 * GET /api/products/:id/configuration
 * Returns all lens configuration including variants in prescriptionLensTypes[].variants
 */
export const getProductConfiguration = async (
  productId: number | string
): Promise<ProductConfiguration | null> => {
  try {
    console.log(`[API] PRIMARY: GET /api/products/${productId}/configuration`)
    const response = await apiClient.get<ProductConfigurationResponse>(
      API_ROUTES.PRODUCTS.CONFIGURATION(productId),
      false // Public endpoint
    );

    console.log(`[API] Product configuration response:`, response)

    if (response.success && response.data) {
      console.log(`[API] ✅ Configuration data received`)
      
      // Check if variants are included in progressive type
      if (response.data.prescriptionLensTypes) {
        const progressiveType = response.data.prescriptionLensTypes.find(
          t => t.prescriptionType === 'progressive' || t.slug === 'progressive'
        )
        if (progressiveType) {
          console.log(`[API] Progressive type found with ${progressiveType.variants?.length || 0} variants`)
          if (progressiveType.variants && progressiveType.variants.length > 0) {
            console.log(`[API] Variants:`, progressiveType.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              isActive: v.isActive,
              is_active: v.is_active
            })))
          }
        } else {
          console.warn(`[API] ⚠️ Progressive type not found in configuration`)
        }
      }
      return response.data;
    }

    console.error('[API] ❌ Failed to fetch product configuration:', response.message || 'Unknown error');
    return null;
  } catch (error) {
    console.error('[API] ❌ Error fetching product configuration:', error);
    return null;
  }
};

/**
 * Get all lens types
 */
export const getLensTypes = async (): Promise<PrescriptionLensType[]> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: { lensTypes: PrescriptionLensType[] };
    }>('/products/configuration/lens-types', false);

    if (response.success && response.data) {
      return (response.data as any).lensTypes || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching lens types:', error);
    return [];
  }
};

/**
 * Get lens thickness materials
 */
export const getLensThicknessMaterials = async (): Promise<LensThicknessMaterial[]> => {
  try {
    console.log('[API] GET /api/lens/thickness-materials');
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: LensThicknessMaterial[] | { materials?: LensThicknessMaterial[]; data?: LensThicknessMaterial[] };
    }>(API_ROUTES.LENS.THICKNESS_MATERIALS.LIST, false);

    if (response.success && response.data) {
      // Handle different response structures
      let materials: LensThicknessMaterial[] = [];
      if (Array.isArray(response.data)) {
        materials = response.data;
      } else if ((response.data as any).materials && Array.isArray((response.data as any).materials)) {
        materials = (response.data as any).materials;
      } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        materials = (response.data as any).data;
      }
      
      console.log(`[API] ✅ Fetched ${materials.length} lens thickness materials`);
      return materials;
    }

    return [];
  } catch (error) {
    console.error('[API] ❌ Error fetching lens thickness materials:', error);
    return [];
  }
};

/**
 * Get lens thickness options
 */
export const getLensThicknessOptions = async (): Promise<LensThicknessOption[]> => {
  try {
    console.log('[API] GET /api/lens/thickness-options');
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: LensThicknessOption[] | { options?: LensThicknessOption[]; data?: LensThicknessOption[] };
    }>(API_ROUTES.LENS.THICKNESS_OPTIONS.LIST, false);

    if (response.success && response.data) {
      // Handle different response structures
      let options: LensThicknessOption[] = [];
      if (Array.isArray(response.data)) {
        options = response.data;
      } else if ((response.data as any).options && Array.isArray((response.data as any).options)) {
        options = (response.data as any).options;
      } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        options = (response.data as any).data;
      }
      
      console.log(`[API] ✅ Fetched ${options.length} lens thickness options`);
      return options;
    }

    return [];
  } catch (error) {
    console.error('[API] ❌ Error fetching lens thickness options:', error);
    return [];
  }
};

/**
 * Get lens treatments
 */
export const getLensTreatments = async (type?: string): Promise<LensTreatment[]> => {
  try {
    const endpoint = type
      ? `${API_ROUTES.LENS.TREATMENTS.LIST}?type=${type}`
      : API_ROUTES.LENS.TREATMENTS.LIST;
    
    console.log(`[API] GET ${endpoint}`);
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: LensTreatment[] | { treatments?: LensTreatment[]; data?: LensTreatment[] };
    }>(endpoint, false);

    if (response.success && response.data) {
      // Handle different response structures
      let treatments: LensTreatment[] = [];
      if (Array.isArray(response.data)) {
        treatments = response.data;
      } else if ((response.data as any).treatments && Array.isArray((response.data as any).treatments)) {
        treatments = (response.data as any).treatments;
      } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        treatments = (response.data as any).data;
      }
      
      console.log(`[API] ✅ Fetched ${treatments.length} lens treatments`);
      return treatments;
    }

    return [];
  } catch (error) {
    console.error('[API] ❌ Error fetching lens treatments:', error);
    return [];
  }
};

/**
 * Get prescription lens types
 */
export const getPrescriptionLensTypes = async (): Promise<PrescriptionLensType[]> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: { prescriptionLensTypes: PrescriptionLensType[]; count: number };
    }>('/lens/prescription-lens-types', false);

    if (response.success && response.data) {
      return (response.data as any).prescriptionLensTypes || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching prescription lens types:', error);
    return [];
  }
};

