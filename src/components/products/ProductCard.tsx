import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { getProductImageUrl } from '../../utils/productImage'
import { getShopProductBrandLabel, isShopContactLensProduct } from '../../utils/productDisplayName'
import { getProxiedImageUrl } from '../../services/imageProxyService'
import { normalizeProductSubcategory, type Product } from '../../services/productsService'

interface ProductCardProps {
    product: Product
    className?: string
}

/** One row on the card: from API `colors`, `color_images`, or a single `color` / `frame_color` string. */
type CardColorOption = {
    key: string
    label: string
    thumbUrl?: string
    hex?: string
}

const MAX_SWATCHES = 6

function parseColorImagesField(product: Product): unknown[] | null {
    let raw = product.color_images
    if (raw == null) return null
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw) as unknown
        } catch {
            return null
        }
    }
    return Array.isArray(raw) ? raw : null
}

/** Maps common color names to a solid fill when there is no thumbnail or hex. */
function solidFromColorName(name: string): string {
    const n = name.toLowerCase()
    if (/^#[0-9a-f]{3,8}$/i.test(n.trim())) return n.trim()
    if (n.includes('black') || n === 'nero') return '#111827'
    if (n.includes('brown') || n.includes('tortoise') || n.includes('tortoiseshell')) return '#8B4513'
    if (n.includes('red') || n === 'rosso') return '#DC143C'
    if (n.includes('pink') || n === 'rosa') return '#F472B6'
    if (n.includes('green') || n === 'verde') return '#228B22'
    if (n.includes('blue') || n === 'blu') return '#2563EB'
    if (n.includes('purple') || n === 'viola') return '#7C3AED'
    if (n.includes('white') || n === 'bianco') return '#F8FAFC'
    if (n.includes('yellow') || n === 'giallo') return '#EAB308'
    if (n.includes('gray') || n.includes('grey')) return '#94A3B8'
    if (n.includes('gold')) return '#CA8A04'
    if (n.includes('silver')) return '#CBD5E1'
    if (n.includes('beige') || n.includes('tan')) return '#D6C0A3'
    if (n.includes('navy')) return '#1E3A5F'
    if (n.includes('orange')) return '#EA580C'
    return '#E2E8F0'
}

function gradientFromColorName(name: string): string | null {
    const n = name.toLowerCase()
    if (n.includes('tortoise') || n.includes('tortoiseshell')) {
        return 'linear-gradient(135deg, #8B4513 0%, #D2691E 40%, #8B4513 100%)'
    }
    if (n.includes('rainbow')) {
        return 'linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)'
    }
    return null
}

function resolveThumbUrl(url: string): string {
    const u = url.trim()
    if (!u) return ''
    if (u.startsWith('blob:')) return u
    const proxied = getProxiedImageUrl(u)
    return proxied || u
}

/**
 * Colors on listings come from:
 * - `colors[]` (preferred on some APIs): name, display_name, value, hexCode, images[]
 * - `color_images[]`: color, name, display_name, optional price, images[] per color — effectively a color variant with its own gallery
 * - Else a single `frame_color` / `color` / `lens_color` string (display only, not tied to extra images unless backend sends them above)
 */
function normalizeCardColors(product: Product): CardColorOption[] {
    const p = product as Record<string, unknown>
    const out: CardColorOption[] = []
    const seen = new Set<string>()

    const add = (opt: CardColorOption) => {
        const key = (opt.key || opt.label).trim()
        const label = (opt.label || opt.key).trim()
        if (!key && !label) return
        const dedupe = key.toLowerCase() || label.toLowerCase()
        if (seen.has(dedupe)) return
        seen.add(dedupe)
        out.push({ ...opt, key: key || label, label: label || key })
    }

    const colorsApi = p.colors
    if (Array.isArray(colorsApi) && colorsApi.length > 0) {
        for (const c of colorsApi as Record<string, unknown>[]) {
            const key = String(c.value ?? c.color ?? c.name ?? c.hexCode ?? '').trim()
            const label = String(c.display_name ?? c.name ?? c.color ?? c.value ?? 'Color').trim()
            const imgs = c.images
            const thumb =
                Array.isArray(imgs) && imgs[0] && String(imgs[0]).trim() ? String(imgs[0]).trim() : undefined
            const hex =
                typeof c.hexCode === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.hexCode) ? c.hexCode : undefined
            add({ key: key || label, label, thumbUrl: thumb, hex })
        }
        if (out.length > 0) return out
    }

    const cis = parseColorImagesField(product)
    if (cis) {
        for (const raw of cis) {
            const ci = raw as Record<string, unknown>
            const key = String(ci.color ?? '').trim()
            const label = String(ci.display_name ?? ci.name ?? ci.color ?? 'Color').trim()
            const imgs = ci.images
            const thumb =
                Array.isArray(imgs) && imgs[0] && String(imgs[0]).trim() ? String(imgs[0]).trim() : undefined
            const hex =
                typeof ci.hexCode === 'string' && /^#[0-9a-f]{3,8}$/i.test(ci.hexCode)
                    ? ci.hexCode
                    : undefined
            add({ key: key || label, label, thumbUrl: thumb, hex })
        }
    }

    if (out.length === 0) {
        const single = [p.frame_color, p.color, p.lens_color, p.lensColor].find(
            (x): x is string => typeof x === 'string' && x.trim() !== ''
        )
        if (single) {
            const s = single.trim()
            add({ key: s, label: s })
        }
    }

    return out
}

