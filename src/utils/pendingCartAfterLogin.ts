/**
 * Persists add-to-cart intent while the user signs in, then replays it after login.
 */

import { addItemToCart, updateCartItem, type AddToCartRequest } from '../services/cartService'
import {
  addContactLensToCart,
  type ContactLensCheckoutRequest,
} from '../services/contactLensFormsService'

const STORAGE_KEY = 'optyshop_pending_cart_action'

export type PendingCartAction =
  | {
      type: 'standard'
      request: AddToCartRequest
      returnPath: string
    }
  | {
      type: 'contact_lens'
      request: ContactLensCheckoutRequest
      returnPath: string
    }

export function savePendingCartAction(action: PendingCartAction): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action))
  } catch (e) {
    console.error('savePendingCartAction failed:', e)
  }
}

export function getPendingCartAction(): PendingCartAction | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingCartAction
  } catch {
    return null
  }
}

export function clearPendingCartAction(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function consumePendingCartAction(): PendingCartAction | null {
  const action = getPendingCartAction()
  if (action) clearPendingCartAction()
  return action
}

/** Only allow in-app relative paths (prevents open redirects). */
export function getSafeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  return trimmed
}

export async function executePendingCartAction(
  action: PendingCartAction
): Promise<{ success: boolean; message?: string }> {
  if (action.type === 'contact_lens') {
    const result = await addContactLensToCart(action.request)
    if (result?.success && result.data?.item) {
      const apiItem = result.data.item
      const req = action.request
      const expectedLineQty =
        (Number(req.right_qty) || 0) + (Number(req.left_qty) || 0)
      const reportedQty = Number(apiItem.quantity)
      if (
        apiItem.id &&
        expectedLineQty > 0 &&
        Number.isFinite(reportedQty) &&
        reportedQty !== expectedLineQty
      ) {
        await updateCartItem(apiItem.id, expectedLineQty)
      }
      return { success: true, message: result.message }
    }
    return {
      success: false,
      message: result?.message || 'Failed to add contact lens to cart',
    }
  }

  const result = await addItemToCart(action.request)
  return {
    success: result.success,
    message: result.message,
  }
}
