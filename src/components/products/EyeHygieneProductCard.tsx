import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWishlist } from '../../context/WishlistContext'
import { getProductImageUrl } from '../../utils/productImage'
import { getShopProductBrandLabel } from '../../utils/productDisplayName'
import type { Product } from '../../services/productsService'
import { isOutOfStock as checkOutOfStock } from '../../utils/stock'

interface EyeHygieneProductCardProps {
    product: Product
    /** Optional — kept for backwards compatibility. The card no longer renders an Add to Cart button. */
    onAddToCart?: (product: Product, variant?: any) => void
    className?: string
}

const EyeHygieneProductCard: React.FC<EyeHygieneProductCardProps> = ({
    product,
    className = ''
}) => {
    const { t } = useTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(product)
    }

    const isOutOfStock = checkOutOfStock(product as any)

    const getVariants = () => {
        const p = product as any
        const variants = p.eyeHygieneVariants || p.size_volume_variants || []
        return Array.isArray(variants) ? variants : []
    }

    const variants = getVariants()
    const hasVariants = variants && variants.length > 0
    const brandLabel = getShopProductBrandLabel(product)

    return (
        <article className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md ${className}`}>
            <div className="relative aspect-[5/4] overflow-hidden bg-white">
                <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                    <div className="flex h-full w-full items-center justify-center bg-white p-3 sm:p-4">
                        <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            style={{ filter: 'drop-shadow(0 4px 12px rgba(15, 23, 42, 0.05))' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDc1VjE3NUgxMjVWMTI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDEyNUgxNzVWMTc1SDIyNVYxMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMjUgMjI1SDc1VjI3NUgxMjVWMjI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDIyNUgxNzVWMjc1SDIyNVYyMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwSDE1MFYxNzVIMTAwVjE1MFoiIGZpbGw9IiNBMkEyQTQiLz4KPHRleHQgeD0iMTUwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='
                            }}
                        />
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:border-slate-300 hover:text-rose-600"
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {isInWishlist(product.id) ? (
                        <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </button>

                {isOutOfStock && (
                    <div className="absolute left-2 top-2 z-10 rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {t('shop.outOfStock')}
                    </div>
                )}

                {hasVariants && (
                    <div className="absolute bottom-2 right-2 z-10 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {variants.length} Variants
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-3.5 sm:pb-3 sm:pt-2.5">
                <Link
                    to={`/shop/product/${product.slug || product.id}`}
                    className="mb-1.5"
                >
                    <h3 className="line-clamp-1 text-[13px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
                        {product.name}
                    </h3>
                </Link>

                <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[10px] text-slate-500">
                        {brandLabel ? `${t('shop.byVendor', 'by')} ${brandLabel}` : ''}
                    </span>
                    <div className="flex shrink-0 items-baseline gap-1.5">
                        {product.sale_price && Number(product.sale_price) < Number(product.price) ? (
                            <>
                                <span className="text-[15px] font-bold tabular-nums text-blue-600">
                                    €{Number(product.sale_price).toFixed(2)}
                                </span>
                                <span className="text-[11px] tabular-nums text-slate-400 line-through">
                                    €{Number(product.price).toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[15px] font-bold tabular-nums text-blue-600">
                                €{Number(product.price).toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}

export default EyeHygieneProductCard
