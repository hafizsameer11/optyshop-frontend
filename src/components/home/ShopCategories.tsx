import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, type Category } from '../../services/categoriesService'
import { getProducts, type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { useTranslation } from 'react-i18next'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import VirtualTryOnModal from './VirtualTryOnModal'
import { useWishlist } from '../../context/WishlistContext'

interface CategoryWithProducts extends Category {
    fetchedProducts?: Product[]
}

const ShopCategories: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const [categories, setCategories] = useState<CategoryWithProducts[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null)
    const [showTryOnModal, setShowTryOnModal] = useState(false)
    const [productColorSelections, setProductColorSelections] = useState<Record<number, string>>({})

    // Helper function to check if product is glasses (including sunglasses, optyglasses, kids glasses, etc.)
    // Detects glasses by: name/category keywords, color_images (glasses typically have multiple colors), 
    // and image patterns (glasses images usually contain "frame" or "glasses" in URL)
    const isGlassesProduct = (product: any): boolean => {
        const categoryName = product.category?.name?.toLowerCase() || ''
        const categorySlug = product.category?.slug?.toLowerCase() || ''
        const productName = (product.name || '').toLowerCase()
        const isApiProduct = 'image' in product || 'image_url' in product || 'images' in product
        const productImage = isApiProduct
            ? getProductImageUrl(product as Product).toLowerCase()
            : getImageUrl(product as Category['products'][0]).toLowerCase()
        
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
        const hasColorImages = Boolean((product as any).color_images && (product as any).color_images.length > 0)
        
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
        
        const fetchCategoriesAndProducts = async () => {
            try {
                setLoading(true)
                // Fetch categories with products included from API (includeProducts=true)
                const fetchedCategories = await getCategories({ includeProducts: true })
                
                if (isCancelled) return
                
                // Limit to first 6 categories to prevent too many API calls
                const limitedCategories = fetchedCategories.slice(0, 6)
                
                // Use products that come with categories API, only fetch additional if needed
                const categoriesWithProducts = limitedCategories.map((category) => {
                    // Use products from category if available, otherwise empty array
                    const categoryProducts = category.products || []
                    
                    // Only fetch additional products if category has less than 4 products
                    // and we need more for display
                    if (categoryProducts.length < 4) {
                        // Don't fetch here - just use what we have
                        // This prevents excessive API calls
                    }
                    
                    return {
                        ...category,
                        fetchedProducts: categoryProducts,
                        products: categoryProducts
                    } as CategoryWithProducts
                })
                
                if (isCancelled) return
                
                // Filter to only show categories that have products
                const categoriesWithAnyProducts = categoriesWithProducts.filter(
                    cat => (cat.products && cat.products.length > 0) || (cat.fetchedProducts && cat.fetchedProducts.length > 0)
                )
                
                setCategories(categoriesWithAnyProducts)
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching categories:', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }
        
        fetchCategoriesAndProducts()
        
        return () => {
            isCancelled = true
        }
    }, [])

    // Helper function to parse product images
    const getProductImages = (product: Category['products'][0]): string[] => {
        if (!product.images) return []
        try {
            const parsed = JSON.parse(product.images)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return product.images ? [product.images] : []
        }
    }

    // Helper function to get product image URL
    const getImageUrl = (product: Category['products'][0]): string => {
        const images = getProductImages(product)
        if (images.length > 0 && images[0]) {
            return images[0]
        }
        return '/assets/images/frame1.png'
    }

    if (loading) {
        return (
            <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                        <p className="mt-4 text-lg text-gray-600">Loading categories...</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-white py-12 md:py-16 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                    Shop Categories
                </h2>
                
                {categories.length > 0 ? (
                    <div className="space-y-16">
                        {categories.map((category) => (
                            <div key={category.id} className="category-section">
                                {/* Category Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                            {translateCategory(category)}
                                        </h3>
                                        {category.description && (
                                            <p className="text-gray-600">{category.description}</p>
                                        )}
                                    </div>
                                    <Link
                                        to={`/category/${category.slug}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base flex items-center gap-2 transition-colors"
                                    >
                                        {t('navbar.viewAll')}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Products Grid */}
                                {(() => {
                                    // Get products from either category.products or fetchedProducts
                                    const productsToShow = (category.products && category.products.length > 0) 
                                        ? category.products 
                                        : (category.fetchedProducts || [])
                                    
                                    if (productsToShow.length === 0) {
                                        return <p className="text-gray-500 text-center py-8">No products available in this category</p>
                                    }
                                    
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                            {productsToShow.map((product) => {
                                                // Handle both API product format (Product) and category product format (CategoryProduct)
                                                const isApiProduct = 'image' in product || 'image_url' in product || 'images' in product
                                                const productAsProduct = product as any as Product
                                                // Get selected color or default to first color if available
                                                let selectedColor = productColorSelections[product.id]
                                                const productColorImages = (product as any).color_images || productAsProduct.color_images
                                                if (!selectedColor && productColorImages && productColorImages.length > 0) {
                                                    selectedColor = productColorImages[0].color
                                                    // Set default selection if not already set
                                                    if (!productColorSelections[product.id]) {
                                                        setProductColorSelections(prev => ({
                                                            ...prev,
                                                            [product.id]: selectedColor
                                                        }))
                                                    }
                                                }
                                                
                                                // Get image URL based on selected color
                                                const productImageUrl = selectedColor && productColorImages
                                                    ? (() => {
                                                        // Case-insensitive color matching
                                                        const colorImage = productColorImages.find((ci: any) => 
                                                            ci.color.toLowerCase() === selectedColor.toLowerCase()
                                                        )
                                                        return colorImage?.images?.[0] || (isApiProduct ? getProductImageUrl(productAsProduct) : getImageUrl(product as Category['products'][0]))
                                                    })()
                                                    : (isApiProduct ? getProductImageUrl(productAsProduct) : getImageUrl(product as Category['products'][0]))
                                                const productName = (product as any).name || product.name
                                                const productPrice = (product as any).price || product.price || '0'
                                                const productSlug = (product as any).slug || (product as any).id || product.id
                                                const productSku = (product as any).sku
                                                const productReviewCount = (product as any).review_count
                                                
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 flex flex-col group"
                                                    >
                                                        {/* Product Image */}
                                                        <div className="relative h-64 md:h-72 bg-white overflow-hidden">
                                                            <Link to={`/shop/product/${productSlug}`} className="block h-full">
                                                            <img
                                                                    src={productImageUrl}
                                                                    key={`${product.id}-${selectedColor || 'default'}`}
                                                                alt={productName}
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
                                                                    toggleWishlist(productAsProduct)
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
                                                        </div>
                                                        
                                                        {/* Product Info */}
                                                        <div className="p-4 flex-grow flex flex-col">
                                                            {/* Color Swatches - Below Image - Only for Glasses */}
                                                            {isGlassesProduct(product) && productColorImages && productColorImages.length > 0 && (
                                                                <div className="mb-3 flex gap-2 flex-wrap items-center justify-center">
                                                                    {productColorImages.map((colorImage: any, index: number) => {
                                                                        // Enhanced color detection with support for patterns and gradients
                                                                        const colorName = colorImage.color.toLowerCase()
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
                                                                {productSku && (
                                                                    <p className="text-xs text-gray-500 font-semibold">
                                                                        {productSku}
                                                                    </p>
                                                                )}
                                                                {!productSku && <div />}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        toggleWishlist(productAsProduct)
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
                                                                        setSelectedProductForTryOn(productAsProduct)
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
                                                                        €{parseFloat(productPrice).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                {/* Reviews Count */}
                                                                {productReviewCount !== undefined && productReviewCount > 0 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        {productReviewCount} {t('shop.reviews', 'Reviews')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })()}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Fallback: Show category buttons if no products
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        <Link
                            to="/shop"
                            className="px-6 py-3 bg-blue-950 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 text-sm md:text-base"
                        >
                            {t('navbar.eyeglasses')}
                        </Link>
                        <Link
                            to="/shop"
                            className="px-6 py-3 bg-blue-950 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 text-sm md:text-base"
                        >
                            {t('navbar.sunglasses')}
                        </Link>
                    </div>
                )}
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

export default ShopCategories

