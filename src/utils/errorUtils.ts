/**
 * Error formatting utilities for consistent error message display
 */

/**
 * Extracts a meaningful error message from various error formats
 * @param error - The error object, string, or any other type
 * @returns A user-friendly error message string
 */
export const formatErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an object, try to extract meaningful information
  if (typeof error === 'object') {
    // Check for common error message properties
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    // Handle validation errors array
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors
        .map((err: any) => {
          if (typeof err === 'string') return err;
          if (typeof err === 'object' && err.msg) return err.msg;
          if (typeof err === 'object' && err.message) return err.message;
          return JSON.stringify(err);
        })
        .join(', ');
    }

    // Handle field-specific errors object
    if (error.errors && typeof error.errors === 'object') {
      return Object.entries(error.errors)
        .map(([field, message]) => {
          if (typeof message === 'string') {
            return `${field}: ${message}`;
          }
          if (typeof message === 'object') {
            return `${field}: ${JSON.stringify(message)}`;
          }
          return `${field}: ${message}`;
        })
        .join(', ');
    }

    // Handle validation issues array (from Zod or similar)
    if (error.data?.issues && Array.isArray(error.data.issues)) {
      return error.data.issues.join(', ');
    }

    if (error.issues && Array.isArray(error.issues)) {
      return error.issues.join(', ');
    }

    // Handle nested message objects
    if (error.message && typeof error.message === 'object') {
      const messageObj = error.message;
      if (messageObj.message && typeof messageObj.message === 'string') {
        return messageObj.message;
      }
      if (messageObj.error && typeof messageObj.error === 'string') {
        return messageObj.error;
      }
      return JSON.stringify(messageObj);
    }

    // Handle nested error objects
    if (error.error && typeof error.error === 'object') {
      const errorObj = error.error;
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      if (errorObj.error && typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      return JSON.stringify(errorObj);
    }

    // Last resort: stringify the object
    try {
      const jsonString = JSON.stringify(error);
      // If the JSON string is too long, truncate it
      if (jsonString.length > 200) {
        return jsonString.substring(0, 200) + '...';
      }
      return jsonString;
    } catch {
      return 'An error occurred but could not be displayed properly';
    }
  }

  // Handle other types (numbers, booleans, etc.)
  return String(error);
};

/**
 * Extracts validation errors specifically for form fields
 * @param error - The error object from API response
 * @returns An object mapping field names to error messages
 */
export const extractValidationErrors = (error: any): { [key: string]: string } => {
  const validationErrors: { [key: string]: string } = {};

  if (!error || typeof error !== 'object') {
    return validationErrors;
  }

  // Handle field-specific errors object
  if (error.errors && typeof error.errors === 'object') {
    Object.entries(error.errors).forEach(([field, message]) => {
      if (typeof message === 'string') {
        validationErrors[field] = message;
      } else if (typeof message === 'object') {
        validationErrors[field] = JSON.stringify(message);
      } else {
        validationErrors[field] = String(message);
      }
    });
  }

  // Handle validation errors array with field information
  if (error.errors && Array.isArray(error.errors)) {
    error.errors.forEach((err: any) => {
      if (typeof err === 'object' && err.field && err.msg) {
        validationErrors[err.field] = err.msg;
      }
    });
  }

  return validationErrors;
};
