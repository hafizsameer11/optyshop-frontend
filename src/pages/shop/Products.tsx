import React, { useState, useEffect } from 'react'
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
import Campaigns from '../../components/home/Campaigns'
import ProductCard from '../../components/products/ProductCard'
import HeroSection from '../../components/shop/HeroSection'
import ComprehensiveFilters from '../../components/shop/ComprehensiveFilters'

const Products: React.FC = () => {
    const { } = useTranslation()
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
            
            {/* General Campaigns Section - Show for non-specific categories */}
            {currentSection !== 'eye-hygiene' && (
                <Campaigns position="shop" variant="compact" />
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

            
            {/* Main Content Area with Sidebar */}
            <div className="w-[90%] mx-auto max-w-screen-2xl px-4 sm:px-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <ComprehensiveFilters
                            onFilterChange={(filters) => {
                                // Apply filters from comprehensive filter component
                                if (filters.gender !== undefined) {
                                    setGender(filters.gender)
                                    setCurrentPage(1)
                                }
                                if (filters.minPrice !== undefined) {
                                    setMinPrice(filters.minPrice)
                                    setCurrentPage(1)
                                }
                                if (filters.maxPrice !== undefined) {
                                    setMaxPrice(filters.maxPrice)
                                    setCurrentPage(1)
                                }
                                if (filters.sortBy !== undefined) {
                                    setSortBy(filters.sortBy)
                                    setCurrentPage(1)
                                }
                                if (filters.color !== undefined) {
                                    setSelectedColor(filters.color)
                                    setCurrentPage(1)
                                }
                                if (filters.brand !== undefined) {
                                    setBrand(filters.brand)
                                    setCurrentPage(1)
                                }
                                if (filters.lensType !== undefined) {
                                    setLensType(filters.lensType)
                                    setCurrentPage(1)
                                }
                                if (filters.lensCoating !== undefined) {
                                    setLensCoating(filters.lensCoating)
                                    setCurrentPage(1)
                                }
                                if (filters.inStock !== undefined) {
                                    setInStockOnly(filters.inStock)
                                    setCurrentPage(1)
                                }
                                if (filters.search !== undefined) {
                                    if (import.meta.env.DEV) {
                                        console.log('🔍 Products.tsx received search term:', filters.search)
                                    }
                                    setSearchTerm(filters.search)
                                    setCurrentPage(1)
                                }
                                if (filters.category !== undefined) {
                                    setSelectedCategory(filters.category)
                                    setCurrentPage(1)
                                }
                                if (filters.subcategory !== undefined) {
                                    setSelectedSubcategory(filters.subcategory)
                                    setCurrentPage(1)
                                }
                            }}
                            availableColors={availableColors}
                            availableBrands={availableBrands}
                            availableLensTypes={availableLensTypes}
                            availableLensCoatings={availableLensCoatings}
                            availableCategories={[
                                { id: 'men', name: 'Men', slug: 'men' },
                                { id: 'women', name: 'Women', slug: 'women' },
                                { id: 'kids', name: 'Kids', slug: 'kids' }
                            ]} // Sample categories for demonstration
                            availableSubcategories={availableSubcategories}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            categoryLevel="category"
                            className="sticky top-24"
                        />
                    </div>

                    {/* Products Content */}
                    <div className="flex-1">
                        {/* Products Grid */}
                        <div className="bg-white rounded-lg">
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
                                <div className="max-h-[80vh] overflow-y-auto pr-2">
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
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
                                </>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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

