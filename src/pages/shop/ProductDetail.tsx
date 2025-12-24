import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import { 
    getProductBySlug, 
    getRelatedProducts,
    getProductOptions,
    type Product,
    type ProductOptions
} from '../../services/productsService'
import {
    getContactLensOptionsBySubSubcategoryId,
    getContactLensOptionsBySubSubcategorySlug,
    type ContactLensOptions
} from '../../services/categoriesService'
import {
    getContactLensConfigsByProduct,
    getContactLensConfigsBySubCategory,
    type ContactLensConfiguration
} from '../../services/contactLensConfigService'
import ContactLensConfigurationDropdown from '../../components/products/ContactLensConfigurationDropdown'
import { getProductImageUrl } from '../../utils/productImage'
import ProductCheckout from '../../components/shop/ProductCheckout'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import { useAuth } from '../../context/AuthContext'
import { addItemToCart, type AddToCartRequest } from '../../services/cartService'

interface ContactLensFormData {
    right_qty: number
    right_base_curve: string
    right_diameter: string
    right_power: string
    right_cylinder?: string
    right_axis?: string
    left_qty: number
    left_base_curve: string
    left_diameter: string
    left_power: string
    left_cylinder?: string
    left_axis?: string
    unit: string // Unit selection: 'unit', 'box', 'pack'
}

