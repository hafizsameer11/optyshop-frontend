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
    type ProductFilters,
    normalizeProductSubcategory
} from '../../services/productsService'
import CategoryBanner from '../../components/home/CategoryBanner'
import CategoryNavigation from '../../components/shop/CategoryNavigation'
import ProductCard from '../../components/products/ProductCard'
import ComprehensiveFilters from '../../components/shop/ComprehensiveFilters'
import BannerDebug from '../../components/debug/BannerDebug'

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
        const productSubcategoryName = productSubcategoryData.name
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

                // Apply category/subcategory filters with enhanced logging
                if (import.meta.env.DEV) {
                    console.log('🔍 CategoryPage - Category Info:', {
                        category: categoryInfo.category?.name,
                        subcategory: categoryInfo.subcategory?.name,
                        subSubcategory: categoryInfo.subSubcategory?.name,
                        categorySlug: categoryInfo.category?.slug,
                        subcategorySlug: categoryInfo.subcategory?.slug,
                        subSubcategorySlug: categoryInfo.subSubcategory?.slug
                    })
                }

                // Enhanced category/subcategory filtering with validation
                if (categoryInfo.category?.slug) {
                    filters.category = categoryInfo.category.slug
                    
                    // Validate that we have the right category structure
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Category filter applied:', {
                            categoryName: categoryInfo.category.name,
                            categorySlug: categoryInfo.category.slug,
                            categoryId: categoryInfo.category.id,
                            hasSubcategory: !!categoryInfo.subcategory,
                            hasSubSubcategory: !!categoryInfo.subSubcategory
                        })
                    }
                }

                // Apply subcategory/sub-subcategory filters with enhanced validation
                if (categoryInfo.subSubcategory && categoryInfo.subSubcategory.slug) {
                    // Use sub-subcategory for most specific filtering
                    filters.subcategory = categoryInfo.subSubcategory.slug
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Sub-subcategory filter applied:', {
                            subSubcategoryName: categoryInfo.subSubcategory.name,
                            subSubcategorySlug: categoryInfo.subSubcategory.slug,
                            subSubcategoryId: categoryInfo.subSubcategory.id,
                            parentSubcategory: categoryInfo.subcategory?.name
                        })
                    }
                } else if (categoryInfo.subcategory && categoryInfo.subcategory.slug) {
                    // Use subcategory if no sub-subcategory is selected
                    filters.subcategory = categoryInfo.subcategory.slug
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Subcategory filter applied:', {
                            subcategoryName: categoryInfo.subcategory.name,
                            subcategorySlug: categoryInfo.subcategory.slug,
                            subcategoryId: categoryInfo.subcategory.id,
                            hasChildren: !!(categoryInfo.subcategory.children && categoryInfo.subcategory.children.length > 0),
                            childrenCount: categoryInfo.subcategory.children?.length || 0
                        })
                    }
                } else {
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Category-level filtering (no subcategory selected)', {
                            categoryName: categoryInfo.category?.name,
                            note: 'Will show all products in this category'
                        })
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

                // Log final filters before API call
                if (import.meta.env.DEV) {
                    console.log('🔍 CategoryPage - Final filters being sent to API:', filters)
                }

                // Get products using unified filtering
                const result = await getProducts(filters)
                    
                if (!isCancelled && result) {
                    // Validate that returned products match the expected filters
                    if (import.meta.env.DEV && result.products && result.products.length > 0) {
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

                    // Apply client-side filters with enhanced subcategory filtering
                    let filteredProducts = result.products || []
                    
                    // Enhanced client-side subcategory filtering as fallback
                    if (categoryInfo.subSubcategory && categoryInfo.subSubcategory.slug) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const productSubcategoryData = normalizeProductSubcategory(product)
                            // For sub-subcategories, match both the sub-subcategory slug and ensure parent matches the selected subcategory
                            return productSubcategoryData.slug === categoryInfo.subSubcategory?.slug && 
                                   productSubcategoryData.parentSlug === categoryInfo.subcategory?.slug
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - Client-side sub-subcategory filter (${categoryInfo.subSubcategory.slug} with parent ${categoryInfo.subcategory?.slug}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
                    } else if (categoryInfo.subcategory && categoryInfo.subcategory.slug) {
                        const beforeFilter = filteredProducts.length
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const productSubcategoryData = normalizeProductSubcategory(product)
                            // For subcategories, match either the subcategory directly or its parent
                            return productSubcategoryData.slug === categoryInfo.subcategory?.slug ||
                                   productSubcategoryData.parentSlug === categoryInfo.subcategory?.slug
                        })
                        if (import.meta.env.DEV) {
                            console.log(`🔍 CategoryPage - Client-side subcategory filter (${categoryInfo.subcategory.slug}): ${beforeFilter} -> ${filteredProducts.length}`)
                        }
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
                        filteredProducts = filteredProducts.filter((product: Product) => {
                            const p = product as any
                            return p.treatment_options && p.treatment_options.toLowerCase() === lensCoating.toLowerCase()
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
                    
                    if (import.meta.env.DEV) {
                        console.log('🔍 CategoryPage - Final filtered products:', filteredProducts.length)
                        if (filteredProducts.length === 0 && (result.products || []).length > 0) {
                            console.warn('⚠️ CategoryPage - All products were filtered out!')
                            console.log('🔍 CategoryPage - Sample product that was filtered:', result.products?.[0])
                        }
                    }

                    setProducts(filteredProducts)
                    // Update pagination total if we filtered client-side
                    const updatedPagination = { ...result.pagination }
                    if (selectedColor && filteredProducts.length !== (result.products || []).length) {
                        updatedPagination.total = filteredProducts.length
                        updatedPagination.pages = Math.ceil(filteredProducts.length / (updatedPagination.limit || 12))
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
                onFilterChange={(filters: {
                    gender?: string
                    minPrice?: number
                    maxPrice?: number
                    sortBy?: string
                }) => {
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
                        if (filters.search !== undefined) {
                            if (import.meta.env.DEV) {
                                console.log('🔍 CategoryPage received search term:', filters.search)
                            }
                            setSearchTerm(filters.search)
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
