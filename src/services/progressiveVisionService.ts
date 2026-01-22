import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

export interface ProgressiveFormStructure {
  pd: Array<{ value: string; label: string }>;
  h: Array<{ value: string; label: string }>;
  sph: {
    right: Array<{ value: string; label: string }>;
    left: Array<{ value: string; label: string }>;
  };
  cyl: {
    right: Array<{ value: string; label: string }>;
    left: Array<{ value: string; label: string }>;
  };
  axis: {
    right: Array<{ value: string; label: string }>;
    left: Array<{ value: string; label: string }>;
  };
  year_of_birth: Array<{ value: string; label: string }>;
  select_option: Array<{ value: string; label: string }>;
}

export interface ProgressiveFormData {
  pd_first?: string;
  pd_second?: string;
  pd_total?: string;
  h?: string;
  right_eye_sph?: string;
  right_eye_cyl?: string;
  right_eye_axis?: string;
  left_eye_sph?: string;
  left_eye_cyl?: string;
  left_eye_axis?: string;
  year_of_birth?: string;
  select_option?: string;
  copy_left_to_right?: boolean;
}

/**
 * Get Progressive Vision form structure from API
 */
export const getProgressiveFormStructure = async (): Promise<ProgressiveFormStructure> => {
  try {
    const response = await apiClient.get(API_ROUTES.PRESCRIPTION_FORMS.GET_PROGRESSIVE);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch progressive form structure:', error);
    throw new Error('Failed to load progressive vision options');
  }
};

/**
 * Get dropdown values for specific field type
 */
export const getProgressiveDropdownValues = async (
  fieldType: 'pd' | 'sph' | 'cyl' | 'axis' | 'h' | 'year_of_birth' | 'select_option',
  eyeType?: 'left' | 'right' | 'both'
): Promise<Array<{ value: string; label: string }>> => {
  try {
    const url = API_ROUTES.PRESCRIPTION_FORMS.GET_DROPDOWN_VALUES(
      fieldType,
      eyeType,
      'progressive'
    );
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch progressive dropdown values for ${fieldType}:`, error);
    throw new Error(`Failed to load ${fieldType} options`);
  }
};

/**
 * Submit Progressive Vision form
 */
export const submitProgressiveForm = async (formData: ProgressiveFormData): Promise<any> => {
  try {
    const response = await apiClient.post(API_ROUTES.PRESCRIPTION_FORMS.SUBMIT, {
      form_type: 'progressive',
      ...formData
    });
    return response.data;
  } catch (error) {
    console.error('Failed to submit progressive form:', error);
    throw new Error('Failed to submit prescription form');
  }
};

/**
 * Helper function to get field values from form structure
 */
export const getProgressiveFieldValues = (
  formStructure: ProgressiveFormStructure,
  fieldType: keyof ProgressiveFormStructure,
  eyeType?: 'left' | 'right' | 'both'
): Array<{ value: string; label: string }> => {
  const field = formStructure[fieldType];
  
  if (!field) return [];
  
  // For fields that have left/right separation
  if (typeof field === 'object' && 'right' in field && 'left' in field) {
    if (eyeType === 'right') return field.right;
    if (eyeType === 'left') return field.left;
    // Return combined unique values for 'both'
    const combined = [...field.right, ...field.left];
    const unique = combined.filter((item, index, arr) => 
      arr.findIndex(i => i.value === item.value) === index
    );
    return unique;
  }
  
  // For simple array fields
  return Array.isArray(field) ? field : [];
};
