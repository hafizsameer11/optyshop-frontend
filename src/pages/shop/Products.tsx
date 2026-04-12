import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import {
    getProducts,
    getProductsBySection,
    type Product,
    type ProductFilters,
    type ProductSection
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import { 
    getCategoryBySlug, 
    getSubcategoryBySlug, 
    getSubcategoriesByCategoryId, 
    type Category 
} from '../../services/categoriesService'
import CategoryBanner from '../../components/home/CategoryBanner'
import SmallSlidingBanners, { SHOP_SLIDING_BANNER_POSITION_PRIORITY } from '../../components/home/SmallSlidingBanners'
import ProductCard from '../../components/products/ProductCard'
import HeroSection from '../../components/shop/HeroSection'
import ComprehensiveFilters, { type ShopFilterPayload } from '../../components/shop/ComprehensiveFilters'

const Products: React.FC = () => {
    const { t } = useTranslation()
    const { } = useCategoryTranslation()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const [products, setProducts] = useState<Product[]>([])
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

    // Category and subcategory from URL - currently unused but kept for future functionality
    // const [categoryInfo, setCategoryInfo] = useState<{ category: Category | null; subcategory: Category | null }>({
    //     category: null,
    //     subcategory: null
    // })
    
    // Eye hygiene category info for banner
    const [eyeHygieneCategory, setEyeHygieneCategory] = useState<Category | null>(null)

    // Category and subcategory filters
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all')
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | number | null>(null)
    const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([])
    
    // Enhanced filters
    const [searchTerm, setSearchTerm] = useState('')
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
    const [gender, setGender] = useState<string>('')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [availableColors, setAvailableColors] = useState<string[]>([])
    const [availableBrands, setAvailableBrands] = useState<string[]>([])
    const [availableLensTypes, setAvailableLensTypes] = useState<string[]>([])
    const [availableLensCoatings, setAvailableLensCoatings] = useState<string[]>([])
    const [brand, setBrand] = useState<string>('')
    const [inStockOnly, setInStockOnly] = useState<boolean>(false)
    
    // Contact lens specific filters
    const [lensType, setLensType] = useState<string>('')
    const [lensCoating, setLensCoating] = useState<string>('')
    
    const [currentPage, setCurrentPage] = useState(1)
    const [sortBy, setSortBy] = useState<string>('newest') // 'newest', 'oldest', 'price_low', 'price_high', 'name'
    const [selectedProductForTryOn, setSelectedProductForTryOn] = useState<Product | null>(null)
    const [showTryOnModal, setShowTryOnModal] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const [frameShape, setFrameShape] = useState<string>('')
    const [frameMaterial, setFrameMaterial] = useState<string>('')
    const [isFeaturedOnly, setIsFeaturedOnly] = useState<boolean>(false)
    const [baseCurve, setBaseCurve] = useState<string>('')
    const [diameter, setDiameter] = useState<string>('')
    const [replacementPeriod, setReplacementPeriod] = useState<string>('')
    const [categoryText, setCategoryText] = useState<string>('')
    const [model, setModel] = useState<string>('')
    const [features, setFeatures] = useState<string>('')
    const [caliber, setCaliber] = useState<string>('')
    const [bridge, setBridge] = useState<string>('')
    const [temples, setTemples] = useState<string>('')

    const filtersCategorySlug = currentSection ?? ''

    const shopPageTitle = useMemo(() => {
        switch (currentSection) {
            case 'sunglasses':
                return t('shop.sectionSunglasses', 'Sunglasses')
            case 'eyeglasses':
                return t('shop.sectionEyeglasses', 'Eyeglasses')
            case 'contact-lenses':
                return t('shop.sectionContactLenses', 'Contact lenses')
            case 'eye-hygiene':
                return t('shop.sectionEyeHygiene', 'Eye hygiene')
            default:
                return t('shop.allProducts', 'All products')
        }
    }, [currentSection, t])

    const handleComprehensiveFilterChange = useCallback((filters: ShopFilterPayload) => {
        if ('minPrice' in filters) {
            setMinPrice(filters.minPrice)
            setCurrentPage(1)
        }
        if ('maxPrice' in filters) {
            setMaxPrice(filters.maxPrice)
            setCurrentPage(1)
        }
        if (filters.sortBy !== undefined) {
            setSortBy(filters.sortBy)
            setCurrentPage(1)
        }
        if (filters.color !== undefined) {
            setSelectedColor(filters.color ?? '')
            setCurrentPage(1)
        }
        if (filters.brand !== undefined) {
            setBrand(filters.brand ?? '')
            setCurrentPage(1)
        }
        if (filters.lensType !== undefined) {
            setLensType(filters.lensType ?? '')
            setCurrentPage(1)
        }
        if (filters.lensCoating !== undefined) {
            setLensCoating(filters.lensCoating ?? '')
            setCurrentPage(1)
        }
        if (filters.inStock !== undefined) {
            setInStockOnly(!!filters.inStock)
            setCurrentPage(1)
        }
        if (filters.search !== undefined) {
            setSearchTerm(filters.search ?? '')
            setCurrentPage(1)
        }
        if (filters.gender !== undefined) {
            setGender(filters.gender ?? '')
            setCurrentPage(1)
        }
        if (filters.frameShape !== undefined) {
            setFrameShape(filters.frameShape ?? '')
            setCurrentPage(1)
        }
        if (filters.frameMaterial !== undefined) {
            setFrameMaterial(filters.frameMaterial ?? '')
            setCurrentPage(1)
        }
        if (typeof filters.featuredOnly === 'boolean') {
            setIsFeaturedOnly(filters.featuredOnly)
            setCurrentPage(1)
        }
        if (filters.baseCurve !== undefined) {
            setBaseCurve(filters.baseCurve ?? '')
            setCurrentPage(1)
        }
        if (filters.diameter !== undefined) {
            setDiameter(filters.diameter ?? '')
            setCurrentPage(1)
        }
        if (filters.replacementPeriod !== undefined) {
            setReplacementPeriod(filters.replacementPeriod ?? '')
            setCurrentPage(1)
        }
        if (filters.categoryText !== undefined) {
            setCategoryText(filters.categoryText ?? '')
            setCurrentPage(1)
        }
        if (filters.model !== undefined) {
            setModel(filters.model ?? '')
            setCurrentPage(1)
        }
        if (filters.features !== undefined) {
            setFeatures(filters.features ?? '')
            setCurrentPage(1)
        }
        if (filters.caliber !== undefined) {
            setCaliber(filters.caliber ?? '')
            setCurrentPage(1)
        }
        if (filters.bridge !== undefined) {
            setBridge(filters.bridge ?? '')
            setCurrentPage(1)
        }
        if (filters.temples !== undefined) {
            setTemples(filters.temples ?? '')
            setCurrentPage(1)
        }
        if (filters.category !== undefined) {
            setSelectedCategory(filters.category ?? 'all')
            setCurrentPage(1)
        }
        if (filters.subcategory !== undefined) {
            setSelectedSubcategory(filters.subcategory ?? null)
            setCurrentPage(1)
        }
    }, [])

    const handleClearAllComprehensiveFilters = useCallback(() => {
        setSearchTerm('')
        setLensType('')
        setLensCoating('')
        setMinPrice(undefined)
        setMaxPrice(undefined)
        setGender('')
        setSelectedColor('')
        setBrand('')
        setInStockOnly(false)
        setSortBy('newest')
        setFrameShape('')
        setFrameMaterial('')
        setIsFeaturedOnly(false)
        setBaseCurve('')
        setDiameter('')
        setReplacementPeriod('')
        setCategoryText('')
        setModel('')
        setFeatures('')
        setCaliber('')
        setBridge('')
        setTemples('')
        setSelectedCategory('all')
        setSelectedSubcategory(null)
        setCurrentPage(1)
    }, [])

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
                // setCategoryInfo({ category, subcategory })
                // Category info state is currently unused but kept for future functionality
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
                        // Reset subcategory when category changes
                        setSelectedSubcategory(null)
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
                    setSelectedSubcategory(null)
                }
            }
        }

        fetchSubcategories()

        return () => {
            isCancelled = true
        }
    }, [selectedCategory])

    // Fetch eye-hygiene category for banner
    useEffect(() => {
        let isCancelled = false

        const fetchEyeHygieneCategory = async () => {
            try {
                const category = await getCategoryBySlug('eye-hygiene')
                if (!isCancelled && category) {
                    console.log('Eye-hygiene category found:', { id: category.id, name: category.name, slug: category.slug })
                    setEyeHygieneCategory(category)
                }
            } catch (error) {
                console.error('Error fetching eye-hygiene category:', error)
            }
        }

        fetchEyeHygieneCategory()

        return () => {
            isCancelled = true
        }
    }, [])

    // Fetch products when filters change
    useEffect(() => {
        let isCancelled = false
        // Set immediately so the header/grid don't show a stale "no results" line or wrong section while debounce runs
        setLoading(true)

        const fetchProducts = async () => {
            try {
                // loading already set when this effect runs (covers debounce delay)
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

                // Use section-specific endpoint if section is detected, otherwise use regular products endpoint
                const result = currentSection
                    ? await getProductsBySection(currentSection, filters)
                    : await getProducts(filters)
                if (isCancelled) return

                if (result) {
                    // Debug: Log filtering info for contact lenses
                    if (import.meta.env.DEV && currentSection === 'contact-lenses') {
                        console.log('🔍 Products.tsx - Contact lenses filters applied:', filters);
                        console.log('🔍 Products.tsx - Products received:', result.products?.length || 0);
                    }
                    
                        // Extract unique colors, brands, lens types, and coatings from all products
                        if (result.products && result.products.length > 0) {
                            const colorSet = new Set<string>()
                            const brandSet = new Set<string>()
                            const lensTypeSet = new Set<string>()
                            const lensCoatingSet = new Set<string>()
                            
                            result.products.forEach((product: Product) => {
                                const p = product as any
                                
                                // Extract colors
                                if (p.colors && Array.isArray(p.colors)) {
                                    p.colors.forEach((c: any) => {
                                        const colorName = c.display_name || c.name || c.value || c.color
                                        if (colorName) {
                                            colorSet.add(colorName)
                                        }
                                    })
                                }
                                if (product.color_images && Array.isArray(product.color_images)) {
                                    product.color_images.forEach((ci: any) => {
                                        const colorName = ci.display_name || ci.name || ci.color
                                        if (colorName) {
                                            colorSet.add(colorName)
                                        }
                                    })
                                }
                                
                                // Extract brands
                                if (product.brand) {
                                    brandSet.add(product.brand)
                                }
                                
                                // Extract lens types (for contact lenses)
                                if (p.lens_type) {
                                    lensTypeSet.add(p.lens_type)
                                }
                                
                                // Extract lens coatings (for contact lenses)
                                if (p.lens_coating) {
                                    lensCoatingSet.add(p.lens_coating)
                                }
                            })
                            
                            if (!isCancelled) {
                                setAvailableColors(Array.from(colorSet).sort())
                                setAvailableBrands(Array.from(brandSet).sort())
                                setAvailableLensTypes(Array.from(lensTypeSet).sort())
                                setAvailableLensCoatings(Array.from(lensCoatingSet).sort())
                            }
                        }

                    // Apply client-side filters
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
                    
                    // Filter by brand
                    if (brand && filteredProducts.length > 0) {
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            return product.brand && product.brand.toLowerCase() === brand.toLowerCase()
                        })
                    }
                    
                    // Filter by stock status
                    if (inStockOnly && filteredProducts.length > 0) {
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            return product.in_stock === true || (product as any).stock_quantity > 0
                        })
                    }
                    
                    // Filter by lens type (for contact lenses)
                    if (lensType && filteredProducts.length > 0) {
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            return p.lens_type && p.lens_type.toLowerCase() === lensType.toLowerCase()
                        })
                    }
                    
                    // Filter by lens coating (for contact lenses)
                    if (lensCoating && filteredProducts.length > 0) {
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            return p.lens_coating && p.lens_coating.toLowerCase() === lensCoating.toLowerCase()
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
                        const hasClientSideFilters = selectedColor || brand || inStockOnly || lensType || lensCoating
                        if (hasClientSideFilters && filteredProducts.length !== (result.products || []).length) {
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
    }, [selectedCategory, selectedSubcategory, searchTerm, minPrice, maxPrice, gender, selectedColor, brand, inStockOnly, lensType, lensCoating, currentPage, sortBy, currentSection, location.pathname])


    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <HeroSection />

            {/* Category-specific Banners Section */}
            {currentSection === 'eye-hygiene' && eyeHygieneCategory && (
                <CategoryBanner 
                    categoryName={eyeHygieneCategory.name} 
                    categoryId={eyeHygieneCategory.id}
                    position="category_page"
                />
            )}
            
            {/* Same small marquee banners as home (not the tall shop Campaigns strip) */}
            {currentSection !== 'eye-hygiene' && (
                <SmallSlidingBanners positionPriority={SHOP_SLIDING_BANNER_POSITION_PRIORITY} />
            )}


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

            {/* Main content: full-width grid + floating filters */}
            <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <div className="min-w-0 w-full">
                        <header className="mb-8 border-b border-slate-200/90 pb-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {shopPageTitle}
                                </h1>
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen(true)}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    {t('shop.filters.filters', 'Filters')}
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                                {loading
                                    ? '\u00a0'
                                    : products.length > 0
                                      ? pagination.total > 0
                                          ? `Showing ${products.length} of ${pagination.total} product${pagination.total === 1 ? '' : 's'}`
                                          : `${products.length} product${products.length === 1 ? '' : 's'}`
                                      : t('shop.noProductsMatch', 'No products match these filters')}
                            </p>
                        </header>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-6 lg:p-8">
                            {loading ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                                        >
                                            <div className="aspect-[4/3] rounded-xl bg-slate-200/80" />
                                            <div className="mt-4 h-4 w-[80%] rounded bg-slate-200/80" />
                                            <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : !products || products.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="mx-auto max-w-lg">
                                        <svg
                                            className="mx-auto mb-6 h-32 w-32 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <p className="mb-4 text-xl font-semibold text-gray-600 md:text-2xl">
                                            {t('shop.noProductsMatch', 'No products match these filters')}
                                        </p>
                                        <p className="mb-8 text-base text-gray-500">
                                            {t('shop.adjustFiltersHint', 'Try adjusting filters or browse another section.')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-4">
                                        {products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>

                                    {pagination && pagination.pages > 1 && (
                                        <div className="mt-12 flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                ← {t('shop.previous', 'Previous')}
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                                                    {currentPage}
                                                </span>
                                                <span className="font-medium text-gray-500">
                                                    of {pagination.pages}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePageChange(Math.min(pagination.pages, currentPage + 1))
                                                }
                                                disabled={currentPage === pagination.pages}
                                                className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {t('shop.next', 'Next')} →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ComprehensiveFilters
                onFilterChange={handleComprehensiveFilterChange}
                onClearAll={handleClearAllComprehensiveFilters}
                availableColors={availableColors}
                availableBrands={availableBrands}
                availableLensTypes={availableLensTypes}
                availableLensCoatings={availableLensCoatings}
                availableCategories={[
                    { id: 'men', name: 'Men', slug: 'men' },
                    { id: 'women', name: 'Women', slug: 'women' },
                    { id: 'kids', name: 'Kids', slug: 'kids' },
                ]}
                availableSubcategories={availableSubcategories}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                categoryLevel="category"
                categorySlug={filtersCategorySlug}
                showDesktopSidebar={false}
                filterDrawerOpen={filtersOpen}
                onFilterDrawerOpenChange={setFiltersOpen}
                showCloseButton
                onClose={() => setFiltersOpen(false)}
            />

            <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={`fixed bottom-6 right-6 z-[90] flex h-14 min-w-[3.5rem] items-center justify-center gap-2 rounded-full border-2 border-blue-600/25 bg-white px-3 text-blue-700 shadow-lg ring-1 ring-slate-900/5 transition-all hover:border-blue-600/40 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:bottom-8 sm:right-8 sm:min-w-0 sm:px-4 ${
                    filtersOpen ? 'pointer-events-none scale-95 opacity-0' : 'opacity-100'
                }`}
                aria-expanded={filtersOpen}
                aria-controls="shop-filters-panel"
                aria-label={t('shop.filters.filters', 'Filters')}
            >
                <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden pr-0.5 text-sm font-semibold sm:inline">{t('shop.filters.filters', 'Filters')}</span>
            </button>

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

