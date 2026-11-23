import type { Product } from '../services/productsService'

/**
 * Contact lens shop products: prescription / pack / toric options belong on the detail page,
 * not on listing cards. Mirrors {@link ProductDetail} `isContactLens` logic.
 */
export function isShopContactLensProduct(product: Product | null | undefined): boolean {
    if (!product) return false
    const p = product as Record<string, unknown>
    const categorySlug = (product.category?.slug || '').toLowerCase()
    const categoryName = (product.category?.name || '').toLowerCase()
    const clt = p.contact_lens_type
    const hasContactLensType =
        (typeof clt === 'string' && clt.length > 0) ||
        (Array.isArray(clt) && clt.length > 0)
    return (
        categorySlug.includes('contact') ||
        categoryName.includes('contact') ||
        categorySlug.includes('lens') ||
        hasContactLensType
    )
}

/**
 * Eyebrow / card brand line: `brand`, then `contact_lens_brand`.
 * Never falls back to category — shop UI should show brand, not category.
 */
export function getShopProductBrandLabel(product: Product | null | undefined): string | null {
    if (!product) return null
    const p = product as Product & {
        contact_lens_brand?: string | null
        brand?: string | { name?: string | null } | null
        brand_name?: string | null
        brandName?: string | null
    }
    if (typeof p.brand === 'string' && p.brand.trim()) return p.brand.trim()
    if (p.brand && typeof p.brand === 'object' && typeof p.brand.name === 'string' && p.brand.name.trim()) {
        return p.brand.name.trim()
    }
    if (typeof p.brand_name === 'string' && p.brand_name.trim()) return p.brand_name.trim()
    if (typeof p.brandName === 'string' && p.brandName.trim()) return p.brandName.trim()
    const cl = typeof p.contact_lens_brand === 'string' ? p.contact_lens_brand.trim() : ''
    if (cl) return cl
    return null
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
