import type { Product } from '../services/productsService'

/**
 * Eyebrow / card brand line: `brand`, then `contact_lens_brand`, then category name.
 * Returns null when nothing should be shown (avoids a fake "Brand" placeholder).
 */
export function getShopProductBrandLabel(product: Product | null | undefined): string | null {
    if (!product) return null
    const p = product as Product & { contact_lens_brand?: string | null }
    const b = typeof product.brand === 'string' ? product.brand.trim() : ''
    if (b) return b
    const cl = typeof p.contact_lens_brand === 'string' ? p.contact_lens_brand.trim() : ''
    if (cl) return cl
    const cat = product.category?.name?.trim()
    return cat || null
}

/**
 * Resolve a human-readable product title from heterogeneous API shapes (home grids, category payloads, etc.).
 */
export function getProductDisplayName(product: unknown): string {
    const p = product as Record<string, unknown>
    const candidates = [p?.name, p?.title, p?.product_name, p?.display_name]
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim()
    }
    return ''
}
