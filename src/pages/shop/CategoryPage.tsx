import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Banner from '../../components/home/Banner'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getProducts, 
    type Product,
    type ProductFilters
} from '../../services/productsService'
// Removed contact lens config service import - no longer needed
import { getProductImageUrl } from '../../utils/productImage'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
// ContactLensConfiguration component removed - contact lens forms are handled in ProductDetail page
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
    // Removed: Contact lens configuration modal - forms are handled in ProductDetail page
    const [productColorSelections, setProductColorSelections] = useState<Record<number, string>>({})
    const [hoverColorCycles, setHoverColorCycles] = useState<Record<number, number>>({}) // Track current hover color index per product
    const [isHovering, setIsHovering] = useState<Record<number, boolean>>({}) // Track if product is being hovered
    const [imageOpacity, setImageOpacity] = useState<Record<number, number>>({}) // Track image opacity for fade effect
    const hoverIntervals = useRef<Record<number, NodeJS.Timeout>>({}) // Store intervals for cleanup

    // Helper function to check if we're on a contact lens sub-subcategory page (Spherical or Astigmatism)
    const isContactLensSubSubcategory = (): boolean => {
        if (!categoryInfo.subSubcategory) return false
        
        const subSubcategoryName = (categoryInfo.subSubcategory.name || '').toLowerCase()
        const subSubcategorySlug = (categoryInfo.subSubcategory.slug || '').toLowerCase()
        
        // Check for Spherical
        const isSpherical = subSubcategoryName.includes('spherical') || 
                          subSubcategoryName.includes('sferiche') || 
                          subSubcategoryName.includes('sferica') ||
                          subSubcategorySlug.includes('spherical') ||
                          subSubcategorySlug.includes('sferiche') ||
                          subSubcategorySlug.includes('sferica')
        
        // Check for Astigmatism
        const isAstigmatism = subSubcategoryName.includes('astigmatism') || 
                             subSubcategoryName.includes('astigmatismo') || 
                             subSubcategoryName.includes('toric') ||
                             subSubcategoryName.includes('torica') ||
                             subSubcategorySlug.includes('astigmatism') ||
                             subSubcategorySlug.includes('astigmatismo') ||
                             subSubcategorySlug.includes('toric') ||
                             subSubcategorySlug.includes('torica')
        
        return isSpherical || isAstigmatism
    }

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
                            const subSubcategorySlugLower = (subSubcategorySlug || '').toLowerCase()
                            subSubcategory = nestedSubcategories.find(sub => 
                                sub.slug && sub.slug.toLowerCase() === subSubcategorySlugLower
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
                // Products should appear on all their parent category pages:
                // - Category page: Shows all products in category (including subcategories and sub-subcategories)
                // - Subcategory page: Shows all products in subcategory (including sub-subcategories)
                // - Sub-subcategory page: Shows products in sub-subcategory
                // API expects slugs (strings) for category and subCategory parameters
                if (categoryInfo.subSubcategory) {
                    // For sub-subcategory pages, fetch ALL products from parent subcategory first
                    // Then filter client-side to show only products linked to this sub-subcategory
                    // This ensures we get all products that might be linked to the sub-subcategory
                    if (categoryInfo.subcategory) {
                        // Fetch all products from parent subcategory (API limit is 100, so we'll fetch multiple pages if needed)
                        filters.subcategory = categoryInfo.subcategory.slug
                        filters.category = categoryInfo.category!.slug
                        filters.page = 1
                        filters.limit = 100 // API maximum limit
                    } else {
                        // Fallback: try filtering by sub-subcategory slug directly
                    filters.subcategory = categoryInfo.subSubcategory.slug
                        filters.category = categoryInfo.category!.slug
                    }
                    
                    // Check if this is a spherical sub-subcategory page
                    const subSubcategoryName = (categoryInfo.subSubcategory.name || '').toLowerCase()
                    const subSubcategorySlug = (categoryInfo.subSubcategory.slug || '').toLowerCase()
                    const isSphericalPage = subSubcategoryName.includes('spherical') || 
                                           subSubcategoryName.includes('sferiche') || 
                                           subSubcategoryName.includes('sferica') ||
                                           subSubcategorySlug.includes('spherical') ||
                                           subSubcategorySlug.includes('sferiche') ||
                                           subSubcategorySlug.includes('sferica')
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for sub-subcategory:', {
                            subSubcategoryId: categoryInfo.subSubcategory.id,
                            subSubcategoryName: categoryInfo.subSubcategory.name,
                            subSubcategorySlug: categoryInfo.subSubcategory.slug,
                            parentSubcategoryId: categoryInfo.subcategory?.id,
                            parentSubcategoryName: categoryInfo.subcategory?.name,
                            parentSubcategorySlug: categoryInfo.subcategory?.slug,
                            isSphericalPage,
                            filters
                        })
                    }
                } else if (categoryInfo.subcategory) {
                    // Filter by subcategory AND category - show all products in this subcategory
                    // This includes products directly linked to subcategory AND products in its sub-subcategories
                    filters.subcategory = categoryInfo.subcategory.slug
                    filters.category = categoryInfo.category!.slug
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Fetching products for subcategory:', {
                            subcategoryId: categoryInfo.subcategory.id,
                            subcategoryName: categoryInfo.subcategory.name,
                            subcategorySlug: categoryInfo.subcategory.slug,
                            categorySlug: categoryInfo.category!.slug,
                            filters
                        })
                    }
                } else {
                    // Filter by category only - show all products linked to this category
                    // This includes products in all subcategories and sub-subcategories
                    filters.category = categoryInfo.category!.slug
                    // Don't set subcategory filter to get all products in the category
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

                let result = await getProducts(filters)
                
                // If we got an error (400 Bad Request) when filtering by subcategory, 
                // fall back to fetching by category only
                if (!result && (categoryInfo.subcategory || categoryInfo.subSubcategory)) {
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ Failed to fetch products with subcategory filter, falling back to category only:', {
                            subcategory: categoryInfo.subcategory?.slug,
                            subSubcategory: categoryInfo.subSubcategory?.slug,
                            category: categoryInfo.category!.slug
                        })
                    }
                    
                    // Try fetching by category only
                    const fallbackFilters: ProductFilters = {
                        page: currentPage,
                        limit: categoryInfo.subSubcategory ? 100 : 12,
                        category: categoryInfo.category!.slug
                    }
                    delete fallbackFilters.subcategory
                    
                    result = await getProducts(fallbackFilters)
                    
                    if (import.meta.env.DEV && result) {
                        console.log('✅ Fallback fetch successful, got products by category:', {
                            count: result.products?.length || 0
                        })
                    }
                }
                
                // For sub-subcategory pages, fetch all products from parent subcategory (multiple pages if needed)
                if (categoryInfo.subSubcategory && categoryInfo.subcategory && result && result.products) {
                    // If there are more pages, fetch them all
                    if (result.pagination && result.pagination.pages > 1) {
                        const allProducts = [...result.products]
                        const totalPages = result.pagination.pages
                        
                        // Fetch remaining pages
                        for (let page = 2; page <= totalPages; page++) {
                            const pageFilters: ProductFilters = {
                                ...filters,
                                page: page,
                                limit: 100
                            }
                            const pageResult = await getProducts(pageFilters)
                            if (pageResult && pageResult.products) {
                                allProducts.push(...pageResult.products)
                            }
                        }
                        
                        // Update result with all products
                        result.products = allProducts
                        if (import.meta.env.DEV) {
                            console.log(`✅ Fetched all ${allProducts.length} products from ${totalPages} pages`)
                        }
                    }
                }
                
                // Filter products by sub-subcategory if we're on a sub-subcategory page
                if (categoryInfo.subSubcategory && result && result.products) {
                    // Filter products to only show those linked to this specific sub-subcategory
                    const subSubcategoryId = categoryInfo.subSubcategory.id
                    const subSubcategorySlug = categoryInfo.subSubcategory.slug
                    
                    const filteredProducts = result.products.filter((p: any) => {
                        // Check if product's subcategory matches the sub-subcategory
                        // API can return subcategory (lowercase) or subCategory (camelCase) or sub_category_id
                        const productSubcategoryId = p.subcategory?.id || p.subCategory?.id || p.sub_category_id
                        const productSubcategorySlug = p.subcategory?.slug || p.subCategory?.slug
                        
                        // Match by ID (most reliable) or slug
                        const matchesSubSubcategory = 
                            productSubcategoryId === subSubcategoryId ||
                            (productSubcategorySlug && productSubcategorySlug.toLowerCase() === subSubcategorySlug.toLowerCase())
                        
                        return matchesSubSubcategory
                    })
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 Filtered products by sub-subcategory:', {
                            subSubcategoryId,
                            subSubcategorySlug,
                            totalProducts: result.products.length,
                            filteredProducts: filteredProducts.length,
                            products: filteredProducts.map((p: any) => ({
                                id: p.id,
                                name: p.name,
                                subcategoryId: p.subcategory?.id || p.subCategory?.id || p.sub_category_id,
                                subcategorySlug: p.subcategory?.slug || p.subCategory?.slug,
                                subcategoryName: p.subcategory?.name || p.subCategory?.name,
                                rawSubcategory: p.subcategory,
                                rawSubCategory: p.subCategory,
                                sub_category_id: p.sub_category_id
                            }))
                        })
                    }
                    
                    // Apply pagination to filtered products
                    const limit = 12 // Use standard page limit
                    const totalCount = filteredProducts.length
                    const startIndex = (currentPage - 1) * limit
                    const endIndex = startIndex + limit
                    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
                    
                    // Update result with paginated filtered products
                    result.products = paginatedProducts
                    result.pagination = {
                        total: totalCount,
                        page: currentPage,
                        limit: limit,
                        pages: Math.ceil(totalCount / limit)
                    }
                }
                
                // If on a spherical sub-subcategory page, also fetch spherical-related products from parent subcategory
                if (categoryInfo.subSubcategory && categoryInfo.subcategory) {
                    const subSubcategoryName = (categoryInfo.subSubcategory.name || '').toLowerCase()
                    const subSubcategorySlug = (categoryInfo.subSubcategory.slug || '').toLowerCase()
                    const isSphericalPage = subSubcategoryName.includes('spherical') || 
                                           subSubcategoryName.includes('sferiche') || 
                                           subSubcategoryName.includes('sferica') ||
                                           subSubcategorySlug.includes('spherical') ||
                                           subSubcategorySlug.includes('sferiche') ||
                                           subSubcategorySlug.includes('sferica')
                    
                    if (isSphericalPage) {
                        // Fetch additional products from parent subcategory that are spherical-related
                        // Fetch all pages if needed (API limit is 100 per page)
                        const parentSubcategoryFilters: ProductFilters = {
                            page: 1,
                            limit: 100, // API maximum limit
                            category: categoryInfo.category!.slug,
                            subcategory: categoryInfo.subcategory.slug
                        }
                        
                        let parentSubcategoryResult = await getProducts(parentSubcategoryFilters)
                        
                        // If there are more pages, fetch them all
                        if (parentSubcategoryResult && parentSubcategoryResult.pagination && parentSubcategoryResult.pagination.pages > 1) {
                            const allProducts = [...parentSubcategoryResult.products]
                            const totalPages = parentSubcategoryResult.pagination.pages
                            
                            // Fetch remaining pages
                            for (let page = 2; page <= totalPages; page++) {
                                const pageFilters: ProductFilters = {
                                    ...parentSubcategoryFilters,
                                    page: page
                                }
                                const pageResult = await getProducts(pageFilters)
                                if (pageResult && pageResult.products) {
                                    allProducts.push(...pageResult.products)
                                }
                            }
                            
                            // Update result with all products
                            parentSubcategoryResult.products = allProducts
                            if (import.meta.env.DEV) {
                                console.log(`✅ Fetched all ${allProducts.length} products from ${totalPages} pages for spherical filtering`)
                            }
                        }
                        
                        if (parentSubcategoryResult && parentSubcategoryResult.products) {
                            const subSubcategoryId = categoryInfo.subSubcategory.id
                            const subSubcategorySlug = categoryInfo.subSubcategory.slug
                            
                            // Filter for spherical-related products that match the sub-subcategory
                            const sphericalProducts = parentSubcategoryResult.products.filter((p: any) => {
                                // First check if product matches the sub-subcategory
                                // API can return subcategory (lowercase) or subCategory (camelCase) or sub_category_id
                                const productSubcategoryId = p.subcategory?.id || p.subCategory?.id || p.sub_category_id
                                const productSubcategorySlug = p.subcategory?.slug || p.subCategory?.slug
                                const productSubcategoryName = (p.subcategory?.name || p.subCategory?.name || '').toLowerCase()
                                
                                const matchesSubSubcategory = 
                                    productSubcategoryId === subSubcategoryId ||
                                    (productSubcategorySlug && productSubcategorySlug.toLowerCase() === subSubcategorySlug.toLowerCase())
                                
                                // Also check if product is spherical-related (for additional products from parent)
                                const contactLensType = (p.contact_lens_type || '').toLowerCase()
                                const isSphericalProduct = 
                                    contactLensType.includes('spherical') ||
                                    contactLensType.includes('sferiche') ||
                                    contactLensType.includes('sferica') ||
                                    productSubcategoryName.includes('spherical') ||
                                    productSubcategoryName.includes('sferiche') ||
                                    productSubcategoryName.includes('sferica') ||
                                    (productSubcategorySlug && productSubcategorySlug.includes('spherical')) ||
                                    (productSubcategorySlug && productSubcategorySlug.includes('sferiche')) ||
                                    (productSubcategorySlug && productSubcategorySlug.includes('sferica'))
                                
                                // Include products that match sub-subcategory OR are spherical-related
                                return matchesSubSubcategory || isSphericalProduct
                            })
                            
                            // Combine and deduplicate products (sub-subcategory products first, then spherical)
                            if (result && result.products) {
                                const existingIds = new Set(result.products.map(p => p.id))
                                const newSphericalProducts = sphericalProducts.filter((p: Product) => !existingIds.has(p.id))
                                
                                // Combine all products (sub-subcategory products first)
                                const allProducts = [...result.products, ...newSphericalProducts]
                                const totalCount = allProducts.length
                                const limit = 12 // Use standard page limit
                                
                                // Apply pagination to combined results
                                const startIndex = (currentPage - 1) * limit
                                const endIndex = startIndex + limit
                                const paginatedProducts = allProducts.slice(startIndex, endIndex)
                                
                                result.products = paginatedProducts
                                result.pagination = {
                                    total: totalCount,
                                    page: currentPage,
                                    limit: limit,
                                    pages: Math.ceil(totalCount / limit)
                                }
                                
                                if (import.meta.env.DEV) {
                                    console.log('✅ Added spherical-related products:', {
                                        originalCount: result.products.length - newSphericalProducts.length,
                                        addedCount: newSphericalProducts.length,
                                        totalCount: totalCount,
                                        currentPage: currentPage,
                                        showing: paginatedProducts.length
                                    })
                                }
                            } else if (sphericalProducts.length > 0) {
                                // If no result from sub-subcategory, use spherical products from parent
                                const limit = 12
                                const startIndex = (currentPage - 1) * limit
                                const endIndex = startIndex + limit
                                const paginatedProducts = sphericalProducts.slice(startIndex, endIndex)
                                
                                result = {
                                    products: paginatedProducts,
                                    pagination: {
                                        total: sphericalProducts.length,
                                        page: currentPage,
                                        limit: limit,
                                        pages: Math.ceil(sphericalProducts.length / limit)
                                    }
                                }
                            }
                        }
                    }
                }
                
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

    // Initialize default color selections for products with color images
    useEffect(() => {
        setProductColorSelections(prev => {
            const newSelections: Record<number, string> = {}
            products.forEach(product => {
                if (!prev[product.id]) {
                    const p = product as any
                    // Prefer colors array, fallback to color_images
                    if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
                        const firstColor = p.colors[0]
                        newSelections[product.id] = firstColor.value || firstColor.hexCode || firstColor.color || firstColor.name
                    } else if (product.color_images && product.color_images.length > 0) {
                        newSelections[product.id] = product.color_images[0].color
                    }
                }
            })
            if (Object.keys(newSelections).length > 0) {
                return {
                    ...prev,
                    ...newSelections
                }
            }
            return prev
        })
    }, [products])
    
    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            Object.values(hoverIntervals.current).forEach(interval => {
                if (interval) clearInterval(interval)
            })
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

    // Determine page type and IDs for banner
    const getBannerProps = () => {
        if (categoryInfo.subSubcategory && categoryInfo.subcategory) {
            return {
                pageType: 'sub_subcategory' as const,
                categoryId: categoryInfo.category?.id || null,
                subCategoryId: categoryInfo.subSubcategory.id
            }
        } else if (categoryInfo.subcategory) {
            return {
                pageType: 'subcategory' as const,
                categoryId: categoryInfo.category?.id || null,
                subCategoryId: categoryInfo.subcategory.id
            }
        } else if (categoryInfo.category) {
            return {
                pageType: 'category' as const,
                categoryId: categoryInfo.category.id,
                subCategoryId: null
            }
        }
        return {
            pageType: null as const,
            categoryId: null,
            subCategoryId: null
        }
    }

    const bannerProps = getBannerProps()

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Banner Section - Show banners specific to this page type */}
            {categoryInfo.category && (
                <Banner
                    pageType={bannerProps.pageType}
                    categoryId={bannerProps.categoryId}
                    subCategoryId={bannerProps.subCategoryId}
                    showNavbar={false}
                    autoSlideInterval={5000}
                    height="300px"
                />
            )}

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
                                    const p = product as any
                                    // Get available colors - prefer 'colors' array, fallback to 'color_images'
                                    const colorsArray = (p.colors && Array.isArray(p.colors) && p.colors.length > 0)
                                        ? p.colors
                                        : (product.color_images && product.color_images.length > 0
                                            ? product.color_images.map((ci: any) => ({
                                                value: ci.value || ci.color,
                                                hexCode: ci.hexCode || '#E5E5E5',
                                                display_name: ci.display_name || ci.name || ci.color,
                                                color: ci.color,
                                                images: ci.images || []
                                            }))
                                            : [])
                                    
                                    // Get selected color or default to first color if available
                                    const selectedColor = productColorSelections[product.id] || 
                                        (colorsArray.length > 0 
                                            ? (colorsArray[0].value || colorsArray[0].color || colorsArray[0].hexCode)
                                            : null)
                                    
                                    // Find current selected color index
                                    const selectedColorIndex = colorsArray.length > 0 && selectedColor
                                        ? colorsArray.findIndex((c: any) => 
                                            (c.value && c.value.toLowerCase() === selectedColor.toLowerCase()) ||
                                            (c.color && c.color.toLowerCase() === selectedColor.toLowerCase()) ||
                                            (c.hexCode && c.hexCode.toLowerCase() === selectedColor.toLowerCase())
                                        )
                                        : -1
                                    const startIndex = selectedColorIndex >= 0 ? selectedColorIndex : 0
                                    
                                    // Get hover color index (for auto-cycling on hover) - cycle continuously
                                    const hoverColorIndex = hoverColorCycles[product.id] ?? startIndex
                                    const currentIndex = isHovering[product.id] && colorsArray.length > 0
                                        ? hoverColorIndex % colorsArray.length
                                        : (selectedColorIndex >= 0 ? selectedColorIndex : 0)
                                    const displayColor = colorsArray.length > 0 && colorsArray[currentIndex]
                                        ? (colorsArray[currentIndex].value || colorsArray[currentIndex].color || colorsArray[currentIndex].hexCode)
                                        : selectedColor
                                    
                                    // Get image URL based on display color (hover or selected)
                                    const productImageUrl = displayColor && colorsArray.length > 0
                                        ? (() => {
                                            const displayColorLower = (displayColor || '').toLowerCase()
                                            const colorData = colorsArray.find((c: any) => 
                                                (c.value && c.value.toLowerCase() === displayColorLower) ||
                                                (c.color && c.color.toLowerCase() === displayColorLower) ||
                                                (c.hexCode && c.hexCode.toLowerCase() === displayColorLower)
                                            )
                                            if (colorData && colorData.images && Array.isArray(colorData.images) && colorData.images.length > 0) {
                                                return colorData.images[0]
                                            }
                                            // Fallback to color_images if colors array doesn't have images
                                            if (product.color_images) {
                                                const colorImage = product.color_images.find((ci: any) =>
                                                    (ci.color && ci.color.toLowerCase() === displayColorLower) ||
                                                    (ci.name && ci.name.toLowerCase() === displayColorLower)
                                                )
                                                return colorImage?.images?.[0] || getProductImageUrl(product)
                                            }
                                            return getProductImageUrl(product)
                                        })()
                                        : getProductImageUrl(product)
                                    
                                    // Handle hover color cycling with smooth transitions
                                    const handleMouseEnter = () => {
                                        if (colorsArray.length <= 1) return // No need to cycle if only one color
                                        
                                        setIsHovering(prev => ({ ...prev, [product.id]: true }))
                                        
                                        // Clear any existing interval for this product
                                        if (hoverIntervals.current[product.id]) {
                                            clearInterval(hoverIntervals.current[product.id])
                                        }
                                        
                                        // Start from selected color index
                                        const startIdx = selectedColorIndex >= 0 ? selectedColorIndex : 0
                                        setHoverColorCycles(prev => ({ ...prev, [product.id]: startIdx }))
                                        setImageOpacity(prev => ({ ...prev, [product.id]: 1 }))
                                        
                                        // Start cycling through colors with smooth fade transitions
                                        let currentIndex = startIdx
                                        hoverIntervals.current[product.id] = setInterval(() => {
                                            // Fade out
                                            setImageOpacity(prev => ({ ...prev, [product.id]: 0 }))
                                            
                                            setTimeout(() => {
                                                // Move to next color (cycle back to 0 after last)
                                                currentIndex = (currentIndex + 1) % colorsArray.length
                                                setHoverColorCycles(prev => ({
                                                    ...prev,
                                                    [product.id]: currentIndex
                                                }))
                                                
                                                // Fade in
                                                setImageOpacity(prev => ({ ...prev, [product.id]: 1 }))
                                            }, 200) // Half of transition time
                                        }, 1500) // Change color every 1.5 seconds
                                    }
                                    
                                    const handleMouseLeave = () => {
                                        setIsHovering(prev => {
                                            const newState = { ...prev }
                                            delete newState[product.id]
                                            return newState
                                        })
                                        
                                        // Clear interval and reset to selected color
                                        if (hoverIntervals.current[product.id]) {
                                            clearInterval(hoverIntervals.current[product.id])
                                            delete hoverIntervals.current[product.id]
                                        }
                                        
                                        setHoverColorCycles(prev => {
                                            const newState = { ...prev }
                                            delete newState[product.id]
                                            return newState
                                        })
                                        
                                        // Reset opacity
                                        setImageOpacity(prev => {
                                            const newState = { ...prev }
                                            delete newState[product.id]
                                            return newState
                                        })
                                    }

                                    const isGlassesProduct = 
                                        product.category?.name?.toLowerCase().includes('eyeglasses') ||
                                        product.category?.name?.toLowerCase().includes('sunglasses') ||
                                        product.category?.slug?.toLowerCase().includes('eyeglasses') ||
                                        product.category?.slug?.toLowerCase().includes('sunglasses') ||
                                        (product.category?.parent_category && (
                                            product.category.parent_category.name?.toLowerCase().includes('eyeglasses') ||
                                            product.category.parent_category.name?.toLowerCase().includes('sunglasses')
                                        ))

                                    return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 flex flex-col group"
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {/* Product Image */}
                                        <div className="relative h-64 md:h-72 bg-white overflow-hidden">
                                            <Link to={`/shop/product/${product.slug || product.id}`} className="block h-full">
                                                <img
                                                    src={productImageUrl}
                                                    alt={product.name}
                                                    key={`${product.id}-${displayColor || 'default'}`}
                                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-all duration-300"
                                                    style={{ 
                                                        opacity: imageOpacity[product.id] ?? 1,
                                                        transition: 'opacity 0.4s ease-in-out, transform 0.3s ease-in-out'
                                                    }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/assets/images/frame1.png'
                                                    }}
                                                />
                                            </Link>
                                            
                                            {/* Next Color Indicator - Shows when hovering and multiple colors available */}
                                            {isHovering[product.id] && colorsArray.length > 1 && (
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span>Viewing colors</span>
                                                </div>
                                            )}
                                            
                                            {/* Wishlist Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    toggleWishlist(product)
                                                }}
                                                className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 ${
                                                    isInWishlist(product.id)
                                                        ? 'bg-red-500 text-white shadow-lg'
                                                        : 'bg-white/90 text-gray-600 hover:bg-white hover:shadow-md'
                                                }`}
                                                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                            >
                                                <svg className="w-5 h-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </button>
                                            
                                            {/* Out of Stock Badge */}
                                            {(() => {
                                                const p = product as any
                                                const stockStatus = p.stock_status
                                                const stockQty = product.stock_quantity

                                                // Check if out of stock
                                                const isOutOfStock =
                                                    stockStatus === 'out_of_stock' ||
                                                    (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                    (stockStatus === undefined && product.in_stock === false) ||
                                                    (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)

                                                return isOutOfStock ? (
                                                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                                                        {t('shop.outOfStock')}
                                                    </div>
                                                ) : null
                                            })()}
                                            {product.sale_price && Number(product.sale_price) < Number(product.price) && (
                                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                                                    Sale
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <Link to={`/shop/product/${product.slug || product.id}`} className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-950 transition-colors">
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            
                                            {/* Color Selection */}
                                            {colorsArray.length > 1 && (
                                                <div className="mb-3 flex items-center gap-2 flex-wrap">
                                                    {colorsArray.map((colorData: any, index: number) => {
                                                        const colorValue = colorData.value || colorData.hexCode || colorData.color || colorData.name
                                                        const hexCode = colorData.hexCode || '#E5E5E5'
                                                        const displayName = colorData.display_name || colorData.name || colorData.color || 'Color'
                                                        const isSelected = selectedColor && (
                                                            (colorData.value && colorData.value.toLowerCase() === selectedColor.toLowerCase()) ||
                                                            (colorData.hexCode && colorData.hexCode.toLowerCase() === selectedColor.toLowerCase()) ||
                                                            (colorData.color && colorData.color.toLowerCase() === selectedColor.toLowerCase()) ||
                                                            (colorData.name && colorData.name.toLowerCase() === selectedColor.toLowerCase())
                                                        )

                                                        // Check for gradient
                                                        const hasGradient = colorData.gradient || colorData.hexCode2
                                                        const gradientStyle = hasGradient
                                                            ? `linear-gradient(135deg, ${hexCode} 0%, ${colorData.hexCode2 || hexCode} 100%)`
                                                            : null

                                                        return (
                                                            <button
                                                                key={index}
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    setProductColorSelections(prev => ({
                                                                        ...prev,
                                                                        [product.id]: colorValue
                                                                    }))
                                                                }}
                                                                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                                                                    isSelected
                                                                        ? 'border-blue-600 scale-110 ring-2 ring-blue-200 shadow-md'
                                                                        : 'border-gray-300 hover:border-gray-400'
                                                                }`}
                                                                style={{
                                                                    backgroundColor: gradientStyle ? 'transparent' : hexCode,
                                                                    backgroundImage: gradientStyle || undefined,
                                                                    borderColor: isSelected ? '#2563EB' : undefined,
                                                                    backgroundSize: gradientStyle ? 'cover' : undefined,
                                                                }}
                                                                title={displayName}
                                                                aria-label={`Select color ${displayName}`}
                                                            >
                                                                {isSelected && (
                                                                    <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* Price and Actions */}
                                            <div className="mt-auto pt-3 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        {product.sale_price && Number(product.sale_price) < Number(product.price) ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl font-bold text-blue-950">
                                                                    ${Number(product.sale_price).toFixed(2)}
                                                                </span>
                                                                <span className="text-sm text-gray-500 line-through">
                                                                    ${Number(product.price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xl font-bold text-blue-950">
                                                                ${Number(product.price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            handleAddToCart(product)
                                                        }}
                                                        className="flex-1 bg-blue-950 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900 transition-colors text-sm"
                                                    >
                                                        {t('shop.addToCart')}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Try On Button - Only for Glasses - HIDDEN */}
                                            {false && isGlassesProduct && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        setSelectedProductForTryOn(product)
                                                        setShowTryOnModal(true)
                                                    }}
                                                    className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-sm flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Try On
                                                </button>
                                            )}
                                            
                                            {/* Rating */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {product.rating !== undefined && product.rating > 0 ? (
                                                    <>
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`w-4 h-4 ${
                                                                    i < Math.round(Number(product.rating))
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300'
                                                                }`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                        <span className="text-sm text-gray-600">
                                                            {Number(product.rating).toFixed(1)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        No rating
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
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    
                                    {[...Array(pagination.pages)].map((_, index) => {
                                        const page = index + 1
                                        if (page === 1 || page === pagination.pages || (page >= currentPage - 1 && page <= currentPage + 1)) {
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
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {pagination && pagination.total > 0 && (
                                <div className="text-center mt-4 text-gray-600">
                                    Showing {products.length} of {pagination.total || 0} products
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

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

            <Footer />
            
            {/* Virtual Try-On Modal */}
            <VirtualTryOnModal
                open={showTryOnModal}
                onClose={() => setShowTryOnModal(false)}
                selectedProduct={selectedProductForTryOn}
            />
            
            {/* Contact Lens Configuration Modal - Removed - Contact lens forms are handled in ProductDetail page */}
        </div>
    )
}

export default CategoryPage

