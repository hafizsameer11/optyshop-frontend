import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, type Category, type CategoryProduct } from '../../services/categoriesService'
import { type Product } from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getProductDisplayName } from '../../utils/productDisplayName'
import { useTranslation } from 'react-i18next'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { addItemToCart } from '../../services/cartService'
import CategoryBanner from './CategoryBanner'

interface CategoryWithProducts extends Category {
    fetchedProducts?: CategoryProduct[]
}

/** One home “Shop categories” row: top-level category or a subcategory (e.g. Sunglasses) with its own banner API */
interface ShopCategorySection {
    rowKey: string
    /** Category/subcategory used for products, links, and labels */
    category: CategoryWithProducts
    /** When set, this row is a subcategory — banner uses parent id + sub id */
    parentCategory: Category | null
}

const ShopCategories: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [categorySections, setCategorySections] = useState<ShopCategorySection[]>([])
    const [loading, setLoading] = useState(true)
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
            ? getProductImageUrl(product as any as Product).toLowerCase()
            : (Array.isArray(product) && product[0] ? getImageUrl(product[0]) : '/assets/images/frame1.png').toLowerCase()
        
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
                // Subcategories included so rows like “Sunglasses” get correct banner (subcategory page_type + ids)
                const fetchedCategories = await getCategories({
                    includeProducts: true,
                    includeSubcategories: true,
                })
                
                if (isCancelled) return
                
                const sortedTop = [...fetchedCategories].sort(
                    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                )
                
                const sections: ShopCategorySection[] = []
                
                for (const cat of sortedTop) {
                    const subs = [...(cat.subcategories || [])]
                        .filter((s) => s.is_active !== false)
                        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    const subsWithProducts = subs.filter((s) => (s.products?.length ?? 0) > 0)
                    
                    if ((cat.products?.length ?? 0) > 0) {
                        const categoryProducts = cat.products || []
                        sections.push({
                            rowKey: `cat-${cat.id}`,
                            category: {
                                ...cat,
                                fetchedProducts: categoryProducts,
                                products: categoryProducts,
                            },
                            parentCategory: null,
                        })
                    }
                    
                    for (const sub of subsWithProducts) {
                        const subProducts = sub.products || []
                        sections.push({
                            rowKey: `sub-${cat.id}-${sub.id}`,
                            category: {
                                ...sub,
                                fetchedProducts: subProducts,
                                products: subProducts,
                            },
                            parentCategory: cat,
                        })
                    }
                }
                
                if (isCancelled) return
                
                const withProducts = sections.filter(
                    (s) =>
                        (s.category.products && s.category.products.length > 0) ||
                        (s.category.fetchedProducts && s.category.fetchedProducts.length > 0)
                )
                
                // Cap rows (each row still loads its own banner); was 6 top-level only — hid Sunglasses when ordered late or as sub
                setCategorySections(withProducts.slice(0, 24))
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

    // Initialize default color selections when categories/products change
    useEffect(() => {
        const newSelections: Record<number, string> = {}
        let hasChanges = false
        
        categorySections.forEach((section) => {
            const category = section.category
            if (category.products) {
                category.products.forEach(product => {
                    const productId = (product as any).id
                    if (productId && !productColorSelections[productId]) {
                        const productColorImages = (product as any).color_images || (product as any as Product).color_images
                        if (productColorImages && productColorImages.length > 0) {
                            newSelections[productId] = productColorImages[0].color
                            hasChanges = true
                        }
                    }
                })
            }
        })
        
        if (hasChanges) {
            setProductColorSelections(prev => ({
                ...prev,
                ...newSelections
            }))
        }
    }, [categorySections]) // Only depend on categorySections, not productColorSelections

    // Helper function to parse product images
    const getProductImages = (product: CategoryProduct): string[] => {
        if (!product.images) return []
        try {
            const parsed = JSON.parse(product.images)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return product.images ? [product.images] : []
        }
    }

    // Helper function to get product image URL
    const getImageUrl = (product: CategoryProduct): string => {
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
                
                {categorySections.length > 0 ? (
                    <div className="space-y-16">
                        {categorySections.map((section) => {
                            const category = section.category
                            const parent = section.parentCategory
                            const categoryPath = parent
                                ? `/category/${parent.slug}/${category.slug}`
                                : `/category/${category.slug}`
                            return (
                            <div key={section.rowKey} className="category-section">
                                <CategoryBanner 
                                    categoryName={translateCategory(category)}
                                    categoryId={parent ? parent.id : category.id}
                                    subcategoryId={parent ? category.id : undefined}
                                    position={parent ? 'subcategory_page' : 'category_section'}
                                />
                                <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="min-w-0 text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
                                        {translateCategory(category)}
                                    </h2>
                                    <Link
                                        to={categoryPath}
                                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 md:text-base"
                                    >
                                        {t('navbar.viewAll')}
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                const productColorImages = (product as any).color_images || productAsProduct.color_images
                                                const selectedColor = productColorSelections[product.id] || 
                                                    (productColorImages && productColorImages.length > 0 
                                                        ? productColorImages[0].color 
                                                        : null)
                                                
                                                // Get image URL based on selected color
                                                const productImageUrl = selectedColor && productColorImages
                                                    ? (() => {
                                                        // Case-insensitive color matching
                                                        const selectedColorLower = (selectedColor || '').toLowerCase()
                                                        const colorImage = productColorImages.find((ci: any) => 
                                                            ci.color && ci.color.toLowerCase() === selectedColorLower
                                                        )
                                                        return colorImage?.images?.[0] || (isApiProduct ? getProductImageUrl(productAsProduct) : (Array.isArray(product) && product[0] ? getImageUrl(product[0]) : '/assets/images/frame1.png'))
                                                    })()
                                                    : (isApiProduct ? getProductImageUrl(productAsProduct) : (Array.isArray(product) && product[0] ? getImageUrl(product[0]) : '/assets/images/frame1.png'))
                                                const displayName = getProductDisplayName(product)
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
                                                                alt={displayName || 'Product'}
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
                                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <Link
                                                                        to={`/shop/product/${productSlug}`}
                                                                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                                                                    >
                                                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 text-left hover:text-blue-800 transition-colors">
                                                                            {displayName || t('shop.viewDetails', 'View product')}
                                                                        </h3>
                                                                    </Link>
                                                                    {productSku ? (
                                                                        <p className="mt-1 text-xs font-medium text-gray-500 tabular-nums">
                                                                            {productSku}
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        toggleWishlist(productAsProduct)
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
                                                            {isGlassesProduct(product) && productColorImages && productColorImages.length > 0 && (
                                                                <div className="mb-3 flex gap-2 flex-wrap items-center justify-center">
                                                                    {productColorImages.map((colorImage: any, index: number) => {
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

                                                            {/* Add to Cart Button */}
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    try {
                                                                        const finalPrice = parseFloat(productPrice) || 0
                                                                        
                                                                        // Get selected color image
                                                                        const selectedColor = productColorSelections[product.id] || 
                                                                            (productColorImages && productColorImages.length > 0 
                                                                                ? productColorImages[0].color 
                                                                                : null)
                                                                        
                                                                        // Get image URL based on selected color
                                                                        const finalImageUrl = selectedColor && productColorImages
                                                                            ? (() => {
                                                                                const selectedColorLower = (selectedColor || '').toLowerCase()
                                                                                const colorImage = productColorImages.find((ci: any) => 
                                                                                    ci.color && ci.color.toLowerCase() === selectedColorLower
                                                                                )
                                                                                return colorImage?.images?.[0] || productImageUrl
                                                                            })()
                                                                            : productImageUrl
                                                                        
                                                                        const cartProduct = {
                                                                            id: product.id,
                                                                            name: displayName || String(product.name || ''),
                                                                            brand: (product as any).brand || '',
                                                                            category: (product as any).category?.slug || 'eyeglasses',
                                                                            price: finalPrice,
                                                                            image: finalImageUrl, // Use selected color image
                                                                            description: (product as any).description || '',
                                                                            inStock: (product as any).in_stock !== false,
                                                                            rating: (product as any).rating ? Number((product as any).rating) : undefined,
                                                                            customization: selectedColor ? {
                                                                                selected_color: selectedColor,
                                                                                color_name: productColorImages?.find((ci: any) => 
                                                                                    ci.color?.toLowerCase() === selectedColor.toLowerCase()
                                                                                )?.name,
                                                                                variant_images: productColorImages?.find((ci: any) => 
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
                            )
                        })}
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
        </section>
    )
}

export default ShopCategories

