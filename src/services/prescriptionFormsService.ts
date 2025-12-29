/**
 * Prescription Forms Service
 * Handles prescription form API calls for Progressive, Near Vision, and Distance Vision
 */

import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// ============================================
// Type Definitions
// ============================================

export type FormType = 'progressive' | 'near_vision' | 'distance_vision';
export type FieldType = 'pd' | 'sph' | 'cyl' | 'axis' | 'h' | 'year_of_birth' | 'select_option';
export type EyeType = 'left' | 'right' | 'both';

export interface DropdownValue {
  id: number;
  value: string;
  label: string;
  field_type: FieldType;
  eye_type: 'left' | 'right' | 'both' | null;
  form_type: FormType | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// API Response Structure (what the backend returns)
export interface ApiPrescriptionFormStructure {
  formType: FormType;
  dropdownValues: {
    pd?: DropdownValue[];
    h?: DropdownValue[];
    year_of_birth?: DropdownValue[];
    select_option?: DropdownValue[];
    rightEye?: {
      sph?: DropdownValue[];
      cyl?: DropdownValue[];
      axis?: DropdownValue[];
    };
    leftEye?: {
      sph?: DropdownValue[];
      cyl?: DropdownValue[];
      axis?: DropdownValue[];
    };
  };
}

// Internal Structure (what the frontend uses)
export interface PrescriptionFormStructure {
  form_type: FormType;
  fields: {
    pd?: {
      left?: DropdownValue[];
      right?: DropdownValue[];
      both?: DropdownValue[];
    };
    sph?: {
      left?: DropdownValue[];
      right?: DropdownValue[];
      both?: DropdownValue[];
    };
    cyl?: {
      left?: DropdownValue[];
      right?: DropdownValue[];
      both?: DropdownValue[];
    };
    axis?: {
      left?: DropdownValue[];
      right?: DropdownValue[];
      both?: DropdownValue[];
    };
    h?: {
      both?: DropdownValue[];
    };
    year_of_birth?: {
      both?: DropdownValue[];
    };
    select_option?: {
      both?: DropdownValue[];
    };
  };
}

export interface PrescriptionFormSubmitRequest {
  form_type: FormType;
  // PD fields
  pd?: string;
  pd_right?: string;
  pd_mm?: string;
  // Height (for progressive)
  h?: string;
  // Year of birth (for progressive)
  year_of_birth?: string;
  // Select option (for progressive)
  select_option?: string;
  // Left eye
  left_eye_sph?: string;
  left_eye_cyl?: string;
  left_eye_axis?: string;
  // Right eye
  right_eye_sph?: string;
  right_eye_cyl?: string;
  right_eye_axis?: string;
  // Copy feature
  copy_left_to_right?: boolean;
  same_for_both_eyes?: boolean;
}

export interface PrescriptionFormSubmitResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// ============================================
// API Functions
// ============================================

/**
 * Transform API response structure to internal structure
 */
function transformApiResponse(apiData: ApiPrescriptionFormStructure): PrescriptionFormStructure {
  const structure: PrescriptionFormStructure = {
    form_type: apiData.formType,
    fields: {}
  };

  const { dropdownValues } = apiData;

  // Transform PD, H, Year of Birth, Select Option (these are "both" eye type)
  if (dropdownValues.pd && dropdownValues.pd.length > 0) {
    structure.fields.pd = { both: dropdownValues.pd };
  }
  if (dropdownValues.h && dropdownValues.h.length > 0) {
    structure.fields.h = { both: dropdownValues.h };
  }
  if (dropdownValues.year_of_birth && dropdownValues.year_of_birth.length > 0) {
    structure.fields.year_of_birth = { both: dropdownValues.year_of_birth };
  }
  if (dropdownValues.select_option && dropdownValues.select_option.length > 0) {
    structure.fields.select_option = { both: dropdownValues.select_option };
  }

    // Transform SPH, CYL, AXIS from leftEye and rightEye
    if (dropdownValues.leftEye || dropdownValues.rightEye) {
      const leftEye = dropdownValues.leftEye || {};
      const rightEye = dropdownValues.rightEye || {};

      // Helper function to merge left and right eye values
      const mergeEyeValues = (leftValues?: DropdownValue[], rightValues?: DropdownValue[]) => {
        const result: { left?: DropdownValue[]; right?: DropdownValue[]; both?: DropdownValue[] } = {};
        const bothSet = new Map<string, DropdownValue>();
        const leftSet = new Map<string, DropdownValue>();
        const rightSet = new Map<string, DropdownValue>();
        
        // Process left eye values
        if (leftValues && leftValues.length > 0) {
          leftValues.forEach(v => {
            // If eye_type is null or 'both', it applies to both eyes
            if (v.eye_type === null || v.eye_type === 'both' || !v.eye_type) {
              bothSet.set(v.value, v);
            } else if (v.eye_type === 'left') {
              leftSet.set(v.value, v);
            }
          });
        }
        
        // Process right eye values
        if (rightValues && rightValues.length > 0) {
          rightValues.forEach(v => {
            // If eye_type is null or 'both', it applies to both eyes
            if (v.eye_type === null || v.eye_type === 'both' || !v.eye_type) {
              bothSet.set(v.value, v);
            } else if (v.eye_type === 'right') {
              rightSet.set(v.value, v);
            }
          });
        }

        // If same value appears in both left and right arrays, add to 'both'
        if (leftValues && rightValues) {
          const leftValueSet = new Set(leftValues.map(v => v.value));
          rightValues.forEach(v => {
            if (leftValueSet.has(v.value)) {
              bothSet.set(v.value, v);
            }
          });
        }

        // Build result
        if (bothSet.size > 0) {
          result.both = Array.from(bothSet.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        if (leftSet.size > 0) {
          result.left = Array.from(leftSet.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        if (rightSet.size > 0) {
          result.right = Array.from(rightSet.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        return Object.keys(result).length > 0 ? result : undefined;
      };

      // SPH
      const sphMerged = mergeEyeValues(leftEye.sph, rightEye.sph);
      if (sphMerged) {
        structure.fields.sph = sphMerged;
      }

      // CYL
      const cylMerged = mergeEyeValues(leftEye.cyl, rightEye.cyl);
      if (cylMerged) {
        structure.fields.cyl = cylMerged;
      }

      // AXIS
      const axisMerged = mergeEyeValues(leftEye.axis, rightEye.axis);
      if (axisMerged) {
        structure.fields.axis = axisMerged;
      }
    }

  return structure;
}

/**
 * Get prescription form structure for Progressive Vision
 */
export async function getProgressiveFormStructure(): Promise<PrescriptionFormStructure> {
  const response = await apiClient.get<ApiPrescriptionFormStructure>(
    API_ROUTES.PRESCRIPTION_FORMS.GET_PROGRESSIVE
  );
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch progressive form structure');
  }
  return transformApiResponse(response.data);
}

/**
 * Get prescription form structure for Near Vision
 */
export async function getNearVisionFormStructure(): Promise<PrescriptionFormStructure> {
  const response = await apiClient.get<ApiPrescriptionFormStructure>(
    API_ROUTES.PRESCRIPTION_FORMS.GET_NEAR_VISION
  );
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch near vision form structure');
  }
  return transformApiResponse(response.data);
}

/**
 * Get prescription form structure for Distance Vision
 */
export async function getDistanceVisionFormStructure(): Promise<PrescriptionFormStructure> {
  const response = await apiClient.get<ApiPrescriptionFormStructure>(
    API_ROUTES.PRESCRIPTION_FORMS.GET_DISTANCE_VISION
  );
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch distance vision form structure');
  }
  return transformApiResponse(response.data);
}

/**
 * Get form structure by form type
 */
export async function getFormStructure(formType: FormType): Promise<PrescriptionFormStructure> {
  switch (formType) {
    case 'progressive':
      return getProgressiveFormStructure();
    case 'near_vision':
      return getNearVisionFormStructure();
    case 'distance_vision':
      return getDistanceVisionFormStructure();
    default:
      throw new Error(`Unknown form type: ${formType}`);
  }
}

/**
 * Get dropdown values with optional filters
 */
export async function getDropdownValues(
  fieldType?: FieldType,
  eyeType?: EyeType,
  formType?: FormType
): Promise<DropdownValue[]> {
  const response = await apiClient.get<DropdownValue[]>(
    API_ROUTES.PRESCRIPTION_FORMS.GET_DROPDOWN_VALUES(fieldType, eyeType, formType)
  );
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch dropdown values');
  }
  return response.data || [];
}

/**
 * Submit prescription form
 * Supports copy_left_to_right feature to automatically copy left eye values to right eye
 */
export async function submitPrescriptionForm(
  data: PrescriptionFormSubmitRequest
): Promise<PrescriptionFormSubmitResponse> {
  const response = await apiClient.post<PrescriptionFormSubmitResponse>(
    API_ROUTES.PRESCRIPTION_FORMS.SUBMIT,
    data
  );
  return response;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract dropdown values from form structure for a specific field and eye
 */
export function getFieldValues(
  structure: PrescriptionFormStructure,
  fieldType: FieldType,
  eyeType: 'left' | 'right' | 'both' = 'both'
): DropdownValue[] {
  // Safety check: ensure structure and fields exist
  if (!structure || !structure.fields) return [];
  
  const field = structure.fields[fieldType];
  if (!field) return [];

  // Try specific eye type first, then fallback to 'both'
  const values = field[eyeType] || field.both || [];
  return values.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Get all values for a field type across all eye types
 */
export function getAllFieldValues(
  structure: PrescriptionFormStructure,
  fieldType: FieldType
): DropdownValue[] {
  // Safety check: ensure structure and fields exist
  if (!structure || !structure.fields) return [];
  
  const field = structure.fields[fieldType];
  if (!field) return [];

  const allValues: DropdownValue[] = [];
  if (field.left) allValues.push(...field.left);
  if (field.right) allValues.push(...field.right);
  if (field.both) allValues.push(...field.both);

  // Remove duplicates by value
  const uniqueValues = new Map<string, DropdownValue>();
  allValues.forEach((value) => {
    if (!uniqueValues.has(value.value)) {
      uniqueValues.set(value.value, value);
    }
  });

  return Array.from(uniqueValues.values()).sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );
}

