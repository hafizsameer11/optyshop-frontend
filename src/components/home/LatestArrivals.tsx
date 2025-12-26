import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from './VirtualTryOnModal'
import { useWishlist } from '../../context/WishlistContext'

const LatestArrivals: React.FC = () => {
    const { t } = useTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null)
    const [showTryOnModal, setShowTryOnModal] = useState(false)
    const [productColorSelections, setProductColorSelections] = useState<Record<number, string>>({})

    // Helper function to check if product is glasses (including sunglasses, optyglasses, kids glasses, etc.)
    // Detects glasses by: name/category keywords, color_images (glasses typically have multiple colors), 
    // and image patterns (glasses images usually contain "frame" or "glasses" in URL)
    const isGlassesProduct = (product: Product): boolean => {
        const categoryName = product.category?.name?.toLowerCase() || ''
        const categorySlug = product.category?.slug?.toLowerCase() || ''
        const productName = product.name?.toLowerCase() || ''
        const productImage = getProductImageUrl(product).toLowerCase()
        
        // Check for Opty Kids category (kids glasses)
        const isOptyKids = categoryName.includes('opty kids') || 
                          categorySlug.includes('opty-kids') ||
                          categorySlug.includes('optykids') ||
                          categorySlug.includes('opty_kids') ||
                          categoryName.includes('optykids')
        
        // Check if "glasses" appears anywhere in the name or category (includes sunglasses, optyglasses, kids glasses, etc.)
        const hasGlassesKeyword = categoryName.includes('glasses') || 
                                  categorySlug.includes('glasses') ||
                                  productName.includes('glasses') ||
                                  categoryName.includes('occhiali') || 
                                  categorySlug.includes('occhiali') ||
                                  productName.includes('occhiali') ||
                                  categoryName.includes('frame') || 
                                  categorySlug.includes('frame') ||
                                  productName.includes('frame') ||
                                  categoryName.includes('eyewear') || 
                                  categorySlug.includes('eyewear') ||
                                  productName.includes('eyewear')
        
        // Check for kids glasses (kids + glasses keywords)
        const isKidsGlasses = (categoryName.includes('kids') || categorySlug.includes('kids') || productName.includes('kids')) &&
                             (hasGlassesKeyword || categoryName.includes('occhiali') || categorySlug.includes('occhiali'))
        
        // Check if product has color_images (glasses typically have multiple color options)
        const hasColorImages = Boolean(product.color_images && product.color_images.length > 0)
        
        // Check if image URL suggests glasses (contains "frame" or "glasses" in path)
        const imageSuggestsGlasses = productImage.includes('frame') || 
                                     productImage.includes('glasses') ||
                                     productImage.includes('occhiali')
        
        // If product has color images, it's likely glasses (glasses have color variations)
        // OR if it has glasses keywords in name/category
        // OR if image URL suggests glasses
        // OR if it's Opty Kids or kids glasses
        return hasGlassesKeyword || 
               isOptyKids || 
               isKidsGlasses ||
               (hasColorImages && imageSuggestsGlasses) || 
               (hasColorImages && !productName.includes('contact') && !categoryName.includes('contact'))
    }

    useEffect(() => {
        let isCancelled = false
        
        const fetchLatestProducts = async () => {
            try {
                setLoading(true)
                const result = await getProducts({
                    page: 1,
                    limit: 4,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                })
                if (isCancelled) return
                
                if (result) {
                    setProducts(result.products)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching latest products:', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }
        fetchLatestProducts()
        
        return () => {
            isCancelled = true
        }
    }, [])

    if (loading) {
        return (
            <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('home.latestArrivals.title')}</h2>
                    <div className="text-center py-8">{t('common.loading')}</div>
                </div>
            </section>
        )
    }

    if (products.length === 0) {
        return null
    }

    return (
        <section className="bg-gray-50 py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('home.latestArrivals.title')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => {
                        // Get selected color or default to first color if available
                        let selectedColor = productColorSelections[product.id]
                        if (!selectedColor && product.color_images && product.color_images.length > 0) {
                            selectedColor = product.color_images[0].color
                            // Set default selection if not already set
                            if (!productColorSelections[product.id]) {
                                setProductColorSelections(prev => ({
                                    ...prev,
                                    [product.id]: selectedColor
                                }))
                            }
                        }
                        
                        // Get image URL based on selected color
                        const productImageUrl = selectedColor && product.color_images
                            ? (() => {
                                // Case-insensitive color matching
                                const selectedColorLower = (selectedColor || '').toLowerCase()
                                const colorImage = product.color_images.find(ci => 
                                    ci.color && ci.color.toLowerCase() === selectedColorLower
                                )
                                return colorImage?.images?.[0] || getProductImageUrl(product)
                            })()
                            : getProductImageUrl(product)
                        
                        return (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 flex flex-col group"
                        >
                            {/* Product Image */}
                            <div className="relative h-64 md:h-72 bg-white overflow-hidden">
                                <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                                <img
                                        src={productImageUrl}
                                        key={`${product.id}-${selectedColor || 'default'}`}
                                    alt={product.name}
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-all duration-300"
                                        style={{ transition: 'opacity 0.3s ease-in-out' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/assets/images/frame1.png'
                                    }}
                                />
                                </Link>
                                
                                {/* Favorite/Wishlist Icon - Always Visible */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleWishlist(product)
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 z-20 transition-all"
                                    title={isInWishlist(product.id) ? t('shop.removeFromWishlist', 'Remove from wishlist') : t('shop.addToWishlist', 'Add to wishlist')}
                                >
                                    {isInWishlist(product.id) ? (
                                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    )}
                                </button>
                                {(() => {
                                    const p = product as any
                                    const stockStatus = p.stock_status
                                    const stockQty = product.stock_quantity
                                    
                                    const isOutOfStock = 
                                        stockStatus === 'out_of_stock' ||
                                        (stockStatus !== 'in_stock' && stockStatus !== undefined && stockQty !== undefined && stockQty <= 0) ||
                                        (stockStatus === undefined && product.in_stock === false) ||
                                        (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                    
                                    return isOutOfStock ? (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                                            {t('shop.outOfStock')}
                                        </div>
                                    ) : null
                                })()}
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-4 flex-grow flex flex-col">
                                {/* Color Swatches - Below Image - Only for Glasses */}
                                {isGlassesProduct(product) && product.color_images && product.color_images.length > 0 && (
                                    <div className="mb-3 flex gap-2 flex-wrap items-center justify-center">
                                        {product.color_images.map((colorImage, index) => {
                                            // Enhanced color detection with support for patterns and gradients
                                            const colorName = (colorImage.color || '').toLowerCase()
                                            const getColorValue = () => {
                                                // Check for hex code first
                                                if (colorName.match(/^#[0-9a-f]{6}$/i)) return colorName
                                                
                                                // Solid colors
                                                if (colorName.includes('black') || colorName === 'nero') return '#000000'
                                                if (colorName.includes('brown') || colorName.includes('tortoise') || colorName.includes('tortoiseshell')) return '#8B4513'
                                                if (colorName.includes('red') || colorName === 'rosso') return '#DC143C'
                                                if (colorName.includes('pink') || colorName === 'rosa') return '#FFC0CB'
                                                if (colorName.includes('green') || colorName === 'verde') return '#228B22'
                                                if (colorName.includes('blue') || colorName === 'blu') return '#4169E1'
                                                if (colorName.includes('purple') || colorName === 'viola') return '#9370DB'
                                                if (colorName.includes('white') || colorName === 'bianco') return '#FFFFFF'
                                                if (colorName.includes('yellow') || colorName === 'giallo') return '#FFD700'
                                                if (colorName.includes('gray') || colorName.includes('grey')) return '#808080'
                                                if (colorName.includes('gold')) return '#FFD700'
                                                if (colorName.includes('silver')) return '#C0C0C0'
                                                if (colorName.includes('beige') || colorName.includes('tan')) return '#F5DEB3'
                                                if (colorName.includes('navy')) return '#000080'
                                                if (colorName.includes('burgundy') || colorName.includes('wine')) return '#800020'
                                                if (colorName.includes('coral')) return '#FF7F50'
                                                if (colorName.includes('teal')) return '#008080'
                                                if (colorName.includes('orange')) return '#FFA500'
                                                
                                                return '#E5E5E5' // Default gray
                                            }
                                            
                                            // Check if it's a pattern (tortoiseshell, gradient, etc.)
                                            const isPattern = colorName.includes('tortoise') || 
                                                             colorName.includes('tortoiseshell') ||
                                                             colorName.includes('gradient') ||
                                                             colorName.includes('rainbow') ||
                                                             colorName.includes('pattern')
                                            
                                            // Get gradient style for patterns
                                            const getGradientStyle = () => {
                                                if (colorName.includes('tortoise') || colorName.includes('tortoiseshell')) {
                                                    return 'linear-gradient(135deg, #8B4513 0%, #D2691E 25%, #CD853F 50%, #8B4513 75%, #654321 100%)'
                                                }
                                                if (colorName.includes('pink') && colorName.includes('gradient')) {
                                                    return 'linear-gradient(135deg, #FFC0CB 0%, #FF69B4 50%, #FF1493 100%)'
                                                }
                                                if (colorName.includes('purple') && colorName.includes('gradient')) {
                                                    return 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 50%, #4B0082 100%)'
                                                }
                                                if (colorName.includes('rainbow')) {
                                                    return 'linear-gradient(90deg, #FF0000 0%, #FF7F00 14%, #FFFF00 28%, #00FF00 42%, #0000FF 57%, #4B0082 71%, #9400D3 85%, #FF0000 100%)'
                                                }
                                                return null
                                            }
                                            
                                            const gradientStyle = isPattern ? getGradientStyle() : null
                                            const isSelected = selectedColor === colorImage.color
                                            
                                            return (
                                                <button
                                                    key={`${product.id}-${index}-${colorImage.color}`}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setProductColorSelections(prev => ({
                                                            ...prev,
                                                            [product.id]: colorImage.color
                                                        }))
                                                    }}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                                                        isSelected
                                                            ? 'border-blue-600 scale-110 ring-2 ring-blue-200 shadow-md'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                    style={{
                                                        backgroundColor: gradientStyle ? 'transparent' : getColorValue(),
                                                        backgroundImage: gradientStyle || undefined,
                                                        borderColor: isSelected ? '#2563EB' : undefined,
                                                        backgroundSize: gradientStyle ? 'cover' : undefined,
                                                    }}
                                                    title={colorImage.color}
                                                    aria-label={`Select color ${colorImage.color}`}
                                                >
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Model Number and Heart Icon - Same Row */}
                                <div className="flex items-center justify-between mb-2">
                                    {product.sku && (
                                        <p className="text-xs text-gray-500 font-semibold">
                                            {product.sku}
                                        </p>
                                    )}
                                    {!product.sku && <div />}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleWishlist(product)
                                        }}
                                        className="w-6 h-6 flex items-center justify-center hover:text-red-500 transition-colors"
                                        title={isInWishlist(product.id) ? t('shop.removeFromWishlist', 'Remove from wishlist') : t('shop.addToWishlist', 'Add to wishlist')}
                                    >
                                        {isInWishlist(product.id) ? (
                                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Try On Button - Only for Glasses */}
                                {isGlassesProduct(product) && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSelectedProductForTryOn(product)
                                            setShowTryOnModal(true)
                                        }}
                                        className="mb-3 w-full border-2 border-blue-500 bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-md font-semibold text-sm transition-colors"
                                    >
                                        {t('shop.tryOn', 'Try on')}
                                    </button>
                                )}

                                {/* Price and Reviews - Same Row */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-gray-900">
                                            €{Number(product.price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {/* Reviews Count */}
                                    {product.review_count !== undefined && product.review_count > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {product.review_count} {t('shop.reviews', 'Reviews')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Virtual Try-On Modal */}
            <VirtualTryOnModal
                open={showTryOnModal}
                onClose={() => setShowTryOnModal(false)}
                selectedProduct={selectedProductForTryOn}
            />
        </section>
    )
}

export default LatestArrivals

