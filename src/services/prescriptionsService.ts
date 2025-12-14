/**
 * Prescriptions Service
 * Handles prescription validation and verification API calls
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Type definitions for prescription data
export interface PrescriptionData {
  prescription_type?: string;
  od_sphere?: string | number;
  od_cylinder?: string | number;
  od_axis?: number;
  od_add?: string | number | null;
  os_sphere?: string | number;
  os_cylinder?: string | number;
  os_axis?: number;
  os_add?: string | number | null;
  pd_binocular?: string | number;
  pd_monocular_od?: string | number;
  pd_monocular_os?: string | number;
  pd_near?: string | number | null;
  ph_od?: string | number | null;
  ph_os?: string | number | null;
  doctor_name?: string | null;
  doctor_license?: string | null;
  prescription_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  [key: string]: any;
}

export interface Prescription extends PrescriptionData {
  id: number;
  user_id: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidatePrescriptionResponse {
  valid: boolean;
}

export interface VerifyPrescriptionResponse {
  prescription: Prescription;
}

export interface PrescriptionsListResponse {
  prescriptions: Prescription[];
}

export interface PrescriptionResponse {
  prescription: Prescription;
}

/**
 * Get all prescriptions for the current user
 */
export const getPrescriptions = async (): Promise<Prescription[]> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.PRESCRIPTIONS.LIST,
      true // Requires authentication
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle nested structure: data.prescriptions or just data
      return data.prescriptions || data || [];
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return [];
  }
};

/**
 * Get a single prescription by ID
 * @param id - The prescription ID
 */
export const getPrescriptionById = async (
  id: number | string
): Promise<Prescription | null> => {
  try {
    const response = await apiClient.get<any>(
      API_ROUTES.PRESCRIPTIONS.BY_ID(id),
      true // Requires authentication
    );

    if (response.success && response.data) {
      const data = response.data as any;
      // Handle nested structure: data.prescription or just data
      return data.prescription || data || null;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return null;
  }
};

/**
 * Create a new prescription
 * @param prescriptionData - The prescription data to create
 */
export const createPrescription = async (
  prescriptionData: PrescriptionData
): Promise<{ success: boolean; prescription?: Prescription; message?: string }> => {
  try {
    const response = await apiClient.post<PrescriptionResponse>(
      API_ROUTES.PRESCRIPTIONS.CREATE,
      prescriptionData,
      true // Requires authentication
    );

    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        prescription: data.prescription || data,
        message: response.message,
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to create prescription',
    };
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while creating prescription',
    };
  }
};

/**
 * Update an existing prescription
 * @param id - The prescription ID
 * @param prescriptionData - The prescription data to update
 */
export const updatePrescription = async (
  id: number | string,
  prescriptionData: PrescriptionData
): Promise<{ success: boolean; prescription?: Prescription; message?: string }> => {
  try {
    const response = await apiClient.put<PrescriptionResponse>(
      API_ROUTES.PRESCRIPTIONS.UPDATE(id),
      prescriptionData,
      true // Requires authentication
    );

    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        prescription: data.prescription || data,
        message: response.message,
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to update prescription',
    };
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while updating prescription',
    };
  }
};

/**
 * Delete a prescription
 * @param id - The prescription ID
 */
export const deletePrescription = async (
  id: number | string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiClient.delete(
      API_ROUTES.PRESCRIPTIONS.DELETE(id),
      true // Requires authentication
    );

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error: any) {
    console.error('Error deleting prescription:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while deleting prescription',
    };
  }
};

/**
 * Validate a prescription
 * @param prescriptionData - The prescription data to validate
 */
export const validatePrescription = async (
  prescriptionData: PrescriptionData
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const response = await apiClient.post<ValidatePrescriptionResponse>(
      API_ROUTES.PRESCRIPTIONS.VALIDATE,
      prescriptionData,
      true // Requires authentication
    );

    if (response.success && response.data) {
      return {
        valid: response.data.valid,
        message: response.message,
      };
    }

    return {
      valid: false,
      message: response.message || 'Validation failed',
    };
  } catch (error: any) {
    console.error('Error validating prescription:', error);
    return {
      valid: false,
      message: error.message || 'An error occurred during validation',
    };
  }
};

/**
 * Verify a prescription by ID
 * @param id - The prescription ID to verify
 */
export const verifyPrescription = async (
  id: number | string
): Promise<{ success: boolean; prescription?: Prescription; message?: string }> => {
  try {
    const response = await apiClient.get<VerifyPrescriptionResponse>(
      API_ROUTES.PRESCRIPTIONS.VERIFY(id),
      true // Requires authentication
    );

    if (response.success && response.data) {
      return {
        success: true,
        prescription: response.data.prescription,
        message: response.message,
      };
    }

    return {
      success: false,
      message: response.message || 'Verification failed',
    };
  } catch (error: any) {
    console.error('Error verifying prescription:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during verification',
    };
  }
};

