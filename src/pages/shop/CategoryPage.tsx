import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getProducts, 
    type Product,
    type ProductFilters
} from '../../services/productsService'
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import { useWishlist } from '../../context/WishlistContext'
import { 
    getCategoryBySlug, 
    getSubcategoryBySlug, 
    getSubcategoriesByCategoryId, 
    getNestedSubcategoriesByParentId,
    type Category 
} from '../../services/categoriesService'

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { categorySlug, subcategorySlug, subSubcategorySlug } = useParams<{ 
        categorySlug: string; 
        subcategorySlug?: string;
        subSubcategorySlug?: string;
    }>()
    const navigate = useNavigate()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryInfo, setCategoryInfo] = useState<{ 
        category: Category | null; 
        subcategory: Category | null;
        subSubcategory: Category | null;
    }>({
        category: null,
        subcategory: null,
        subSubcategory: null
    })
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [subcategories, setSubcategories] = useState<Category[]>([])
    const [subSubcategories, setSubSubcategories] = useState<Category[]>([])
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
        const hasColorImages = Boolean(product.color_images && product.color_images.length > 0)
        
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
                            subSubcategory = nestedSubcategories.find(sub => 
                                sub.slug.toLowerCase() === subSubcategorySlug.toLowerCase()
                            ) || null
                            
                            if (import.meta.env.DEV) {
                                console.log('🔍 Looking for sub-subcategory:', {
                                    requestedSlug: subSubcategorySlug,
                                    availableSubcategories: nestedSubcategories.map(s => ({
                                        id: s.id,
                                        name: s.name,
                                        slug: s.slug
                                    })),
                                    found: !!subSubcategory
                                })
                            }
                            
                            if (!subSubcategory) {
                                console.warn(`⚠️ Sub-subcategory "${subSubcategorySlug}" not found under subcategory "${subcategory.name}"`)
                                navigate(`/category/${categorySlug}/${subcategorySlug}`)
                                return
                            }
                            
                            if (import.meta.env.DEV) {
                                console.log('✅ Sub-subcategory found:', {
                                    id: subSubcategory.id,
                                    name: subSubcategory.name,
                                    slug: subSubcategory.slug
                                })
                            }
                        }
                    }
                }

                if (!isCancelled) {
                    setCategoryInfo({ category, subcategory, subSubcategory })
                    
                    // Reset to first page when category/subcategory/sub-subcategory changes
                    setCurrentPage(1)
                    
                    // Fetch subcategories if viewing category (not subcategory or sub-subcategory)
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
                    
                    // Fetch sub-subcategories if viewing subcategory (not sub-subcategory)
                    if (subcategory && !subSubcategory) {
                        try {
                            const fetchedSubSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                            if (!isCancelled) {
                                setSubSubcategories(fetchedSubSubcategories)
                            }
                        } catch (error) {
                            console.error('Error fetching sub-subcategories:', error)
                        }
                    } else {
                        setSubSubcategories([])
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

                // Filter products based on category hierarchy
                // Priority: sub-subcategory > subcategory > category
                // API expects slugs (strings) for category and subCategory parameters
                if (categoryInfo.subSubcategory) {
                    // Filter ONLY by sub-subcategory - show only products linked to this sub-subcategory
                    // Use sub-subcategory slug to filter products - API will return only products from this sub-subcategory
                    filters.subcategory = categoryInfo.subSubcategory.slug
                    // Explicitly exclude category filter to ensure only sub-subcategory products are shown
                    delete filters.category
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for sub-subcategory:', {
                            subSubcategoryId: categoryInfo.subSubcategory.id,
                            subSubcategoryName: categoryInfo.subSubcategory.name,
                            subSubcategorySlug: categoryInfo.subSubcategory.slug,
                            parentSubcategoryId: categoryInfo.subcategory?.id,
                            parentSubcategoryName: categoryInfo.subcategory?.name,
                            filters
                        })
                    }
                } else if (categoryInfo.subcategory) {
                    // Filter ONLY by subcategory - show only products directly linked to this subcategory
                    // Note: This will show products from the subcategory but NOT from its sub-subcategories
                    // To see sub-subcategory products, user must navigate to that sub-subcategory page
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
                        products: result.products?.map(p => ({ 
                            id: p.id, 
                            name: p.name, 
                            category: p.category?.name, 
                            subcategory: (p as any).subcategory?.name,
                            subcategorySlug: (p as any).subcategory?.slug,
                            expectedSubSubcategorySlug: categoryInfo.subSubcategory?.slug
                        }))
                    })
                    
                    // Verify that products match the selected sub-subcategory
                    if (categoryInfo.subSubcategory && result.products) {
                        const mismatchedProducts = result.products.filter(p => {
                            const productSubcategorySlug = (p as any).subcategory?.slug
                            return productSubcategorySlug !== categoryInfo.subSubcategory?.slug
                        })
                        if (mismatchedProducts.length > 0) {
                            console.warn('⚠️ Some products do not match the selected sub-subcategory:', {
                                expectedSlug: categoryInfo.subSubcategory.slug,
                                mismatchedProducts: mismatchedProducts.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    actualSubcategorySlug: (p as any).subcategory?.slug
                                }))
                            })
                        } else {
                            console.log('✅ All products match the selected sub-subcategory:', categoryInfo.subSubcategory.slug)
                        }
                    }
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
    }, [categoryInfo.category?.id, categoryInfo.subcategory?.id, categoryInfo.subSubcategory?.id, currentPage])

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
                            {categoryInfo.subSubcategory 
                                ? translateCategory(categoryInfo.subSubcategory)
                                : categoryInfo.subcategory 
                                ? translateCategory(categoryInfo.subcategory)
                                : translateCategory(categoryInfo.category)}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                            {categoryInfo.subSubcategory 
                                ? t('shop.browseCollection', { name: translateCategory(categoryInfo.subSubcategory) })
                                : categoryInfo.subcategory 
                                ? t('shop.browseCollection', { name: translateCategory(categoryInfo.subcategory) })
                                : t('shop.discoverCollection', { name: translateCategory(categoryInfo.category) })}
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
                            <span className="text-gray-900 uppercase">{translateCategory(categoryInfo.category)}</span>
                        </Link>
                        {categoryInfo.subcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                {categoryInfo.subSubcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category.slug}/${categoryInfo.subcategory.slug}`}
                                        className="hover:text-gray-700 transition-colors"
                                    >
                                        <span className="text-gray-700 uppercase">{translateCategory(categoryInfo.subcategory)}</span>
                                    </Link>
                                ) : (
                                    <span className="text-gray-900 uppercase">{translateCategory(categoryInfo.subcategory)}</span>
                                )}
                            </>
                        )}
                        {categoryInfo.subSubcategory && (
                            <>
                                <span className="text-gray-500">&gt;</span>
                                <span className="text-gray-900 uppercase">{translateCategory(categoryInfo.subSubcategory)}</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Subcategories Section - Show when viewing category (not subcategory or sub-subcategory) */}
            {!categoryInfo.subcategory && !categoryInfo.subSubcategory && subcategories.length > 0 && (
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
                                                alt={translateCategory(subcategory)}
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
                                        {translateCategory(subcategory)}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Sub-subcategories Section - Show when viewing subcategory (not sub-subcategory) */}
            {categoryInfo.subcategory && !categoryInfo.subSubcategory && subSubcategories.length > 0 && (
                <section className="bg-white py-8 px-4 sm:px-6 border-b border-gray-200">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                            Browse by Sub-subcategory
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {subSubcategories.map((subSubcategory) => (
                                <Link
                                    key={subSubcategory.id}
                                    to={`/category/${categoryInfo.category!.slug}/${categoryInfo.subcategory!.slug}/${subSubcategory.slug}`}
                                    className="group bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-lg p-4 md:p-6 text-center transition-all duration-300 hover:shadow-lg border border-cyan-200 hover:border-cyan-300"
                                >
                                    <div className="mb-2">
                                        {subSubcategory.image ? (
                                            <img
                                                src={subSubcategory.image}
                                                alt={translateCategory(subSubcategory)}
                                                className="w-16 h-16 mx-auto object-contain rounded-lg"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 mx-auto bg-cyan-200 rounded-lg flex items-center justify-center">
                                                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-cyan-900 transition-colors">
                                        {translateCategory(subSubcategory)}
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
                    {/* Subcategory/Sub-subcategory Info Banner */}
                    {(categoryInfo.subcategory || categoryInfo.subSubcategory) && (
                        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {categoryInfo.subSubcategory ? 'Viewing sub-subcategory:' : 'Viewing subcategory:'}
                                    </p>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {categoryInfo.subSubcategory 
                                            ? translateCategory(categoryInfo.subSubcategory)
                                            : translateCategory(categoryInfo.subcategory)}
                                    </h2>
                                    {(categoryInfo.subSubcategory?.description || categoryInfo.subcategory?.description) && (
                                        <p className="text-gray-600 mt-2 max-w-2xl">
                                            {categoryInfo.subSubcategory?.description || categoryInfo.subcategory?.description}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    to={categoryInfo.subSubcategory 
                                        ? `/category/${categoryInfo.category.slug}/${categoryInfo.subcategory?.slug}`
                                        : `/category/${categoryInfo.category.slug}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    {categoryInfo.subSubcategory 
                                        ? `${t('common.back')} ${translateCategory(categoryInfo.subcategory)}`
                                        : `${t('common.back')} ${translateCategory(categoryInfo.category)}`}
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
                                    {categoryInfo.subSubcategory 
                                        ? t('shop.noProducts', { category: translateCategory(categoryInfo.subSubcategory) })
                                        : categoryInfo.subcategory 
                                        ? t('shop.noProducts', { category: translateCategory(categoryInfo.subcategory) })
                                        : t('shop.noProducts', { category: translateCategory(categoryInfo.category) })}
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    {categoryInfo.subSubcategory 
                                        ? "This sub-subcategory doesn't have any products yet."
                                        : categoryInfo.subcategory 
                                        ? "This subcategory doesn't have any products yet."
                                        : "This category doesn't have any products yet."}
                                </p>
                                {categoryInfo.subSubcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category.slug}/${categoryInfo.subcategory?.slug}`}
                                        className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors mr-3"
                                    >
                                        {t('shop.viewProducts', { category: translateCategory(categoryInfo.subcategory) })}
                                    </Link>
                                ) : categoryInfo.subcategory ? (
                                    <Link 
                                        to={`/category/${categoryInfo.category.slug}`}
                                        className="inline-block px-6 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors mr-3"
                                    >
                                        {t('shop.viewProducts', { category: translateCategory(categoryInfo.category) })}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                                {products.map((product) => {
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
            <VirtualTryOnModal
                open={showTryOnModal}
                onClose={() => setShowTryOnModal(false)}
                selectedProduct={selectedProductForTryOn}
            />
        </div>
    )
}

export default CategoryPage

