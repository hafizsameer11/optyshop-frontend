import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { getProductImageUrl } from '../../utils/productImage'
import type { Product, MMCaliber } from '../../services/productsService'

interface ProductCardProps {
    product: Product
    className?: string
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
    const { t } = useTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { addToCart } = useCart()

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        try {
            const salePrice = product?.sale_price ? Number(product.sale_price) : null
            const regularPrice = product?.price ? Number(product.price) : 0
            const finalPrice = salePrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product?.id || 0,
                name: product?.name || '',
                brand: product?.brand || '',
                category: product?.category?.slug || 'contact-lenses',
                price: finalPrice,
                image: getProductImageUrl(product),
                description: product?.description || '',
                inStock: product?.in_stock !== false,
                rating: product?.rating ? Number(product.rating) : undefined
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

    // Get calibers for this product (if available)
    const getCalibers = (): MMCaliber[] => {
        const p = product as any
        const calibers = p.mm_calibers
        return Array.isArray(calibers) ? calibers : []
    }

    const calibers = getCalibers()
    const hasCalibers = calibers && calibers.length > 0

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

                {/* Sale Badge */}
                {product.sale_price && Number(product.sale_price) < Number(product.price) && (
                    <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        Sale
                    </div>
                )}

                {/* Caliber Badge - Show if product has calibers */}
                {hasCalibers && (
                    <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        {calibers.length} Sizes
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

                {/* Caliber Sizes - Show available calibers if product has them */}
                {hasCalibers && (
                    <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Available sizes:</div>
                        <div className="flex flex-wrap gap-1">
                            {calibers.slice(0, 3).map((caliber, index) => (
                                <span 
                                    key={index}
                                    className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                    {caliber.mm}mm
                                </span>
                            ))}
                            {calibers.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                    +{calibers.length - 3} more
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
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                        isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    {isOutOfStock ? t('shop.outOfStock') : t('shop.addToCart')}
                </button>
            </div>
        </div>
    )
}

export default ProductCard
