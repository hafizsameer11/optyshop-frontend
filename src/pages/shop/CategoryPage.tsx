import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { 
    getProducts, 
    type Product,
    type ProductFilters
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getCategoryBySlug, getSubcategoryBySlug, getSubcategoriesByCategoryId, type Category } from '../../services/categoriesService'

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>()
    const navigate = useNavigate()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryInfo, setCategoryInfo] = useState<{ category: Category | null; subcategory: Category | null }>({
        category: null,
        subcategory: null
    })
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [subcategories, setSubcategories] = useState<Category[]>([])

    // Fetch category and subcategory info
    useEffect(() => {
        let isCancelled = false

        const fetchCategoryInfo = async () => {
            if (!categorySlug) {
                navigate('/shop')
                return
            }

            let category: Category | null = null
            let subcategory: Category | null = null

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
                }

                if (!isCancelled) {
                    setCategoryInfo({ category, subcategory })
                    
                    // Fetch subcategories if viewing category (not subcategory)
                    if (category && !subcategory) {
                        try {
                            const fetchedSubcategories = await getSubcategoriesByCategoryId(category.id)
                            if (!isCancelled) {
                                setSubcategories(fetchedSubcategories)
                            }
                        } catch (error) {
                            console.error('Error fetching subcategories:', error)
                        }
                    } else {
                        setSubcategories([])
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching category info:', error)
                    navigate('/shop')
                }
            }
        }

        fetchCategoryInfo()

        return () => {
            isCancelled = true
        }
    }, [categorySlug, subcategorySlug, navigate])

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

                // If subcategory is selected, filter ONLY by subcategory
                // Otherwise, filter by category to show all products in that category
                // API expects slugs (strings) for category and subCategory parameters
                if (categoryInfo.subcategory) {
                    // Filter ONLY by subcategory - show only products linked to this subcategory
                    filters.subcategory = categoryInfo.subcategory.slug
                    // Explicitly exclude category filter to ensure only subcategory products are shown
                    delete filters.category
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for subcategory:', {
                            subcategoryId: categoryInfo.subcategory.id,
                            subcategoryName: categoryInfo.subcategory.name,
                            subcategorySlug: categoryInfo.subcategory.slug,
                            filters
                        })
                    }
                } else {
                    // Filter by category only - show all products linked to this category
                    filters.category = categoryInfo.category!.slug
                    // Explicitly exclude subcategory filter to show all category products
                    delete filters.subcategory
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for category:', {
                            categoryId: categoryInfo.category!.id,
                            categoryName: categoryInfo.category!.name,
                            categorySlug: categoryInfo.category!.slug,
                            filters
                        })
                    }
                }

                const result = await getProducts(filters)
                
                if (import.meta.env.DEV && result) {
                    console.log('📦 Products received:', {
                        count: result.products?.length || 0,
                        total: result.pagination?.total || 0,
                        products: result.products?.map(p => ({ id: p.id, name: p.name, category: p.category?.name, subcategory: (p as any).subcategory?.name }))
                    })
                }
                
                if (isCancelled) return

                if (result) {
                    setProducts(result.products || [])
                    setPagination(result.pagination || {
                        total: 0,
                        page: 1,
                        limit: 12,
                        pages: 0
                    })
                } else {
                    setProducts([])
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

        // Add a small delay to prevent rapid successive calls
        const timeoutId = setTimeout(() => {
            fetchProducts()
        }, 100)

        return () => {
            isCancelled = true
            clearTimeout(timeoutId)
        }
    }, [categoryInfo.category?.id, categoryInfo.subcategory?.id, currentPage])

    const handleAddToCart = (product: Product) => {
        try {
            const salePrice = product?.sale_price ? Number(product.sale_price) : null
            const regularPrice = product?.price ? Number(product.price) : 0
            const finalPrice = salePrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product?.id || 0,
                name: product?.name || '',
                brand: product?.brand || '',
                category: product?.category?.slug || 'eyeglasses',
                price: finalPrice,
                image: getProductImageUrl(product),
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

    if (!categoryInfo.category) {
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
                                : categoryInfo.category.name}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                            {categoryInfo.subcategory 
                                ? `Browse our collection of ${categoryInfo.subcategory.name}`
                                : `Discover our wide collection of ${categoryInfo.category.name}`}
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
                        <span className="text-gray-500">&gt;</span>
                        <Link 
                            to={`/category/${categoryInfo.category.slug}`}
                            className="hover:text-gray-700 transition-colors"
                        >
                            <span className="text-gray-900 uppercase">{categoryInfo.category.name}</span>
                        </Link>
                        {categoryInfo.subcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{categoryInfo.subcategory.name}</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Subcategories Section - Show when viewing category (not subcategory) */}
            {!categoryInfo.subcategory && subcategories.length > 0 && (
                <section className="bg-white py-8 px-4 sm:px-6 border-b border-gray-200">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                            Browse by Subcategory
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {subcategories.map((subcategory) => (
                                <Link
                                    key={subcategory.id}
                                    to={`/category/${categoryInfo.category!.slug}/${subcategory.slug}`}
                                    className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-4 md:p-6 text-center transition-all duration-300 hover:shadow-lg border border-blue-200 hover:border-blue-300"
                                >
                                    <div className="mb-2">
                                        {subcategory.image ? (
                                            <img
                                                src={subcategory.image}
                                                alt={subcategory.name}
                                                className="w-16 h-16 mx-auto object-contain rounded-lg"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 mx-auto bg-blue-200 rounded-lg flex items-center justify-center">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                                        {subcategory.name}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Products Grid */}
            <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    {/* Subcategory Info Banner - Show when viewing subcategory */}
                    {categoryInfo.subcategory && (
                        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Viewing subcategory:</p>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {categoryInfo.subcategory.name}
                                    </h2>
                                    {categoryInfo.subcategory.description && (
                                        <p className="text-gray-600 mt-2 max-w-2xl">
                                            {categoryInfo.subcategory.description}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    to={`/category/${categoryInfo.category.slug}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to {categoryInfo.category.name}
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                            <p className="mt-4 text-lg text-gray-600">Loading products...</p>
                        </div>
                    ) : !products || products.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="max-w-md mx-auto">
                                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-lg md:text-xl text-gray-600 mb-2 font-semibold">
                                    {categoryInfo.subcategory 
                                        ? `No products found in ${categoryInfo.subcategory.name}`
                                        : `No products found in ${categoryInfo.category.name}`}
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    {categoryInfo.subcategory 
                                        ? "This subcategory doesn't have any products yet."
                                        : "This category doesn't have any products yet."}
                                </p>
                                {categoryInfo.subcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category.slug}`}
                                        className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors mr-3"
                                    >
                                        View {categoryInfo.category.name} Products
                                    </Link>
                                ) : null}
                                <Link 
                                    to="/shop" 
                                    className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Browse All Products
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-8">
                                {products.map((product) => (
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
                                                    target.src = '/assets/images/frame1.png'
                                                }}
                                            />
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

                                            {/* Price */}
                                            <div className="mt-auto pt-4 border-t border-gray-200">
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

export default CategoryPage

