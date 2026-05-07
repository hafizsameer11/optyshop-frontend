import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWishlist } from '../../context/WishlistContext'
import { getProductImageUrl } from '../../utils/productImage'
import { getShopProductBrandLabel } from '../../utils/productDisplayName'
import type { Product } from '../../services/productsService'

interface EyeHygieneProductCardProps {
    product: Product
    onAddToCart: (product: Product, variant?: any) => void
    className?: string
}

const EyeHygieneProductCard: React.FC<EyeHygieneProductCardProps> = ({ 
    product, 
    onAddToCart, 
    className = '' 
}) => {
    const { t } = useTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(product)
    }

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onAddToCart(product)
    }

    const isOutOfStock = product.in_stock === false

    // Get variants for this product (if available)
    const getVariants = () => {
        const p = product as any
        const variants = p.eyeHygieneVariants || p.size_volume_variants || []
        return Array.isArray(variants) ? variants : []
    }

    const variants = getVariants()
    const hasVariants = variants && variants.length > 0
    const brandLabel = getShopProductBrandLabel(product)

    return (
        <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group ${className}`}>
            {/* Product Image */}
            <div className="relative aspect-[5/4] bg-white overflow-hidden">
                <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                    <div className="relative w-full h-full flex items-center justify-center p-3 bg-white">
                        <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDc1VjE3NUgxMjVWMTI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDEyNUgxNzVWMTc1SDIyNVYxMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMjUgMjI1SDc1VjI3NUgxMjVWMjI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDIyNUgxNzVWMjc1SDIyNVYyMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwSDE1MFYxNzVIMTAwVjE1MFoiIGZpbGw9IiNBMkEyQTQiLz4KPHRleHQgeD0iMTUwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='
                            }}
                        />
                    </div>
                </Link>

                {/* Heart Icon */}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-md z-10"
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

                {/* Out of Stock Badge */}
                {isOutOfStock && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                        {t('shop.outOfStock')}
                    </div>
                )}

                {/* Eye Hygiene Badge */}
                <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] font-semibold z-10">
                    Eye Care
                </div>

                {/* Variants Badge */}
                {hasVariants && (
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-semibold z-10">
                        {variants.length} Variants
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="px-3 pt-2 pb-3 flex-1 flex flex-col">
                {/* Product Name */}
                <Link to={`/shop/product/${product.slug || product.id}`} className="mb-1.5">
                    <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors leading-snug">
                        {product.name}
                    </h3>
                </Link>

                {/* Brand + Price (inline) */}
                <div className="mb-2 flex items-center justify-between gap-2">
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

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCartClick}
                    disabled={isOutOfStock}
                    className={`mt-auto w-full rounded-md border py-1.5 text-[12px] font-semibold transition-all ${
                        isOutOfStock
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                            : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-blue-200 hover:bg-slate-50 active:scale-[0.99]'
                    }`}
                >
                    {isOutOfStock ? t('shop.outOfStock') : t('shop.addToCart')}
                </button>
            </div>
        </div>
    )
}

export default EyeHygieneProductCard
