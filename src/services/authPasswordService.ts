import { apiClient } from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post<{ message?: string }>(
    API_ROUTES.AUTH.FORGOT_PASSWORD,
    { email: email.trim() },
    false
  );

  return {
    success: response.success,
    message: response.message || response.error,
  };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post<{ message?: string }>(
    API_ROUTES.AUTH.RESET_PASSWORD,
    { token, newPassword },
    false
  );

  return {
    success: response.success,
    message: response.message || response.error,
  };
}
