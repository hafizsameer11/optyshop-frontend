import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { 
    getProducts, 
    type Product,
    type ProductFilters
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import { getCategoryBySlug, getSubcategoryBySlug, type Category } from '../../services/categoriesService'

const CategoryPage: React.FC = () => {
    const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()
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
                // Otherwise, filter by category
                if (categoryInfo.subcategory) {
                    // Filter ONLY by subcategory - this should return only products in this subcategory
                    filters.subcategory = categoryInfo.subcategory.id
                    // Don't include category filter when subcategory is selected - let API handle subcategory filtering
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for subcategory:', {
                            subcategoryId: categoryInfo.subcategory.id,
                            subcategoryName: categoryInfo.subcategory.name,
                            subcategorySlug: categoryInfo.subcategory.slug,
                            filters
                        })
                    }
                } else {
                    // Filter by category only - show products directly in this category
                    filters.category = categoryInfo.category!.id
                    
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
                        <span className="text-gray-900 uppercase">{categoryInfo.category.name}</span>
                        {categoryInfo.subcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{categoryInfo.subcategory.name}</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

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
                            <p className="text-lg md:text-xl text-gray-600 mb-4">
                                No products found in this category.
                            </p>
                            <Link 
                                to="/shop" 
                                className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
                            >
                                Browse All Products
                            </Link>
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
                                                const stockStatus = p.stock_status || product.in_stock
                                                const stockQty = product.stock_quantity
                                                
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

export default CategoryPage

