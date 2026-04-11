/**
 * Contact page form — submits either to the backend API or to Web3Forms (email inbox).
 *
 * - Default: POST /api/forms/contact/submissions — the server must send email / store the lead.
 * - Optional: set VITE_WEB3FORMS_ACCESS_KEY — submissions go to Web3Forms and email is delivered
 *   to the address configured in https://web3forms.com (no backend mail required).
 */

import { apiClient, type ApiResponse } from '../utils/api'
import { API_ROUTES } from '../config/apiRoutes'

const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

export type ContactFormPayload = {
  email: string
  firstName: string
  lastName: string
  country: string
  message: string
  /** Optional; omitted from the public contact form but kept for callers that still send it. */
  company?: string
}

function isTruthyApiBody<T>(response: ApiResponse<T>): boolean {
  if (!response.success) return false
  const raw = response.data as { success?: boolean; message?: string } | undefined
  if (raw && typeof raw === 'object' && 'success' in raw && raw.success === false) {
    return false
  }
  return true
}

function getErrorMessage<T>(response: ApiResponse<T>): string {
  const raw = response.data as { message?: string; error?: string } | undefined
  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message) return raw.message
    if (typeof raw.error === 'string' && raw.error) return raw.error
  }
  return response.message || response.error || 'Request failed'
}

/**
 * Submit contact form. Uses Web3Forms when VITE_WEB3FORMS_ACCESS_KEY is set; otherwise the backend API.
 */
export async function submitContactForm(
  payload: ContactFormPayload
): Promise<{ success: boolean; message?: string }> {
  const web3Key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim()

  if (web3Key) {
    const body = {
      access_key: web3Key,
      subject: 'New contact form — OptyShop',
      from_name: `${payload.firstName} ${payload.lastName}`.trim(),
      email: payload.email,
      message: [
        payload.message,
        '',
        ...(payload.company?.trim() ? [`Company: ${payload.company.trim()}`] : []),
        `Country: ${payload.country}`,
      ].join('\n'),
      ...(payload.company?.trim() ? { company: payload.company.trim() } : {}),
      country: payload.country,
      firstName: payload.firstName,
      lastName: payload.lastName,
    }

    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        message?: string
      }

      if (data.success && res.ok) {
        return { success: true }
      }

      return {
        success: false,
        message: data.message || `Could not send message (${res.status})`,
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, message: msg }
    }
  }

  const response = await apiClient.post(API_ROUTES.FORMS.CONTACT.SUBMIT, payload, false)

  if (!isTruthyApiBody(response)) {
    return {
      success: false,
      message: getErrorMessage(response),
    }
  }

  return { success: true }
}
