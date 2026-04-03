import type { FlashOffer } from '../services/flashOffersService'

/** Nested `product.flash_offer` (GET product) — may omit `is_active`. */
export function isFlashOfferCurrentlyActive(
    offer:
        | (Pick<FlashOffer, 'starts_at' | 'ends_at'> & { is_active?: boolean })
        | null
        | undefined
): boolean {
    if (!offer) return false
    if (offer.is_active === false) return false
    const start = new Date(offer.starts_at).getTime()
    const end = new Date(offer.ends_at).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false
    const now = Date.now()
    return start <= now && end >= now
}

/**
 * True for empty, `#...`, `javascript:...`, or absolute URLs that are only the site root + a hash
 * (e.g. `https://shop.example/#live-demo`). Those should not win over `/flash-offers/:id`.
 */
export function isUnusableFlashOfferLinkUrl(url: string | null | undefined): boolean {
    const t = url?.trim()
    if (!t) return true
    if (t.startsWith('#')) return true
    if (/^javascript:/i.test(t)) return true
    // Legacy demo / in-page anchors (CMS often stored full origin + hash)
    if (/#live-demo\b/i.test(t)) return true
    try {
        const base =
            typeof window !== 'undefined' && window.location?.origin
                ? window.location.origin
                : 'https://placeholder.local'
        const p = new URL(t, base)
        if (p.hash) {
            const path = (p.pathname || '/').replace(/\/+$/, '') || '/'
            // Root (or empty) path + fragment only → not a real destination
            if (path === '/' || path === '') return true
        }
    } catch {
        return false
    }
    return false
}

/**
 * Prefer a real `link_url`, else flash landing when several products are in the offer,
 * else first product PDP (single product), else landing.
 */
export function resolveFlashOfferCtaPath(
    offer: Pick<FlashOffer, 'id' | 'link_url' | 'product_ids'>,
    productSlugOrId?: string | null
): string {
    const raw = offer.link_url?.trim() || ''
    if (raw && !isUnusableFlashOfferLinkUrl(raw)) {
        return raw
    }
    const ids = offer.product_ids
    if (Array.isArray(ids) && ids.length > 1) {
        return `/flash-offers/${offer.id}`
    }
    if (productSlugOrId) {
        return `/shop/product/${productSlugOrId}`
    }
    return `/flash-offers/${offer.id}`
}

export type NormalizedFlashDiscount = 'percentage' | 'fixed_amount' | 'free_shipping' | 'none'

/** Maps API enum + legacy `fixed` to a normalized kind. */
export function normalizeFlashDiscountType(raw: string | undefined | null): NormalizedFlashDiscount {
    if (!raw) return 'none'
    const r = String(raw).toLowerCase()
    if (r === 'percentage') return 'percentage'
    if (r === 'fixed_amount' || r === 'fixed') return 'fixed_amount'
    if (r === 'free_shipping') return 'free_shipping'
    return 'none'
}

/**
 * Short label for badges (card corner, list). Pass `freeShippingLabel` for translated "Free shipping".
 */
export function flashDiscountBadgeLabel(
    offer: Pick<FlashOffer, 'discount_type' | 'discount_value'>,
    freeShippingLabel = 'Free shipping'
): string | null {
    const kind = normalizeFlashDiscountType(offer.discount_type)
    const v = offer.discount_value
    if (kind === 'free_shipping') return freeShippingLabel
    if (v == null || v === '') return null
    const num = Number(v)
    if (!Number.isFinite(num)) return null
    if (kind === 'percentage') return `-${num}%`
    if (kind === 'fixed_amount') return `-€${num.toFixed(2)}`
    return null
}

/**
 * Frontend-only sale price for display (cart/checkout do not apply this until backend supports it).
 */
export function computeFlashAdjustedPrice(
    basePrice: number,
    offer: Pick<FlashOffer, 'discount_type' | 'discount_value'>
): { sale: number; compare: number } | null {
    const kind = normalizeFlashDiscountType(offer.discount_type)
    if (kind === 'free_shipping' || kind === 'none') return null
    const v = Number(offer.discount_value)
    if (!Number.isFinite(v)) return null
    const base = Number(basePrice)
    if (!Number.isFinite(base) || base <= 0) return null
    if (kind === 'percentage') {
        const sale = Math.max(0, base * (1 - v / 100))
        return sale < base - 1e-9 ? { sale, compare: base } : null
    }
    if (kind === 'fixed_amount') {
        const sale = Math.max(0, base - v)
        return sale < base - 1e-9 ? { sale, compare: base } : null
    }
    return null
}