const ProductDetail: React.FC = () => {
    const { t } = useTranslation()
    const { translateCategory } = useCategoryTranslation()
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [product, setProduct] = useState<Product | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [selectedColor, setSelectedColor] = useState<string | null>(null) // For color_images support
    const [quantity, setQuantity] = useState(1)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showTryOn, setShowTryOn] = useState(false)
    const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
    const [selectedFrameMaterial, setSelectedFrameMaterial] = useState<string>('') // Single selection
    const [selectedLensType, setSelectedLensType] = useState<string>('') // Single selection
    const [subSubcategoryOptions, setSubSubcategoryOptions] = useState<ContactLensOptions | null>(null) // Aggregated options from sub-subcategory
    
    // Contact lens configuration state
    const [contactLensConfigs, setContactLensConfigs] = useState<ContactLensConfiguration[]>([])
    const [selectedConfig, setSelectedConfig] = useState<ContactLensConfiguration | null>(null)
    const [configsLoading, setConfigsLoading] = useState(false)
    
    // Contact lens form state
    const [contactLensFormData, setContactLensFormData] = useState<ContactLensFormData>({
        right_qty: 1,
        right_base_curve: '8.70',
        right_diameter: '14.00',
        right_power: '',
        right_cylinder: '',
        right_axis: '',
        left_qty: 1,
        left_base_curve: '8.70',
        left_diameter: '14.00',
        left_power: '',
        left_cylinder: '',
        left_axis: '',
        unit: 'unit' // Default unit
    })
    
    // Unit options for contact lenses
    const unitOptions = [
        { value: 'unit', label: t('shop.unit'), description: t('shop.unitDescription', 'Single lens') },
        { value: 'box', label: t('shop.box'), description: t('shop.boxDescription', 'Box of lenses (typically 6-30 lenses)') },
        { value: 'pack', label: t('shop.pack'), description: t('shop.packDescription', 'Pack of lenses') }
    ]
    const [contactLensErrors, setContactLensErrors] = useState<Record<string, string>>({})
    const [contactLensLoading, setContactLensLoading] = useState(false)
    const lastProductIdRef = useRef<number | null>(null)
    const formInitializedRef = useRef<number | null>(null)

    useEffect(() => {
        let isCancelled = false
        
        const fetchProduct = async () => {
            if (!slug) return
            
            setLoading(true)
            let productData = await getProductBySlug(slug)
            
            // If product not found and slug starts with "config-", it might be a configuration product
            if (!productData && slug.startsWith('config-')) {
                const configId = parseInt(slug.replace('config-', ''))
                if (!isNaN(configId)) {
                    try {
                        // Try to fetch configuration and convert to product
                        const { getContactLensConfigs } = await import('../../services/contactLensConfigService')
                        const configs = await getContactLensConfigs({ sub_category_id: configId })
                        // Actually, we need to fetch by ID, but the API might not support that
                        // For now, let's try fetching all configs and finding the one with matching ID
                        // Or we can fetch by sub_category_id if we know it
                        // This is a fallback - the main flow should work through regular product fetch
                        if (import.meta.env.DEV) {
                            console.log('⚠️ Product not found, checking if it\'s a configuration:', {
                                slug,
                                configId
                            })
                        }
                    } catch (error) {
                        if (import.meta.env.DEV) {
                            console.log('⚠️ Could not fetch configuration:', error)
                        }
                    }
                }
            }
            
            if (isCancelled) return
            
            if (productData) {
                // Reset selected image index when loading a new product
                setSelectedImageIndex(0)
                // Reset selections when product changes
                setSelectedFrameMaterial('')
                setSelectedLensType('')
                
                // Check if product is a contact lens (needed for configuration fetching)
                const p = productData as any
                const categorySlug = productData.category?.slug
                // Helper function to check if product is contact lens (avoid closure issues)
                const checkIsContactLens = () => {
                    return categorySlug === 'contact-lenses' || 
                           categorySlug === 'eye-hygiene' ||
                           p.product_type === 'contact_lens' ||
                           Array.isArray(p.base_curve_options)
                }
                const isContactLensProduct = checkIsContactLens()
                
                // Debug log product data and image info
                if (import.meta.env.DEV) {
                    const imageUrl = getProductImageUrl(productData, 0)
                    const isContactLens = checkIsContactLens() // Recalculate for console.log
                    
                    console.log('🔍 Product Detail Data:', {
                        id: productData.id,
                        name: productData.name,
                        price: productData.price,
                        priceType: typeof productData.price,
                        sale_price: productData.sale_price,
                        images: productData.images,
                        image: productData.image,
                        image_url: productData.image_url,
                        thumbnail: productData.thumbnail,
                        selectedImageUrl: imageUrl,
                        stock_status: p.stock_status,
                        stock_quantity: productData.stock_quantity,
                        in_stock: productData.in_stock,
                        category: categorySlug,
                        isContactLens: isContactLens,
                        // Contact Lens specific fields
                        ...(isContactLens && {
                            base_curve_options: p.base_curve_options,
                            diameter_options: p.diameter_options,
                            powers_range: p.powers_range,
                            contact_lens_brand: p.contact_lens_brand,
                            contact_lens_material: p.contact_lens_material,
                            contact_lens_type: p.contact_lens_type
                        }),
                        fullProduct: productData
                    })
                }
                setProduct(productData)
                
                // Get product subcategory info for configuration fetching
                const productSubcategory = p.subcategory
                
                // Fetch contact lens configurations for this product
                // Recalculate to ensure we have the correct value
                if (checkIsContactLens()) {
                    try {
                        setConfigsLoading(true)
                        let configs: ContactLensConfiguration[] | null = null
                        
                        // First, try to fetch by product_id
                        configs = await getContactLensConfigsByProduct(productData.id)
                        
                        // If no configurations found by product_id, try by sub_category_id
                        // (configurations can have product_id: null but be linked to sub-subcategory)
                        if ((!configs || configs.length === 0) && productSubcategory && productSubcategory.parent_id) {
                            // Product belongs to a sub-subcategory, fetch configurations by sub_category_id
                            if (import.meta.env.DEV) {
                                console.log('⚠️ No configurations found by product_id, trying sub_category_id:', {
                                    productId: productData.id,
                                    subCategoryId: productSubcategory.id,
                                    subCategoryName: productSubcategory.name
                                })
                            }
                            
                            configs = await getContactLensConfigsBySubCategory(productSubcategory.id)
                            
                            if (import.meta.env.DEV && configs && configs.length > 0) {
                                console.log('✅ Fetched configurations by sub_category_id:', {
                                    subCategoryId: productSubcategory.id,
                                    count: configs.length
                                })
                            }
                        }
                        
                        if (!isCancelled && configs && configs.length > 0) {
                            setContactLensConfigs(configs)
                            if (import.meta.env.DEV) {
                                console.log('✅ Fetched contact lens configurations:', {
                                    productId: productData.id,
                                    count: configs.length,
                                    configs: configs.map(c => ({
                                        id: c.id,
                                        display_name: c.display_name,
                                        type: c.configuration_type,
                                        price: c.price,
                                        product_id: c.product_id,
                                        sub_category_id: c.sub_category_id
                                    }))
                                })
                            }
                        } else {
                            setContactLensConfigs([])
                            if (import.meta.env.DEV) {
                                console.log('⚠️ No contact lens configurations found for product:', {
                                    productId: productData.id,
                                    productName: productData.name,
                                    subCategoryId: productSubcategory?.id
                                })
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching contact lens configurations:', error)
                        setContactLensConfigs([])
                    } finally {
                        if (!isCancelled) {
                            setConfigsLoading(false)
                        }
                    }
                } else {
                    setContactLensConfigs([])
                    setSelectedConfig(null)
                }
                
                // Fetch contact lens options from sub-subcategory if product belongs to one
                if (productSubcategory && productSubcategory.parent_id) {
                    // This is a sub-subcategory, fetch aggregated options
                    try {
                        const options = await getContactLensOptionsBySubSubcategoryId(productSubcategory.id)
                        if (!isCancelled && options) {
                            setSubSubcategoryOptions(options)
                            if (import.meta.env.DEV) {
                                console.log('✅ Fetched contact lens options from sub-subcategory:', {
                                    subSubcategoryId: productSubcategory.id,
                                    subSubcategoryName: productSubcategory.name,
                                    subSubcategorySlug: productSubcategory.slug,
                                    type: options.type,
                                    powerOptionsCount: options.powerOptions.length,
                                    baseCurveOptionsCount: options.baseCurveOptions.length,
                                    diameterOptionsCount: options.diameterOptions.length,
                                    productCount: options.productCount
                                })
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching contact lens options from sub-subcategory:', error)
                    }
                } else {
                    // Not a sub-subcategory, clear options
                    setSubSubcategoryOptions(null)
                }
                
                // Fetch related products
                const related = await getRelatedProducts(productData.id, 4)
                if (!isCancelled) {
                    setRelatedProducts(related)
                }
            } else {
                // Product not found, redirect to shop
                if (!isCancelled) {
                    navigate('/shop')
                }
            }
            if (!isCancelled) {
                setLoading(false)
            }
        }

        fetchProduct()
        
        return () => {
            isCancelled = true
        }
    }, [slug, navigate])

    // Fetch product options (frame materials, etc.)
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const options = await getProductOptions()
                if (options) {
                    setProductOptions(options)
                }
            } catch (error) {
                console.error('Error fetching product options:', error)
            }
        }
        fetchOptions()
    }, [])

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // This ensures hooks run in the same order on every render
    
    // Check if product is a contact lens or eye hygiene (memoized to prevent infinite loops)
    const isContactLens = useMemo(() => {
        if (!product) return false
        const p = product as any
        const categorySlug = product.category?.slug
        return categorySlug === 'contact-lenses' || 
               categorySlug === 'eye-hygiene' ||
               p.product_type === 'contact_lens' ||
               Array.isArray(p.base_curve_options)
    }, [product])
    
    // Get contact lens options from configuration, sub-subcategory, or product (memoized)
    // Priority: Configuration > Sub-subcategory > Product
    const baseCurveOptions = useMemo(() => {
        // Priority 1: Use configuration data if available
        if (selectedConfig && selectedConfig.right_base_curve) {
            const configOptions = Array.isArray(selectedConfig.right_base_curve) 
                ? selectedConfig.right_base_curve 
                : [selectedConfig.right_base_curve]
            if (configOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using base curve options from configuration:', configOptions)
                }
                return configOptions.map(v => typeof v === 'string' ? parseFloat(v) : v).filter(v => !isNaN(v))
            }
        }
        
        // Priority 2: Use aggregated options from sub-subcategory if available
        if (subSubcategoryOptions && subSubcategoryOptions.baseCurveOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using base curve options from sub-subcategory:', subSubcategoryOptions.baseCurveOptions)
            }
            return subSubcategoryOptions.baseCurveOptions
        }
        
        // Priority 3: Use product-specific options
        if (!product) return []
        const p = product as any
        
        // Debug: Log API data in development
        if (import.meta.env.DEV && isContactLens) {
            console.log('🔍 Contact Lens API Data - Base Curve Options:', {
                base_curve_options: p.base_curve_options,
                type: typeof p.base_curve_options,
                isArray: Array.isArray(p.base_curve_options),
                productId: product.id,
                productName: product.name
            })
        }
        
        // Handle different data formats from API
        let options: (number | string)[] = []
        
        if (Array.isArray(p.base_curve_options)) {
            options = p.base_curve_options
        } else if (typeof p.base_curve_options === 'string') {
            // Try to parse JSON string
            try {
                const parsed = JSON.parse(p.base_curve_options)
                if (Array.isArray(parsed)) {
                    options = parsed
                }
            } catch (e) {
                // If parsing fails, try splitting by comma
                options = p.base_curve_options.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v))
            }
        }
        
        // Fallback to default options if empty
        if (options.length === 0) {
            options = [8.70, 8.80, 8.90]
            if (import.meta.env.DEV) {
                console.warn('⚠️ No base_curve_options found in API, using defaults:', options)
            }
        }
        
        return options
    }, [product, isContactLens, subSubcategoryOptions, selectedConfig])
    
    const diameterOptions = useMemo(() => {
        // Priority 1: Use configuration data if available
        if (selectedConfig && selectedConfig.right_diameter) {
            const configOptions = Array.isArray(selectedConfig.right_diameter) 
                ? selectedConfig.right_diameter 
                : [selectedConfig.right_diameter]
            if (configOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using diameter options from configuration:', configOptions)
                }
                return configOptions.map(v => typeof v === 'string' ? parseFloat(v) : v).filter(v => !isNaN(v))
            }
        }
        
        // Priority 2: Use aggregated options from sub-subcategory if available
        if (subSubcategoryOptions && subSubcategoryOptions.diameterOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using diameter options from sub-subcategory:', subSubcategoryOptions.diameterOptions)
            }
            return subSubcategoryOptions.diameterOptions
        }
        
        // Priority 3: Use product-specific options
        if (!product) return []
        const p = product as any
        
        // Debug: Log API data in development
        if (import.meta.env.DEV && isContactLens) {
            console.log('🔍 Contact Lens API Data - Diameter Options:', {
                diameter_options: p.diameter_options,
                type: typeof p.diameter_options,
                isArray: Array.isArray(p.diameter_options),
                productId: product.id,
                productName: product.name
            })
        }
        
        // Handle different data formats from API
        let options: (number | string)[] = []
        
        if (Array.isArray(p.diameter_options)) {
            options = p.diameter_options
        } else if (typeof p.diameter_options === 'string') {
            // Try to parse JSON string
            try {
                const parsed = JSON.parse(p.diameter_options)
                if (Array.isArray(parsed)) {
                    options = parsed
                }
            } catch (e) {
                // If parsing fails, try splitting by comma
                options = p.diameter_options.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v))
            }
        }
        
        // Fallback to default options if empty
        if (options.length === 0) {
            options = [14.00, 14.20]
            if (import.meta.env.DEV) {
                console.warn('⚠️ No diameter_options found in API, using defaults:', options)
            }
        }
        
        return options
    }, [product, isContactLens, subSubcategoryOptions, selectedConfig])
    
    // Helper function to check if product belongs to spherical sub-subcategory
    const isSphericalSubSubcategory = useMemo(() => {
        if (!product) return false
        const p = product as any
        
        // Check contact_lens_type field
        const lensType = (p.contact_lens_type || '').toLowerCase()
        if (lensType.includes('spherical') || lensType.includes('sferiche') || lensType.includes('sferica')) {
            return true
        }
        
        // Check subcategory slug/name if available
        const subcategorySlug = (p.subcategory?.slug || '').toLowerCase()
        const subcategoryName = (p.subcategory?.name || '').toLowerCase()
        if (subcategorySlug.includes('spherical') || subcategorySlug.includes('sferiche') || 
            subcategoryName.includes('spherical') || subcategoryName.includes('sferiche') || 
            subcategoryName.includes('sferica')) {
            return true
        }
        
        return false
    }, [product])
    
    // Helper function to check if product belongs to astigmatism sub-subcategory
    // Priority: Configuration type > Sub-subcategory options > Product data
    const isAstigmatismSubSubcategory = useMemo(() => {
        if (!product) return false
        
        // Priority 1: Check selected configuration type (most reliable)
        if (selectedConfig && selectedConfig.configuration_type === 'astigmatism') {
            if (import.meta.env.DEV) {
                console.log('✅ Detected astigmatism from configuration type:', selectedConfig.configuration_type)
            }
            return true
        }
        
        // Priority 2: Check if we have sub-subcategory options with type field
        if (subSubcategoryOptions && subSubcategoryOptions.type === 'astigmatism') {
            if (import.meta.env.DEV) {
                console.log('✅ Detected astigmatism from sub-subcategory options type:', subSubcategoryOptions.type)
            }
            return true
        }
        
        const p = product as any
        
        // Priority 3: Check contact_lens_type field
        const lensType = (p.contact_lens_type || '').toLowerCase()
        if (lensType.includes('astigmatism') || lensType.includes('astigmatismo') || lensType.includes('toric')) {
            if (import.meta.env.DEV) {
                console.log('✅ Detected astigmatism from contact_lens_type:', lensType)
            }
            return true
        }
        
        // Priority 4: Check subcategory slug/name if available
        const subcategorySlug = (p.subcategory?.slug || '').toLowerCase()
        const subcategoryName = (p.subcategory?.name || '').toLowerCase()
        // Check for astigmatism variations: "astigmatism", "astigmatismo", "astighmatism" (typo in admin panel), "toric"
        if (subcategorySlug.includes('astigmatism') || subcategorySlug.includes('astigmatismo') || 
            subcategorySlug.includes('astighmatism') || // Handle typo variant from admin panel
            subcategoryName.includes('astigmatism') || subcategoryName.includes('astigmatismo') ||
            subcategorySlug.includes('toric') || subcategoryName.includes('toric')) {
            if (import.meta.env.DEV) {
                console.log('✅ Detected astigmatism from subcategory name/slug:', { subcategoryName, subcategorySlug })
            }
            return true
        }
        
        if (import.meta.env.DEV) {
            console.log('ℹ️ Product is NOT astigmatism:', {
                hasSelectedConfig: !!selectedConfig,
                configType: selectedConfig?.configuration_type,
                hasSubSubcategoryOptions: !!subSubcategoryOptions,
                subSubcategoryType: subSubcategoryOptions?.type,
                contactLensType: lensType,
                subcategoryName,
                subcategorySlug
            })
        }
        
        return false
    }, [product, subSubcategoryOptions, selectedConfig])
    
    // Generate cylinder options (from -6.00 to +6.00 in 0.25 steps)
    // Priority: Configuration > Sub-subcategory > Standard
    const cylinderOptions = useMemo(() => {
        // Priority 1: Use configuration data if available
        if (selectedConfig && selectedConfig.right_cylinder) {
            const configOptions = Array.isArray(selectedConfig.right_cylinder) 
                ? selectedConfig.right_cylinder 
                : [selectedConfig.right_cylinder]
            if (configOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using cylinder options from configuration:', configOptions)
                }
                return configOptions.map(cyl => {
                    const num = typeof cyl === 'string' ? parseFloat(cyl) : cyl
                    const value = num.toFixed(2)
                    return num > 0 ? `+${value}` : value
                })
            }
        }
        
        // Priority 2: Use aggregated options from sub-subcategory if available
        if (subSubcategoryOptions && subSubcategoryOptions.cylinderOptions && subSubcategoryOptions.cylinderOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using cylinder options from sub-subcategory:', subSubcategoryOptions.cylinderOptions)
            }
            // Convert numbers to strings with proper formatting
            return subSubcategoryOptions.cylinderOptions.map(cyl => {
                const value = cyl.toFixed(2)
                return cyl > 0 ? `+${value}` : value
            })
        }
        
        // Priority 3: Generate standard options
        const options: string[] = []
        for (let i = -24; i <= 24; i++) {
            const value = (i * 0.25).toFixed(2)
            if (i > 0) {
                options.push(`+${value}`)
            } else if (i < 0) {
                options.push(value)
            } else {
                options.push('0.00')
            }
        }
        return options
    }, [subSubcategoryOptions, selectedConfig])
    
    // Generate axis options (0 to 180 in 1 degree steps)
    // Priority: Configuration > Sub-subcategory > Standard
    const axisOptions = useMemo(() => {
        // Priority 1: Use configuration data if available
        if (selectedConfig && selectedConfig.right_axis) {
            const configOptions = Array.isArray(selectedConfig.right_axis) 
                ? selectedConfig.right_axis 
                : [selectedConfig.right_axis]
            if (configOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using axis options from configuration:', configOptions)
                }
                return configOptions.map(axis => String(axis))
            }
        }
        
        // Priority 2: Use aggregated options from sub-subcategory if available
        if (subSubcategoryOptions && subSubcategoryOptions.axisOptions && subSubcategoryOptions.axisOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using axis options from sub-subcategory:', subSubcategoryOptions.axisOptions)
            }
            return subSubcategoryOptions.axisOptions.map(axis => axis.toString())
        }
        
        // Priority 3: Generate standard options
        const options: string[] = []
        for (let i = 0; i <= 180; i++) {
            options.push(i.toString())
        }
        return options
    }, [subSubcategoryOptions, selectedConfig])
    
    // Parse power range to generate options (memoized)
    // Handles multiple ranges like "-0.50 to -6.00 in 0.25 steps" and "-6.50 to -15.00 in 0.50 steps"
    // Priority: Configuration > Sub-subcategory > Product
    const powerOptions = useMemo(() => {
        // Priority 1: Use configuration data if available
        if (selectedConfig && selectedConfig.right_power) {
            const configOptions = Array.isArray(selectedConfig.right_power) 
                ? selectedConfig.right_power 
                : [selectedConfig.right_power]
            if (configOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using power options from configuration:', {
                        count: configOptions.length,
                        options: configOptions.slice(0, 5)
                    })
                }
                return configOptions.map(v => typeof v === 'number' ? v.toFixed(2) : String(v))
            }
        }
        
        // Priority 2: Use aggregated options from sub-subcategory if available
        if (subSubcategoryOptions && subSubcategoryOptions.powerOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using power options from sub-subcategory:', {
                    count: subSubcategoryOptions.powerOptions.length,
                    type: subSubcategoryOptions.type,
                    options: subSubcategoryOptions.powerOptions.slice(0, 5) + '...'
                })
            }
            return subSubcategoryOptions.powerOptions
        }
        
        // Otherwise, use product-specific options or standardized range
        if (!product) return []
        const p = product as any
        
        // For spherical sub-subcategories, use standardized power range
        let range: string
        if (isSphericalSubSubcategory) {
            // Standardized power range for all spherical lenses
            range = '-0.50 to -6.00 in 0.25 steps'
            if (import.meta.env.DEV) {
                console.log('🔍 Using standardized power range for spherical sub-subcategory:', {
                    productId: product.id,
                    productName: product.name,
                    standardizedRange: range
                })
            }
        } else {
            range = p.powers_range || '-0.50 to -6.00 in 0.25 steps'
        }
        
        // Debug: Log power range in development
        if (import.meta.env.DEV && isContactLens) {
            console.log('🔍 Contact Lens API Data - Power Range:', {
                powers_range: p.powers_range,
                isSpherical: isSphericalSubSubcategory,
                usedRange: range,
                type: typeof p.powers_range,
                productId: product.id,
                productName: product.name
            })
        }
        
        if (!range) return []
        
        try {
            const options: string[] = []
            
            // Match all ranges in the string (handles multiple ranges)
            const rangePattern = /(-?\d+\.?\d*)\s+(?:to|a)\s+(-?\d+\.?\d*)\s+(?:in|in\s+variazioni\s+di)\s+(\d+\.?\d*)\s+steps?/gi
            let match
            
            while ((match = rangePattern.exec(range)) !== null) {
                const start = parseFloat(match[1])
                const end = parseFloat(match[2])
                const step = parseFloat(match[3])
                
                if (start < end) {
                    // Positive range (e.g., +0.50 to +6.00)
                    for (let val = start; val <= end; val += step) {
                        const formatted = val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
                        if (!options.includes(formatted)) {
                            options.push(formatted)
                        }
                    }
                } else {
                    // Negative range (e.g., -0.50 to -6.00)
                    for (let val = start; val >= end; val -= step) {
                        const formatted = val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
                        if (!options.includes(formatted)) {
                            options.push(formatted)
                        }
                    }
                }
            }
            
            // If no ranges found, try single range pattern
            if (options.length === 0) {
                const singleMatch = range.match(/(-?\d+\.?\d*)\s+(?:to|a)\s+(-?\d+\.?\d*)\s+(?:in|in\s+variazioni\s+di)\s+(\d+\.?\d*)\s+steps?/i)
                if (singleMatch) {
                    const start = parseFloat(singleMatch[1])
                    const end = parseFloat(singleMatch[2])
                    const step = parseFloat(singleMatch[3])
                    
                    if (start < end) {
                        for (let val = start; val <= end; val += step) {
                            const formatted = val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
                            options.push(formatted)
                        }
                    } else {
                        for (let val = start; val >= end; val -= step) {
                            const formatted = val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
                            options.push(formatted)
                        }
                    }
                }
            }
            
            // Sort options: negative values first (descending), then positive (ascending)
            if (options.length > 0) {
                return options.sort((a, b) => {
                    const numA = parseFloat(a)
                    const numB = parseFloat(b)
                    return numA - numB
                })
            }
        } catch (error) {
            console.error('Error parsing power range:', error)
        }
        
        // Default fallback options
        return ['-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00']
    }, [product, isSphericalSubSubcategory])
    
    // Initialize contact lens form when product loads
    useEffect(() => {
        if (!product?.id) return
        
        const currentProductId = product.id
        
        // Only initialize once per product ID
        if (formInitializedRef.current === currentProductId) return
        
        // Check if it's a contact lens or eye hygiene
        // Use the memoized isContactLens value instead of redefining
        if (isContactLens) {
            const p = product as any
            // Get base curve options (handle different formats)
            let baseCurves: (number | string)[] = []
            if (Array.isArray(p.base_curve_options)) {
                baseCurves = p.base_curve_options
            } else if (typeof p.base_curve_options === 'string') {
                try {
                    const parsed = JSON.parse(p.base_curve_options)
                    if (Array.isArray(parsed)) {
                        baseCurves = parsed
                    }
                } catch (e) {
                    baseCurves = p.base_curve_options.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v))
                }
            }
            if (baseCurves.length === 0) {
                baseCurves = [8.70, 8.80, 8.90]
            }
            
            // Get diameter options (handle different formats)
            let diameters: (number | string)[] = []
            if (Array.isArray(p.diameter_options)) {
                diameters = p.diameter_options
            } else if (typeof p.diameter_options === 'string') {
                try {
                    const parsed = JSON.parse(p.diameter_options)
                    if (Array.isArray(parsed)) {
                        diameters = parsed
                    }
                } catch (e) {
                    diameters = p.diameter_options.split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v))
                }
            }
            if (diameters.length === 0) {
                diameters = [14.00, 14.20]
            }
            
            // Debug: Log initialization in development
            if (import.meta.env.DEV) {
                console.log('🔍 Initializing Contact Lens Form:', {
                    productId: currentProductId,
                    productName: product.name,
                    baseCurves,
                    diameters,
                    base_curve_options_raw: p.base_curve_options,
                    diameter_options_raw: p.diameter_options,
                    powers_range: p.powers_range
                })
            }
            
            if (baseCurves.length > 0 && diameters.length > 0) {
                formInitializedRef.current = currentProductId
                lastProductIdRef.current = currentProductId
                
                setContactLensFormData({
                    right_qty: 1,
                    right_base_curve: baseCurves[0]?.toString() || '8.70',
                    right_diameter: diameters[0]?.toString() || '14.00',
                    right_power: '',
                    left_qty: 1,
                    left_base_curve: baseCurves[0]?.toString() || '8.70',
                    left_diameter: diameters[0]?.toString() || '14.00',
                    left_power: '',
                    unit: 'unit' // Default unit
                })
            }
        } else {
            // Reset refs if not a contact lens
            if (formInitializedRef.current !== null) {
                formInitializedRef.current = null
                lastProductIdRef.current = null
            }
        }
    }, [product?.id, product?.name])
    
    // Memoize product price to prevent recalculation
    const productBasePrice = useMemo(() => {
        if (!product) return 0
        return product.sale_price && product.sale_price < product.price 
            ? Number(product.sale_price) 
            : Number(product.price || 0)
    }, [product])
    
    // Get unit-based pricing from product or calculate based on multipliers
    const getUnitPrice = useMemo(() => {
        if (!product) {
            return (unit: string) => productBasePrice
        }
        const p = product as any
        
        // Check if API provides unit-specific prices
        const boxPrice = p.box_price || null
        const packPrice = p.pack_price || null
        
        // Return function that calculates price based on unit
        return (unit: string) => {
            if (unit === 'unit') {
                return productBasePrice
            } else if (unit === 'box' && boxPrice) {
                return Number(boxPrice)
            } else if (unit === 'pack' && packPrice) {
                return Number(packPrice)
            } else {
                // Calculate based on multipliers (box = 6x, pack = 12x)
                const multipliers: Record<string, number> = {
                    unit: 1,
                    box: 6,
                    pack: 12
                }
                return productBasePrice * (multipliers[unit] || 1)
            }
        }
    }, [product, productBasePrice])
    
    // Memoize total calculation to prevent recalculation on every render
    // Now includes unit-based pricing
    const calculateContactLensTotal = useMemo(() => {
        if (!contactLensFormData.right_power || !contactLensFormData.left_power || productBasePrice === 0) {
            return 0
        }
        
        // Get price per unit (unit/box/pack)
        const unitPrice = getUnitPrice(contactLensFormData.unit)
        
        // For unit selection, calculate total based on quantity
        // If unit is 'box' or 'pack', the price is already for the whole box/pack
        // So we multiply by quantity of boxes/packs
        const rightTotal = unitPrice * contactLensFormData.right_qty
        const leftTotal = unitPrice * contactLensFormData.left_qty
        
        return rightTotal + leftTotal
    }, [
        productBasePrice, 
        contactLensFormData.right_power, 
        contactLensFormData.left_power, 
        contactLensFormData.right_qty, 
        contactLensFormData.left_qty,
        contactLensFormData.unit,
        getUnitPrice
    ])

    // Helper function to check if product is out of stock (MUST be before conditional returns)
    const isProductOutOfStock = useMemo(() => {
        if (!product) return false
        const p = product as any
        const stockStatus = p.stock_status
        const stockQty = product.stock_quantity
        
        return stockStatus === 'out_of_stock' ||
               (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
               (stockStatus === undefined && product.in_stock === false) ||
               (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
    }, [product])

    const handleAddToCart = () => {
        if (!product) return
        
        try {
            // Convert API product to cart-compatible format
            const salePrice = product.sale_price ? Number(product.sale_price) : null
            const regularPrice = product.price ? Number(product.price) : 0
            const finalPrice = salePrice && regularPrice && salePrice < regularPrice ? salePrice : regularPrice
            
            const cartProduct = {
                id: product.id || 0,
                name: product.name || '',
                brand: product.brand || '',
                category: product.category?.slug || 'eyeglasses',
                price: finalPrice,
                image: getProductImageUrl(product, selectedImageIndex), // Use the same image extraction logic, with selected image index
                description: product.description || '',
                inStock: product.in_stock || false,
                rating: product.rating ? Number(product.rating) : undefined,
                quantity: quantity, // Include quantity
                frame_material: selectedFrameMaterial || undefined, // Include selected frame material (single)
                lens_type: selectedLensType || undefined // Include selected lens type (single)
            }
            
            // Add quantity copies
            for (let i = 0; i < quantity; i++) {
                addToCart(cartProduct)
            }
            
            // Navigate to cart after adding
            navigate('/cart')
        } catch (error) {
            console.error('Error adding to cart:', error)
            alert('Failed to add product to cart. Please try again.')
        }
    }
    
    // Handle configuration selection
    const handleConfigSelect = (config: ContactLensConfiguration | null) => {
        setSelectedConfig(config)
        
        if (config) {
            // Pre-fill form with configuration data (all fields are arrays from API)
            const newFormData: Partial<ContactLensFormData> = {}
            
            // Right eye - use arrays from configuration
            if (config.right_qty) {
                const qtyArray = Array.isArray(config.right_qty) ? config.right_qty : [config.right_qty]
                if (qtyArray.length > 0) {
                    newFormData.right_qty = typeof qtyArray[0] === 'number' ? qtyArray[0] : parseInt(String(qtyArray[0])) || 1
                }
            }
            if (config.right_base_curve) {
                const bcOptions = Array.isArray(config.right_base_curve) ? config.right_base_curve : [config.right_base_curve]
                if (bcOptions.length > 0) {
                    newFormData.right_base_curve = String(bcOptions[0])
                }
            }
            if (config.right_diameter) {
                const diaOptions = Array.isArray(config.right_diameter) ? config.right_diameter : [config.right_diameter]
                if (diaOptions.length > 0) {
                    newFormData.right_diameter = String(diaOptions[0])
                }
            }
            if (config.right_power) {
                const powerOptions = Array.isArray(config.right_power) ? config.right_power : [config.right_power]
                if (powerOptions.length > 0) {
                    // Format power value properly
                    const powerValue = powerOptions[0]
                    newFormData.right_power = typeof powerValue === 'number' ? powerValue.toFixed(2) : String(powerValue)
                }
            }
            if (config.configuration_type === 'astigmatism') {
                if (config.right_cylinder) {
                    const cylOptions = Array.isArray(config.right_cylinder) ? config.right_cylinder : [config.right_cylinder]
                    if (cylOptions.length > 0) {
                        const cylValue = cylOptions[0]
                        newFormData.right_cylinder = typeof cylValue === 'number' ? (cylValue > 0 ? `+${cylValue.toFixed(2)}` : cylValue.toFixed(2)) : String(cylValue)
                    }
                }
                if (config.right_axis) {
                    const axisOptions = Array.isArray(config.right_axis) ? config.right_axis : [config.right_axis]
                    if (axisOptions.length > 0) {
                        newFormData.right_axis = String(axisOptions[0])
                    }
                }
            }
            
            // Left eye - use arrays from configuration
            if (config.left_qty) {
                const qtyArray = Array.isArray(config.left_qty) ? config.left_qty : [config.left_qty]
                if (qtyArray.length > 0) {
                    newFormData.left_qty = typeof qtyArray[0] === 'number' ? qtyArray[0] : parseInt(String(qtyArray[0])) || 1
                }
            }
            if (config.left_base_curve) {
                const bcOptions = Array.isArray(config.left_base_curve) ? config.left_base_curve : [config.left_base_curve]
                if (bcOptions.length > 0) {
                    newFormData.left_base_curve = String(bcOptions[0])
                }
            }
            if (config.left_diameter) {
                const diaOptions = Array.isArray(config.left_diameter) ? config.left_diameter : [config.left_diameter]
                if (diaOptions.length > 0) {
                    newFormData.left_diameter = String(diaOptions[0])
                }
            }
            if (config.left_power) {
                const powerOptions = Array.isArray(config.left_power) ? config.left_power : [config.left_power]
                if (powerOptions.length > 0) {
                    // Format power value properly
                    const powerValue = powerOptions[0]
                    newFormData.left_power = typeof powerValue === 'number' ? powerValue.toFixed(2) : String(powerValue)
                }
            }
            if (config.configuration_type === 'astigmatism') {
                if (config.left_cylinder) {
                    const cylOptions = Array.isArray(config.left_cylinder) ? config.left_cylinder : [config.left_cylinder]
                    if (cylOptions.length > 0) {
                        const cylValue = cylOptions[0]
                        newFormData.left_cylinder = typeof cylValue === 'number' ? (cylValue > 0 ? `+${cylValue.toFixed(2)}` : cylValue.toFixed(2)) : String(cylValue)
                    }
                }
                if (config.left_axis) {
                    const axisOptions = Array.isArray(config.left_axis) ? config.left_axis : [config.left_axis]
                    if (axisOptions.length > 0) {
                        newFormData.left_axis = String(axisOptions[0])
                    }
                }
            }
            
            setContactLensFormData(prev => ({ ...prev, ...newFormData }))
            
            if (import.meta.env.DEV) {
                console.log('✅ Configuration selected, form pre-filled:', {
                    configId: config.id,
                    configName: config.display_name,
                    configType: config.configuration_type,
                    formData: newFormData
                })
            }
        } else {
            // Reset form when configuration is deselected
            setContactLensFormData({
                right_qty: 1,
                right_base_curve: '8.70',
                right_diameter: '14.00',
                right_power: '',
                right_cylinder: '',
                right_axis: '',
                left_qty: 1,
                left_base_curve: '8.70',
                left_diameter: '14.00',
                left_power: '',
                left_cylinder: '',
                left_axis: '',
                unit: 'unit'
            })
        }
    }
    
    const handleContactLensFieldChange = (field: keyof ContactLensFormData, value: string | number) => {
        setContactLensFormData(prev => ({ ...prev, [field]: value }))
        
        // Debug: Log unit changes in development
        if (import.meta.env.DEV && field === 'unit') {
            console.log('🔍 Unit Selection Changed:', {
                unit: value,
                productId: product?.id,
                productName: product?.name
            })
        }
        
        if (contactLensErrors[field]) {
            setContactLensErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    // NOW we can do conditional returns AFTER all hooks have been called
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mb-4"></div>
                        <p className="text-lg text-gray-600">Loading product...</p>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('shop.productNotFound')}</h1>
                        <Link to="/shop" className="text-blue-600 hover:text-blue-700">
                            {t('shop.returnToShop')}
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    // Calculate prices safely, ensuring they're numbers
    // Handle price as string or number
    const p = product as any
    
    // Get raw price values - check multiple possible fields
    const rawPrice = product.price || p.price_value || p.regular_price || 0
    const rawSalePrice = product.sale_price || p.sale_price_value || p.discounted_price || null
    
    // Convert price to number - handle string, number, or undefined
    let priceValue = 0
    if (rawPrice != null && rawPrice !== undefined) {
        if (typeof rawPrice === 'string') {
            const parsed = parseFloat(rawPrice)
            priceValue = !isNaN(parsed) ? parsed : 0
        } else {
            priceValue = Number(rawPrice) || 0
        }
    }
    
    // Convert sale_price to number
    let salePriceValue: number | null = null
    if (rawSalePrice != null && rawSalePrice !== undefined) {
        if (typeof rawSalePrice === 'string') {
            const parsed = parseFloat(rawSalePrice)
            salePriceValue = !isNaN(parsed) ? parsed : null
        } else {
            salePriceValue = Number(rawSalePrice) || null
        }
    }
    
    const salePriceNum = salePriceValue != null && !isNaN(salePriceValue) && salePriceValue > 0 ? salePriceValue : null
    const regularPriceNum = !isNaN(priceValue) && priceValue > 0 ? priceValue : 0
    
    // Debug price calculation in development
    if (import.meta.env.DEV) {
        if (regularPriceNum === 0) {
            console.warn('⚠️ Price calculation warning:', {
                rawPrice,
                priceValue,
                regularPriceNum,
                productPrice: product.price,
                product: product
            })
        }
    }
    
    const hasValidSale = salePriceNum != null && regularPriceNum > 0 && salePriceNum < regularPriceNum
    const displayPrice = hasValidSale ? salePriceNum : regularPriceNum
    const originalPrice = hasValidSale ? regularPriceNum : null
    
    const validateContactLensForm = (): boolean => {
        // Don't allow adding to cart if out of stock
        if (isProductOutOfStock) {
            alert(t('shop.outOfStockAlert'))
            return false
        }
        
        const newErrors: Record<string, string> = {}
        
        if (!contactLensFormData.right_power) {
            newErrors.right_power = 'Power is required for right eye'
        }
        
        if (!contactLensFormData.left_power) {
            newErrors.left_power = 'Power is required for left eye'
        }
        
        // For astigmatism lenses, cylinder and axis are required
        if (isAstigmatismSubSubcategory) {
            if (!contactLensFormData.right_cylinder) {
                newErrors.right_cylinder = 'Cylinder is required for right eye'
            }
            if (!contactLensFormData.right_axis) {
                newErrors.right_axis = 'Axis is required for right eye'
            }
            if (!contactLensFormData.left_cylinder) {
                newErrors.left_cylinder = 'Cylinder is required for left eye'
            }
            if (!contactLensFormData.left_axis) {
                newErrors.left_axis = 'Axis is required for left eye'
            }
        }
        
        if (contactLensFormData.right_qty < 1) {
            newErrors.right_qty = 'Quantity must be at least 1'
        }
        
        if (contactLensFormData.left_qty < 1) {
            newErrors.left_qty = 'Quantity must be at least 1'
        }
        
        setContactLensErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }
    
    const handleContactLensAddToCart = async () => {
        if (!validateContactLensForm()) {
            return
        }
        
        setContactLensLoading(true)
        try {
            if (isAuthenticated) {
                const cartRequest: AddToCartRequest = {
                    product_id: product.id,
                    quantity: 1,
                    contact_lens_right_qty: contactLensFormData.right_qty,
                    contact_lens_right_base_curve: parseFloat(contactLensFormData.right_base_curve),
                    contact_lens_right_diameter: parseFloat(contactLensFormData.right_diameter),
                    contact_lens_right_power: parseFloat(contactLensFormData.right_power),
                    contact_lens_left_qty: contactLensFormData.left_qty,
                    contact_lens_left_base_curve: parseFloat(contactLensFormData.left_base_curve),
                    contact_lens_left_diameter: parseFloat(contactLensFormData.left_diameter),
                    contact_lens_left_power: parseFloat(contactLensFormData.left_power),
                    ...(isAstigmatismSubSubcategory && {
                        contact_lens_right_cylinder: contactLensFormData.right_cylinder ? parseFloat(contactLensFormData.right_cylinder) : undefined,
                        contact_lens_right_axis: contactLensFormData.right_axis ? parseInt(contactLensFormData.right_axis) : undefined,
                        contact_lens_left_cylinder: contactLensFormData.left_cylinder ? parseFloat(contactLensFormData.left_cylinder) : undefined,
                        contact_lens_left_axis: contactLensFormData.left_axis ? parseInt(contactLensFormData.left_axis) : undefined
                    })
                }
                
                const result = await addItemToCart(cartRequest)
                
                if (result.success) {
                    const cartProduct = {
                        id: product.id || 0,
                        name: product.name || '',
                        brand: product.brand || '',
                        category: product.category?.slug || (isContactLens ? 'contact-lenses' : ''),
                        price: calculateContactLensTotal, // Total price (right + left eye totals)
                        image: getProductImageUrl(product, selectedImageIndex),
                        description: product.description || '',
                        inStock: product.in_stock || false,
                        unit: contactLensFormData.unit, // Include unit selection
                        isContactLens: true // Flag to identify as contact lens
                    }
                    addToCart(cartProduct)
                    navigate('/cart')
                } else {
                    alert(result.message || 'Failed to add to cart')
                }
            } else {
                const cartProduct = {
                    id: product.id || 0,
                    name: product.name || '',
                    brand: product.brand || '',
                    category: product.category?.slug || 'contact-lenses',
                    price: calculateContactLensTotal, // Total price (right + left eye totals)
                    image: getProductImageUrl(product, selectedImageIndex),
                    description: product.description || '',
                    inStock: product.in_stock || false,
                    unit: contactLensFormData.unit, // Include unit selection
                    isContactLens: true, // Flag to identify as contact lens
                    customization: {
                        contactLens: {
                            unit: contactLensFormData.unit, // Store unit in customization
                            right: {
                                qty: contactLensFormData.right_qty,
                                baseCurve: parseFloat(contactLensFormData.right_base_curve),
                                diameter: parseFloat(contactLensFormData.right_diameter),
                                power: parseFloat(contactLensFormData.right_power),
                                ...(isAstigmatismSubSubcategory && {
                                    cylinder: contactLensFormData.right_cylinder ? parseFloat(contactLensFormData.right_cylinder) : undefined,
                                    axis: contactLensFormData.right_axis ? parseInt(contactLensFormData.right_axis) : undefined
                                })
                            },
                            left: {
                                qty: contactLensFormData.left_qty,
                                baseCurve: parseFloat(contactLensFormData.left_base_curve),
                                diameter: parseFloat(contactLensFormData.left_diameter),
                                power: parseFloat(contactLensFormData.left_power),
                                ...(isAstigmatismSubSubcategory && {
                                    cylinder: contactLensFormData.left_cylinder ? parseFloat(contactLensFormData.left_cylinder) : undefined,
                                    axis: contactLensFormData.left_axis ? parseInt(contactLensFormData.left_axis) : undefined
                                })
                            }
                        }
                    }
                }
                addToCart(cartProduct)
                navigate('/cart')
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            alert('Failed to add to cart. Please try again.')
        } finally {
            setContactLensLoading(false)
        }
    }

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Breadcrumbs */}
            <div className="bg-white py-4 px-4 sm:px-6 border-b border-gray-200">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/shop" className="hover:text-gray-700 transition-colors">
                            SHOP
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Details */}
            <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Product Images */}
                        <div>
                            {isContactLens ? (
                                /* Contact Lens - Two Image Fields (Right Eye & Left Eye) */
                                <div className="space-y-6">
                                    {/* Parse images array */}
                                    {(() => {
                                        // Parse images if it's a JSON string
                                        let imagesArray: string[] = []
                                        if (product.images) {
                                            if (typeof product.images === 'string') {
                                                try {
                                                    imagesArray = JSON.parse(product.images)
                                                } catch (e) {
                                                    imagesArray = [product.images]
                                                }
                                            } else if (Array.isArray(product.images)) {
                                                imagesArray = product.images
                                            }
                                        }
                                        
                                        // Get right eye image (first image) and left eye image (second image, or same as first if only one)
                                        const rightEyeImage = imagesArray.length > 0 
                                            ? imagesArray[0] 
                                            : getProductImageUrl(product, 0)
                                        const leftEyeImage = imagesArray.length > 1 
                                            ? imagesArray[1] 
                                            : (imagesArray.length > 0 ? imagesArray[0] : getProductImageUrl(product, 0))
                                        
                                        return (
                                            <>
                                                {/* Right Eye Image */}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Right Eye</h3>
                                                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                                        <img
                                                            key={`product-${product.id}-right-eye`}
                                                            src={rightEyeImage}
                                                            alt={`${product.name} - Right Eye`}
                                                            className="w-full h-full object-cover p-8"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                if (import.meta.env.DEV) {
                                                                    console.warn('Right eye image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
                                                                }
                                                                target.src = '/assets/images/frame1.png'
                                                            }}
                                                        />
                                                        {(() => {
                                                            const p = product as any
                                                            const stockStatus = p.stock_status
                                                            const stockQty = product.stock_quantity
                                                            
                                                            const isOutOfStock = 
                                                                stockStatus === 'out_of_stock' ||
                                                                (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                                (stockStatus === undefined && product.in_stock === false) ||
                                                                (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                            
                                                            return isOutOfStock ? (
                                                                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                                    {t('shop.outOfStock')}
                                                                </div>
                                                            ) : null
                                                        })()}
                                                        {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum && (
                                                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                                Sale
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Left Eye Image */}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Left Eye</h3>
                                                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                                        <img
                                                            key={`product-${product.id}-left-eye`}
                                                            src={leftEyeImage}
                                                            alt={`${product.name} - Left Eye`}
                                                            className="w-full h-full object-cover p-8"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                if (import.meta.env.DEV) {
                                                                    console.warn('Left eye image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
                                                                }
                                                                target.src = '/assets/images/frame1.png'
                                                            }}
                                                        />
                                                        {(() => {
                                                            const p = product as any
                                                            const stockStatus = p.stock_status
                                                            const stockQty = product.stock_quantity
                                                            
                                                            const isOutOfStock = 
                                                                stockStatus === 'out_of_stock' ||
                                                                (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                                (stockStatus === undefined && product.in_stock === false) ||
                                                                (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                            
                                                            return isOutOfStock ? (
                                                                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                                    {t('shop.outOfStock')}
                                                                </div>
                                                            ) : null
                                                        })()}
                                                        {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum && (
                                                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                                Sale
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            ) : (
                                /* Regular Product - Single Image Display */
                                <>
                                    <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
                                        {(() => {
                                            // Use color_images if available and color is selected
                                            let imageUrl = getProductImageUrl(product, selectedImageIndex)
                                            
                                            if (selectedColor && product.color_images) {
                                                const colorImage = product.color_images.find(ci => ci.color === selectedColor)
                                                if (colorImage && colorImage.images && colorImage.images[selectedImageIndex]) {
                                                    imageUrl = colorImage.images[selectedImageIndex]
                                                }
                                            }
                                            
                                            return (
                                                <img
                                                    key={`product-${product.id}-img-${selectedImageIndex}-${selectedColor || 'default'}`}
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover p-8"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        if (import.meta.env.DEV) {
                                                            console.warn('Image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
                                                        }
                                                        target.src = '/assets/images/frame1.png'
                                                    }}
                                                />
                                            )
                                        })()}
                                        {(() => {
                                            const p = product as any
                                            const stockStatus = p.stock_status
                                            const stockQty = product.stock_quantity
                                            
                                            // Check if out of stock - stock_status takes priority
                                            const isOutOfStock = 
                                                stockStatus === 'out_of_stock' ||
                                                (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                (stockStatus === undefined && product.in_stock === false) ||
                                                (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                            
                                            return isOutOfStock ? (
                                                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                    Out of Stock
                                                </div>
                                            ) : null
                                        })()}
                                        {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum && (
                                            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                Sale
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Color Selection (if color_images available from Postman collection) */}
                                    {product.color_images && product.color_images.length > 0 && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('shop.selectColor', 'Select Color')}
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                {product.color_images.map((colorImage, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedColor(colorImage.color)
                                                            setSelectedImageIndex(0) // Reset to first image of selected color
                                                        }}
                                                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                                            selectedColor === colorImage.color
                                                                ? 'border-blue-950 bg-blue-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium capitalize">
                                                            {colorImage.color}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Thumbnail Images */}
                                    {(() => {
                                        // Use color_images if available and color is selected, otherwise use regular images
                                        let imagesArray: string[] = []
                                        
                                        if (selectedColor && product.color_images) {
                                            const colorImage = product.color_images.find(ci => ci.color === selectedColor)
                                            if (colorImage && colorImage.images) {
                                                imagesArray = colorImage.images
                                            }
                                        }
                                        
                                        // Fallback to regular images if no color_images or no color selected
                                        if (imagesArray.length === 0 && product.images) {
                                            if (typeof product.images === 'string') {
                                                try {
                                                    imagesArray = JSON.parse(product.images)
                                                } catch (e) {
                                                    imagesArray = [product.images]
                                                }
                                            } else if (Array.isArray(product.images)) {
                                                imagesArray = product.images
                                            }
                                        }
                                        
                                        return imagesArray.length > 1 ? (
                                            <div className="flex gap-2 overflow-x-auto">
                                                {imagesArray.map((image, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                                            selectedImageIndex === index
                                                                ? 'border-blue-950'
                                                                : 'border-gray-200'
                                                        }`}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt={`${product.name} view ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = '/assets/images/frame1.png'
                                                            }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null
                                    })()}
                                </>
                            )}
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                                    {product.brand || product.category?.name || 'Brand'}
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    {product.name}
                                </h1>

                                {/* Price */}
                                <div className="mb-6">
                                    {originalPrice ? (
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-bold text-blue-950">
                                                ${displayPrice.toFixed(2)}
                                            </span>
                                            <span className="text-2xl text-gray-500 line-through">
                                                ${originalPrice.toFixed(2)}
                                            </span>
                                            <span className="text-lg font-semibold text-red-600">
                                                {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-4xl font-bold text-blue-950">
                                            ${displayPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                                        <p className="text-gray-600 leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Product Details */}
                                <div className="mb-6 space-y-2">
                                    {product.frame_shape && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Frame Shape:</span>
                                            <span className="text-gray-600 capitalize">{product.frame_shape.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                    {product.frame_material && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Material:</span>
                                            <span className="text-gray-600 capitalize">{product.frame_material}</span>
                                        </div>
                                    )}
                                    {product.gender && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Gender:</span>
                                            <span className="text-gray-600 capitalize">{product.gender}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">Category:</span>
                                            <span className="text-gray-600">{translateCategory(product.category)}</span>
                                        </div>
                                    )}
                                    {product.sku && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">SKU:</span>
                                            <span className="text-gray-600">{product.sku}</span>
                                        </div>
                                    )}
                                    {/* 3D Model URL - from Postman collection */}
                                    {product.model_3d_url && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">3D Model:</span>
                                            <a
                                                href={product.model_3d_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                {t('shop.view3DModel', 'View 3D Model')}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Lens Configuration */}
                                {isContactLens ? (
                                    <div className="mb-6">
                                        {/* Configuration Dropdown */}
                                        {contactLensConfigs.length > 0 && (
                                            <div className="mb-6">
                                                <ContactLensConfigurationDropdown
                                                    configurations={contactLensConfigs}
                                                    selectedConfigId={selectedConfig?.id || null}
                                                    onSelect={handleConfigSelect}
                                                    disabled={isProductOutOfStock || configsLoading}
                                                    className="mb-4"
                                                />
                                                {configsLoading && (
                                                    <p className="text-sm text-gray-500">Loading configurations...</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Unit Selector */}
                                        <div className="mb-6">
                                            <label className="block text-base font-semibold text-gray-900 mb-3">{t('shop.unit')}</label>
                                            <div className="flex gap-3 flex-wrap">
                                                {unitOptions.map((unitOption) => (
                                                    <button
                                                        key={unitOption.value}
                                                        type="button"
                                                        onClick={() => handleContactLensFieldChange('unit', unitOption.value)}
                                                        disabled={isProductOutOfStock}
                                                        className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                                            isProductOutOfStock
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : contactLensFormData.unit === unitOption.value
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                                                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                                        }`}
                                                        title={unitOption.description}
                                                    >
                                                        {unitOption.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">{t('shop.selected')}: {contactLensFormData.unit}</p>
                                        </div>
                                        
                                        {/* Price Display */}
                                        <div className="mb-6">
                                            <div className="text-4xl font-bold text-gray-900">
                                                ${calculateContactLensTotal.toFixed(2)}
                                            </div>
                                        </div>
                                        
                                        {/* Configuration Form */}
                                        <div className={`bg-white border border-gray-300 rounded-lg p-6 mb-6 ${isProductOutOfStock ? 'opacity-60' : ''}`}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Select the parameters</h3>
                                            {isProductOutOfStock && (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm text-red-700 font-medium">
                                                        ⚠️ {t('shop.outOfStockMessage')}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Right Eye */}
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900 mb-4">(Right eye)</h4>
                                                    
                                                    <div className="space-y-4">
                                                        {/* Qty */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={contactLensFormData.right_qty}
                                                                onChange={(e) => handleContactLensFieldChange('right_qty', parseInt(e.target.value) || 1)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                    contactLensErrors.right_qty ? 'border-red-500' : 'border-gray-300'
                                                                } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            />
                                                            {contactLensErrors.right_qty && (
                                                                <p className="text-sm text-red-500 mt-1">{contactLensErrors.right_qty}</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Radius (B.C) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Radius (B.C)</label>
                                                            <select
                                                                value={contactLensFormData.right_base_curve}
                                                                onChange={(e) => handleContactLensFieldChange('right_base_curve', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                {baseCurveOptions.length === 0 ? (
                                                                    <option value="">Loading options...</option>
                                                                ) : (
                                                                    baseCurveOptions.map((option: number | string) => (
                                                                        <option key={option} value={option.toString()}>
                                                                            {option}
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </select>
                                                            {import.meta.env.DEV && baseCurveOptions.length === 0 && (
                                                                <p className="text-xs text-yellow-600 mt-1">⚠️ No base curve options available from API</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Diameter */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">(Diameter)</label>
                                                            <select
                                                                value={contactLensFormData.right_diameter}
                                                                onChange={(e) => handleContactLensFieldChange('right_diameter', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                {diameterOptions.length === 0 ? (
                                                                    <option value="">Loading options...</option>
                                                                ) : (
                                                                    diameterOptions.map((option: number | string) => (
                                                                        <option key={option} value={option.toString()}>
                                                                            {option}
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </select>
                                                            {import.meta.env.DEV && diameterOptions.length === 0 && (
                                                                <p className="text-xs text-yellow-600 mt-1">⚠️ No diameter options available from API</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Power (PWR) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Power (PWR) <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                value={contactLensFormData.right_power}
                                                                onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                    contactLensErrors.right_power ? 'border-red-500' : 'border-gray-300'
                                                                } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="">-</option>
                                                                {powerOptions.map((power) => (
                                                                    <option key={power} value={power}>
                                                                        {power}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {contactLensErrors.right_power && (
                                                                <p className="text-sm text-red-500 mt-1">{contactLensErrors.right_power}</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Cylinder (CYL) - Only for Astigmatism */}
                                                        {isAstigmatismSubSubcategory && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Cilindro (CYL) <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.right_cylinder || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('right_cylinder', e.target.value)}
                                                                    disabled={isProductOutOfStock}
                                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                        contactLensErrors.right_cylinder ? 'border-red-500' : 'border-gray-300'
                                                                    } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {cylinderOptions.map((cyl) => (
                                                                        <option key={cyl} value={cyl}>
                                                                            {cyl}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.right_cylinder && (
                                                                    <p className="text-sm text-red-500 mt-1">{contactLensErrors.right_cylinder}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Axis (AX) - Only for Astigmatism */}
                                                        {isAstigmatismSubSubcategory && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Asse (AX) <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.right_axis || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('right_axis', e.target.value)}
                                                                    disabled={isProductOutOfStock}
                                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                        contactLensErrors.right_axis ? 'border-red-500' : 'border-gray-300'
                                                                    } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {axisOptions.map((axis) => (
                                                                        <option key={axis} value={axis}>
                                                                            {axis}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.right_axis && (
                                                                    <p className="text-sm text-red-500 mt-1">{contactLensErrors.right_axis}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Left Eye */}
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900 mb-4">(Left eye)</h4>
                                                    
                                                    <div className="space-y-4">
                                                        {/* Qty */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={contactLensFormData.left_qty}
                                                                onChange={(e) => handleContactLensFieldChange('left_qty', parseInt(e.target.value) || 1)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                    contactLensErrors.left_qty ? 'border-red-500' : 'border-gray-300'
                                                                } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            />
                                                            {contactLensErrors.left_qty && (
                                                                <p className="text-sm text-red-500 mt-1">{contactLensErrors.left_qty}</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Radius (B.C) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Radius (B.C)</label>
                                                            <select
                                                                value={contactLensFormData.left_base_curve}
                                                                onChange={(e) => handleContactLensFieldChange('left_base_curve', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                {baseCurveOptions.length === 0 ? (
                                                                    <option value="">Loading options...</option>
                                                                ) : (
                                                                    baseCurveOptions.map((option: number | string) => (
                                                                        <option key={option} value={option.toString()}>
                                                                            {option}
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </select>
                                                            {import.meta.env.DEV && baseCurveOptions.length === 0 && (
                                                                <p className="text-xs text-yellow-600 mt-1">⚠️ No base curve options available from API</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Diameter */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">(Diameter)</label>
                                                            <select
                                                                value={contactLensFormData.left_diameter}
                                                                onChange={(e) => handleContactLensFieldChange('left_diameter', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                {diameterOptions.length === 0 ? (
                                                                    <option value="">Loading options...</option>
                                                                ) : (
                                                                    diameterOptions.map((option: number | string) => (
                                                                        <option key={option} value={option.toString()}>
                                                                            {option}
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </select>
                                                            {import.meta.env.DEV && diameterOptions.length === 0 && (
                                                                <p className="text-xs text-yellow-600 mt-1">⚠️ No diameter options available from API</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Power (PWR) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Power (PWR) <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                value={contactLensFormData.left_power}
                                                                onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                disabled={isProductOutOfStock}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                    contactLensErrors.left_power ? 'border-red-500' : 'border-gray-300'
                                                                } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="">-</option>
                                                                {powerOptions.map((power) => (
                                                                    <option key={power} value={power}>
                                                                        {power}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {contactLensErrors.left_power && (
                                                                <p className="text-sm text-red-500 mt-1">{contactLensErrors.left_power}</p>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Cylinder (CYL) - Only for Astigmatism */}
                                                        {isAstigmatismSubSubcategory && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Cilindro (CYL) <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.left_cylinder || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('left_cylinder', e.target.value)}
                                                                    disabled={isProductOutOfStock}
                                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                        contactLensErrors.left_cylinder ? 'border-red-500' : 'border-gray-300'
                                                                    } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {cylinderOptions.map((cyl) => (
                                                                        <option key={cyl} value={cyl}>
                                                                            {cyl}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.left_cylinder && (
                                                                    <p className="text-sm text-red-500 mt-1">{contactLensErrors.left_cylinder}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Axis (AX) - Only for Astigmatism */}
                                                        {isAstigmatismSubSubcategory && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Asse (AX) <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.left_axis || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('left_axis', e.target.value)}
                                                                    disabled={isProductOutOfStock}
                                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                                        contactLensErrors.left_axis ? 'border-red-500' : 'border-gray-300'
                                                                    } ${isProductOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {axisOptions.map((axis) => (
                                                                        <option key={axis} value={axis}>
                                                                            {axis}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.left_axis && (
                                                                    <p className="text-sm text-red-500 mt-1">{contactLensErrors.left_axis}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Add to Cart Button */}
                                        <div className="flex flex-col items-end mb-6">
                                            {isProductOutOfStock && (
                                                <p className="text-sm text-red-600 font-medium mb-2">
                                                    {t('shop.outOfStockMessage')}
                                                </p>
                                            )}
                                            <button
                                                onClick={handleContactLensAddToCart}
                                                disabled={contactLensLoading || isProductOutOfStock}
                                                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                                                    isProductOutOfStock
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                }`}
                                            >
                                                {contactLensLoading 
                                                    ? t('shop.addingToCart') 
                                                    : isProductOutOfStock 
                                                        ? t('shop.outOfStock') 
                                                        : t('shop.addToCart')
                                                }
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Regular Product Quantity and Add to Cart */
                                <div className="mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="font-semibold text-gray-900">Quantity:</label>
                                        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-300"
                                                disabled={quantity <= 1}
                                                aria-label="Decrease quantity"
                                            >
                                                −
                                            </button>
                                            <span className="px-6 py-2.5 min-w-[70px] text-center font-semibold text-gray-900 bg-white">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-300"
                                                disabled={(() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    return stockStatus === 'out_of_stock' ||
                                                           (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                           (stockStatus === undefined && product.in_stock === false) ||
                                                           (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                })()}
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Lens Type Selection - Show only types available for this product */}
                                    {(() => {
                                        // Get available lens types for this product
                                        const getAvailableLensTypes = (): string[] => {
                                            if (!product || !productOptions?.lensTypeEnums) return []
                                            
                                            const p = product as any
                                            
                                            // Check if product has lens_types array
                                            if (Array.isArray(p.lens_types) && p.lens_types.length > 0) {
                                                const filtered = p.lens_types.filter((t: string) => 
                                                    productOptions.lensTypeEnums.includes(t)
                                                )
                                                if (import.meta.env.DEV) {
                                                    console.log('🔍 [Lens Types] Product has lens_types array:', p.lens_types)
                                                    console.log('🔍 [Lens Types] Filtered available types:', filtered)
                                                }
                                                return filtered
                                            }
                                            
                                            // Check if product has lensTypes array (from lensTypes field)
                                            if (Array.isArray(p.lensTypes) && p.lensTypes.length > 0) {
                                                const filtered = p.lensTypes
                                                    .map((lt: any) => lt.type || lt.name || lt)
                                                    .filter((t: string) => 
                                                        productOptions.lensTypeEnums.includes(t)
                                                    )
                                                if (import.meta.env.DEV) {
                                                    console.log('🔍 [Lens Types] Product has lensTypes array:', p.lensTypes)
                                                    console.log('🔍 [Lens Types] Filtered available types:', filtered)
                                                }
                                                return filtered
                                            }
                                            
                                            // Check if product has lens_type (singular)
                                            if (p.lens_type) {
                                                if (productOptions.lensTypeEnums.includes(p.lens_type)) {
                                                    if (import.meta.env.DEV) {
                                                        console.log('🔍 [Lens Types] Product has single lens_type:', p.lens_type)
                                                    }
                                                    return [p.lens_type]
                                                }
                                            }
                                            
                                            // If product doesn't specify types, don't show lens type selection
                                            if (import.meta.env.DEV) {
                                                console.log('🔍 [Lens Types] Product has no specific lens types. Available options:', productOptions.lensTypeEnums)
                                                console.log('🔍 [Lens Types] Product data:', {
                                                    lens_types: p.lens_types,
                                                    lensTypes: p.lensTypes,
                                                    lens_type: p.lens_type
                                                })
                                            }
                                            return []
                                        }
                                        
                                        const availableLensTypes = getAvailableLensTypes()
                                        
                                        return (
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                    {t('shop.lensType', 'Lens Type')} <span className="text-xs font-normal text-gray-500">({t('shop.selectOne', 'Select One')})</span>
                                                </label>
                                                {availableLensTypes.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                                                        {availableLensTypes.map((lensType) => {
                                                            const isSelected = selectedLensType === lensType
                                                            return (
                                                                <label
                                                                    key={lensType}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                                                                        isSelected
                                                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 shadow-md ring-2 ring-blue-200'
                                                                            : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="lensType"
                                                                        value={lensType}
                                                                        checked={isSelected}
                                                                        onChange={() => setSelectedLensType(lensType)}
                                                                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                                                                    />
                                                                    <span className={`text-sm font-medium capitalize flex-1 ${
                                                                        isSelected ? 'text-blue-900' : 'text-gray-700'
                                                                    }`}>
                                                                        {lensType.replace(/_/g, ' ')}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                                        <p className="text-sm text-gray-500 text-center">{t('shop.noLensTypesAvailable', 'No lens types available for this product')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    
                                    {/* Frame Material Selection - Show only materials available for this product */}
                                    {(() => {
                                        // Get available frame materials for this product
                                        const getAvailableFrameMaterials = (): string[] => {
                                            if (!product || !productOptions?.frameMaterials) return []
                                            
                                            const p = product as any
                                            
                                            // Check if product has frame_materials array (plural)
                                            if (Array.isArray(p.frame_materials) && p.frame_materials.length > 0) {
                                                // Filter to show only materials that exist in productOptions
                                                const filtered = p.frame_materials.filter((m: string) => 
                                                    productOptions.frameMaterials.includes(m)
                                                )
                                                if (import.meta.env.DEV) {
                                                    console.log('🔍 [Frame Materials] Product has frame_materials array:', p.frame_materials)
                                                    console.log('🔍 [Frame Materials] Filtered available materials:', filtered)
                                                }
                                                return filtered
                                            }
                                            
                                            // Check if product has frame_material (singular)
                                            if (p.frame_material) {
                                                // If the product's frame_material exists in available options, show it
                                                if (productOptions.frameMaterials.includes(p.frame_material)) {
                                                    if (import.meta.env.DEV) {
                                                        console.log('🔍 [Frame Materials] Product has single frame_material:', p.frame_material)
                                                    }
                                                    return [p.frame_material]
                                                }
                                            }
                                            
                                            // If product doesn't specify materials, don't show frame material selection
                                            if (import.meta.env.DEV) {
                                                console.log('🔍 [Frame Materials] Product has no specific materials')
                                            }
                                            return []
                                        }
                                        
                                        const availableMaterials = getAvailableFrameMaterials()
                                        
                                        return (
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                    {t('shop.frameMaterial', 'Frame Material')} <span className="text-xs font-normal text-gray-500">({t('shop.selectOne', 'Select One')})</span>
                                                </label>
                                                {availableMaterials.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                                                        {availableMaterials.map((material) => {
                                                            const isSelected = selectedFrameMaterial === material
                                                            return (
                                                                <label
                                                                    key={material}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                                                                        isSelected
                                                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 shadow-md ring-2 ring-blue-200'
                                                                            : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="frameMaterial"
                                                                        value={material}
                                                                        checked={isSelected}
                                                                        onChange={() => setSelectedFrameMaterial(material)}
                                                                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                                                                    />
                                                                    <span className={`text-sm font-medium capitalize flex-1 ${
                                                                        isSelected ? 'text-blue-900' : 'text-gray-700'
                                                                    }`}>
                                                                        {material.replace(/_/g, ' ')}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                                        <p className="text-sm text-gray-500 text-center">{t('shop.noFrameMaterialsAvailable', 'No frame materials available for this product')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    
                                    <div className="space-y-3 pt-2">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={(() => {
                                                const p = product as any
                                                const stockStatus = p.stock_status
                                                const stockQty = product.stock_quantity
                                                
                                                return stockStatus === 'out_of_stock' ||
                                                       (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                       (stockStatus === undefined && product.in_stock === false) ||
                                                       (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                            })()}
                                            className={`w-full px-6 py-3.5 rounded-lg font-semibold text-base transition-all duration-200 shadow-md ${
                                                (() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    const isInStock = stockStatus === 'in_stock' ||
                                                                      (stockStatus !== 'out_of_stock' && stockQty !== undefined && stockQty > 0) ||
                                                                      (stockStatus === undefined && product.in_stock === true) ||
                                                                      (stockStatus === undefined && stockQty !== undefined && stockQty > 0)
                                                    
                                                    return isInStock
                                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg transform hover:-translate-y-0.5'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                })()
                                            }`}
                                        >
                                            Buy Glasses Only
                                        </button>
                                        
                                        <button
                                            onClick={() => setShowCheckout(true)}
                                            disabled={(() => {
                                                const p = product as any
                                                const stockStatus = p.stock_status
                                                const stockQty = product.stock_quantity
                                                
                                                return stockStatus === 'out_of_stock' ||
                                                       (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                       (stockStatus === undefined && product.in_stock === false) ||
                                                       (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                            })()}
                                            className={`w-full px-6 py-3.5 rounded-lg font-semibold text-base transition-all duration-200 shadow-md ${
                                                (() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    const isInStock = stockStatus === 'in_stock' ||
                                                                      (stockStatus !== 'out_of_stock' && stockQty !== undefined && stockQty > 0) ||
                                                                      (stockStatus === undefined && product.in_stock === true) ||
                                                                      (stockStatus === undefined && stockQty !== undefined && stockQty > 0)
                                                    
                                                    return isInStock
                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                })()
                                            }`}
                                        >
                                            Select Lenses
                                        </button>
                                        
                                        <div className="flex gap-3">
                                            {/* 3D Model Viewer Button - from Postman collection */}
                                            {product.model_3d_url && (
                                                <a
                                                    href={product.model_3d_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    {t('shop.view3DModel', 'View 3D Model')}
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setShowTryOn(true)}
                                                disabled={(() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    return stockStatus === 'out_of_stock' ||
                                                           (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                           (stockStatus === undefined && product.in_stock === false) ||
                                                           (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                })()}
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                            >
                                                Try on
                                            </button>
                                            
                                            <a
                                                href="https://wa.me/1234567890"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Specifications for Contact Lenses */}
            {isContactLens && (
                <section className="py-12 md:py-16 bg-gray-50 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{t('shop.productSpecifications')}</h2>
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {p.can_sleep_with !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-700">{t('shop.sleepingWithLenses')}:</span>
                                            <span className="text-gray-900 font-medium">{p.can_sleep_with ? t('common.yes', 'YES') : t('common.no', 'NO')}</span>
                                        </div>
                                    )}
                                    {p.has_uv_filter !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-700">{t('shop.uvFilter')}:</span>
                                            <span className="text-gray-900 font-medium">{p.has_uv_filter ? t('common.yes', 'YES') : t('common.no', 'NO')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Right Column */}
                                <div className="space-y-4">
                                    {p.is_medical_device !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-700">{t('shop.medicalDevice')}:</span>
                                            <span className="text-gray-900 font-medium">{p.is_medical_device ? t('common.yes', 'YES') : t('common.no', 'NO')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="py-12 md:py-16 bg-gray-50 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    to={`/shop/product/${relatedProduct.slug}`}
                                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
                                >
                                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                                        <img
                                            src={getProductImageUrl(relatedProduct)}
                                            alt={relatedProduct.name}
                                            className="w-full h-full object-contain p-4"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/assets/images/frame1.png'
                                            }}
                                        />
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {relatedProduct.name}
                                        </h3>
                                        <div className="mt-auto pt-4">
                                            <span className="text-xl font-bold text-blue-950">
                                                ${Number(relatedProduct.sale_price || relatedProduct.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            {/* Checkout Modal */}
            {showCheckout && product && !isContactLens && (
                <ProductCheckout
                    product={product}
                    onClose={() => setShowCheckout(false)}
                    initialFrameMaterials={selectedFrameMaterial ? [selectedFrameMaterial] : []}
                    initialLensType={selectedLensType || undefined}
                />
            )}


            {/* Virtual Try-On Modal */}
            <VirtualTryOnModal
                open={showTryOn}
                onClose={() => setShowTryOn(false)}
                selectedProduct={product}
            />
        </div>
    )
}

export default ProductDetail

