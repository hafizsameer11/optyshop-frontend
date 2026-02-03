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
    type Product,
    type ProductFilters
} from '../../services/productsService'
import CategoryBanner from '../../components/home/CategoryBanner'
import CategoryNavigation from '../../components/shop/CategoryNavigation'
import ProductCard from '../../components/products/ProductCard'
import ComprehensiveFilters from '../../components/shop/ComprehensiveFilters'
import BannerDebug from '../../components/debug/BannerDebug'

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
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

    // Enhanced Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [lensType, setLensType] = useState<string>('')
    const [lensCoating, setLensCoating] = useState<string>('')
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
    const [gender, setGender] = useState<string>('')
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [availableColors, setAvailableColors] = useState<string[]>([])
    const [availableBrands, setAvailableBrands] = useState<string[]>([])
    const [availableLensTypes, setAvailableLensTypes] = useState<string[]>([])
    const [availableLensCoatings, setAvailableLensCoatings] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<string>('newest')
    const [brand, setBrand] = useState<string>('')
    const [inStockOnly, setInStockOnly] = useState<boolean>(false)

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

                if (brand) {
                    filters.brand = brand
                }

                if (inStockOnly) {
                    filters.inStock = true
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
    }, [categoryInfo.category?.id, categoryInfo.subcategory?.id, categoryInfo.subSubcategory?.id, currentPage, searchTerm, lensType, lensCoating, minPrice, maxPrice, gender, selectedColor, brand, inStockOnly, sortBy])

    
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
                    categoryId={categoryInfo.category?.id || 0}
                    subcategoryId={
                        categoryInfo.subSubcategory?.id || 
                        categoryInfo.subcategory?.id
                    }
                    position={categoryInfo.subSubcategory ? "sub_subcategory_page" : categoryInfo.subcategory ? "subcategory_page" : "category_page"}
                />
            )}

            {/* Enhanced Category Navigation with Comprehensive Filters */}
            <CategoryNavigation 
                category={categoryInfo.category}
                subcategory={categoryInfo.subcategory}
                subSubcategory={categoryInfo.subSubcategory}
                onFilterChange={(filters) => {
                    // Apply filters from category navigation component (limited set)
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
                }}
            />
            
            {/* Comprehensive Filters */}
            <div className="max-w-screen-2xl mx-auto px-4 mb-3">
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
                        if (filters.searchTerm !== undefined) {
                            setSearchTerm(filters.searchTerm)
                            setCurrentPage(1)
                        }
                    }}
                    availableColors={availableColors}
                    availableBrands={availableBrands}
                    availableLensTypes={availableLensTypes}
                    availableLensCoatings={availableLensCoatings}
                    categoryLevel={
                        categoryInfo.subSubcategory ? 'subsubcategory' :
                        categoryInfo.subcategory ? 'subcategory' : 'category'
                    }
                />
            </div>

            {/* Debug Banner Information - Only in development */}
            {import.meta.env.DEV && categoryInfo.category && (
                <div className="max-w-screen-2xl mx-auto px-4 mb-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Banner Debug Information</h3>
                        <BannerDebug />
                    </div>
                </div>
            )}

            {/* Page Content */}
            <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 py-1 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-screen-2xl mx-auto">
                    {/* Subcategory/Sub-subcategory Info Banner */}
                    {(categoryInfo.subcategory || categoryInfo.subSubcategory) && (
                        <div className="mb-2 bg-white rounded-xl shadow-md p-3 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h2 className="text-base md:text-lg font-bold text-gray-900">
                                        {categoryInfo.subSubcategory 
                                            ? `${translateCategory(categoryInfo.subSubcategory)} (Sub-subcategory)`
                                            : `${translateCategory(categoryInfo.subcategory)} (Subcategory)`}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}

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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-16 px-4 lg:px-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
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
