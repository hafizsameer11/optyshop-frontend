import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProducts, type Product, type MMCaliber } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getProductDisplayName } from '../../utils/productDisplayName'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { addItemToCart } from '../../services/cartService'

const LatestArrivals: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [productColorSelections, setProductColorSelections] = useState<Record<number, string>>({})
    /** While pointer is over a swatch, preview that color’s image only (no cycling). */
    const [hoverPreviewColor, setHoverPreviewColor] = useState<Partial<Record<number, string>>>({})

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

    // Initialize default color selections when products change
    useEffect(() => {
        if (products.length === 0) return
        
        const newSelections: Record<number, string> = {}
        let hasChanges = false
        
        products.forEach(product => {
            if (!productColorSelections[product.id]) {
                const p = product as any
                // Prefer colors array, fallback to color_images
                if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
                    const firstColor = p.colors[0]
                    newSelections[product.id] = firstColor.value || firstColor.hexCode || firstColor.color || firstColor.name
                    hasChanges = true
                } else if (product.color_images && product.color_images.length > 0) {
                    newSelections[product.id] = product.color_images[0].color
                    hasChanges = true
                }
            }
        })
        
        if (hasChanges) {
            setProductColorSelections(prev => ({
                ...prev,
                ...newSelections
            }))
        }
    }, [products]) // Only depend on products, not productColorSelections
    
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
                        const p = product as any
                        const displayName = getProductDisplayName(product)
                        // Get available colors - prefer 'colors' array, fallback to 'color_images'
                        const colorsArray = (p.colors && Array.isArray(p.colors) && p.colors.length > 0)
                            ? p.colors
                            : (product.color_images && product.color_images.length > 0
                                ? product.color_images.map((ci: any) => ({
                                    value: ci.value || ci.color,
                                    hexCode: ci.hexCode || '#E5E5E5',
                                    display_name: ci.display_name || ci.name || ci.color,
                                    color: ci.color,
                                    images: ci.images || []
                                }))
                                : [])
                        
                        // Get calibers for this product (if available)
                        const getCalibers = (): MMCaliber[] => {
                            const calibers = p.mm_calibers
                            return Array.isArray(calibers) ? calibers : []
                        }

                        const calibers = getCalibers()
                        const hasCalibers = calibers && calibers.length > 0
                        
                        // Get selected color or default to first color if available
                        const selectedColor = productColorSelections[product.id] || 
                            (colorsArray.length > 0 
                                ? (colorsArray[0].value || colorsArray[0].color || colorsArray[0].hexCode)
                                : null)
                        
                        const previewHue = hoverPreviewColor[product.id]
                        const activeColorForImage =
                            previewHue != null && previewHue !== '' ? previewHue : selectedColor

                        // Get image URL for the active (hovered or selected) color only — no cycling
                        const productImageUrl = activeColorForImage && colorsArray.length > 0
                            ? (() => {
                                const displayColorLower = (activeColorForImage || '').toLowerCase()
                                const colorData = colorsArray.find((c: any) =>
                                    (c.value && c.value.toLowerCase() === displayColorLower) ||
                                    (c.color && c.color.toLowerCase() === displayColorLower) ||
                                    (c.hexCode && c.hexCode.toLowerCase() === displayColorLower)
                                )
                                if (colorData && colorData.images && Array.isArray(colorData.images) && colorData.images.length > 0) {
                                    return colorData.images[0]
                                }
                                if (product.color_images) {
                                    const colorImage = product.color_images.find((ci: any) =>
                                        (ci.color && ci.color.toLowerCase() === displayColorLower) ||
                                        (ci.name && ci.name.toLowerCase() === displayColorLower)
                                    )
                                    return colorImage?.images?.[0] || getProductImageUrl(product)
                                }
                                return getProductImageUrl(product)
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
                                        key={`${product.id}-${activeColorForImage || 'default'}`}
                                    alt={displayName || 'Product'}
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
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

                                {/* Caliber Badge - Show if product has calibers */}
                                {hasCalibers && (
                                    <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                                        {calibers.length} Sizes
                                    </div>
                                )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-4 flex-grow flex flex-col">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            to={`/shop/product/${product.slug || product.id}`}
                                            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                                        >
                                            <h3 className="text-left text-sm sm:text-base font-semibold leading-snug text-gray-900 line-clamp-2 hover:text-blue-800 transition-colors">
                                                {displayName || t('shop.viewDetails', 'View product')}
                                            </h3>
                                        </Link>
                                        {product.sku ? (
                                            <p className="mt-1 text-xs font-medium text-gray-500 tabular-nums">{product.sku}</p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleWishlist(product)
                                        }}
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                        title={
                                            isInWishlist(product.id)
                                                ? t('shop.removeFromWishlist', 'Remove from wishlist')
                                                : t('shop.addToWishlist', 'Add to wishlist')
                                        }
                                    >
                                        {isInWishlist(product.id) ? (
                                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Color Swatches - Below Image - Only for Glasses */}
                                {isGlassesProduct(product) && colorsArray.length > 0 && (
                                    <div
                                        className="mb-3 flex gap-2 flex-wrap items-center justify-center"
                                        onMouseLeave={() => {
                                            setHoverPreviewColor((prev) => {
                                                const next = { ...prev }
                                                delete next[product.id]
                                                return next
                                            })
                                        }}
                                    >
                                        {colorsArray.map((colorData: any, index: number) => {
                                            const colorValue = colorData.value || colorData.color || colorData.hexCode
                                            const hexCode = colorData.hexCode || '#E5E5E5'
                                            const displayName = colorData.display_name || colorData.name || colorData.color || 'Color'
                                            
                                            // Check if it's a pattern (tortoiseshell, gradient, etc.)
                                            const colorName = (displayName || '').toLowerCase()
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
                                            const isSelected = selectedColor && (
                                                (colorValue && colorValue.toLowerCase() === selectedColor.toLowerCase()) ||
                                                (colorData.color && colorData.color.toLowerCase() === selectedColor.toLowerCase()) ||
                                                (hexCode && hexCode.toLowerCase() === selectedColor.toLowerCase())
                                            )
                                            
                                            return (
                                                <button
                                                    key={`${product.id}-${index}-${colorValue}`}
                                                    type="button"
                                                    onMouseEnter={() => {
                                                        setHoverPreviewColor((prev) => ({
                                                            ...prev,
                                                            [product.id]: String(colorValue),
                                                        }))
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        const slug = product.slug || product.id
                                                        const q = encodeURIComponent(String(colorValue))
                                                        navigate(`/shop/product/${slug}?color=${q}`)
                                                    }}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                                                        isSelected
                                                            ? 'border-blue-600 scale-110 ring-2 ring-blue-200 shadow-md'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                    style={{
                                                        backgroundColor: gradientStyle ? 'transparent' : hexCode,
                                                        backgroundImage: gradientStyle || undefined,
                                                        borderColor: isSelected ? '#2563EB' : undefined,
                                                        backgroundSize: gradientStyle ? 'cover' : undefined,
                                                    }}
                                                    title={displayName}
                                                    aria-label={`Select color ${displayName}`}
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

                                {/* Add to Cart Button */}
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        try {
                                            const salePrice = product?.sale_price ? Number(product.sale_price) : null
                                            const regularPrice = product?.price ? Number(product.price) : 0
                                            const finalPrice = salePrice && salePrice < regularPrice ? salePrice : regularPrice
                                            
                                            // Get selected color image
                                            const selectedColor = productColorSelections[product.id] || 
                                                (product.color_images && product.color_images.length > 0 
                                                    ? product.color_images[0].color 
                                                    : null)
                                            
                                            // Get image URL based on selected color
                                            const productImageUrl = selectedColor && product.color_images
                                                ? (() => {
                                                    const selectedColorLower = (selectedColor || '').toLowerCase()
                                                    const colorImage = product.color_images.find(ci => 
                                                        ci.color && ci.color.toLowerCase() === selectedColorLower
                                                    )
                                                    return colorImage?.images?.[0] || getProductImageUrl(product)
                                                })()
                                                : getProductImageUrl(product)
                                            
                                            const cartProduct = {
                                                id: product?.id || 0,
                                                name: displayName || product?.name || '',
                                                brand: product?.brand || '',
                                                category: product?.category?.slug || 'eyeglasses',
                                                price: finalPrice,
                                                image: productImageUrl, // Use selected color image
                                                description: product?.description || '',
                                                inStock: product?.in_stock || false,
                                                rating: product?.rating ? Number(product.rating) : undefined,
                                                customization: selectedColor ? {
                                                    selected_color: selectedColor,
                                                    color_name: product.color_images?.find(ci => 
                                                        ci.color?.toLowerCase() === selectedColor.toLowerCase()
                                                    )?.name,
                                                    variant_images: product.color_images?.find(ci => 
                                                        ci.color?.toLowerCase() === selectedColor.toLowerCase()
                                                    )?.images
                                                } : undefined
                                            }
                                            
                                            // Add to local cart
                                            addToCart(cartProduct)
                                            
                                            // Add to API cart if authenticated
                                            if (isAuthenticated) {
                                                try {
                                                    await addItemToCart({
                                                        product_id: product.id,
                                                        quantity: 1,
                                                        selected_color: selectedColor || undefined
                                                    })
                                                } catch (error) {
                                                    console.error('Error adding to API cart:', error)
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error adding to cart:', error)
                                        }
                                    }}
                                    className="mb-3 w-full bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors"
                                >
                                    {t('shop.addToCart', 'Add to Cart')}
                                </button>

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
        </section>
    )
}

export default LatestArrivals

