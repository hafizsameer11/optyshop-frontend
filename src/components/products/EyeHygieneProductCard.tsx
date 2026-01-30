import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWishlist } from '../../context/WishlistContext'
import { getProductImageUrl } from '../../utils/productImage'
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

    return (
        <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group ${className}`}>
            {/* Product Image */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                    <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDc1VjE3NUgxMjVWMTI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDEyNUgxNzVWMTc1SDIyNVYxMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMjUgMjI1SDc1VjI3NUgxMjVWMjI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDIyNUgxNzVWMjc1SDIyNVYyMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwSDE1MFYxNzVIMTAwVjE1MFoiIGZpbGw9IiNBMkEyQTQiLz4KPHA+PC9wPgo8L3N2Zz4='
                        }}
                    />
                </Link>

                {/* Heart Icon */}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm z-10"
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
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        {t('shop.outOfStock')}
                    </div>
                )}

                {/* Eye Hygiene Badge */}
                <div className="absolute bottom-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                    Eye Care
                </div>

                {/* Variants Badge */}
                {hasVariants && (
                    <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        {variants.length} Variants
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Product Name */}
                <Link to={`/shop/product/${product.slug || product.id}`} className="flex-1 mb-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {product.name}
                    </h3>
                </Link>

                {/* Eye Hygiene Specific Fields */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                        {product.size_volume && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Size:</span>
                                <span className="font-medium text-gray-900">{product.size_volume}</span>
                            </div>
                        )}
                        {product.pack_type && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Pack:</span>
                                <span className="font-medium text-gray-900">{product.pack_type}</span>
                            </div>
                        )}
                        {(product as any).expiry_date && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Expires:</span>
                                <span className="font-medium text-gray-900">
                                    {new Date((product as any).expiry_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Stock:</span>
                            <span className={`font-medium ${
                                (product.stock_quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {(product.stock_quantity || 0)} available
                            </span>
                        </div>
                    </div>
                </div>

                {/* Variants Preview */}
                {hasVariants && (
                    <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Available variants:</div>
                        <div className="flex flex-wrap gap-1">
                            {variants.slice(0, 2).map((variant: any, index: number) => (
                                <span 
                                    key={index}
                                    className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                    {variant.size_volume} {variant.pack_type}
                                </span>
                            ))}
                            {variants.length > 2 && (
                                <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                    +{variants.length - 2} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Price */}
                <div className="mb-4">
                    {product.sale_price && Number(product.sale_price) < Number(product.price) ? (
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                                €{Number(product.sale_price).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                                €{Number(product.price).toFixed(2)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-lg font-bold text-gray-900">
                            €{Number(product.price).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCartClick}
                    disabled={isOutOfStock}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                        isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    {isOutOfStock ? t('shop.outOfStock') : t('shop.addToCart')}
                </button>
            </div>
        </div>
    )
}

export default EyeHygieneProductCard