/** Human-readable segment: "eye-glasses" → "Eye Glasses" */
function formatCategorySegment(raw: string): string {
    const s = raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!s) return ''
    return s
        .split(/\s+/)
        .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
}

/**
 * Category › subcategory line: uses category.parent, nested subcategory helpers, deduped.
 * Order: root parent → sub-parent (from API) → leaf category name → subcategory name.
 */
function buildListingBreadcrumb(product: Product): string | null {
    const p = product as any
    const sub = normalizeProductSubcategory(product)
    const ordered: (string | null | undefined)[] = [
        p.category?.parent?.name,
        sub.parentName,
        p.category?.name,
        sub.name,
    ]
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of ordered) {
        if (!raw?.trim()) continue
        const seg = formatCategorySegment(String(raw))
        if (!seg) continue
        const key = seg.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(seg)
    }
    if (out.length === 0) return null
    return out.slice(0, 4).join(' > ')
}

function resolveListAndCurrentPrice(product: Product): {
    current: number
    compare: number | null
} {
    const numPrice = Number(product.price) || 0
    const numSale = product.sale_price != null ? Number(product.sale_price) : null
    const rawCompare = product.compare_at_price ?? product.original_price
    const numCompare =
        rawCompare != null && rawCompare !== ''
            ? Number(rawCompare)
            : null

    const hasSale = numSale != null && !isNaN(numSale) && numSale < numPrice
    const current = hasSale ? numSale! : numPrice
    let compare: number | null = null
    if (hasSale) {
        compare = numPrice
    } else if (numCompare != null && !isNaN(numCompare) && numCompare > current) {
        compare = numCompare
    }
    return { current, compare }
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { addToCart } = useCart()
    const [previewColorKey, setPreviewColorKey] = React.useState<string | null>(null)

    // Get calibers for this product (moved outside of functions for reuse)
    const p = product as any
    let calibers = []
    
    // Parse mm_calibers if it's a string or array
    if (p.mm_calibers) {
        try {
            if (typeof p.mm_calibers === 'string') {
                calibers = JSON.parse(p.mm_calibers)
            } else if (Array.isArray(p.mm_calibers)) {
                calibers = p.mm_calibers
            }
        } catch (error) {
            console.error('Error parsing mm_calibers:', error)
            calibers = []
        }
    }
    
    // Filter out blob URLs and get first valid caliber
    const validCalibers = calibers.filter((c: any) => 
        c && c.image_url && 
        !c.image_url.startsWith('blob:') && 
        c.image_url !== 'null' && 
        c.image_url !== ''
    )
    
    const firstCaliber = validCalibers.length > 0 ? validCalibers[0] : null

    const colorOptions = normalizeCardColors(product)
    const swatches = colorOptions.slice(0, MAX_SWATCHES)
    const moreColors = colorOptions.length - swatches.length

    const baseListingImage = React.useMemo(() => {
        let img = getProductImageUrl(product)
        if (firstCaliber && firstCaliber.image_url) {
            img = firstCaliber.image_url
        }
        return img
    }, [product, firstCaliber])

    const heroImage = React.useMemo(() => {
        if (previewColorKey) {
            const opt = colorOptions.find((o) => o.key === previewColorKey)
            if (opt?.thumbUrl) {
                return resolveThumbUrl(opt.thumbUrl)
            }
        }
        return baseListingImage
    }, [previewColorKey, colorOptions, baseListingImage])

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        try {
            const { current: finalPrice } = resolveListAndCurrentPrice(product)
            
            const cartProduct = {
                id: product?.id || 0,
                name: product?.name || '',
                brand: getShopProductBrandLabel(product) || '',
                category: product?.category?.slug || 'contact-lenses',
                price: finalPrice,
                image: heroImage,
                description: product?.description || '',
                inStock: product?.in_stock !== false,
                rating: product?.rating ? Number(product.rating) : undefined,
                caliber: firstCaliber?.mm,
                caliberImageUrl: firstCaliber?.image_url,
                type: 'main_product' as const,
                customization: {
                    selected_mm_caliber: firstCaliber?.mm,
                    caliber_image_url: firstCaliber?.image_url
                }
            }
            addToCart(cartProduct)
        } catch (error) {
            console.error('Error adding to cart:', error)
        }
    }

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(product)
    }

    const isOutOfStock = product.in_stock === false
    const hideAddToCartOnCard = isShopContactLensProduct(product)
    const { current: displayPrice, compare: comparePrice } = resolveListAndCurrentPrice(product)

    const brandLabel = getShopProductBrandLabel(product)
    const breadcrumb = buildListingBreadcrumb(product)

    return (
        <article
            className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md ${className}`}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                    <div className="flex h-full w-full items-center justify-center bg-transparent p-4 sm:p-5">
                        <img
                            src={heroImage}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            style={{ filter: 'drop-shadow(0 6px 20px rgba(15, 23, 42, 0.06))' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (import.meta.env.DEV) {
                                    console.error('Product image failed:', product.id, product.name, target.src)
                                }
                                target.src =
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDc1VjE3NUgxMjVWMTI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDEyNUgxNzVWMTc1SDIyNVYxMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMjUgMjI1SDc1VjI3NUgxMjVWMjI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDIyNUgxNzVWMjc1SDIyNVYyMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwSDE1MFYxNzVIMTAwVjE1MFoiIGZpbGw9IiNBMkEyQTQiLz4KPHRleHQgeD0iMTUwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='
                                target.onerror = null
                            }}
                        />
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:border-slate-300 hover:text-rose-600"
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {isInWishlist(product.id) ? (
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </button>

                {isOutOfStock && (
                    <div className="absolute left-3 top-3 z-10 rounded-md bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {t('shop.outOfStock')}
                    </div>
                )}

            </div>

            <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                {breadcrumb ? (
                    <p className="mb-1.5 line-clamp-1 text-[11px] leading-tight text-slate-400">{breadcrumb}</p>
                ) : null}
                <Link
                    to={`/shop/product/${product.slug || product.id}`}
                    className="mb-2 min-h-[2.35rem] flex-1"
                >
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
                        {product.name}
                    </h3>
                </Link>

                {swatches.length > 0 ? (
                    <div className="mb-3">
                        <p className="mb-1 text-[12px] text-slate-600">
                            <span className="font-medium text-slate-700">{t('shop.colors', 'Colors')}:</span>
                        </p>
                        <div
                            className="flex flex-wrap items-center gap-1.5"
                            role="list"
                            aria-label={t('shop.availableColors', 'Available colors')}
                            onMouseLeave={() => setPreviewColorKey(null)}
                        >
                            {swatches.map((opt) => {
                                const thumb = opt.thumbUrl ? resolveThumbUrl(opt.thumbUrl) : ''
                                const grad = !thumb ? gradientFromColorName(`${opt.label} ${opt.key}`) : null
                                const solid =
                                    opt.hex && /^#[0-9a-f]{3,8}$/i.test(opt.hex)
                                        ? opt.hex
                                        : !thumb && !grad
                                          ? solidFromColorName(`${opt.label} ${opt.key}`)
                                          : null
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        role="listitem"
                                        title={opt.label}
                                        onMouseEnter={() => setPreviewColorKey(opt.key)}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            const slug = product.slug || product.id
                                            navigate(
                                                `/shop/product/${slug}?color=${encodeURIComponent(opt.key)}`
                                            )
                                        }}
                                        className="h-6 w-6 shrink-0 cursor-pointer rounded-full border border-slate-200/90 bg-slate-100 shadow-sm ring-2 ring-white outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-blue-500"
                                        style={
                                            thumb
                                                ? {
                                                      backgroundImage: `url(${thumb})`,
                                                      backgroundSize: 'cover',
                                                      backgroundPosition: 'center',
                                                  }
                                                : grad
                                                  ? { backgroundImage: grad }
                                                  : { backgroundColor: solid || '#E2E8F0' }
                                        }
                                    />
                                )
                            })}
                            {moreColors > 0 ? (
                                <span className="pl-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                                    +{moreColors}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div
                    className={`mb-3 flex items-baseline gap-3 ${comparePrice != null ? 'justify-between' : ''}`}
                >
                    <span className="text-xl font-bold tabular-nums text-blue-600">€{displayPrice.toFixed(2)}</span>
                    {comparePrice != null ? (
                        <span className="text-sm tabular-nums text-slate-400 line-through">
                            €{comparePrice.toFixed(2)}
                        </span>
                    ) : null}
                </div>

                {brandLabel ? (
                    <p className="mb-3 text-[12px] text-slate-400">
                        {t('shop.byVendor', 'by')} <span className="text-slate-500">{brandLabel}</span>
                    </p>
                ) : null}

                {!hideAddToCartOnCard ? (
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`mt-auto w-full rounded-lg border py-2.5 text-sm font-semibold transition-all ${
                            isOutOfStock
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-blue-200 hover:bg-slate-50 active:scale-[0.99]'
                        }`}
                    >
                        {isOutOfStock ? t('shop.outOfStock') : t('shop.addToCart')}
                    </button>
                ) : null}
            </div>
        </article>
    )
}

export default ProductCard
