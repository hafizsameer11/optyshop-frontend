import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
    type ProductFilters,
    normalizeProductSubcategory
} from '../../services/productsService'
import CategoryBanner from '../../components/home/CategoryBanner'
import CategoryNavigation from '../../components/shop/CategoryNavigation'
import ProductCard from '../../components/products/ProductCard'
import ComprehensiveFilters, { type ShopFilterPayload } from '../../components/shop/ComprehensiveFilters'

// Validation function to ensure products match expected category/subcategory
const validateProductFiltering = (products: Product[], categoryInfo: {
    category: Category | null; 
    subcategory: Category | null;
    subSubcategory: Category | null;
}) => {
    const validation = {
        totalProducts: products.length,
        correctCategory: 0,
        correctSubcategory: 0,
        correctSubSubcategory: 0,
        mismatches: [] as string[]
    }

    products.forEach(product => {
        // Validate category
        if (categoryInfo.category && product.category?.slug === categoryInfo.category.slug) {
            validation.correctCategory++
        } else if (categoryInfo.category) {
            validation.mismatches.push(`Product "${product.name}" category mismatch: expected "${categoryInfo.category.slug}", got "${product.category?.slug}"`)
        }

        // Validate subcategory using helper function for consistent field name handling
        const productSubcategoryData = normalizeProductSubcategory(product)
        const productSubcategory = productSubcategoryData.slug
        const productParentSlug = productSubcategoryData.parentSlug
        
        if (categoryInfo.subSubcategory && categoryInfo.subSubcategory.slug) {
            // For sub-subcategories, validate both the sub-subcategory and its parent
            if (productSubcategory === categoryInfo.subSubcategory.slug && 
                productParentSlug === categoryInfo.subcategory?.slug) {
                validation.correctSubSubcategory++
            } else {
                validation.mismatches.push(`Product "${product.name}" sub-subcategory mismatch: expected "${categoryInfo.subSubcategory.slug}" with parent "${categoryInfo.subcategory?.slug}", got "${productSubcategory}" with parent "${productParentSlug}"`)
            }
        } else if (categoryInfo.subcategory && categoryInfo.subcategory.slug) {
            // For subcategories, validate either direct match or parent match
            if (productSubcategory === categoryInfo.subcategory.slug || 
                productParentSlug === categoryInfo.subcategory.slug) {
                validation.correctSubcategory++
            } else {
                validation.mismatches.push(`Product "${product.name}" subcategory mismatch: expected "${categoryInfo.subcategory.slug}" (direct or parent), got "${productSubcategory}" with parent "${productParentSlug}"`)
            }
        }
    })

    return validation
}

