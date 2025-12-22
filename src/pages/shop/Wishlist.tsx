import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useWishlist } from '../../context/WishlistContext'
import { getProductImageUrl } from '../../utils/productImage'
import { useCart } from '../../context/CartContext'

const Wishlist: React.FC = () => {
    const { t } = useTranslation()
    const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlist()
    const { addToCart } = useCart()

    const handleAddToCart = (product: any) => {
        addToCart({
            id: product.id,
            name: product.name,
            brand: product.brand || '',
            category: product.category?.name || '',
            price: Number(product.price || 0),
            image: getProductImageUrl(product),
            description: product.description || '',
            inStock: product.in_stock !== false
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8 mt-20">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('shop.wishlist', 'My Wishlist')}
                    </h1>
                    <p className="text-gray-600">
                        {wishlistItems.length} {wishlistItems.length === 1 ? t('shop.item', 'item') : t('shop.items', 'items')}
                    </p>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            {t('shop.wishlistEmpty', 'Your wishlist is empty')}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {t('shop.wishlistEmptyDescription', 'Start adding products you love to your wishlist')}
                        </p>
                        <Link
                            to="/shop"
                            className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors"
                        >
                            {t('shop.continueShopping', 'Continue Shopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistItems.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 flex flex-col group"
                            >
                                {/* Product Image */}
                                <div className="relative h-64 md:h-72 bg-white overflow-hidden">
                                    <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                                        <img
                                            src={getProductImageUrl(product)}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                    </Link>
                                    
                                    {/* Remove from Wishlist Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            removeFromWishlist(product.id)
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 z-20 transition-all"
                                        title={t('shop.removeFromWishlist', 'Remove from wishlist')}
                                    >
                                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="p-4 flex-grow flex flex-col">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    
                                    {product.sku && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            {product.sku}
                                        </p>
                                    )}

                                    {/* Price */}
                                    <div className="mt-auto pt-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xl font-bold text-gray-900">
                                                €{Number(product.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        
                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            {t('shop.addToCart', 'Add to Cart')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

export default Wishlist

