import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { 
    getProducts, 
    getProductOptions,
    type Product,
    type ProductFilters,
    type ProductOptions
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getCategoryBySlug, getSubcategoryBySlug, type Category } from '../../services/categoriesService'

const Products: React.FC = () => {
    const { addToCart } = useCart()
    const [searchParams, setSearchParams] = useSearchParams()
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

    const handleAddToCart = (product: Product) => {
        try {
            // Convert API product to cart-compatible format
            const salePrice = product?.sale_price ? Number(product.sale_price) : null
            const regularPrice = product?.price ? Number(product.price) : 0
            const finalPrice = salePrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product?.id || 0,
                name: product?.name || '',
                brand: product?.brand || '',
                category: product?.category?.slug || 'eyeglasses',
                price: finalPrice,
                image: getProductImageUrl(product), // Use the same image extraction logic as product card
                description: product?.description || '',
                inStock: product?.in_stock || false,
                rating: product?.rating ? Number(product.rating) : undefined
            }
            addToCart(cartProduct)
        } catch (error) {
            console.error('Error adding to cart:', error)
        }
    }

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
                                ? categoryInfo.subcategory.name 
                                : categoryInfo.category 
                                    ? categoryInfo.category.name 
                                    : 'Shop Glasses'}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                            {categoryInfo.subcategory 
                                ? `Browse our collection of ${categoryInfo.subcategory.name}`
                                : categoryInfo.category 
                                    ? `Discover our wide collection of ${categoryInfo.category.name}`
                                    : 'Discover our wide collection of eyeglasses and sunglasses'}
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
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            <span>SHOP</span>
                        </Link>
                        {categoryInfo.category && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{categoryInfo.category.name}</span>
                            </>
                        )}
                        {categoryInfo.subcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{categoryInfo.subcategory.name}</span>
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
                                        {category.name}
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
                                            {category.name}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-8">
                                {products && products.length > 0 && products.map((product) => (
                                    <Link
                                    key={product.id}
                                        to={`/shop/product/${product.slug || product.id}`}
                                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
                                >
                                    {/* Product Image */}
                                    <div className="relative h-64 md:h-72 bg-gray-100 overflow-hidden">
                                        <img
                                            src={getProductImageUrl(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                // Log which image failed to load
                                                if (import.meta.env.DEV) {
                                                    console.warn('Image failed to load for product:', product.id, product.name, 'Tried URL:', target.src)
                                                }
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                            {(() => {
                                                const p = product as any
                                                const stockStatus = p.stock_status || product.in_stock
                                                const stockQty = product.stock_quantity
                                                
                                                // Check if out of stock
                                                const isOutOfStock = 
                                                    stockStatus === 'out_of_stock' ||
                                                    stockStatus === false ||
                                                    (stockQty !== undefined && stockQty <= 0)
                                                
                                                return isOutOfStock ? (
                                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                Out of Stock
                                                    </div>
                                                ) : null
                                            })()}
                                            {product.sale_price && product.price && product.sale_price < product.price && (
                                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    Sale
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4 md:p-6 flex-grow flex flex-col">
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                                                    {product.brand || product.category?.name || 'Brand'}
                                            </p>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-1">
                                                {product.name}
                                            </h3>
                                        </div>

                                            {product.description && (
                                                <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                                            {product.description}
                                        </p>
                                        )}

                                        {/* Price and Add to Cart */}
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
                                                <div className="flex flex-col">
                                                    {product.sale_price && product.price && Number(product.sale_price) < Number(product.price) ? (
                                                        <>
                                                            <span className="text-2xl font-bold text-blue-950">
                                                                ${Number(product.sale_price || 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ${Number(product.price || 0).toFixed(2)}
                                                            </span>
                                                        </>
                                                    ) : (
                                            <span className="text-2xl font-bold text-blue-950">
                                                            ${Number(product.price || 0).toFixed(2)}
                                            </span>
                                                    )}
                                                </div>
                                            <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handleAddToCart(product)
                                                    }}
                                                    disabled={(() => {
                                                        const p = product as any
                                                        const stockStatus = p.stock_status || product.in_stock
                                                        const stockQty = product.stock_quantity
                                                        
                                                        return stockStatus === 'out_of_stock' ||
                                                               stockStatus === false ||
                                                               (stockQty !== undefined && stockQty <= 0)
                                                    })()}
                                                    className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-colors ${
                                                        (() => {
                                                            const p = product as any
                                                            const stockStatus = p.stock_status || product.in_stock
                                                            const stockQty = product.stock_quantity
                                                            
                                                            const isInStock = stockStatus === 'in_stock' ||
                                                                              stockStatus === true ||
                                                                              (stockQty !== undefined && stockQty > 0)
                                                            
                                                            return isInStock
                                                    ? 'bg-blue-950 text-white hover:bg-blue-900'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        })()
                                                    }`}
                                                >
                                                    {(() => {
                                                        const p = product as any
                                                        const stockStatus = p.stock_status || product.in_stock
                                                        const stockQty = product.stock_quantity
                                                        
                                                        const isInStock = stockStatus === 'in_stock' ||
                                                                          stockStatus === true ||
                                                                          (stockQty !== undefined && stockQty > 0)
                                                        
                                                        return isInStock ? 'Add to Cart' : 'Out of Stock'
                                                    })()}
                                            </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
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
        </div>
    )
}

export default Products