const CategoryPage: React.FC = () => {
    const { t } = useTranslation()
    const { menuCategoryLabel } = useCategoryTranslation()
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
    /** Initial category tree + first paint (no full-page spinner — see isFetchingProducts for grid) */
    const [isBootstrappingCategory, setIsBootstrappingCategory] = useState(true)
    const [isFetchingProducts, setIsFetchingProducts] = useState(false)
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)

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

    const handleCategoryNavigationFilterChange = useCallback(
        (filters: {
            gender?: string
            minPrice?: number
            maxPrice?: number
            sortBy?: string
        }) => {
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
        },
        []
    )

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
        setCurrentPage(1)
    }, [])

    const pageTitleLabel = useMemo(() => {
        if (categoryInfo.category) {
            return menuCategoryLabel(
                categoryInfo.subSubcategory || categoryInfo.subcategory || categoryInfo.category
            )
        }
        const leaf = subSubcategorySlug || subcategorySlug || categorySlug || ''
        return leaf.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }, [categoryInfo, categorySlug, subcategorySlug, subSubcategorySlug, menuCategoryLabel])

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
                if (subcategorySlug) {
                    // Load category + subcategory in parallel (was sequential — saved one round-trip)
                    const [cat, sub] = await Promise.all([
                        getCategoryBySlug(categorySlug),
                        getSubcategoryBySlug(subcategorySlug),
                    ])
                    category = cat
                    subcategory = sub
                    if (isCancelled) return

                    if (!category) {
                        navigate('/shop')
                        return
                    }

                    if (!subcategory) {
                        navigate(`/category/${categorySlug}`)
                        return
                    }

                    const subCatParentId = subcategory.category_id ?? subcategory.category?.id
                    if (subCatParentId != null && String(subCatParentId) !== String(category.id)) {
                        navigate(`/category/${categorySlug}`)
                        return
                    }

                    if (subSubcategorySlug) {
                        const nestedSubcategories = await getNestedSubcategoriesByParentId(subcategory.id)
                        if (!isCancelled) {
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
                } else {
                    category = await getCategoryBySlug(categorySlug)
                    if (isCancelled) return

                    if (!category) {
                        navigate('/shop')
                        return
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
                    setIsBootstrappingCategory(false)
                }
            }
        }

        fetchCategoryInfo()

        return () => {
            isCancelled = true
        }
    }, [categorySlug, subcategorySlug, subSubcategorySlug, navigate])

    // Fetch products — uses URL slugs so the list request runs in parallel with category metadata (no waterfall)
    useEffect(() => {
        if (!categorySlug) return

        let isCancelled = false

        const fetchProducts = async () => {
            try {
                setIsFetchingProducts(true)
                const filters: ProductFilters = {
                    page: currentPage,
                    limit: 12,
                }

                filters.category = categorySlug
                // Parent subcategory and nested sub-subcategory are independent in the URL.
                // Sending only subSubcategory (else-if) dropped the middle segment (e.g. weekly)
                // when browsing /category/contact-lenses/weekly/spherical.
                if (subcategorySlug) {
                    filters.subcategory = subcategorySlug
                }
                if (subSubcategorySlug) {
                    filters.subSubcategory = subSubcategorySlug
                }

                if (import.meta.env.DEV) {
                    console.log('🔍 CategoryPage - Product filters (URL-first):', {
                        categorySlug,
                        subcategorySlug,
                        subSubcategorySlug,
                        resolvedCategory: categoryInfo.category?.name,
                    })
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

                if (frameShape) {
                    filters.frameShape = frameShape
                }
                if (frameMaterial) {
                    filters.frameMaterial = frameMaterial
                }
                if (isFeaturedOnly) {
                    filters.isFeatured = true
                }
                if (baseCurve.trim()) {
                    filters.baseCurve = baseCurve.trim()
                }
                if (diameter.trim()) {
                    filters.diameter = diameter.trim()
                }
                if (replacementPeriod.trim()) {
                    filters.replacementPeriod = replacementPeriod.trim()
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
                } else if (sortBy === 'relevance') {
                    // Let backend default relevance ordering drive results
                }

                // Log final filters before API call
                if (import.meta.env.DEV) {
                    console.log('🔍 CategoryPage - Final filters being sent to API:', filters)
                }

                // Get products using unified filtering
                const result = await getProducts(filters)
                    
                if (!isCancelled && result) {
                    // Validate that returned products match the expected filters
                    if (import.meta.env.DEV && categoryInfo.category && result.products && result.products.length > 0) {
                        const validationResults = validateProductFiltering(result.products, categoryInfo)
                        console.log('🔍 CategoryPage - Product filtering validation:', validationResults)
                    }
                    
                    // Debug: Log product data and filtering info
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Products received:', result.products?.length || 0);
                        console.log('🔍 Filters applied:', filters);
                        if (result.products && result.products.length > 0) {
                            console.log('🔍 Sample product data:', result.products[0]);
                            console.log('🔍 Product categories received:', result.products.map(p => {
                                const subcatData = normalizeProductSubcategory(p)
                                return {
                                    id: p.id,
                                    name: p.name,
                                    category: p.category?.name,
                                    subcategory: subcatData.name,
                                    subcategory_slug: subcatData.slug,
                                    parent: subcatData.parentName,
                                    parent_slug: subcatData.parentSlug,
                                    full_path: subcatData.fullPath.join(' > '),
                                    in_stock: p.in_stock,
                                    stock_quantity: p.stock_quantity
                                }
                            }));
                        } else {
                            console.log('⚠️ CategoryPage - No products found with these filters')
                        }
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

                    // Client-side subcategory refinement: only when the list API was NOT already scoped by subcategory.
                    // If we sent subcategory/subSubcategory in filters, the server result is authoritative — re-filtering
                    // with normalizeProductSubcategory often strips everything (slug casing, nesting, stale categoryInfo).
                    let filteredProducts = result.products || []

                    const apiScopedBySub =
                        !!(filters.subcategory || filters.subSubcategory)

                    if (!apiScopedBySub) {
                        // Prefer URL segments over categoryInfo (avoids stale subcategory after client-side nav)
                        const leafSubSub = (subSubcategorySlug || categoryInfo.subSubcategory?.slug || '')
                            .toLowerCase()
                        const midSub = (subcategorySlug || categoryInfo.subcategory?.slug || '')
                            .toLowerCase()

                        const norm = (s: string | null | undefined) => (s || '').toLowerCase()

                        if (leafSubSub && midSub) {
                            const beforeFilter = filteredProducts.length
                            filteredProducts = filteredProducts.filter((product: Product) => {
                                const d = normalizeProductSubcategory(product)
                                return norm(d.slug) === leafSubSub && norm(d.parentSlug) === midSub
                            })
                            if (import.meta.env.DEV) {
                                console.log(
                                    `🔍 CategoryPage - Client sub-sub filter (${leafSubSub}/${midSub}): ${beforeFilter} -> ${filteredProducts.length}`
                                )
                            }
                        } else if (midSub) {
                            const beforeFilter = filteredProducts.length
                            filteredProducts = filteredProducts.filter((product: Product) => {
                                const d = normalizeProductSubcategory(product)
                                return norm(d.slug) === midSub || norm(d.parentSlug) === midSub
                            })
                            if (import.meta.env.DEV) {
                                console.log(
                                    `🔍 CategoryPage - Client subcategory filter (${midSub}): ${beforeFilter} -> ${filteredProducts.length}`
                                )
                            }
                        }
                    } else if (import.meta.env.DEV && filteredProducts.length > 0) {
                        console.log(
                            '🔍 CategoryPage - Skipping client subcategory filter (API already filtered by subcategory/subSubcategory)'
                        )
                    }
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Starting with products:', filteredProducts.length)
                        console.log('🔍 CategoryPage - Active filters:', {
                            selectedColor,
                            brand,
                            inStockOnly,
                            lensType,
                            lensCoating,
                            minPrice,
                            maxPrice,
                            gender,
                            searchTerm
                        })
                        
                        // Debug each filter step by step
                        console.log('🔍 CategoryPage - Testing each filter:')
                        
                        // Test color filter
                        if (selectedColor) {
                            const beforeColor = filteredProducts.length
                            const afterColor = filteredProducts.filter((product: Product) => {
                                const p = product as any
                                const selectedColorLower = selectedColor.toLowerCase()
                                if (p.colors && Array.isArray(p.colors)) {
                                    const hasColor = p.colors.some((c: any) => {
                                        const colorName = (c.display_name || c.name || c.value || c.color || '').toLowerCase()
                                        return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                    })
                                    if (hasColor) return true
                                }
                                if (product.color_images && Array.isArray(product.color_images)) {
                                    const hasColor = product.color_images.some((ci: any) => {
                                        const colorName = (ci.display_name || ci.name || ci.color || '').toLowerCase()
                                        return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                    })
                                    if (hasColor) return true
                                }
                                return false
                            }).length
                            console.log(`  🎨 Color filter "${selectedColor}": ${beforeColor} → ${afterColor}`)
                        } else {
                            console.log(`  🎨 Color filter: NOT ACTIVE`)
                        }
                        
                        // Test brand filter
                        if (brand) {
                            const beforeBrand = filteredProducts.length
                            const afterBrand = filteredProducts.filter((product: Product) => {
                                return product.brand && product.brand.toLowerCase() === brand.toLowerCase()
                            }).length
                            console.log(`  🏷️ Brand filter "${brand}": ${beforeBrand} → ${afterBrand}`)
                        } else {
                            console.log(`  🏷️ Brand filter: NOT ACTIVE`)
                        }
                        
                        // Test stock filter
                        if (inStockOnly) {
                            const beforeStock = filteredProducts.length
                            const afterStock = filteredProducts.filter((product: Product) => {
                                return product.in_stock === true || (product as any).stock_quantity > 0
                            }).length
                            console.log(`  📦 Stock filter: ${beforeStock} → ${afterStock}`)
                        } else {
                            console.log(`  📦 Stock filter: NOT ACTIVE`)
                        }
                        
                        // Test lens type filter
                        if (lensType) {
                            const beforeLensType = filteredProducts.length
                            const afterLensType = filteredProducts.filter((product: Product) => {
                                const p = product as any
                                return p.lens_type && p.lens_type.toLowerCase() === lensType.toLowerCase()
                            }).length
                            console.log(`  👁️ Lens type filter "${lensType}": ${beforeLensType} → ${afterLensType}`)
                        } else {
                            console.log(`  👁️ Lens type filter: NOT ACTIVE`)
                        }
                        
                        // Test lens coating filter
                        if (lensCoating) {
                            const beforeLensCoating = filteredProducts.length
                            const afterLensCoating = filteredProducts.filter((product: Product) => {
                                const p = product as any
                                return p.treatment_options && p.treatment_options.toLowerCase() === lensCoating.toLowerCase()
                            }).length
                            console.log(`  🛡️ Lens coating filter "${lensCoating}": ${beforeLensCoating} → ${afterLensCoating}`)
                        } else {
                            console.log(`  🛡️ Lens coating filter: NOT ACTIVE`)
                        }
                        
                        // Test gender filter
                        if (gender) {
                            const beforeGender = filteredProducts.length
                            const afterGender = filteredProducts.filter((product: Product) => {
                                return product.gender && product.gender.toLowerCase() === gender.toLowerCase()
                            }).length
                            console.log(`  👤 Gender filter "${gender}": ${beforeGender} → ${afterGender}`)
                        } else {
                            console.log(`  👤 Gender filter: NOT ACTIVE`)
                        }
                        
                        // Test price filters
                        if (minPrice !== undefined) {
                            const beforeMinPrice = filteredProducts.length
                            const afterMinPrice = filteredProducts.filter((product: Product) => {
                                const price = parseFloat(String(product.price))
                                return price >= minPrice
                            }).length
                            console.log(`  💰 Min price filter ${minPrice}: ${beforeMinPrice} → ${afterMinPrice}`)
                        } else {
                            console.log(`  💰 Min price filter: NOT ACTIVE`)
                        }
                        
                        if (maxPrice !== undefined) {
                            const beforeMaxPrice = filteredProducts.length
                            const afterMaxPrice = filteredProducts.filter((product: Product) => {
                                const price = parseFloat(String(product.price))
                                return price <= maxPrice
                            }).length
                            console.log(`  💰 Max price filter ${maxPrice}: ${beforeMaxPrice} → ${afterMaxPrice}`)
                        } else {
                            console.log(`  💰 Max price filter: NOT ACTIVE`)
                        }
                        
                        // Test search filter
                        if (searchTerm) {
                            const beforeSearch = filteredProducts.length
                            const afterSearch = filteredProducts.filter((product: Product) => {
                                const searchLower = searchTerm.toLowerCase()
                                return product.name.toLowerCase().includes(searchLower) ||
                                       (product.description && product.description.toLowerCase().includes(searchLower))
                            }).length
                            console.log(`  🔍 Search filter "${searchTerm}": ${beforeSearch} → ${afterSearch}`)
                        } else {
                            console.log(`  🔍 Search filter: NOT ACTIVE`)
                        }
                    }
                    
                    // Apply all client-side filters in sequence
                    if (selectedColor && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            const selectedColorLower = selectedColor.toLowerCase()

                            if (p.colors && Array.isArray(p.colors)) {
                                const hasColor = p.colors.some((c: any) => {
                                    const colorName = (c.display_name || c.name || c.value || c.color || '').toLowerCase()
                                    return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                })
                                if (hasColor) return true
                            }

                            if (product.color_images && Array.isArray(product.color_images)) {
                                const hasColor = product.color_images.some((ci: any) => {
                                    const colorName = (ci.display_name || ci.name || ci.color || '').toLowerCase()
                                    return colorName.includes(selectedColorLower) || selectedColorLower.includes(colorName)
                                })
                                if (hasColor) return true
                            }

                            return false
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After color filter (${selectedColor}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (brand && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            return product.brand && product.brand.toLowerCase() === brand.toLowerCase()
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After brand filter (${brand}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (inStockOnly && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            return product.in_stock === true || (product as any).stock_quantity > 0
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After stock filter: ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (lensType && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            return p.lens_type && p.lens_type.toLowerCase() === lensType.toLowerCase()
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After lens type filter (${lensType}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (lensCoating && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        const want = lensCoating.toLowerCase()
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            const coat = (p.lens_coating || p.treatment_options || p.lensCoating || '')
                                .toString()
                                .toLowerCase()
                            return coat && (coat === want || coat.includes(want))
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After lens coating filter (${lensCoating}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (minPrice !== undefined && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const price = parseFloat(String(product.price))
                            return price >= minPrice
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After min price filter (${minPrice}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (maxPrice !== undefined && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const price = parseFloat(String(product.price))
                            return price <= maxPrice
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After max price filter (${maxPrice}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }
                    
                    if (gender && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            return product.gender && product.gender.toLowerCase() === gender.toLowerCase()
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After gender filter (${gender}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }

                    if (searchTerm && filteredProducts.length > 0) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const searchLower = searchTerm.toLowerCase()
                            return product.name.toLowerCase().includes(searchLower) ||
                                   (product.description && product.description.toLowerCase().includes(searchLower))
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - After search filter (${searchTerm}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    }

                    if (frameShape && filteredProducts.length > 0) {
                        const fs = frameShape.toLowerCase()
                        filteredProducts = filteredProducts.filter(
                            (p) => p.frame_shape && p.frame_shape.toLowerCase() === fs
                        )
                    }
                    if (frameMaterial && filteredProducts.length > 0) {
                        const fm = frameMaterial.toLowerCase()
                        filteredProducts = filteredProducts.filter(
                            (p) => p.frame_material && p.frame_material.toLowerCase() === fm
                        )
                    }
                    if (isFeaturedOnly && filteredProducts.length > 0) {
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            return x.is_featured === true || x.isFeatured === true
                        })
                    }
                    if (baseCurve.trim() && filteredProducts.length > 0) {
                        const bc = baseCurve.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const v = String((p as any).base_curve ?? (p as any).baseCurve ?? '')
                            return v.toLowerCase().includes(bc)
                        })
                    }
                    if (diameter.trim() && filteredProducts.length > 0) {
                        const d = diameter.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const v = String((p as any).diameter ?? '')
                            return v.toLowerCase().includes(d)
                        })
                    }
                    if (replacementPeriod.trim() && filteredProducts.length > 0) {
                        const rp = replacementPeriod.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const v = String(
                                (p as any).replacement_period ??
                                    (p as any).replacementPeriod ??
                                    (p as any).wear_schedule ??
                                    ''
                            )
                            return v.toLowerCase().includes(rp)
                        })
                    }
                    if (categoryText.trim() && filteredProducts.length > 0) {
                        const q = categoryText.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const slug = String((p.category as any)?.slug ?? '').toLowerCase()
                            const name = String((p.category as any)?.name ?? '').toLowerCase()
                            return slug.includes(q) || name.includes(q)
                        })
                    }
                    if (model.trim() && filteredProducts.length > 0) {
                        const q = model.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            const modelValue = String(x.model ?? x.model_name ?? x.sku ?? '').toLowerCase()
                            return modelValue.includes(q)
                        })
                    }
                    if (features.trim() && filteredProducts.length > 0) {
                        const q = features.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            const featureText = Array.isArray(x.features)
                                ? x.features.join(' ')
                                : String(x.features ?? x.tags ?? '')
                            return featureText.toLowerCase().includes(q)
                        })
                    }
                    if (caliber.trim() && filteredProducts.length > 0) {
                        const q = caliber.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            const firstFrame = Array.isArray(x.frameSizes) ? x.frameSizes[0] : null
                            const value = String(x.caliber ?? x.mm ?? x.size ?? firstFrame?.size_label ?? '').toLowerCase()
                            return value.includes(q)
                        })
                    }
                    if (bridge.trim() && filteredProducts.length > 0) {
                        const q = bridge.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            const firstFrame = Array.isArray(x.frameSizes) ? x.frameSizes[0] : null
                            const value = String(x.bridge ?? firstFrame?.bridge_width ?? '').toLowerCase()
                            return value.includes(q)
                        })
                    }
                    if (temples.trim() && filteredProducts.length > 0) {
                        const q = temples.trim().toLowerCase()
                        filteredProducts = filteredProducts.filter((p) => {
                            const x = p as any
                            const firstFrame = Array.isArray(x.frameSizes) ? x.frameSizes[0] : null
                            const value = String(x.temples ?? firstFrame?.temple_length ?? '').toLowerCase()
                            return value.includes(q)
                        })
                    }
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Final filtered products:', filteredProducts.length)
                        if (filteredProducts.length === 0 && (result.products || []).length > 0) {
                            console.warn('⚠️ CategoryPage - All products were filtered out!')
                            console.log('🔍 CategoryPage - Sample product that was filtered:', result.products?.[0])
                        }
                    }

                    setProducts(filteredProducts)
                    // Always keep API pagination (total/pages) for server-side paging. Do not recompute pages from
                    // filteredProducts.length — that count is only the current page after client filters, so it
                    // corrupts totals (e.g. "1 of 2" breaks, or Next loads page 2 then UI resets pages to 1).
                    const p = result.pagination
                    const updatedPagination = {
                        total: Number(p.total) || 0,
                        page: currentPage > 0 ? currentPage : Number(p.page) || 1,
                        limit: Number(p.limit) || 12,
                        pages: Number(p.pages) || 0,
                    }
                    setPagination(updatedPagination)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching products:', error)
                    setProducts([])
                }
            } finally {
                if (!isCancelled) {
                    setIsFetchingProducts(false)
                }
            }
        }

        fetchProducts()

        return () => {
            isCancelled = true
        }
    }, [
        categorySlug,
        subcategorySlug,
        subSubcategorySlug,
        currentPage,
        searchTerm,
        lensType,
        lensCoating,
        minPrice,
        maxPrice,
        gender,
        selectedColor,
        brand,
        inStockOnly,
        sortBy,
        frameShape,
        frameMaterial,
        isFeaturedOnly,
        baseCurve,
        diameter,
        replacementPeriod,
        categoryText,
        model,
        features,
        caliber,
        bridge,
        temples,
    ])

    if (!isBootstrappingCategory && !categoryInfo.category && categorySlug) {
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
                    categoryName={pageTitleLabel}
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
                onFilterChange={handleCategoryNavigationFilterChange}
            />
            
            <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <div className="min-w-0 w-full">
                        <header className="mb-8 border-b border-slate-200/90 pb-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {pageTitleLabel}
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
                                {isFetchingProducts || isBootstrappingCategory
                                    ? '\u00a0'
                                    : products.length > 0
                                      ? pagination.total > 0
                                          ? `Showing ${products.length} of ${pagination.total} product${pagination.total === 1 ? '' : 's'}`
                                          : `${products.length} product${products.length === 1 ? '' : 's'}`
                                      : t('shop.noProductsMatch', 'No products match these filters')}
                            </p>
                        </header>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-6 lg:p-8">
                            {isFetchingProducts ? (
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
                                <div className="text-center py-16">
                                    <div className="max-w-lg mx-auto">
                                        <svg className="mx-auto h-32 w-32 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-xl md:text-2xl text-gray-600 mb-4 font-semibold">
                                            {t('shop.noProducts', {
                                                category:
                                                    categoryInfo.subSubcategory
                                                        ? menuCategoryLabel(categoryInfo.subSubcategory)
                                                        : categoryInfo.subcategory
                                                          ? menuCategoryLabel(categoryInfo.subcategory)
                                                          : categoryInfo.category
                                                            ? menuCategoryLabel(categoryInfo.category)
                                                            : pageTitleLabel,
                                            })}
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
                                                {t('shop.viewProducts', { category: menuCategoryLabel(categoryInfo.subcategory) })}
                                            </Link>
                                        ) : categoryInfo.subcategory ? (
                                            <Link 
                                                to={`/category/${categoryInfo.category?.slug || ''}`}
                                                className="inline-block px-8 py-4 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all duration-200 transform hover:scale-105 shadow-lg mr-4 font-semibold"
                                            >
                                                {t('shop.viewProducts', { category: menuCategoryLabel(categoryInfo.category || { name: '', slug: '' }) })}
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
                                    <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-4">
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
                categoryLevel={
                    subSubcategorySlug ? 'subsubcategory' :
                    subcategorySlug ? 'subcategory' : 'category'
                }
                categorySlug={categoryInfo.category?.slug || categorySlug || ''}
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
        </div>
    )
}

export default CategoryPage
