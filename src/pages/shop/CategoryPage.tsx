import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getCategoryBySlug, 
    getSubcategoryBySlug, 
    getNestedSubcategoriesByParentId,
    type Category 
} from '../../services/categoriesService'
import { 
    getProducts, 
    getProductOptions,
    type Product,
    type ProductFilters,
    type ProductOptions
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { useCart } from '../../context/CartContext'
import CategoryBanner from '../../components/home/CategoryBanner'
import RelatedCategories from '../../components/shop/RelatedCategories'

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { addToCart } = useCart()
    const { categorySlug, subcategorySlug, subSubcategorySlug } = useParams<{ 
        categorySlug: string; 
        subcategorySlug?: string;
        subSubcategorySlug?: string;
    }>()
    const navigate = useNavigate()
    const [categoryInfo, setCategoryInfo] = useState<{ 
        category: Category | null; 
        subcategory: Category | null;
        subSubcategory: Category | null;
    }>({
        category: null,
        subcategory: null,
        subSubcategory: null
    })
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [lensType, setLensType] = useState<string>('')
    const [lensCoating, setLensCoating] = useState<string>('')
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
    const [gender, setGender] = useState<string>('')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [availableColors, setAvailableColors] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<string>('newest')
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)

    // Fetch category, subcategory, and sub-subcategory info
    useEffect(() => {
        let isCancelled = false

        const fetchCategoryInfo = async () => {
            if (!categorySlug) {
                navigate('/shop')
                return
            }

            let category: Category | null = null
            let subcategory: Category | null = null
            let subSubcategory: Category | null = null

            try {
                category = await getCategoryBySlug(categorySlug)
                if (isCancelled) return
                
                if (!category) {
                    navigate('/shop')
                    return
                }

                if (subcategorySlug) {
                    subcategory = await getSubcategoryBySlug(subcategorySlug, category.id)
                    if (isCancelled) return
                    
                    if (!subcategory) {
                        navigate(`/category/${categorySlug}`)
                        return
                    }

                    // If sub-subcategory slug is provided, fetch it
                    if (subSubcategorySlug) {
                        // Get all nested subcategories (sub-subcategories) for this subcategory
                        const nestedSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                        if (!isCancelled) {
                            // Find the sub-subcategory by slug (case-insensitive comparison)
                            const subSubcategorySlugLower = (subSubcategorySlug || '').toLowerCase()
                            subSubcategory = nestedSubcategories.find(sub => 
                                sub.slug && sub.slug.toLowerCase() === subSubcategorySlugLower
                            ) || null
                            
                            if (!subSubcategory) {
                                console.warn(`⚠️ Sub-subcategory "${subSubcategorySlug}" not found under subcategory "${subcategory.name}"`)
                                navigate(`/category/${categorySlug}/${subcategorySlug}`)
                                return
                            }
                        }
                    }
                }

                if (!isCancelled) {
                    setCategoryInfo({ category, subcategory, subSubcategory })
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching category info:', error)
                    navigate('/shop')
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchCategoryInfo()

        return () => {
            isCancelled = true
        }
    }, [categorySlug, subcategorySlug, subSubcategorySlug, navigate])

    // Fetch products
    useEffect(() => {
        if (!categoryInfo.category) return

        let isCancelled = false

        const fetchProducts = async () => {
            try {
                setLoading(true)
                const filters: ProductFilters = {
                    page: currentPage,
                    limit: 12,
                }

                // Apply category/subcategory filters
                if (categoryInfo.category?.slug === 'contact-lenses') {
                    filters.category = 'contact-lenses'
                } else {
                    if (categoryInfo.subSubcategory) {
                        filters.subcategory = categoryInfo.subSubcategory.slug
                        filters.category = categoryInfo.category!.slug
                    } else if (categoryInfo.subcategory) {
                        filters.subcategory = categoryInfo.subcategory.slug
                        filters.category = categoryInfo.category!.slug
                    } else {
                        filters.category = categoryInfo.category!.slug
                    }
                }

                // Apply additional filters
                if (searchTerm) {
                    filters.search = searchTerm
                }

                if (lensType) {
                    filters.lensType = lensType
                }

                if (lensCoating) {
                    filters.lensCoating = lensCoating
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

                // For contact lenses category, use the section endpoint
                if (categoryInfo.category?.slug === 'contact-lenses') {
                    // Use contact lenses section endpoint
                    const result = await getProducts({
                        ...filters,
                        category: 'contact-lenses'
                    })
                    
                    if (!isCancelled && result) {
                        setProducts(result.products || [])
                        setPagination(result.pagination || {
                            total: 0,
                            page: 1,
                            limit: 12,
                            pages: 0
                        })
                        
                        // Debug: Log product data
                        if (import.meta.env.DEV && result.products && result.products.length > 0) {
                            console.log('🔍 CategoryPage - Contact lenses products received:', result.products.length);
                            console.log('🔍 Sample product data:', result.products[0]);
                            console.log('🔍 in_stock values:', result.products.map(p => ({
                                id: p.id,
                                name: p.name,
                                in_stock: p.in_stock,
                                stock_quantity: p.stock_quantity,
                                stock_status: (p as any).stock_status
                            })));
                        }
                    }
                } else {
                    // For other categories, use regular category filtering
                    const result = await getProducts(filters)
                    
                    if (!isCancelled && result) {
                        // Extract unique colors from all products for color filter dropdown
                        if (result.products && result.products.length > 0) {
                            const colorSet = new Set<string>()
                            result.products.forEach((product: Product) => {
                                const p = product as any
                                // Extract colors from 'colors' array
                                if (p.colors && Array.isArray(p.colors)) {
                                    p.colors.forEach((c: any) => {
                                        const colorName = c.display_name || c.name || c.value || c.color
                                        if (colorName) {
                                            colorSet.add(colorName)
                                        }
                                    })
                                }
                                // Extract colors from 'color_images' array
                                if (product.color_images && Array.isArray(product.color_images)) {
                                    product.color_images.forEach((ci: any) => {
                                        const colorName = ci.display_name || ci.name || ci.color
                                        if (colorName) {
                                            colorSet.add(colorName)
                                        }
                                    })
                                }
                            })
                            if (!isCancelled) {
                                setAvailableColors(Array.from(colorSet).sort())
                            }
                        }

                        // Filter products by color if color is selected (client-side filtering)
                        let filteredProducts = result.products || []
                        if (selectedColor && filteredProducts.length > 0) {
                            filteredProducts = filteredProducts.filter((product: Product) => {
                                const p = product as any
                                const selectedColorLower = selectedColor.toLowerCase()

                                // Check in 'colors' array
                                if (p.colors && Array.isArray(p.colors)) {
                                    const hasColor = p.colors.some((c: any) => {
                                        const colorName = (c.display_name || c.name || c.value || c.color || '').toLowerCase()
                                        return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                    })
                                    if (hasColor) return true
                                }

                                // Check in 'color_images' array
                                if (product.color_images && Array.isArray(product.color_images)) {
                                    const hasColor = product.color_images.some((ci: any) => {
                                        const colorName = (ci.display_name || ci.name || ci.color || '').toLowerCase()
                                        return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                    })
                                    if (hasColor) return true
                                }

                                return false
                            })
                        }

                        setProducts(filteredProducts)
                        // Update pagination total if we filtered client-side
                        const updatedPagination = { ...result.pagination }
                        if (selectedColor && filteredProducts.length !== (result.products || []).length) {
                            updatedPagination.total = filteredProducts.length
                            updatedPagination.pages = Math.ceil(filteredProducts.length / (updatedPagination.limit || 12))
                        }
                        setPagination(updatedPagination)
                        
                        // Debug: Log product data
                        if (import.meta.env.DEV && result.products && result.products.length > 0) {
                            console.log('🔍 CategoryPage - Other category products received:', result.products.length);
                            console.log('🔍 Sample product data:', result.products[0]);
                            console.log('🔍 in_stock values:', result.products.map(p => ({
                                id: p.id,
                                name: p.name,
                                in_stock: p.in_stock,
                                stock_quantity: p.stock_quantity,
                                stock_status: (p as any).stock_status
                            })));
                        }
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching products:', error)
                    setProducts([])
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        fetchProducts()

        return () => {
            isCancelled = true
        }
    }, [categoryInfo.category?.id, categoryInfo.subcategory?.id, categoryInfo.subSubcategory?.id, currentPage, searchTerm, lensType, lensCoating, minPrice, maxPrice, gender, selectedColor, sortBy])

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

    const handleAddToCart = (product: Product) => {
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

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading...</p>
                </div>
                <Footer />
            </div>
        )
    }

    if (!categoryInfo.category) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="text-center py-12">
                    <p className="text-lg text-gray-600">Category not found</p>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Category Banner - Dynamic banners from backend */}
            {categoryInfo.category && (
                <CategoryBanner 
                    categoryName={translateCategory(
                        categoryInfo.subSubcategory || 
                        categoryInfo.subcategory || 
                        categoryInfo.category
                    )}
                    categoryId={
                        categoryInfo.subSubcategory?.id || 
                        categoryInfo.subcategory?.id || 
                        categoryInfo.category?.id || 0
                    }
                    position={categoryInfo.subSubcategory ? "sub_subcategory_page" : categoryInfo.subcategory ? "subcategory_page" : "category_page"}
                />
            )}

            {/* Page Content */}
            <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 md:py-12 lg:py-16 px-8 sm:px-12 lg:px-16">
                <div className="w-full max-w-7xl mx-auto">
                    {/* Subcategory/Sub-subcategory Info Banner */}
                    {(categoryInfo.subcategory || categoryInfo.subSubcategory) && (
                        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2 font-medium">
                                        {categoryInfo.subSubcategory ? 'Viewing sub-subcategory:' : 'Viewing subcategory:'}
                                    </p>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                                        {categoryInfo.subSubcategory 
                                            ? translateCategory(categoryInfo.subSubcategory)
                                            : translateCategory(categoryInfo.subcategory)}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Related Categories Section */}
                    <RelatedCategories 
                        category={categoryInfo.category}
                        subcategory={categoryInfo.subcategory}
                        subSubcategory={categoryInfo.subSubcategory}
                    />

                    {/* Filters and Search */}
                    <div className="mb-2">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-4">
                            {/* Sort Dropdown */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between lg:justify-start w-full lg:w-auto">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
                            <div className="flex-1 lg:max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Filter Options Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-3">
                            {/* Lens Type Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Lens Type</label>
                                <select
                                    value={lensType}
                                    onChange={(e) => {
                                        setLensType(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All Types</option>
                                    {productOptions?.lensTypes?.map((lensType) => (
                                        <option key={lensType.id} value={lensType.slug}>
                                            {lensType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Lens Coating Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Lens Coating</label>
                                <select
                                    value={lensCoating}
                                    onChange={(e) => {
                                        setLensCoating(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All Coatings</option>
                                    {productOptions?.lensCoatings?.map((coating) => (
                                        <option key={coating.id} value={coating.slug}>
                                            {coating.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gender Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => {
                                        setGender(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All</option>
                                    {productOptions?.genders?.map((g) => (
                                        <option key={g} value={g}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Colors Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Colors</label>
                                <select
                                    value={selectedColor}
                                    onChange={(e) => {
                                        setSelectedColor(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All Colors</option>
                                    {availableColors.map((color) => (
                                        <option key={color} value={color}>
                                            {color}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-2 lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Price Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice || ''}
                                            onChange={(e) => {
                                                setMinPrice(e.target.value ? Number(e.target.value) : undefined)
                                                setCurrentPage(1)
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice || ''}
                                            onChange={(e) => {
                                                setMaxPrice(e.target.value ? Number(e.target.value) : undefined)
                                                setCurrentPage(1)
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-950"></div>
                            <p className="mt-6 text-xl text-gray-600 font-medium">Loading products...</p>
                        </div>
                    ) : !products || products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="max-w-lg mx-auto">
                                <svg className="mx-auto h-32 w-32 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-xl md:text-2xl text-gray-600 mb-4 font-semibold">
                                    {categoryInfo.subSubcategory 
                                        ? t('shop.noProducts', { category: translateCategory(categoryInfo.subSubcategory) })
                                        : categoryInfo.subcategory 
                                        ? t('shop.noProducts', { category: translateCategory(categoryInfo.subcategory) })
                                        : t('shop.noProducts', { category: translateCategory(categoryInfo.category) })}
                                </p>
                                <p className="text-base text-gray-500 mb-8">
                                    {categoryInfo.subSubcategory 
                                        ? "This sub-subcategory doesn't have any products yet."
                                        : categoryInfo.subcategory 
                                        ? "This subcategory doesn't have any products yet."
                                        : "This category doesn't have any products yet."}
                                </p>
                                {categoryInfo.subSubcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category?.slug || ''}/${categoryInfo.subcategory?.slug || ''}`}
                                        className="inline-block px-8 py-4 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all duration-200 transform hover:scale-105 shadow-lg mr-4 font-semibold"
                                    >
                                        {t('shop.viewProducts', { category: translateCategory(categoryInfo.subcategory) })}
                                    </Link>
                                ) : categoryInfo.subcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category?.slug || ''}`}
                                        className="inline-block px-8 py-4 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all duration-200 transform hover:scale-105 shadow-lg mr-4 font-semibold"
                                    >
                                        {t('shop.viewProducts', { category: translateCategory(categoryInfo.category || { name: '', slug: '' }) })}
                                    </Link>
                                ) : null}
                                <Link 
                                    to="/shop" 
                                    className="inline-block px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 font-semibold"
                                >
                                    Browse All Products
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 lg:gap-12 mb-16 px-6 lg:px-8">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300 flex flex-col group h-full transform hover:scale-105"
                                    >
                                        {/* Product Image */}
                                        <div className="relative h-56 md:h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-2xl">
                                            <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                                                <img
                                                    src={getProductImageUrl(product)}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/assets/images/placeholder-product.jpg'
                                                    }}
                                                />
                                            </Link>
                                             
                                            {/* Sale Badge */}
                                            {product.sale_price && Number(product.sale_price) < Number(product.price) && (
                                                <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10 shadow-lg">
                                                    Sale
                                                </div>
                                            )}
                                             
                                            {/* Out of Stock Badge */}
                                            {(product.in_stock === false) && (
                                                <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10 shadow-lg">
                                                    {t('shop.outOfStock')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-6 md:p-8 flex-1 flex flex-col space-y-6">
                                            <Link to={`/shop/product/${product.slug || product.id}`} className="flex-1 group">
                                                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                                    {product.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-2">{product.brand}</p>
                                            </Link>
                                            
                                            {/* Price */}
                                            <div className="mb-6">
                                                {product.sale_price && Number(product.sale_price) < Number(product.price) ? (
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                        <span className="text-2xl md:text-3xl font-bold text-red-600">
                                                            ${Number(product.sale_price).toFixed(2)}
                                                        </span>
                                                        <span className="text-base text-gray-400 line-through">
                                                            ${Number(product.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl md:text-3xl font-bold text-gray-900">
                                                        ${Number(product.price).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Add to Cart Button */}
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.in_stock === false}
                                                className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 transform hover:scale-105 ${
                                                    product.in_stock === false
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl'
                                                }`}
                                            >
                                                {product.in_stock === false ? t('shop.outOfStock') : t('shop.addToCart')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-12">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 shadow-md"
                                    >
                                        ← Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm">
                                            {currentPage}
                                        </span>
                                        <span className="text-gray-500 font-medium">of {pagination.pages}</span>
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                                        disabled={currentPage === pagination.pages}
                                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 shadow-md"
                                    >
                                        Next →
                                    </button>
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

export default CategoryPage
