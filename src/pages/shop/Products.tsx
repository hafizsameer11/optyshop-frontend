import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useWishlist } from '../../context/WishlistContext'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getProducts, 
    getProductOptions,
    type Product,
    type ProductFilters,
    type ProductOptions
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import { getCategoryBySlug, getSubcategoryBySlug, type Category } from '../../services/categoriesService'

const Products: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const [searchParams] = useSearchParams()
    const [products, setProducts] = useState<Product[]>([])
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
    })
    
    // Category and subcategory from URL
    const [categoryInfo, setCategoryInfo] = useState<{ category: Category | null; subcategory: Category | null }>({
        category: null,
        subcategory: null
    })
    
    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all')
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [frameShape, setFrameShape] = useState<string>('')
    const [frameMaterial, setFrameMaterial] = useState<string>('')
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
    const [gender, setGender] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortBy, setSortBy] = useState<string>('newest') // 'newest', 'oldest', 'price_low', 'price_high', 'name'
    const [showNewArrivals, setShowNewArrivals] = useState(false)
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
        
        // Check if product has color_images (glasses typically have multiple color options)
        const hasColorImages = Boolean(product.color_images && product.color_images.length > 0)
        
        // Check if image URL suggests glasses (contains "frame" or "glasses" in path)
        const imageSuggestsGlasses = productImage.includes('frame') || 
                                     productImage.includes('glasses') ||
                                     productImage.includes('occhiali')
        
        // If product has color images, it's likely glasses (glasses have color variations)
        // OR if it has glasses keywords in name/category
        // OR if image URL suggests glasses
        return hasGlassesKeyword || (hasColorImages && imageSuggestsGlasses) || (hasColorImages && !productName.includes('contact') && !categoryName.includes('contact'))
    }

    // Read URL parameters and fetch category/subcategory info
    useEffect(() => {
        let isCancelled = false
        
        const categorySlug = searchParams.get('category')
        const subcategorySlug = searchParams.get('subcategory')
        
        const fetchCategoryInfo = async () => {
            let category: Category | null = null
            let subcategory: Category | null = null
            
            if (categorySlug) {
                try {
                    category = await getCategoryBySlug(categorySlug)
                    if (isCancelled) return
                    if (category) {
                        // API expects category slug, not ID
                        setSelectedCategory(category.slug)
                    }
                } catch (error) {
                    if (!isCancelled) {
                        console.error('Error fetching category:', error)
                    }
                }
            }
            
            if (subcategorySlug) {
                try {
                    // Pass categoryId if available to narrow the search
                    subcategory = await getSubcategoryBySlug(subcategorySlug, category?.id)
                    if (isCancelled) return
                    if (subcategory) {
                        // API expects subcategory slug, not ID
                        setSelectedSubcategory(subcategory.slug)
                    }
                } catch (error) {
                    if (!isCancelled) {
                        console.error('Error fetching subcategory:', error)
                    }
                }
            } else {
                // Reset subcategory if not in URL
                if (!isCancelled) {
                    setSelectedSubcategory(null)
                }
            }
            
            // Reset category if not in URL
            if (!categorySlug) {
                if (!isCancelled) {
                    setSelectedCategory('all')
                }
            }
            
            if (!isCancelled) {
                setCategoryInfo({ category, subcategory })
            }
        }
        
        fetchCategoryInfo()
        
        return () => {
            isCancelled = true
        }
    }, [searchParams])
    
    // Fetch product options on mount
    useEffect(() => {
        let isCancelled = false
        
        const fetchOptions = async () => {
            try {
                const options = await getProductOptions()
                if (!isCancelled) {
                    setProductOptions(options)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching product options:', error)
                    setProductOptions(null)
                }
            }
        }
        fetchOptions()
        
        return () => {
            isCancelled = true
        }
    }, [])

    // Fetch products when filters change
    useEffect(() => {
        let isCancelled = false
        
        const fetchProducts = async () => {
            try {
                setLoading(true)
                const filters: ProductFilters = {
                    page: currentPage,
                    limit: 12,
                }

                if (selectedCategory !== 'all') {
                    filters.category = selectedCategory
                }

                if (selectedSubcategory) {
                    filters.subcategory = selectedSubcategory
                }

                if (searchTerm) {
                    filters.search = searchTerm
                }

                if (frameShape) {
                    filters.frameShape = frameShape
                }

                if (frameMaterial) {
                    filters.frameMaterial = frameMaterial
                }

                if (minPrice !== undefined) {
                    filters.minPrice = minPrice
                }

                if (maxPrice !== undefined) {
                    filters.maxPrice = maxPrice
                }

                if (gender) {
                    filters.gender = gender
                }

                // Add sorting
                if (sortBy === 'newest') {
                    filters.sortBy = 'created_at'
                    filters.sortOrder = 'desc'
                } else if (sortBy === 'oldest') {
                    filters.sortBy = 'created_at'
                    filters.sortOrder = 'asc'
                } else if (sortBy === 'price_low') {
                    filters.sortBy = 'price'
                    filters.sortOrder = 'asc'
                } else if (sortBy === 'price_high') {
                    filters.sortBy = 'price'
                    filters.sortOrder = 'desc'
                } else if (sortBy === 'name') {
                    filters.sortBy = 'name'
                    filters.sortOrder = 'asc'
                }

            const result = await getProducts(filters)
            if (isCancelled) return
            
            if (result) {
                // Log first product to debug image and stock data - show ALL image-related fields
                if (result.products && result.products.length > 0 && import.meta.env.DEV) {
                    const sampleProduct = result.products[0]
                    const selectedImageUrl = getProductImageUrl(sampleProduct)
                    console.log('🔍 API Product List - Sample Product Data:', {
                        id: sampleProduct.id,
                        name: sampleProduct.name,
                        'All Image Fields': {
                            images: sampleProduct.images,
                            image: sampleProduct.image,
                            image_url: sampleProduct.image_url,
                            thumbnail: sampleProduct.thumbnail,
                            primary_image: (sampleProduct as any).primary_image,
                            main_image: (sampleProduct as any).main_image,
                            product_image: (sampleProduct as any).product_image,
                            photo: (sampleProduct as any).photo,
                            photo_url: (sampleProduct as any).photo_url,
                        },
                        'Selected Image URL': selectedImageUrl,
                        'Stock Fields': {
                            in_stock: sampleProduct.in_stock,
                            stock_quantity: sampleProduct.stock_quantity,
                            stock_status: (sampleProduct as any).stock_status,
                        },
                        'Price Fields': {
                            price: sampleProduct.price,
                            sale_price: sampleProduct.sale_price,
                        },
                    })
                }
                if (!isCancelled) {
                    setProducts(result.products || [])
                    setPagination(result.pagination || {
                        total: 0,
                        page: 1,
                        limit: 12,
                        pages: 0
                    })
                }
            } else {
                if (!isCancelled) {
                    setProducts([])
                    setPagination({
                        total: 0,
                        page: 1,
                        limit: 12,
                        pages: 0
                    })
                }
            }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching products:', error)
                    setProducts([])
                    setPagination({
                        total: 0,
                        page: 1,
                        limit: 12,
                        pages: 0
                    })
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        // Add debounce to prevent rapid successive calls
        const timeoutId = setTimeout(() => {
            fetchProducts()
        }, 150)

        return () => {
            isCancelled = true
            clearTimeout(timeoutId)
        }
    }, [selectedCategory, selectedSubcategory, searchTerm, frameShape, frameMaterial, minPrice, maxPrice, gender, currentPage, sortBy, showNewArrivals])


    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="text-center text-white">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                            {categoryInfo.subcategory 
                                ? translateCategory(categoryInfo.subcategory)
                                : categoryInfo.category 
                                    ? translateCategory(categoryInfo.category)
                                    : t('shop.title')}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                            {categoryInfo.subcategory 
                                ? t('shop.browseCollection', { name: translateCategory(categoryInfo.subcategory) })
                                : categoryInfo.category 
                                    ? t('shop.discoverCollection', { name: translateCategory(categoryInfo.category) })
                                    : t('shop.description')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900 flex-wrap">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home').toUpperCase()}</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            <span>{t('common.shop').toUpperCase()}</span>
                        </Link>
                        {categoryInfo.category && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{translateCategory(categoryInfo.category)}</span>
                            </>
                        )}
                        {categoryInfo.subcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{translateCategory(categoryInfo.subcategory)}</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Filters and Search */}
            <section className="bg-white py-8 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="flex flex-col gap-6 mb-8">
                        {/* New Arrivals Toggle and Sort */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setShowNewArrivals(!showNewArrivals)
                                        if (!showNewArrivals) {
                                            setSortBy('newest')
                                        }
                                        setCurrentPage(1)
                                    }}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                        showNewArrivals
                                            ? 'bg-blue-950 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {showNewArrivals ? '✓ New Arrivals' : 'New Arrivals'}
                                </button>
                                
                                {/* Quick Gender Filters */}
                                {productOptions?.genders && productOptions.genders.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {productOptions.genders.map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => {
                                                    setGender(gender === g ? '' : g)
                                                    setCurrentPage(1)
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    gender === g
                                                        ? 'bg-blue-950 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="name">Name: A to Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Quick Category Filters */}
                        {productOptions?.categories && productOptions.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-medium text-gray-700 mr-2">Categories:</span>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all')
                                        setCurrentPage(1)
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedCategory === 'all'
                                            ? 'bg-blue-950 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All
                                </button>
                                {productOptions.categories.slice(0, 6).map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            setSelectedCategory(category.id)
                                            setCurrentPage(1)
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            selectedCategory === category.id
                                                ? 'bg-blue-950 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {translateCategory(category)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    {productOptions?.categories?.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {translateCategory(category)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Shape Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frame Shape</label>
                                <select
                                    value={frameShape}
                                    onChange={(e) => {
                                        setFrameShape(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">All Shapes</option>
                                    {productOptions?.frameShapes?.map((shape) => (
                                        <option key={shape} value={shape}>
                                            {shape.charAt(0).toUpperCase() + shape.slice(1).replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Material Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frame Material</label>
                                <select
                                    value={frameMaterial}
                                    onChange={(e) => {
                                        setFrameMaterial(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">All Materials</option>
                                    {productOptions?.frameMaterials?.map((material) => (
                                        <option key={material} value={material}>
                                            {material.charAt(0).toUpperCase() + material.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gender Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => {
                                        setGender(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">All</option>
                                    {productOptions?.genders?.map((g) => (
                                        <option key={g} value={g}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                                <input
                                    type="number"
                                    placeholder="Min price"
                                    value={minPrice || ''}
                                    onChange={(e) => {
                                        setMinPrice(e.target.value ? Number(e.target.value) : undefined)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                                <input
                                    type="number"
                                    placeholder="Max price"
                                    value={maxPrice || ''}
                                    onChange={(e) => {
                                        setMaxPrice(e.target.value ? Number(e.target.value) : undefined)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* New Arrivals Section */}
            {showNewArrivals && (
                <section className="bg-white py-8 px-4 sm:px-6 border-b border-gray-200">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                New Arrivals
                            </h2>
                            <button
                                onClick={() => setShowNewArrivals(false)}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Hide
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Discover our latest collection of eyewear
                        </p>
                    </div>
                </section>
            )}

            {/* Products Grid */}
            <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                            <p className="mt-4 text-lg text-gray-600">Loading products...</p>
                        </div>
                    ) : !products || products.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-lg md:text-xl text-gray-600">
                                No products found. Try adjusting your filters.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                                {products && products.length > 0 && products.map((product) => {
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
                                            const colorImage = product.color_images.find(ci => 
                                                ci.color.toLowerCase() === selectedColor.toLowerCase()
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
                                                    alt={product.name}
                                                    key={`${product.id}-${selectedColor || 'default'}`}
                                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-all duration-300"
                                                    style={{ transition: 'opacity 0.3s ease-in-out' }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        if (import.meta.env.DEV) {
                                                            console.warn('Image failed to load for product:', product.id, product.name, 'Tried URL:', target.src)
                                                        }
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
                                                
                                                // Check if out of stock - comprehensive check
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
                                            {product.sale_price && product.price && product.sale_price < product.price && (
                                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                                                    Sale
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4 flex-grow flex flex-col">
                                        {/* Color Swatches - Below Image - Only for Glasses */}
                                        {isGlassesProduct(product) && product.color_images && product.color_images.length > 0 && (
                                            <div className="mb-3 flex gap-2 flex-wrap items-center justify-center">
                                                {product.color_images.map((colorImage, index) => {
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
                                                                // Update color selection - this will trigger image change
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
                                                    {product.sale_price && product.price && Number(product.sale_price) < Number(product.price) ? (
                                                        <>
                                                        <span className="text-base font-bold text-gray-900">
                                                                €{Number(product.sale_price || 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-gray-400 line-through">
                                                                €{Number(product.price || 0).toFixed(2)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                    <span className="text-base font-bold text-gray-900">
                                                            €{Number(product.price || 0).toFixed(2)}
                                                        </span>
                                                    )}
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

                            {/* Pagination */}
                            {pagination && pagination.pages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            currentPage === 1
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-950 text-white hover:bg-blue-900'
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    
                                    {Array.from({ length: Math.max(0, pagination.pages || 0) }).map((_, i) => {
                                        const page = i + 1
                                        if (
                                            page === 1 ||
                                            page === pagination.pages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                                        currentPage === page
                                                            ? 'bg-blue-950 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="px-2">...</span>
                                        }
                                        return null
                                    })}
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === pagination.pages}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            currentPage === pagination.pages
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-950 text-white hover:bg-blue-900'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {/* Results count */}
                            {pagination && (
                                <div className="text-center mt-4 text-gray-600">
                                    Showing {products.length} of {pagination.total || 0} products
                        </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <Footer />

            {/* Virtual Try-On Modal */}
            {showTryOnModal && (
                <VirtualTryOnModal
                    open={showTryOnModal}
                    onClose={() => {
                        setShowTryOnModal(false)
                        setSelectedProductForTryOn(null)
                    }}
                    selectedProduct={selectedProductForTryOn}
                />
            )}
        </div>
    )
}

export default Products

