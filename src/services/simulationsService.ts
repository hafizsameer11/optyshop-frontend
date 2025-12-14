/**
 * Simulations Service
 * Handles all simulation API calls for lens calculations and recommendations
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Type definitions for simulation requests and responses
export interface ARCoatingRequest {
  lensType?: string;
  [key: string]: any;
}

export interface ARCoatingResponse {
  simulation: {
    reflectionIntensity: number;
    reflectionOpacity: number;
    colorIntensity: number;
    colors: string[];
  };
}

export interface PhotochromicRequest {
  sunlightLevel?: number;
  [key: string]: any;
}

export interface PhotochromicResponse {
  simulation: {
    sunlightLevel: number;
    opacity: number;
    brightness: number;
    contrast: number;
    color: string;
  };
}

export interface BaseCurveRequest {
  spherePower: number;
  cylinderPower: number;
  cornealCurvature?: number; // Optional, only included if provided
  [key: string]: any;
}

export interface BaseCurveResponse {
  calculation: {
    baseCurve: number;
    recommendation?: string;
    [key: string]: any;
  };
}

export interface PDCalculationRequest {
  [key: string]: any;
}

export interface PDCalculationResponse {
  calculation: {
    distancePD: number;
    nearPD: number;
  };
}

export interface PupillaryHeightRequest {
  [key: string]: any;
}

export interface PupillaryHeightResponse {
  calculation: {
    heightDifferenceMM: number;
    pupilPosition: number;
    frameMidline: number;
    direction: string;
  };
}

export interface LensThicknessRequest {
  frameDiameter?: number;
  lensPower?: number;
  lensIndex?: number;
  [key: string]: any;
}

export interface LensThicknessResponse {
  calculation: {
    edgeThickness: number;
    centerThickness: number;
    frameDiameter: number;
    lensPower: number;
    lensIndex: number;
    thicknessCategory: string;
    recommendation: string;
  };
}

export interface KidsLensRecommendationRequest {
  age?: number;
  prescription?: number;
  [key: string]: any;
}

export interface KidsLensRecommendationResponse {
  recommendation: {
    material: string;
    coatings: string[];
    index: number;
    impactResistant: boolean;
    reasons: string[];
  };
}

export interface LifestyleRecommendationRequest {
  lifestyle?: string[];
  activities?: string[];
  [key: string]: any;
}

export interface LifestyleRecommendationResponse {
  recommendation: {
    lensType: string;
    coatings: string[];
    index: number;
    features: string[];
  };
}

/**
 * Simulate AR Coating
 */
export const simulateARCoating = async (
  data: ARCoatingRequest = {}
): Promise<ARCoatingResponse | null> => {
  try {
    const response = await apiClient.post<ARCoatingResponse>(
      API_ROUTES.SIMULATIONS.AR_COATING,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as ARCoatingResponse;
    }

    console.error('AR coating simulation failed:', response.message);
    return null;
  } catch (error) {
    console.error('Error simulating AR coating:', error);
    return null;
  }
};

/**
 * Simulate Photochromic Lens
 */
export const simulatePhotochromic = async (
  data: PhotochromicRequest = {}
): Promise<PhotochromicResponse | null> => {
  try {
    const response = await apiClient.post<PhotochromicResponse>(
      API_ROUTES.SIMULATIONS.PHOTOCHROMIC,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as PhotochromicResponse;
    }

    console.error('Photochromic simulation failed:', response.message);
    return null;
  } catch (error) {
    console.error('Error simulating photochromic:', error);
    return null;
  }
};

/**
 * Calculate Base Curve
 */
export const calculateBaseCurve = async (
  data: BaseCurveRequest
): Promise<BaseCurveResponse | null> => {
  try {
    // Clean data - remove undefined/null values
    const cleanData: any = {
      spherePower: data.spherePower,
      cylinderPower: data.cylinderPower,
    }
    
    // Only include cornealCurvature if it's provided
    if (data.cornealCurvature !== undefined && data.cornealCurvature !== null) {
      cleanData.cornealCurvature = data.cornealCurvature
    }

    if (import.meta.env.DEV) {
      console.log('[Base Curve] Request data:', cleanData)
      console.log('[Base Curve] Endpoint:', API_ROUTES.SIMULATIONS.CALCULATE_BASE_CURVE)
    }

    const response = await apiClient.post<BaseCurveResponse>(
      API_ROUTES.SIMULATIONS.CALCULATE_BASE_CURVE,
      cleanData,
      false // PUBLIC endpoint
    );

    if (import.meta.env.DEV) {
      console.log('[Base Curve] Full API response:', response)
    }

    if (response.success && response.data) {
      // Handle different response structures
      // Backend might return: { success: true, data: { calculation: {...} } }
      // or: { success: true, data: { baseCurve: ..., recommendation: ... } }
      const responseData = response.data as any
      
      if (import.meta.env.DEV) {
        console.log('[Base Curve] Response data:', responseData)
      }
      
      // If response has calculation property, use it directly
      if (responseData.calculation && responseData.calculation.baseCurve !== undefined) {
        return responseData as BaseCurveResponse
      }
      
      // If response has baseCurve directly, wrap it in calculation
      if (responseData.baseCurve !== undefined) {
        return {
          calculation: {
            baseCurve: responseData.baseCurve,
            recommendation: responseData.recommendation,
          }
        } as BaseCurveResponse
      }
      
      // If response structure is different, try to extract baseCurve from nested objects
      if (typeof responseData === 'object') {
        // Check if baseCurve is nested deeper
        const baseCurve = responseData.baseCurve || responseData.result?.baseCurve || responseData.data?.baseCurve
        if (baseCurve !== undefined) {
          return {
            calculation: {
              baseCurve: baseCurve,
              recommendation: responseData.recommendation || responseData.result?.recommendation || responseData.data?.recommendation,
            }
          } as BaseCurveResponse
        }
      }
      
      // If we can't find baseCurve, log the structure for debugging
      console.warn('[Base Curve] Unexpected response structure:', responseData)
      throw new Error('Invalid response format from server. Expected baseCurve in response.')
    }

    // Log detailed error information
    const errorMessage = response.message || response.error || 'Unknown error'
    console.error('[Base Curve] Calculation failed:', {
      success: response.success,
      message: errorMessage,
      error: response.error,
      data: response.data
    })
    
    // Throw error with message so it can be caught and displayed
    throw new Error(errorMessage)
  } catch (error: any) {
    console.error('[Base Curve] Exception:', error);
    // Re-throw to allow component to handle and display error message
    throw error;
  }
};

