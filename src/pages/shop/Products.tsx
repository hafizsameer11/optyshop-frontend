import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import {
    getProducts,
    getProductsBySection,
    getProductOptions,
    type Product,
    type ProductFilters,
    type ProductOptions,
    type ProductSection
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import { 
    getCategoryBySlug, 
    getSubcategoryBySlug, 
    getSubcategoriesByCategoryId, 
    getNestedSubcategoriesByParentId, 
    type Category 
} from '../../services/categoriesService'
import Campaigns from '../../components/home/Campaigns'
import ProductCard from '../../components/products/ProductCard'

const Products: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const [products, setProducts] = useState<Product[]>([])
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [loading, setLoading] = useState(true)

    // Detect current section from URL path
    const getCurrentSection = (): ProductSection | null => {
        const path = location.pathname
        if (path.includes('/shop/sunglasses')) return 'sunglasses'
        if (path.includes('/shop/eyeglasses')) return 'eyeglasses'
        if (path.includes('/shop/contact-lenses')) return 'contact-lenses'
        if (path.includes('/shop/eye-hygiene')) return 'eye-hygiene'
        return null
    }

    const currentSection = getCurrentSection()
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

    // Category and subcategory filters
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all')
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | number | null>(null)
    const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([])
    const [availableSubSubcategories, setAvailableSubSubcategories] = useState<Category[]>([])
    const [selectedSubSubcategory, setSelectedSubSubcategory] = useState<string | number | null>(null)
    
    // Legacy filters (kept for compatibility)
    const [searchTerm, setSearchTerm] = useState('')
    const [frameShape, setFrameShape] = useState<string>('')
    const [frameMaterial, setFrameMaterial] = useState<string>('')
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
    const [gender, setGender] = useState<string>('')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [availableColors, setAvailableColors] = useState<string[]>([])
    
    // Contact lens specific filters
    const [lensType, setLensType] = useState<string>('')
    const [baseCurve, setBaseCurve] = useState<string>('')
    const [diameter, setDiameter] = useState<string>('')
    const [replacementPeriod, setReplacementPeriod] = useState<string>('')
    
    const [currentPage, setCurrentPage] = useState(1)
    const [sortBy, setSortBy] = useState<string>('newest') // 'newest', 'oldest', 'price_low', 'price_high', 'name'
    const [showNewArrivals, setShowNewArrivals] = useState(false)
    const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null)
    const [showTryOnModal, setShowTryOnModal] = useState(false)


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

    // Fetch subcategories when category changes
    useEffect(() => {
        let isCancelled = false

        const fetchSubcategories = async () => {
            if (selectedCategory && selectedCategory !== 'all') {
                try {
                    const subcategories = await getSubcategoriesByCategoryId(selectedCategory)
                    if (!isCancelled) {
                        setAvailableSubcategories(subcategories)
                        // Reset subcategory and sub-subcategory when category changes
                        setSelectedSubcategory(null)
                        setSelectedSubSubcategory(null)
                        setAvailableSubSubcategories([])
                    }
                } catch (error) {
                    if (!isCancelled) {
                        console.error('Error fetching subcategories:', error)
                        setAvailableSubcategories([])
                    }
                }
            } else {
                if (!isCancelled) {
                    setAvailableSubcategories([])
                    setAvailableSubSubcategories([])
                    setSelectedSubcategory(null)
                    setSelectedSubSubcategory(null)
                }
            }
        }

        fetchSubcategories()

        return () => {
            isCancelled = true
        }
    }, [selectedCategory])

    // Fetch sub-subcategories when subcategory changes
    useEffect(() => {
        let isCancelled = false

        const fetchSubSubcategories = async () => {
            if (selectedSubcategory) {
                try {
                    // Get sub-subcategories from the selected subcategory's children
                    const subcategory = availableSubcategories.find(sub => sub.id === Number(selectedSubcategory))
                    if (subcategory && subcategory.children) {
                        if (!isCancelled) {
                            setAvailableSubSubcategories(subcategory.children)
                            setSelectedSubSubcategory(null)
                        }
                    } else {
                        // Fallback: fetch from API
                        const subSubcategories = await getNestedSubcategoriesByParentId(selectedSubcategory)
                        if (!isCancelled) {
                            setAvailableSubSubcategories(subSubcategories)
                            setSelectedSubSubcategory(null)
                        }
                    }
                } catch (error) {
                    if (!isCancelled) {
                        console.error('Error fetching sub-subcategories:', error)
                        setAvailableSubSubcategories([])
                    }
                }
            } else {
                if (!isCancelled) {
                    setAvailableSubSubcategories([])
                    setSelectedSubSubcategory(null)
                }
            }
        }

        fetchSubSubcategories()

        return () => {
            isCancelled = true
        }
    }, [selectedSubcategory, availableSubcategories])

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

                if (selectedSubSubcategory) {
                    filters.subSubcategory = selectedSubSubcategory
                }

                if (searchTerm) {
                    filters.search = searchTerm
                }

                if (lensType) {
                    filters.lensType = lensType
                }

                if (baseCurve) {
                    filters.baseCurve = baseCurve
                }

                if (diameter) {
                    filters.diameter = diameter
                }

                if (replacementPeriod) {
                    filters.replacementPeriod = replacementPeriod
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

                // Contact lens specific filters
                if (lensType) {
                    filters.lensType = lensType
                }
                
                if (baseCurve) {
                    filters.baseCurve = baseCurve
                }
                
                if (diameter) {
                    filters.diameter = diameter
                }
                
                if (replacementPeriod) {
                    filters.replacementPeriod = replacementPeriod
                }

                // Note: Color filtering is done client-side after fetching products
                // This ensures it doesn't interfere with the search parameter

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

                // Use section-specific endpoint if section is detected, otherwise use regular products endpoint
                const result = currentSection
                    ? await getProductsBySection(currentSection, filters)
                    : await getProducts(filters)
                if (isCancelled) return

                if (result) {
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

                    // Log first product to debug image and stock data - show ALL image-related fields
                    if (filteredProducts.length > 0 && import.meta.env.DEV) {
                        const sampleProduct = filteredProducts[0]
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
                        setProducts(filteredProducts)
                        // Update pagination total if we filtered client-side
                        const updatedPagination = { ...result.pagination }
                        if (selectedColor && filteredProducts.length !== (result.products || []).length) {
                            updatedPagination.total = filteredProducts.length
                            updatedPagination.pages = Math.ceil(filteredProducts.length / (updatedPagination.limit || 12))
                        }
                        setPagination(updatedPagination)
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
    }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, searchTerm, frameShape, frameMaterial, minPrice, maxPrice, gender, selectedColor, currentPage, sortBy, showNewArrivals, currentSection, location.pathname, lensType, baseCurve, diameter, replacementPeriod])


    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Campaigns Section - Show before hero section */}
            <Campaigns position="shop" variant="compact" />


            {/* Section Navigation */}
            <section className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="w-[90%] mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto py-4">
                        <Link
                            to="/shop"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${!currentSection
                                ? 'bg-blue-950 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Products
                        </Link>
                        <Link
                            to="/shop/sunglasses"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${currentSection === 'sunglasses'
                                ? 'bg-blue-950 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Sunglasses
                        </Link>
                        <Link
                            to="/shop/eyeglasses"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${currentSection === 'eyeglasses'
                                ? 'bg-blue-950 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Eyeglasses
                        </Link>
                        <Link
                            to="/shop/contact-lenses"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${currentSection === 'contact-lenses'
                                ? 'bg-blue-950 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Contact Lenses
                        </Link>
                        <Link
                            to="/shop/eye-hygiene"
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${currentSection === 'eye-hygiene'
                                ? 'bg-blue-950 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Eye Hygiene
                        </Link>
                    </div>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-screen-2xl">
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
            <section className="bg-gray-50 py-6 px-4 sm:px-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-4">
                        {/* New Arrivals Toggle and Sort */}
                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between lg:justify-start w-full lg:w-auto">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => {
                                        setShowNewArrivals(!showNewArrivals)
                                        if (!showNewArrivals) {
                                            setSortBy('newest')
                                        }
                                        setCurrentPage(1)
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showNewArrivals
                                        ? 'bg-blue-950 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {showNewArrivals ? '✓ New Arrivals' : 'New Arrivals'}
                                </button>

                                {/* Quick Gender Filters */}
                                {productOptions?.genders && productOptions.genders.length > 0 && (
                                    <div className="flex gap-3 flex-wrap">
                                        {productOptions.genders.map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => {
                                                    setGender(gender === g ? '' : g)
                                                    setCurrentPage(1)
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${gender === g
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
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {/* Category Filter */}
                        <div className="space-y-4">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            >
                                <option value="all">All Categories</option>
                                {productOptions?.categories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {translateCategory(category)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory Filter */}
                        {selectedCategory !== 'all' && availableSubcategories.length > 0 && (
                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Subcategory</label>
                                <select
                                    value={selectedSubcategory || ''}
                                    onChange={(e) => {
                                        setSelectedSubcategory(e.target.value ? Number(e.target.value) : null)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All Subcategories</option>
                                    {availableSubcategories.map((subcategory) => (
                                        <option key={subcategory.id} value={subcategory.id}>
                                            {translateCategory(subcategory)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Sub-subcategory Filter */}
                        {selectedSubcategory && availableSubSubcategories.length > 0 && (
                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Type</label>
                                <select
                                    value={selectedSubSubcategory || ''}
                                    onChange={(e) => {
                                        setSelectedSubSubcategory(e.target.value ? Number(e.target.value) : null)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">All Types</option>
                                    {availableSubSubcategories.map((subSubcategory) => (
                                        <option key={subSubcategory.id} value={subSubcategory.id}>
                                            {translateCategory(subSubcategory)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Product Specification Filters based on category type */}
                        {currentSection === 'contact-lenses' ? (
                            // Contact Lens Specific Filters
                            <>
                                {/* Lens Type Filter */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Lens Type</label>
                                    <select
                                        value={lensType}
                                        onChange={(e) => {
                                            setLensType(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                        <option value="">All Types</option>
                                        {productOptions?.lensTypeEnums?.map((type) => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Base Curve Filter */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Base Curve</label>
                                    <select
                                        value={baseCurve}
                                        onChange={(e) => {
                                            setBaseCurve(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                        <option value="">All Base Curves</option>
                                        <option value="8.4">8.4</option>
                                        <option value="8.5">8.5</option>
                                        <option value="8.6">8.6</option>
                                        <option value="8.7">8.7</option>
                                        <option value="8.8">8.8</option>
                                        <option value="8.9">8.9</option>
                                        <option value="9.0">9.0</option>
                                    </select>
                                </div>

                                {/* Diameter Filter */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Diameter</label>
                                    <select
                                        value={diameter}
                                        onChange={(e) => {
                                            setDiameter(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                        <option value="">All Diameters</option>
                                        <option value="13.8">13.8</option>
                                        <option value="14.0">14.0</option>
                                        <option value="14.2">14.2</option>
                                        <option value="14.4">14.4</option>
                                        <option value="14.5">14.5</option>
                                        <option value="15.0">15.0</option>
                                    </select>
                                </div>

                                {/* Replacement Period Filter */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Replacement</label>
                                    <select
                                        value={replacementPeriod}
                                        onChange={(e) => {
                                            setReplacementPeriod(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    >
                                        <option value="">All Periods</option>
                                        <option value="daily">Daily</option>
                                        <option value="bi-weekly">Bi-Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            // Regular Eyeglasses/Sunglasses Filters
                            <>
                                {/* Frame Shape Filter */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Frame Shape</label>
                                    <select
                                        value={frameShape}
                                        onChange={(e) => {
                                            setFrameShape(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Frame Material</label>
                                    <select
                                        value={frameMaterial}
                                        onChange={(e) => {
                                            setFrameMaterial(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Gender</label>
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
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Colors</label>
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
                            </>
                        )}

                        {/* Price Range - Common for all product types */}
                        <div className="space-y-4">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Price Range</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Min price"
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
                                        placeholder="Max price"
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
                    {/* Add spacer div for visual separation */}
                    <div className="mb-20"></div>
                </div>
            </section>

            {/* New Arrivals Section */}
            {showNewArrivals && (
                <section className="bg-white py-8 px-4 sm:px-6 border-b border-gray-200">
                    <div className="w-[90%] mx-auto max-w-screen-2xl">
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
                <div className="w-[90%] mx-auto max-w-screen-2xl">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
                                {products && products.length > 0 && products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.pages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${currentPage === 1
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
                                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${currentPage === page
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
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${currentPage === pagination.pages
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