/**
 * Calculate Pupillary Distance (PD)
 */
export const calculatePD = async (
  data: PDCalculationRequest = {}
): Promise<PDCalculationResponse | null> => {
  try {
    const response = await apiClient.post<any>(
      API_ROUTES.SIMULATIONS.CALCULATE_PD,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle nested response structure: data.calculation or direct calculation
      const calculationData = response.data.calculation || response.data;
      
      if (calculationData && calculationData.distancePD !== undefined) {
        return {
          calculation: {
            distancePD: calculationData.distancePD,
            nearPD: calculationData.nearPD,
          }
        } as PDCalculationResponse;
      }
    }

    console.error('PD calculation failed:', response.message || 'Unknown error');
    return null;
  } catch (error) {
    console.error('Error calculating PD:', error);
    return null;
  }
};

/**
 * Calculate Pupillary Height
 */
export const calculatePupillaryHeight = async (
  data: PupillaryHeightRequest = {}
): Promise<PupillaryHeightResponse | null> => {
  try {
    const response = await apiClient.post<any>(
      API_ROUTES.SIMULATIONS.CALCULATE_PUPILLARY_HEIGHT,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      // Handle nested response structure: data.calculation or direct calculation
      const calculationData = response.data.calculation || response.data;
      
      if (calculationData && calculationData.heightDifferenceMM !== undefined) {
        return {
          calculation: {
            heightDifferenceMM: calculationData.heightDifferenceMM,
            pupilPosition: calculationData.pupilPosition,
            frameMidline: calculationData.frameMidline,
            direction: calculationData.direction,
          }
        } as PupillaryHeightResponse;
      }
    }

    console.error('Pupillary height calculation failed:', response.message || 'Unknown error');
    return null;
  } catch (error) {
    console.error('Error calculating pupillary height:', error);
    return null;
  }
};

/**
 * Calculate Lens Thickness
 */
export const calculateLensThickness = async (
  data: LensThicknessRequest
): Promise<LensThicknessResponse | null> => {
  try {
    const response = await apiClient.post<LensThicknessResponse>(
      API_ROUTES.SIMULATIONS.CALCULATE_LENS_THICKNESS,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as LensThicknessResponse;
    }

    console.error('Lens thickness calculation failed:', response.message);
    return null;
  } catch (error) {
    console.error('Error calculating lens thickness:', error);
    return null;
  }
};

/**
 * Get Kids Lens Recommendation
 */
export const getKidsLensRecommendation = async (
  data: KidsLensRecommendationRequest = {}
): Promise<KidsLensRecommendationResponse | null> => {
  try {
    const response = await apiClient.post<KidsLensRecommendationResponse>(
      API_ROUTES.SIMULATIONS.KIDS_LENS_RECOMMENDATION,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as KidsLensRecommendationResponse;
    }

    console.error('Kids lens recommendation failed:', response.message);
    return null;
  } catch (error) {
    console.error('Error getting kids lens recommendation:', error);
    return null;
  }
};

/**
 * Get Lifestyle Lens Recommendation
 */
export const getLifestyleRecommendation = async (
  data: LifestyleRecommendationRequest = {}
): Promise<LifestyleRecommendationResponse | null> => {
  try {
    const response = await apiClient.post<LifestyleRecommendationResponse>(
      API_ROUTES.SIMULATIONS.LIFESTYLE_RECOMMENDATION,
      data,
      false // PUBLIC endpoint
    );

    if (response.success && response.data) {
      return response.data as LifestyleRecommendationResponse;
    }

    console.error('Lifestyle recommendation failed:', response.message);
    return null;
  } catch (error) {
    console.error('Error getting lifestyle recommendation:', error);
    return null;
  }
};

