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
    type Product
} from '../../services/productsService'
import { addItemToCart, type AddToCartRequest } from '../../services/cartService'
import { getProductImageUrl } from '../../utils/productImage'
import ProductCheckout from '../../components/shop/ProductCheckout'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import AxisDiagram from '../../components/shop/AxisDiagram'
import { useAuth } from '../../context/AuthContext'
import {
    getContactLensFormConfig,
    getAstigmatismConfigs,
    getSphericalConfigs,
    addContactLensToCart,
    getContactLensOptions,
    getUnitPriceAndImages,
    type ContactLensFormConfig,
    type SphericalConfig,
    type AstigmatismConfig,
    type ContactLensCheckoutRequest
} from '../../services/contactLensFormsService'
import {
    getEyeHygieneOptions,
    type EyeHygieneOptions
} from '../../services/eyeHygieneFormsService'

const ProductDetail: React.FC = () => {
    const { t } = useTranslation()
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [product, setProduct] = useState<Product | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [selectedColor, setSelectedColor] = useState<string | null>(null) // For color_images support
    const [quantity] = useState(1)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showTryOn, setShowTryOn] = useState(false)
    const [showDescription, setShowDescription] = useState(false)
    const [showSpecsDescription, setShowSpecsDescription] = useState(false)
    const [selectedFrameMaterial, setSelectedFrameMaterial] = useState<string>('') // Single selection
    const [selectedLensType, setSelectedLensType] = useState<'distance_vision' | 'near_vision' | 'progressive' | ''>('') // Proper lens type enum
    const lastProductIdRef = useRef<number | null>(null)
    const formInitializedRef = useRef<number | null>(null)

    // Contact Lens Forms API Integration State
    const [contactLensFormConfig, setContactLensFormConfig] = useState<ContactLensFormConfig | null>(null)
    // Separate state for spherical power values (from spherical configs, not astigmatism dropdown API)
    const [sphericalPowerValues, setSphericalPowerValues] = useState<string[]>([])

    // Contact Lens Form Data State (if not already defined elsewhere)
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
        unit: string
    }


    const [contactLensFormData, setContactLensFormData] = useState<ContactLensFormData>({
        right_qty: 0,
        right_base_curve: '00.00',
        right_diameter: '00.00',
        right_power: '00.00',
        left_qty: 0,
        left_base_curve: '00.00',
        left_diameter: '00.00',
        left_power: '00.00',
        unit: 'unit'
    })
    const [contactLensErrors, setContactLensErrors] = useState<Record<string, string>>({})
    const [rightEyeEnabled, setRightEyeEnabled] = useState(true)
    const [leftEyeEnabled, setLeftEyeEnabled] = useState(true)
    const [contactLensLoading, setContactLensLoading] = useState(false)
    const [selectedConfig, setSelectedConfig] = useState<SphericalConfig | null>(null)
    const [sphericalConfigs, setSphericalConfigs] = useState<SphericalConfig[]>([])
    const [astigmatismConfigs, setAstigmatismConfigs] = useState<AstigmatismConfig[]>([])
    const [selectedAstigmatismConfig, setSelectedAstigmatismConfig] = useState<AstigmatismConfig | null>(null)
    const [subSubcategoryOptions, setSubSubcategoryOptions] = useState<any>(null)
    
    // Unit-based pricing and images state (independent from qty)
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null) // Selected unit (pack size), e.g., 10, 20, 30
    const [unitPrice, setUnitPrice] = useState<number | null>(null)
    const [unitImages, setUnitImages] = useState<string[]>([])
    const [loadingUnitData, setLoadingUnitData] = useState(false)

    // Eye Hygiene Form Data State
    interface EyeHygieneFormData {
        size_volume: string
        pack_type: string
        quantity: number
    }
    const [eyeHygieneFormData, setEyeHygieneFormData] = useState<EyeHygieneFormData>({
        size_volume: '',
        pack_type: '',
        quantity: 1
    })
    const [eyeHygieneOptions, setEyeHygieneOptions] = useState<{
        size_volume: string[]
        pack_type: string[]
    }>({
        size_volume: [],
        pack_type: []
    })

    // Check if product is a contact lens
    const { translateCategory } = useCategoryTranslation()

    // Get selected color variant - supports both 'colors' array (preferred) and 'color_images' array (fallback)
    const selectedColorVariant = useMemo(() => {
        if (!product || !selectedColor) return null
        
        const p = product as any
        const selectedColorLower = (selectedColor || '').toLowerCase()
        
        // First try to find in 'colors' array (preferred format from API)
        if (p.colors && Array.isArray(p.colors)) {
            const colorData = p.colors.find((c: any) => 
                (c.value && c.value.toLowerCase() === selectedColorLower) ||
                (c.hexCode && c.hexCode.toLowerCase() === selectedColorLower) ||
                (c.name && c.name.toLowerCase() === selectedColorLower)
            )
            if (colorData) return colorData
        }
        
        // Fallback to 'color_images' array
        if (product.color_images) {
            return product.color_images.find(ci => 
                (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
                (ci.name && ci.name.toLowerCase() === selectedColorLower)
            ) || null
        }
        
        return null
    }, [product, selectedColor])

    // Price calculation - uses variant price if color is selected (supports both 'colors' array and 'color_images' array)
    const { displayPrice, originalPrice, hasValidSale } = useMemo(() => {
        if (!product) return { displayPrice: 0, originalPrice: null, hasValidSale: false }

        // Use variant price if color is selected and variant has a price
        let basePrice = Number(product.price || 0)
        if (selectedColorVariant) {
            // Check if variant has a price (from 'colors' array or 'color_images' array)
            const variantPrice = (selectedColorVariant as any).price
            if (variantPrice !== undefined && variantPrice !== null) {
                basePrice = Number(variantPrice)
            }
        }

        const salePrice = product.sale_price ? Number(product.sale_price) : null
        const isValidSale = !!(salePrice && salePrice < basePrice)
        const finalPrice = isValidSale ? salePrice : basePrice

        return {
            displayPrice: finalPrice,
            originalPrice: isValidSale ? basePrice : null,
            hasValidSale: isValidSale
        }
    }, [product, selectedColorVariant])

    // Helper variables for backward compatibility with legacy JSX sections
    const regularPriceNum = originalPrice || displayPrice
    const salePriceNum = hasValidSale ? displayPrice : null

    // Check if product is eye hygiene (check both category and subcategory)
    const isEyeHygiene = useMemo(() => {
        if (!product) return false
        const categorySlug = product.category?.slug || ''
        const categoryName = product.category?.name || ''
        const subCategorySlug = (product as any).subCategory?.slug || (product as any).sub_category?.slug || ''
        const subCategoryName = (product as any).subCategory?.name || (product as any).sub_category?.name || ''
        
        // Check if category or subcategory contains "eye hygiene" or "hygiene"
        const categoryMatch = categorySlug.toLowerCase().includes('eye-hygiene') || 
                             categorySlug.toLowerCase().includes('hygiene') ||
                             categoryName.toLowerCase().includes('eye hygiene') ||
                             categoryName.toLowerCase().includes('hygiene')
        
        const subCategoryMatch = subCategorySlug.toLowerCase().includes('eye-hygiene') ||
                                subCategorySlug.toLowerCase().includes('hygiene') ||
                                subCategoryName.toLowerCase().includes('eye hygiene') ||
                                subCategoryName.toLowerCase().includes('hygiene')
        
        // Also check if product has Eye Hygiene fields
        const hasEyeHygieneFields = !!(product as any).size_volume || !!(product as any).pack_type || !!(product as any).expiry_date
        
        return categoryMatch || subCategoryMatch || hasEyeHygieneFields
    }, [product])

    const isContactLens = useMemo(() => {
        if (!product) return false
        const p = product as any
        const categorySlug = product.category?.slug || ''
        const categoryName = product.category?.name || ''
        return categorySlug.toLowerCase().includes('contact') ||
            categoryName.toLowerCase().includes('contact') ||
            categorySlug.toLowerCase().includes('lens') ||
            (p.contact_lens_type && p.contact_lens_type.length > 0)
    }, [product])

    // Helper function to check if product belongs to astigmatism sub-subcategory
    // Priority: Configuration type > Sub-subcategory options > Product data
    const isAstigmatismSubSubcategory = useMemo(() => {
        if (!product) return false

        // Priority 1: SphericalConfig doesn't have configuration_type field
        // Form type is determined from contactLensFormConfig.formType instead

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
                hasSubSubcategoryOptions: !!subSubcategoryOptions,
                subSubcategoryType: subSubcategoryOptions?.type,
                contactLensType: lensType,
                subcategoryName,
                subcategorySlug
            })
        }

        return false
    }, [product, subSubcategoryOptions, selectedConfig])

    useEffect(() => {
        let isCancelled = false

        const fetchProduct = async () => {
            if (!slug) return

            setLoading(true)
            let productData = await getProductBySlug(slug)

            if (isCancelled) return

            if (productData) {
                // Reset selected image index when loading a new product
                setSelectedImageIndex(0)
                // Reset selections when product changes
                setSelectedFrameMaterial('')
                setSelectedLensType('')
                
                // Log Eye Hygiene fields if present
                const p = productData as any
                if (import.meta.env.DEV && (p.size_volume || p.pack_type || p.expiry_date)) {
                    console.log('👁️ Eye Hygiene Product Detected:', {
                        name: productData.name,
                        size_volume: p.size_volume,
                        pack_type: p.pack_type,
                        expiry_date: p.expiry_date,
                        stock_quantity: productData.stock_quantity,
                        category: productData.category?.name,
                        categorySlug: productData.category?.slug,
                        subCategory: p.subCategory?.name || p.sub_category?.name,
                        subCategorySlug: p.subCategory?.slug || p.sub_category?.slug
                    });
                }
                
                // Check URL parameters for color selection
                const urlParams = new URLSearchParams(window.location.search)
                const colorParam = urlParams.get('color')
                
                // Auto-select color: URL parameter > product.selectedColor > first color
                if (colorParam) {
                    // Color from URL parameter (hex code or color name)
                    setSelectedColor(colorParam)
                    if (import.meta.env.DEV) {
                        console.log('🎨 Color from URL parameter:', colorParam)
                    }
                } else if (p.selectedColor) {
                    // Use product's default selected color
                    setSelectedColor(p.selectedColor)
                    if (import.meta.env.DEV) {
                        console.log('🎨 Using product default color:', p.selectedColor)
                    }
                } else if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
                    // Use first color from 'colors' array (preferred)
                    const firstColor = p.colors[0]
                    setSelectedColor(firstColor.value || firstColor.hexCode || firstColor.name)
                    if (import.meta.env.DEV) {
                        console.log('🎨 Auto-selected first color from colors array:', firstColor)
                    }
                } else if (productData.color_images && productData.color_images.length > 0) {
                    // Fallback to first color from 'color_images' array
                    const firstColor = productData.color_images[0]
                    setSelectedColor(firstColor.color)
                    if (import.meta.env.DEV) {
                        console.log('🎨 Auto-selected first color from color_images:', firstColor.color, firstColor)
                    }
                } else {
                    setSelectedColor(null)
                }

                // Debug log product data and image info
                if (import.meta.env.DEV) {
                    const imageUrl = getProductImageUrl(productData, 0)

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
                        stock_quantity: productData.stock_quantity,
                        in_stock: productData.in_stock,
                        category: productData.category?.slug,
                        fullProduct: productData
                    })
                }
                setProduct(productData)

                // Fetch related products
                const related = await getRelatedProducts(productData.id, 4)
                if (!isCancelled) {
                    setRelatedProducts(related)
                }
            } else {
                // Product not found or deleted, redirect to shop
                // This handles both 404 errors and products deleted from admin panel
                // Deleted products are automatically excluded from public API endpoints
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

    // Product options (frame materials, etc.) are not currently fetched or used
    // If needed in the future, you'll need to:
    // 1. Import getProductOptions from '../../services/productsService'
    // 2. Create a state variable for productOptions
    // 3. Uncomment and use the useEffect below:
    // useEffect(() => {
    //     const fetchOptions = async () => {
    //         try {
    //             const options = await getProductOptions()
    //             // Store and use options here
    //         } catch (error) {
    //             console.error('Error fetching product options:', error)
    //         }
    //     }
    //     fetchOptions()
    // }, [])

    // Fetch Contact Lens Form Configuration from API
    useEffect(() => {
        const fetchFormConfig = async () => {
            if (!product || !isContactLens) {
                setContactLensFormConfig(null)
                // Clear all config state when not a contact lens
                setSphericalConfigs([])
                setSelectedConfig(null)
                setSphericalPowerValues([])
                setAstigmatismConfigs([])
                setSelectedAstigmatismConfig(null)
                return
            }

            // Clear config state at the start of fetch to prevent stale data
            setSphericalConfigs([])
            setSelectedConfig(null)
            setSphericalPowerValues([])
            setAstigmatismConfigs([])
            setSelectedAstigmatismConfig(null)

            const p = product as any

            // Enhanced sub-sub-category detection - try multiple possible structures
            // A sub-sub-category must have a parent_id (it's a child of a subcategory)
            let subCategoryId: number | string | undefined = undefined
            let subCategoryData: any = null

            // Priority 1: Check direct subcategory field (most common)
            if (p.subcategory) {
                subCategoryData = p.subcategory
                // Check if it has parent_id (indicates it's a sub-sub-category)
                if (subCategoryData.parent_id) {
                    subCategoryId = subCategoryData.id
                }
            }

            // Priority 2: Check alternative field names
            if (!subCategoryId) {
                const possibleFields = [
                    p.sub_category_id,
                    p.subcategory_id,
                    p.sub_category?.id,
                    p.subcategory?.id
                ]

                for (const field of possibleFields) {
                    if (field) {
                        subCategoryId = field
                        break
                    }
                }
            }

            // Priority 3: Check nested category structure (category -> subcategories -> children)
            if (!subCategoryId && p.category) {
                const category = p.category
                // Check if category has subcategories with children (sub-sub-categories)
                if (category.subcategories && Array.isArray(category.subcategories)) {
                    for (const subcat of category.subcategories) {
                        if (subcat.children && Array.isArray(subcat.children) && subcat.children.length > 0) {
                            // Use the first child sub-sub-category (or find the one matching product)
                            // For now, use the first one - in future could match by product association
                            subCategoryId = subcat.children[0]?.id
                            if (subCategoryId) break
                        }
                    }
                }
            }

            // Priority 4: Check if category itself might be the sub-sub-category (if it has parent_id)
            if (!subCategoryId && p.category?.parent_id) {
                subCategoryId = p.category.id
            }

            // Validate that we have a valid ID (must be a number, not a slug)
            if (!subCategoryId) {
                if (import.meta.env.DEV) {
                    console.warn('⚠️ No sub-sub-category ID found for contact lens product:', product.id, {
                        productName: product.name,
                        productSlug: product.slug,
                        subcategory: p.subcategory,
                        sub_category_id: p.sub_category_id,
                        subcategory_id: p.subcategory_id,
                        category: p.category,
                        fullProduct: p
                    })
                }
                return
            }

            // Ensure it's a number (not a slug/string)
            const numericId = typeof subCategoryId === 'string' ? parseInt(subCategoryId, 10) : subCategoryId
            if (isNaN(numericId) || numericId <= 0) {
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Invalid sub-sub-category ID (not a number):', subCategoryId, 'for product:', product.id, {
                        productName: product.name,
                        type: typeof subCategoryId
                    })
                }
                return
            }

            if (import.meta.env.DEV) {
                console.log('🔍 Detected sub-sub-category ID for contact lens product:', {
                    productId: product.id,
                    productName: product.name,
                    subCategoryId: numericId,
                    subCategoryData: subCategoryData
                })
            }

            // Loading state for form config (currently not displayed in UI)
            try {
                const config = await getContactLensFormConfig(numericId)
                if (config) {
                    setContactLensFormConfig(config)
                    if (import.meta.env.DEV) {
                        console.log('✅ Contact Lens Form Config loaded:', config)
                    }

                    // For Astigmatism, dropdown values are extracted from astigmatismConfigs
                    // (see fetchAstigmatismConfigs useEffect below)
                    if (config.formType === 'astigmatism') {
                        // Astigmatism dropdown values are handled in fetchAstigmatismConfigs
                        // No need to extract here since we use astigmatismConfigs directly
                    } else {
                        // For Spherical, fetch configurations which contain the dropdown values
                        // Filter by product_id to get only configs assigned to this product
                        // This ensures dropdown values are specific to the selected product
                        const configs = await getSphericalConfigs(numericId, product.id)
                        if (import.meta.env.DEV) {
                            console.log('📦 Fetched spherical configs (filtered by product_id):', {
                                productId: product.id,
                                count: configs?.length || 0,
                                firstConfig: configs?.[0] ? {
                                    id: configs[0].id,
                                    name: configs[0].name,
                                    right_qty: configs[0].right_qty,
                                    right_base_curve: configs[0].right_base_curve,
                                    right_diameter: configs[0].right_diameter,
                                    right_power: configs[0].right_power?.slice(0, 5), // First 5 power values
                                    left_qty: configs[0].left_qty,
                                    left_base_curve: configs[0].left_base_curve,
                                    left_diameter: configs[0].left_diameter,
                                    left_power: configs[0].left_power?.slice(0, 5) // First 5 power values
                                } : null
                            })
                        }
                        if (configs && configs.length > 0) {
                            setSphericalConfigs(configs)
                            // Auto-select first config if available
                            if (configs.length > 0) {
                                setSelectedConfig(configs[0])
                                if (import.meta.env.DEV) {
                                    console.log('✅ Selected first config:', {
                                        id: configs[0].id,
                                        right_qty: configs[0].right_qty,
                                        right_base_curve: configs[0].right_base_curve,
                                        right_diameter: configs[0].right_diameter
                                    })
                                }
                            }
                            
                            // Extract power values from all spherical configs (right_power and left_power arrays)
                            // IMPORTANT: Only use power values from spherical configs, NOT from astigmatism dropdown API
                            // These values are already filtered by product_id since configs are filtered
                            const allPowerValues = new Set<string>()
                            configs.forEach(config => {
                                // Safely extract power values - handle null, undefined, and empty arrays
                                const rightPower = (config.right_power && Array.isArray(config.right_power)) ? config.right_power : []
                                const leftPower = (config.left_power && Array.isArray(config.left_power)) ? config.left_power : []
                                
                                // Add all power values to the set (handles both string and number arrays)
                                // Filter out null, undefined, and empty string values
                                rightPower.forEach(v => {
                                    if (v != null && v !== '') {
                                        allPowerValues.add(String(v))
                                    }
                                })
                                leftPower.forEach(v => {
                                    if (v != null && v !== '') {
                                        allPowerValues.add(String(v))
                                    }
                                })
                            })
                            
                            // Convert to sorted array of strings
                            const powerValuesArray = Array.from(allPowerValues).sort((a, b) => {
                                const numA = parseFloat(a)
                                const numB = parseFloat(b)
                                if (!isNaN(numA) && !isNaN(numB)) {
                                    return numA - numB
                                }
                                return a.localeCompare(b)
                            })
                            
                            if (import.meta.env.DEV) {
                                console.log('✅ Extracted power values:', {
                                    total: powerValuesArray.length,
                                    first10: powerValuesArray.slice(0, 10)
                                })
                            }
                            
                            // Store in spherical power values state (NOT in astigmatism dropdown values)
                            setSphericalPowerValues(powerValuesArray)
                            
                            // Astigmatism dropdown values are not used for spherical forms

                            if (import.meta.env.DEV) {
                                console.log('✅ Spherical configurations loaded:', {
                                    count: configs.length,
                                    powerValues: powerValuesArray.length,
                                    powerValuesArray,
                                    configs: configs
                                })
                            }
                        } else {
                            // No configs found, set empty values and clear configs
                            setSphericalConfigs([])
                            setSelectedConfig(null)
                            setSphericalPowerValues([])
                            if (import.meta.env.DEV) {
                                console.info('ℹ️ API returned empty spherical configs - dropdowns will be empty (this is expected until admin adds configs)')
                            }
                        }
                    }
                } else {
                    // Config endpoint failed (404 or other error) - try fallback: fetch spherical configs directly
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ Failed to load contact lens form config for sub-category:', subCategoryId, '- trying fallback: fetching spherical configs directly')
                    }
                    
                    // Fallback: Try to fetch spherical configs directly
                    // If configs exist, assume it's a spherical form
                    // Filter by product_id to get only configs assigned to this product
                    const configs = await getSphericalConfigs(numericId, product.id)
                    if (configs && configs.length > 0) {
                        // Create a minimal config object for spherical form
                        setContactLensFormConfig({
                            formType: 'spherical',
                            subCategory: subCategoryData || {
                                id: numericId,
                                name: '',
                                slug: ''
                            },
                            formFields: {
                                rightEye: {},
                                leftEye: {}
                            }
                        })
                        
                        setSphericalConfigs(configs)
                        // Auto-select first config if available
                        if (configs.length > 0) {
                            setSelectedConfig(configs[0])
                        }
                        
                        // Extract power values from all spherical configs
                        // IMPORTANT: Only use power values from spherical configs, NOT from astigmatism dropdown API
                        const allPowerValues = new Set<string>()
                        configs.forEach(config => {
                            // Safely extract power values - handle null, undefined, and empty arrays
                            const rightPower = (config.right_power && Array.isArray(config.right_power)) ? config.right_power : []
                            const leftPower = (config.left_power && Array.isArray(config.left_power)) ? config.left_power : []
                            
                            // Filter out null, undefined, and empty string values
                            rightPower.forEach(v => {
                                if (v != null && v !== '') {
                                    allPowerValues.add(String(v))
                                }
                            })
                            leftPower.forEach(v => {
                                if (v != null && v !== '') {
                                    allPowerValues.add(String(v))
                                }
                            })
                        })
                        
                        const powerValuesArray = Array.from(allPowerValues).sort((a, b) => {
                            const numA = parseFloat(a)
                            const numB = parseFloat(b)
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB
                            }
                            return a.localeCompare(b)
                        })
                        
                        setSphericalPowerValues(powerValuesArray)

                        if (import.meta.env.DEV) {
                            console.log('✅ Spherical configurations loaded (fallback):', {
                                count: configs.length,
                                powerValues: powerValuesArray.length,
                                powerValuesArray,
                                configs: configs
                            })
                        }
                    } else {
                        // No configs found in fallback, clear all config data
                        setSphericalConfigs([])
                        setSelectedConfig(null)
                        setSphericalPowerValues([])
                        if (import.meta.env.DEV) {
                            console.info('ℹ️ API returned empty spherical configs for sub-category:', subCategoryId, '- dropdowns will be empty (this is expected until admin adds configs)')
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching contact lens form config:', error)
                // Try fallback on error as well
                try {
                    // Filter by product_id to get only configs assigned to this product
                    const configs = await getSphericalConfigs(numericId, product.id)
                    if (configs && configs.length > 0) {
                        setContactLensFormConfig({
                            formType: 'spherical',
                            subCategory: subCategoryData || {
                                id: numericId,
                                name: '',
                                slug: ''
                            },
                            formFields: {
                                rightEye: {},
                                leftEye: {}
                            }
                        })
                        setSphericalConfigs(configs)
                        if (configs.length > 0) {
                            setSelectedConfig(configs[0])
                        }
                        
                        // Extract power values from all spherical configs
                        // IMPORTANT: Only use power values from spherical configs, NOT from astigmatism dropdown API
                        const allPowerValues = new Set<string>()
                        configs.forEach(config => {
                            // Safely extract power values - handle null, undefined, and empty arrays
                            const rightPower = (config.right_power && Array.isArray(config.right_power)) ? config.right_power : []
                            const leftPower = (config.left_power && Array.isArray(config.left_power)) ? config.left_power : []
                            
                            // Filter out null, undefined, and empty string values
                            rightPower.forEach(v => {
                                if (v != null && v !== '') {
                                    allPowerValues.add(String(v))
                                }
                            })
                            leftPower.forEach(v => {
                                if (v != null && v !== '') {
                                    allPowerValues.add(String(v))
                                }
                            })
                        })
                        
                        const powerValuesArray = Array.from(allPowerValues).sort((a, b) => {
                            const numA = parseFloat(a)
                            const numB = parseFloat(b)
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB
                            }
                            return a.localeCompare(b)
                        })
                        
                        setSphericalPowerValues(powerValuesArray)
                    }
                } catch (fallbackError) {
                    console.error('Error in fallback fetch:', fallbackError)
                }
            } finally {
                // Form config loading complete
            }
        }

        fetchFormConfig()
    }, [product?.id, isContactLens])

    // Fetch Eye Hygiene Options
    useEffect(() => {
        const fetchEyeHygieneOptions = async () => {
            if (!product || !isEyeHygiene) {
                setEyeHygieneOptions({ size_volume: [], pack_type: [] })
                setEyeHygieneFormData({ size_volume: '', pack_type: '', quantity: 1 })
                return
            }

            try {
                const p = product as any
                const subCategoryId = p.subCategory?.id || p.sub_category?.id || p.subcategory?.id || p.sub_category_id

                if (subCategoryId) {
                    const options = await getEyeHygieneOptions(subCategoryId)
                    if (options) {
                        setEyeHygieneOptions(options)
                        if (import.meta.env.DEV) {
                            console.log('✅ Eye Hygiene Options loaded:', options)
                        }
                    } else {
                        // If API returns null, try to use product's own data as fallback
                        const fallbackOptions: EyeHygieneOptions = {
                            size_volume: p.size_volume ? [p.size_volume] : [],
                            pack_type: p.pack_type ? [p.pack_type] : []
                        }
                        setEyeHygieneOptions(fallbackOptions)
                        // Auto-select if only one option
                        if (fallbackOptions.size_volume.length === 1) {
                            setEyeHygieneFormData(prev => ({
                                ...prev,
                                size_volume: fallbackOptions.size_volume[0]
                            }))
                        }
                        if (fallbackOptions.pack_type.length === 1) {
                            setEyeHygieneFormData(prev => ({
                                ...prev,
                                pack_type: fallbackOptions.pack_type[0]
                            }))
                        }
                    }
                } else {
                    // No subcategory ID - use product's own data as fallback
                    const fallbackOptions: EyeHygieneOptions = {
                        size_volume: p.size_volume ? [p.size_volume] : [],
                        pack_type: p.pack_type ? [p.pack_type] : []
                    }
                    setEyeHygieneOptions(fallbackOptions)
                    // Auto-select if only one option
                    if (fallbackOptions.size_volume.length === 1) {
                        setEyeHygieneFormData(prev => ({
                            ...prev,
                            size_volume: fallbackOptions.size_volume[0]
                        }))
                    }
                    if (fallbackOptions.pack_type.length === 1) {
                        setEyeHygieneFormData(prev => ({
                            ...prev,
                            pack_type: fallbackOptions.pack_type[0]
                        }))
                    }
                }
            } catch (error) {
                console.error('Error fetching Eye Hygiene options:', error)
                setEyeHygieneOptions({ size_volume: [], pack_type: [] })
            }
        }

        fetchEyeHygieneOptions()
    }, [product?.id, isEyeHygiene])

    // Fetch Contact Lens Options from sub-subcategory (aggregated from products) as fallback
    useEffect(() => {
        const fetchContactLensOptions = async () => {
            if (!product || !isContactLens) {
                setSubSubcategoryOptions(null)
                return
            }

            const p = product as any
            // Get sub-sub-category ID using the same enhanced detection logic
            let subCategoryId: number | string | undefined = undefined
            let subCategoryData: any = null

            // Priority 1: Check direct subcategory field (MUST have parent_id to be a sub-subcategory)
            if (p.subcategory?.parent_id) {
                subCategoryId = p.subcategory.id
                subCategoryData = p.subcategory
            }

            // Priority 2: Check alternative field names (but verify parent_id exists)
            if (!subCategoryId) {
                const possibleSubcategory = p.sub_category || p.subcategory
                if (possibleSubcategory?.parent_id) {
                    subCategoryId = possibleSubcategory.id
                    subCategoryData = possibleSubcategory
                }
            }

            // Priority 3: Check nested category structure
            if (!subCategoryId && p.category?.subcategories) {
                for (const subcat of p.category.subcategories) {
                    if (subcat.children && subcat.children.length > 0) {
                        // Use the first child that has a parent_id
                        const child = subcat.children.find((c: any) => c.parent_id)
                        if (child) {
                            subCategoryId = child.id
                            subCategoryData = child
                            break
                        }
                    }
                }
            }

            // Validate that we have a sub-subcategory (MUST have parent_id)
            if (!subCategoryId || !subCategoryData?.parent_id) {
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Cannot fetch contact lens options: Product does not have a valid sub-subcategory (parent_id is required)', {
                        productId: product.id,
                        productName: product.name,
                        subcategory: p.subcategory,
                        hasParentId: !!subCategoryData?.parent_id
                    })
                }
                return
            }

            // Ensure it's a number (not a slug/string)
            const numericId = typeof subCategoryId === 'string' ? parseInt(subCategoryId, 10) : subCategoryId
            if (isNaN(numericId) || numericId <= 0) {
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Invalid sub-subcategory ID:', subCategoryId)
                }
                return
            }

            // Validate subcategory type (must be Spherical or Astigmatism/Toric)
            const subcategoryName = (subCategoryData.name || '').toLowerCase()
            const isSpherical = /spherical|sferiche|sferica/i.test(subcategoryName)
            const isAstigmatism = /astigmatism|astigmatismo|toric|torica/i.test(subcategoryName)

            if (!isSpherical && !isAstigmatism) {
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Sub-subcategory is not Spherical or Astigmatism/Toric type:', {
                        subcategoryId: numericId,
                        subcategoryName: subCategoryData.name,
                        productId: product.id
                    })
                }
                return
            }

            if (import.meta.env.DEV) {
                console.log('🔍 Fetching contact lens options for sub-subcategory:', {
                    subcategoryId: numericId,
                    subcategoryName: subCategoryData.name,
                    parentId: subCategoryData.parent_id,
                    type: isSpherical ? 'spherical' : 'astigmatism',
                    productId: product.id
                })
            }

            try {
                // Fetch aggregated options from all products in this sub-subcategory
                const options = await getContactLensOptions(numericId)
                if (options) {
                    setSubSubcategoryOptions({
                        type: options.type,
                        powerOptions: options.powerOptions || [],
                        baseCurveOptions: options.baseCurveOptions || [],
                        diameterOptions: options.diameterOptions || [],
                        cylinderOptions: options.cylinderOptions || [],
                        axisOptions: options.axisOptions || []
                    })

                    if (import.meta.env.DEV) {
                        console.log('✅ Contact Lens Options loaded from sub-subcategory:', {
                            type: options.type,
                            powerCount: options.powerOptions?.length || 0,
                            baseCurveCount: options.baseCurveOptions?.length || 0,
                            diameterCount: options.diameterOptions?.length || 0,
                            cylinderCount: options.cylinderOptions?.length || 0,
                            axisCount: options.axisOptions?.length || 0,
                            productCount: options.productCount
                        })
                    }
                }
            } catch (error: any) {
                // Only log error if it's not a validation error (400/404)
                if (error?.response?.status === 404) {
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ Sub-subcategory not found:', numericId)
                    }
                } else if (error?.response?.status === 400) {
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ Invalid sub-subcategory:', error?.response?.data?.message || 'Validation failed')
                    }
                } else {
                    console.error('Error fetching contact lens options:', error)
                }
            }
        }

        fetchContactLensOptions()
    }, [product?.id, isContactLens])

    // Fetch Astigmatism Configurations and Extract Dropdown Values (for astigmatism forms)
    useEffect(() => {
        const fetchAstigmatismConfigs = async () => {
            // Only fetch if form type is astigmatism
            const formType = contactLensFormConfig?.formType || 
                (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
            
            // Clear astigmatism configs if form type is not astigmatism
            if (formType !== 'astigmatism' || !isContactLens || !product) {
                setAstigmatismConfigs([])
                setSelectedAstigmatismConfig(null)
                return
            }
            
            // Clear configs at start of fetch to prevent stale data
            setAstigmatismConfigs([])
            setSelectedAstigmatismConfig(null)
            
            if (formType === 'astigmatism' && isContactLens && product) {
                try {
                    const p = product as any
                    
                    // Get sub-sub-category ID (same logic as fetchFormConfig)
                    let subCategoryId: number | string | undefined = undefined
                    
                    if (p.subcategory?.parent_id) {
                        subCategoryId = p.subcategory.id
                    } else if (p.sub_category_id) {
                        subCategoryId = p.sub_category_id
                    } else if (p.subcategory_id) {
                        subCategoryId = p.subcategory_id
                    } else if (p.sub_category?.id) {
                        subCategoryId = p.sub_category.id
                    } else if (p.subcategory?.id) {
                        subCategoryId = p.subcategory.id
                    }
                    
                    if (!subCategoryId) {
                        if (import.meta.env.DEV) {
                            console.warn('⚠️ No sub-sub-category ID found for fetching astigmatism configs')
                        }
                        return
                    }
                    
                    const numericId = typeof subCategoryId === 'string' ? parseInt(subCategoryId, 10) : subCategoryId
                    if (isNaN(numericId) || numericId <= 0) {
                        return
                    }
                    
                    // Fetch astigmatism configurations
                    // Filter by product_id to get only configs assigned to this product
                    // This ensures dropdown values are specific to the selected product
                    const configs = await getAstigmatismConfigs(numericId, product.id)
                    
                    if (import.meta.env.DEV) {
                        console.log('📦 Fetched astigmatism configs (filtered by product_id):', {
                            productId: product.id,
                            count: configs?.length || 0,
                            firstConfig: configs?.[0] ? {
                                id: configs[0].id,
                                name: configs[0].name,
                                right_qty: configs[0].right_qty,
                                right_base_curve: configs[0].right_base_curve,
                                right_diameter: configs[0].right_diameter,
                                right_power: configs[0].right_power?.slice(0, 5),
                                right_cylinder: configs[0].right_cylinder,
                                right_axis: configs[0].right_axis?.slice(0, 5)
                            } : null
                        })
                    }
                    
                    if (configs && configs.length > 0) {
                        // Store astigmatism configs in state
                        setAstigmatismConfigs(configs)
                        // Auto-select first config if available
                        if (configs.length > 0) {
                            setSelectedAstigmatismConfig(configs[0])
                            if (import.meta.env.DEV) {
                                console.log('✅ Selected first astigmatism config:', {
                                    id: configs[0].id,
                                    right_qty: configs[0].right_qty,
                                    right_base_curve: configs[0].right_base_curve,
                                    right_diameter: configs[0].right_diameter
                                })
                            }
                        }
                        
                        // Extract unique dropdown values from all configurations
                        // These values are already filtered by product_id since configs are filtered
                        const allPowerValues = new Set<string>()
                        const allCylinderValues = new Set<string>()
                        const allAxisValues = new Set<string>()
                        
                        configs.forEach(config => {
                            // Extract power values
                            if (config.right_power && Array.isArray(config.right_power)) {
                                config.right_power.forEach(v => {
                                    if (v != null && v !== '') allPowerValues.add(String(v))
                                })
                            }
                            if (config.left_power && Array.isArray(config.left_power)) {
                                config.left_power.forEach(v => {
                                    if (v != null && v !== '') allPowerValues.add(String(v))
                                })
                            }
                            
                            // Extract cylinder values
                            if (config.right_cylinder && Array.isArray(config.right_cylinder)) {
                                config.right_cylinder.forEach(v => {
                                    if (v != null && v !== '') allCylinderValues.add(String(v))
                                })
                            }
                            if (config.left_cylinder && Array.isArray(config.left_cylinder)) {
                                config.left_cylinder.forEach(v => {
                                    if (v != null && v !== '') allCylinderValues.add(String(v))
                                })
                            }
                            
                            // Extract axis values
                            if (config.right_axis && Array.isArray(config.right_axis)) {
                                config.right_axis.forEach(v => {
                                    if (v != null && v !== '') allAxisValues.add(String(v))
                                })
                            }
                            if (config.left_axis && Array.isArray(config.left_axis)) {
                                config.left_axis.forEach(v => {
                                    if (v != null && v !== '') allAxisValues.add(String(v))
                                })
                            }
                        })

                        if (import.meta.env.DEV) {
                            console.log('✅ Astigmatism dropdown values extracted from configurations:', {
                                configsCount: configs.length,
                                power: allPowerValues.size,
                                cylinder: allCylinderValues.size,
                                axis: allAxisValues.size,
                                powerValues: Array.from(allPowerValues).slice(0, 10),
                                cylinderValues: Array.from(allCylinderValues),
                                axisValues: Array.from(allAxisValues).slice(0, 10)
                            })
                        }
                    } else {
                        // API returned empty configs - clear all astigmatism config state
                        setAstigmatismConfigs([])
                        setSelectedAstigmatismConfig(null)
                        if (import.meta.env.DEV) {
                            console.info('ℹ️ API returned empty astigmatism configs - dropdowns will be empty (this is expected until admin adds configs)')
                        }
                    }
                } catch (error) {
                    console.error('Error fetching astigmatism configurations:', error)
                    // Clear configs on error to prevent stale data
                    setAstigmatismConfigs([])
                    setSelectedAstigmatismConfig(null)
                }
            }
        }

        fetchAstigmatismConfigs()
    }, [contactLensFormConfig?.formType, isAstigmatismSubSubcategory, isContactLens, product])

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // This ensures hooks run in the same order on every render

    // Qty Options - ONLY from API configs arrays (sphericalConfigs or astigmatismConfigs)
    // Note: Currently unused as qty is a number input, but kept for potential future dropdown use
    void useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
        
        // ONLY use configs arrays from API - no formFields or dropdownValues
        // Priority 1: Use all configs to aggregate qty options
        if (formType === 'spherical' && sphericalConfigs.length > 0) {
            const allQtyOptions = new Set<string | number>()
            sphericalConfigs.forEach(config => {
                if (config.right_qty && Array.isArray(config.right_qty)) {
                    config.right_qty.forEach(qty => {
                        if (qty != null && qty !== '') {
                            allQtyOptions.add(qty)
                        }
                    })
                }
                if (config.left_qty && Array.isArray(config.left_qty)) {
                    config.left_qty.forEach(qty => {
                        if (qty != null && qty !== '') {
                            allQtyOptions.add(qty)
                        }
                    })
                }
            })
            if (allQtyOptions.size > 0) {
                const sortedOptions = Array.from(allQtyOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using qty options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }
        
        if (formType === 'astigmatism' && astigmatismConfigs.length > 0) {
            const allQtyOptions = new Set<string | number>()
            astigmatismConfigs.forEach(config => {
                if (config.right_qty && Array.isArray(config.right_qty)) {
                    config.right_qty.forEach(qty => {
                        if (qty != null && qty !== '') {
                            allQtyOptions.add(qty)
                        }
                    })
                }
                if (config.left_qty && Array.isArray(config.left_qty)) {
                    config.left_qty.forEach(qty => {
                        if (qty != null && qty !== '') {
                            allQtyOptions.add(qty)
                        }
                    })
                }
            })
            if (allQtyOptions.size > 0) {
                const sortedOptions = Array.from(allQtyOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using qty options from astigmatism configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // Debug: Log why no options are available (expected when API returns empty configs)
        if (import.meta.env.DEV) {
            console.info('ℹ️ No qty options available (API returned empty configs - this is expected):', {
                formType,
                configsCount: formType === 'spherical' ? sphericalConfigs.length : astigmatismConfigs.length,
                message: 'Dropdowns will be empty until admin adds configs via API'
            })
        }

        // No fallback - return empty array if no API data
        return []
    }, [contactLensFormConfig, selectedConfig, selectedAstigmatismConfig, sphericalConfigs, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Base Curve Options - Currently unused as base curve is a fixed value from config
    void useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
        
        // ONLY use configs arrays from API - no formFields or dropdownValues
        // Priority 1: Use all configs to aggregate base curve options
        if (formType === 'spherical' && sphericalConfigs.length > 0) {
            const allBCOptions = new Set<string | number>()
            sphericalConfigs.forEach(config => {
                if (config.right_base_curve && Array.isArray(config.right_base_curve)) {
                    config.right_base_curve.forEach(bc => {
                        if (bc != null && bc !== '') {
                            allBCOptions.add(bc)
                        }
                    })
                }
                if (config.left_base_curve && Array.isArray(config.left_base_curve)) {
                    config.left_base_curve.forEach(bc => {
                        if (bc != null && bc !== '') {
                            allBCOptions.add(bc)
                        }
                    })
                }
            })
            if (allBCOptions.size > 0) {
                const sortedOptions = Array.from(allBCOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using base curve options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }
        
        if (formType === 'astigmatism' && astigmatismConfigs.length > 0) {
            const allBCOptions = new Set<string | number>()
            astigmatismConfigs.forEach(config => {
                if (config.right_base_curve && Array.isArray(config.right_base_curve)) {
                    config.right_base_curve.forEach(bc => {
                        if (bc != null && bc !== '') {
                            allBCOptions.add(bc)
                        }
                    })
                }
                if (config.left_base_curve && Array.isArray(config.left_base_curve)) {
                    config.left_base_curve.forEach(bc => {
                        if (bc != null && bc !== '') {
                            allBCOptions.add(bc)
                        }
                    })
                }
            })
            if (allBCOptions.size > 0) {
                const sortedOptions = Array.from(allBCOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using base curve options from astigmatism configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // Debug: Log why no options are available (expected when API returns empty configs)
        if (import.meta.env.DEV) {
            console.info('ℹ️ No base curve options available (API returned empty configs - this is expected):', {
                formType,
                configsCount: formType === 'spherical' ? sphericalConfigs.length : astigmatismConfigs.length,
                message: 'Dropdowns will be empty until admin adds configs via API'
            })
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come ONLY from API configs arrays (sphericalConfigs or astigmatismConfigs)
        return []
    }, [contactLensFormConfig, product, isContactLens, selectedConfig, selectedAstigmatismConfig, sphericalConfigs, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Diameter Options - Currently unused as diameter is a fixed value from config
    void useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
        
        // ONLY use configs arrays from API - no formFields or dropdownValues
        // Priority 1: Use all configs to aggregate diameter options
        if (formType === 'spherical' && sphericalConfigs.length > 0) {
            const allDiaOptions = new Set<string | number>()
            sphericalConfigs.forEach(config => {
                if (config.right_diameter && Array.isArray(config.right_diameter)) {
                    config.right_diameter.forEach(dia => {
                        if (dia != null && dia !== '') {
                            allDiaOptions.add(dia)
                        }
                    })
                }
                if (config.left_diameter && Array.isArray(config.left_diameter)) {
                    config.left_diameter.forEach(dia => {
                        if (dia != null && dia !== '') {
                            allDiaOptions.add(dia)
                        }
                    })
                }
            })
            if (allDiaOptions.size > 0) {
                const sortedOptions = Array.from(allDiaOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using diameter options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }
        
        if (formType === 'astigmatism' && astigmatismConfigs.length > 0) {
            const allDiaOptions = new Set<string | number>()
            astigmatismConfigs.forEach(config => {
                if (config.right_diameter && Array.isArray(config.right_diameter)) {
                    config.right_diameter.forEach(dia => {
                        if (dia != null && dia !== '') {
                            allDiaOptions.add(dia)
                        }
                    })
                }
                if (config.left_diameter && Array.isArray(config.left_diameter)) {
                    config.left_diameter.forEach(dia => {
                        if (dia != null && dia !== '') {
                            allDiaOptions.add(dia)
                        }
                    })
                }
            })
            if (allDiaOptions.size > 0) {
                const sortedOptions = Array.from(allDiaOptions).sort((a, b) => {
                    const numA = typeof a === 'string' ? parseFloat(a) : a
                    const numB = typeof b === 'string' ? parseFloat(b) : b
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB
                    }
                    return String(a).localeCompare(String(b))
                })
                if (import.meta.env.DEV) {
                    console.log('✅ Using diameter options from astigmatism configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // Debug: Log why no options are available (expected when API returns empty configs)
        if (import.meta.env.DEV) {
            console.info('ℹ️ No diameter options available (API returned empty configs - this is expected):', {
                formType,
                configsCount: formType === 'spherical' ? sphericalConfigs.length : astigmatismConfigs.length,
                message: 'Dropdowns will be empty until admin adds configs via API'
            })
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come ONLY from API configs arrays (sphericalConfigs or astigmatismConfigs)
        return []
    }, [contactLensFormConfig, product, isContactLens, selectedConfig, selectedAstigmatismConfig, sphericalConfigs, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Generate cylinder options from astigmatism configs
    const cylinderOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
        
        // Cylinder is only available for astigmatism forms
        if (formType === 'astigmatism') {
            // Use all astigmatism configs to aggregate cylinder options (ONLY from API configs)
            if (astigmatismConfigs.length > 0) {
                const allCylinderValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightCylinder = (config.right_cylinder && Array.isArray(config.right_cylinder)) ? config.right_cylinder : []
                    const leftCylinder = (config.left_cylinder && Array.isArray(config.left_cylinder)) ? config.left_cylinder : []
                    rightCylinder.forEach(v => {
                        if (v != null && v !== '') {
                            allCylinderValues.add(String(v))
                        }
                    })
                    leftCylinder.forEach(v => {
                        if (v != null && v !== '') {
                            allCylinderValues.add(String(v))
                        }
                    })
                })
                if (allCylinderValues.size > 0) {
                    const cylinderArray = Array.from(allCylinderValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using cylinder options from all astigmatism configs:', cylinderArray)
                    }
                    return cylinderArray
                }
            }

            // Debug: Log why no cylinder options are available (expected when API returns empty configs)
                if (import.meta.env.DEV) {
                console.info('ℹ️ No cylinder options available (API returned empty configs - this is expected):', {
                    astigmatismConfigsCount: astigmatismConfigs.length,
                    message: 'Dropdowns will be empty until admin adds configs via API'
                })
            }
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API
        return []
    }, [contactLensFormConfig?.formType, selectedAstigmatismConfig, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Generate axis options from astigmatism configs
    const axisOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')
        
        // Axis is only available for astigmatism forms
        if (formType === 'astigmatism') {
            // Use all astigmatism configs to aggregate axis options (ONLY from API configs)
            if (astigmatismConfigs.length > 0) {
                const allAxisValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightAxis = (config.right_axis && Array.isArray(config.right_axis)) ? config.right_axis : []
                    const leftAxis = (config.left_axis && Array.isArray(config.left_axis)) ? config.left_axis : []
                    rightAxis.forEach(v => {
                        if (v != null && v !== '') {
                            allAxisValues.add(String(v))
                        }
                    })
                    leftAxis.forEach(v => {
                        if (v != null && v !== '') {
                            allAxisValues.add(String(v))
                        }
                    })
                })
                if (allAxisValues.size > 0) {
                    const axisArray = Array.from(allAxisValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using axis options from all astigmatism configs:', axisArray)
                    }
                    return axisArray
                }
            }

            // Debug: Log why no axis options are available (expected when API returns empty configs)
                if (import.meta.env.DEV) {
                console.info('ℹ️ No axis options available (API returned empty configs - this is expected):', {
                    astigmatismConfigsCount: astigmatismConfigs.length,
                    message: 'Dropdowns will be empty until admin adds configs via API'
                })
            }
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API
        return []
    }, [contactLensFormConfig?.formType, selectedAstigmatismConfig, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Parse power range to generate options (memoized)
    // CRITICAL: Astigmatism dropdown values API should NEVER be used for Spherical forms
    // - Spherical forms: MUST use power from spherical configs (right_power/left_power arrays) ONLY
    // - Astigmatism forms: Use power from astigmatism dropdown values API
    const powerOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType

        // For Spherical forms: Use power values from spherical configurations ONLY
        if (formType === 'spherical') {
            // Priority 1: Use power values from spherical configs (right_power/left_power arrays)
            // These come from the spherical configs API response, NOT from astigmatism dropdown API
            if (sphericalPowerValues.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using power options from spherical configs:', sphericalPowerValues.length, 'values', sphericalPowerValues.slice(0, 10))
                }
                return sphericalPowerValues
            }

            // Priority 1b: Try to extract power from all sphericalConfigs if sphericalPowerValues is empty
            if (sphericalConfigs.length > 0) {
                const allPowerValues = new Set<string>()
                sphericalConfigs.forEach(config => {
                    const rightPower = (config.right_power && Array.isArray(config.right_power)) ? config.right_power : []
                    const leftPower = (config.left_power && Array.isArray(config.left_power)) ? config.left_power : []
                    rightPower.forEach(v => {
                        if (v != null && v !== '') {
                            allPowerValues.add(String(v))
                        }
                    })
                    leftPower.forEach(v => {
                        if (v != null && v !== '') {
                            allPowerValues.add(String(v))
                        }
                    })
                })
                if (allPowerValues.size > 0) {
                    const powerArray = Array.from(allPowerValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using power options from all sphericalConfigs (fallback):', powerArray.length, 'values', powerArray.slice(0, 10))
                    }
                    return powerArray
                }
            }

            // Debug: Log why no power options are available (expected when API returns empty configs)
                if (import.meta.env.DEV) {
                console.info('ℹ️ No power options available for spherical form (API returned empty configs - this is expected):', {
                    sphericalPowerValuesCount: sphericalPowerValues.length,
                    sphericalConfigsCount: sphericalConfigs.length,
                    message: 'Dropdowns will be empty until admin adds configs via API'
                })
            }

            // No fallback - return empty array if no config data
            return []
        }

        // For Astigmatism forms: Use power values from astigmatism configs
        if (formType === 'astigmatism') {
            // Use all astigmatism configs to aggregate power options (ONLY from API configs)
            if (astigmatismConfigs.length > 0) {
                const allPowerValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightPower = (config.right_power && Array.isArray(config.right_power)) ? config.right_power : []
                    const leftPower = (config.left_power && Array.isArray(config.left_power)) ? config.left_power : []
                    rightPower.forEach(v => {
                        if (v != null && v !== '') {
                            allPowerValues.add(String(v))
                        }
                    })
                    leftPower.forEach(v => {
                        if (v != null && v !== '') {
                            allPowerValues.add(String(v))
                        }
                    })
                })
                if (allPowerValues.size > 0) {
                    const powerArray = Array.from(allPowerValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using power options from all astigmatism configs:', powerArray.length, 'values', powerArray.slice(0, 10))
                    }
                    return powerArray
                }
            }

            // Debug: Log why no power options are available (expected when API returns empty configs)
                if (import.meta.env.DEV) {
                console.info('ℹ️ No power options available for astigmatism form (API returned empty configs - this is expected):', {
                    astigmatismConfigsCount: astigmatismConfigs.length,
                    message: 'Dropdowns will be empty until admin adds configs via API'
                })
            }

            // No fallback - return empty array if no config data
            return []
        }

        // If form type is not determined yet, return empty array
        return []
    }, [contactLensFormConfig?.formType, sphericalPowerValues, selectedAstigmatismConfig, astigmatismConfigs, isAstigmatismSubSubcategory])

    // Get fixed Base Curve and Diameter values from selected config (first value from arrays)
    const fixedBaseCurveAndDiameter = useMemo(() => {
        const currentConfig = selectedConfig || selectedAstigmatismConfig
        if (!currentConfig) {
            return {
                right_base_curve: '00.00',
                right_diameter: '00.00',
                left_base_curve: '00.00',
                left_diameter: '00.00'
            }
        }

        // Get first value from arrays (fixed value from admin panel)
        const getFirstValue = (arr: any[] | string[] | number[] | null | undefined): string => {
            if (!arr || !Array.isArray(arr) || arr.length === 0) return '00.00'
            const firstValue = arr[0]
            return firstValue != null && firstValue !== '' ? String(firstValue) : '00.00'
        }

        return {
            right_base_curve: getFirstValue(currentConfig.right_base_curve),
            right_diameter: getFirstValue(currentConfig.right_diameter),
            left_base_curve: getFirstValue(currentConfig.left_base_curve),
            left_diameter: getFirstValue(currentConfig.left_diameter)
        }
    }, [selectedConfig, selectedAstigmatismConfig])

    // Update form data with fixed values when config changes
    useEffect(() => {
        if (!isContactLens) return
        
        const currentConfig = selectedConfig || selectedAstigmatismConfig
        if (currentConfig) {
            setContactLensFormData(prev => ({
                ...prev,
                right_base_curve: fixedBaseCurveAndDiameter.right_base_curve,
                right_diameter: fixedBaseCurveAndDiameter.right_diameter,
                left_base_curve: fixedBaseCurveAndDiameter.left_base_curve,
                left_diameter: fixedBaseCurveAndDiameter.left_diameter
            }))
        }
    }, [fixedBaseCurveAndDiameter, selectedConfig, selectedAstigmatismConfig, isContactLens])

    // Initialize contact lens form when product loads
    useEffect(() => {
        if (!product?.id) return

        const currentProductId = product.id

        // Only initialize once per product ID
        if (formInitializedRef.current === currentProductId) return

        // Check if it's a contact lens
        // Use the memoized isContactLens value instead of redefining
        if (isContactLens) {
            // Form initialization - all data comes from API (formFields, dropdownValues, Spherical configs)
            // No product-specific options or dummy data
            formInitializedRef.current = currentProductId
            lastProductIdRef.current = currentProductId
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
            return () => productBasePrice
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
        if (productBasePrice === 0) {
            return 0
        }

        // Power is required for price calculation for BOTH Spherical and Astigmatism forms
        if (!contactLensFormData.right_power || !contactLensFormData.left_power) {
            return 0
        }

        // Get unit price: priority 1) unit_prices from config (immediate), 2) fetched unitPrice, 3) base price
        const currentConfig = selectedConfig || selectedAstigmatismConfig
        let pricePerPack = 0
        
        // Priority 1: Use unit price directly from config (immediate, no API call needed)
        if (selectedUnit && currentConfig && (currentConfig as any).unit_prices) {
            const configUnitPrice = (currentConfig as any).unit_prices[String(selectedUnit)]
            if (configUnitPrice !== undefined && typeof configUnitPrice === 'number') {
                pricePerPack = configUnitPrice
            } else if (unitPrice !== null) {
                // Fallback to fetched unit price (from API)
                pricePerPack = unitPrice
            } else {
                // Fallback to base price
                pricePerPack = getUnitPrice(contactLensFormData.unit)
            }
        } else if (unitPrice !== null) {
            // Use fetched unit price (from API) if no config unit_prices
            pricePerPack = unitPrice
        } else {
            // No unit selected or no unit pricing, use base price
            pricePerPack = getUnitPrice(contactLensFormData.unit)
        }

        // Calculate total: unit price (pack price) - quantity does NOT affect price
        // Example: Unit 30 pack = $9.00 → Total = $9.00 (regardless of qty)
        // Note: Price is based on unit selection only, quantity is independent
        return pricePerPack
    }, [
        productBasePrice,
        contactLensFormData.right_power,
        contactLensFormData.left_power,
        contactLensFormData.unit,
        unitPrice,
        selectedUnit,
        selectedConfig,
        selectedAstigmatismConfig,
        getUnitPrice
        // Note: Price updates when:
        // 1. Unit is selected (selectedUnit changes) → unit price changes
        // 2. Qty changes (right_qty/left_qty changes) → total = unit_price * qty changes
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

    // Helper function to get the color-specific image URL (with unit images support)
    const getColorSpecificImageUrl = (product: Product, imageIndex: number = 0): string => {
        // Priority 1: Use unit-specific images if available
        if (unitImages.length > 0 && imageIndex < unitImages.length) {
            return unitImages[imageIndex]
        }
        
        if (!selectedColor) {
            // Fallback to regular product image if no color selected
            return getProductImageUrl(product, imageIndex)
        }
        
        const p = product as any
        const selectedColorLower = (selectedColor || '').toLowerCase()
        
        // First try 'colors' array (preferred format from API)
        if (p.colors && Array.isArray(p.colors)) {
            const colorData = p.colors.find((c: any) => 
                (c.value && c.value.toLowerCase() === selectedColorLower) ||
                (c.hexCode && c.hexCode.toLowerCase() === selectedColorLower) ||
                (c.name && c.name.toLowerCase() === selectedColorLower)
            )
            if (colorData && colorData.images && Array.isArray(colorData.images) && colorData.images.length > 0) {
                if (colorData.images[imageIndex]) {
                    return colorData.images[imageIndex]
                } else if (colorData.images[0]) {
                    // Fallback to first image of selected color if selected index doesn't exist
                    return colorData.images[0]
                }
            }
        }
        
        // Fallback to 'color_images' array
        if (product.color_images) {
            const colorImage = product.color_images.find(ci =>
                (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
                (ci.name && ci.name.toLowerCase() === selectedColorLower)
            )
            if (colorImage && colorImage.images) {
                if (colorImage.images[imageIndex]) {
                    return colorImage.images[imageIndex]
                } else if (colorImage.images[0]) {
                    // Fallback to first image of selected color if selected index doesn't exist
                    return colorImage.images[0]
                }
            }
        }
        
        // Fallback to regular product image
        return getProductImageUrl(product, imageIndex)
    }


    // Handle configuration selection


    const handleContactLensFieldChange = (field: keyof ContactLensFormData, value: string | number) => {
        // Prevent manual changes to fixed Base Curve and Diameter values (set by admin)
        const fixedFields: (keyof ContactLensFormData)[] = ['right_base_curve', 'right_diameter', 'left_base_curve', 'left_diameter']
        if (fixedFields.includes(field)) {
            if (import.meta.env.DEV) {
                console.warn('⚠️ Attempted to change fixed field:', field, '- This value is set by admin and cannot be changed')
            }
            return // Ignore changes to fixed fields
        }

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

    // Auto-select first available unit when config loads or changes
    useEffect(() => {
        const currentConfig = selectedConfig || selectedAstigmatismConfig
        if (currentConfig && isContactLens) {
            // Get available units - check available_units first, then unit_prices keys as fallback
            let availableUnits: number[] = []
            
            // Priority 1: Check available_units array
            if ((currentConfig as any).available_units && Array.isArray((currentConfig as any).available_units) && (currentConfig as any).available_units.length > 0) {
                availableUnits = (currentConfig as any).available_units.filter((u: any) => u != null && !isNaN(Number(u))).map((u: any) => Number(u))
            }
            
            // Priority 2: If no available_units or empty, use unit_prices keys
            if (availableUnits.length === 0 && (currentConfig as any).unit_prices && typeof (currentConfig as any).unit_prices === 'object') {
                availableUnits = Object.keys((currentConfig as any).unit_prices)
                    .map(k => Number(k))
                    .filter(n => !isNaN(n) && n > 0)
            }
            
            if (availableUnits.length > 0) {
                // If no unit selected, or selected unit is not in available units, select first available
                if (!selectedUnit || !availableUnits.includes(selectedUnit)) {
                    setSelectedUnit(availableUnits[0])
                    if (import.meta.env.DEV) {
                        console.log('✅ Auto-selected first available unit:', availableUnits[0])
                    }
                }
            } else {
                // No available units, clear selection
                setSelectedUnit(null)
            }
        } else {
            // No config, clear selection
            setSelectedUnit(null)
        }
    }, [selectedConfig, selectedAstigmatismConfig, isContactLens])

    // Update unit price and images when selected unit changes (independent from qty)
    useEffect(() => {
        const updateUnitData = async () => {
            const currentConfig = selectedConfig || selectedAstigmatismConfig
            if (!currentConfig || !isContactLens || !selectedUnit) {
                setUnitPrice(null)
                setUnitImages([])
                return
            }

            // Priority 1: Use unit price directly from config (immediate, no API call needed)
            const configUnitPrice = (currentConfig as any).unit_prices?.[String(selectedUnit)]
            if (configUnitPrice !== undefined && typeof configUnitPrice === 'number') {
                // Set price immediately from config
                setUnitPrice(configUnitPrice)
                if (import.meta.env.DEV) {
                    console.log('✅ Unit price set from config (immediate):', {
                        unit: selectedUnit,
                        price: configUnitPrice
                    })
                }
            } else {
                // No unit price in config, try to fetch from API
                const hasUnitPricing = (currentConfig as any).unit_prices || (currentConfig as any).unit_images
                if (hasUnitPricing) {
                    setLoadingUnitData(true)
                    try {
                        const unitData = await getUnitPriceAndImages(currentConfig.id, selectedUnit)
                        if (unitData && unitData.data) {
                            setUnitPrice(unitData.data.price)
                            if (import.meta.env.DEV) {
                                console.log('✅ Unit price fetched from API:', {
                                    unit: selectedUnit,
                                    price: unitData.data.price
                                })
                            }
                        } else {
                            setUnitPrice(null)
                        }
                    } catch (error) {
                        console.error('Error fetching unit price:', error)
                        setUnitPrice(null)
                    } finally {
                        setLoadingUnitData(false)
                    }
                } else {
                    // No unit-based pricing configured
                    setUnitPrice(null)
                }
            }

            // Handle images: Priority 1) config unit_images, 2) API fetch
            const configUnitImages = (currentConfig as any).unit_images?.[String(selectedUnit)]
            if (configUnitImages && Array.isArray(configUnitImages) && configUnitImages.length > 0) {
                setUnitImages(configUnitImages)
            } else {
                // Fetch images from API if not in config
                try {
                    const unitData = await getUnitPriceAndImages(currentConfig.id, selectedUnit)
                    if (unitData && unitData.data && unitData.data.images) {
                        setUnitImages(unitData.data.images)
                    } else {
                        setUnitImages([])
                    }
                } catch (error) {
                    console.error('Error fetching unit images:', error)
                    setUnitImages([])
                }
            }
        }

        updateUnitData()
    }, [
        selectedConfig,
        selectedAstigmatismConfig,
        selectedUnit,
        isContactLens
    ])

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


    const validateContactLensForm = (): boolean => {
        // Don't allow adding to cart if out of stock
        if (isProductOutOfStock) {
            alert(t('shop.outOfStockAlert'))
            return false
        }

        // Determine form type from config or subcategory
        const formType = contactLensFormConfig?.formType ||
            (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

        const newErrors: Record<string, string> = {}

        // Power is required for BOTH Spherical and Astigmatism forms
        if (!contactLensFormData.right_power) {
            newErrors.right_power = 'Power is required for right eye'
        }

        if (!contactLensFormData.left_power) {
            newErrors.left_power = 'Power is required for left eye'
        }

        // For Astigmatism forms, cylinder and axis are also required
        if (formType === 'astigmatism') {
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

    const handleAddToCart = () => {
        if (!product) return

        // Validate Eye Hygiene form if it's an Eye Hygiene product
        if (isEyeHygiene) {
            if (eyeHygieneOptions.size_volume.length > 0 && !eyeHygieneFormData.size_volume) {
                alert('Please select Size/Volume')
                return
            }
            if (eyeHygieneOptions.pack_type.length > 0 && !eyeHygieneFormData.pack_type) {
                alert('Please select Pack Type')
                return
            }
            if (eyeHygieneFormData.quantity < 1) {
                alert('Please enter a valid quantity')
                return
            }
        }

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
                image: getColorSpecificImageUrl(product, selectedImageIndex), // Use the color-specific image if color is selected
                description: product.description || '',
                inStock: product.in_stock || false,
                rating: product.rating ? Number(product.rating) : undefined,
                quantity: isEyeHygiene ? eyeHygieneFormData.quantity : quantity, // Use Eye Hygiene quantity if applicable
                frame_material: selectedFrameMaterial || undefined, // Include selected frame material (single)
                lens_type: selectedLensType || undefined, // Include selected lens type (single)
                selectedColor: selectedColor || undefined, // Store selected color for reference
                // Eye Hygiene specific fields
                ...(isEyeHygiene && {
                    size_volume: eyeHygieneFormData.size_volume || undefined,
                    pack_type: eyeHygieneFormData.pack_type || undefined
                })
            }

            // Use services/cartService addItemToCart if authenticated
            if (isAuthenticated) {
                // Get color value (hex code) - prefer value from 'colors' array, fallback to selectedColor
                let colorValue = selectedColor
                if (selectedColorVariant) {
                    const variant = selectedColorVariant as any
                    colorValue = variant.value || variant.hexCode || variant.color || selectedColor
                }
                
                const cartRequest: AddToCartRequest = {
                    product_id: cartProduct.id,
                    quantity: isEyeHygiene ? eyeHygieneFormData.quantity : quantity,
                    selected_color: colorValue || undefined, // Pass color value (hex code) for variant matching
                    customization: {
                        frame_material: cartProduct.frame_material,
                        color: colorValue || undefined,
                        // Store color variant details if available
                        ...(selectedColorVariant ? {
                            color_name: (selectedColorVariant as any).name || (selectedColorVariant as any).color,
                            color_display_name: (selectedColorVariant as any).display_name || (selectedColorVariant as any).name || (selectedColorVariant as any).color,
                            variant_price: (selectedColorVariant as any).price,
                            variant_images: (selectedColorVariant as any).images || []
                        } : {}),
                        // Eye Hygiene specific customization
                        ...(isEyeHygiene && {
                            size_volume: eyeHygieneFormData.size_volume || undefined,
                            pack_type: eyeHygieneFormData.pack_type || undefined
                        })
                    },
                    lens_type: selectedLensType === '' ? undefined : selectedLensType
                }
                addItemToCart(cartRequest).catch(err => console.error('API cart error:', err))
            }

            // Always add to local cart context
            const qtyToAdd = isEyeHygiene ? eyeHygieneFormData.quantity : quantity
            for (let i = 0; i < qtyToAdd; i++) {
                addToCart(cartProduct)
            }

            // Navigate to cart after adding
            navigate('/cart')
        } catch (error) {
            console.error('Error adding to cart:', error)
            alert('Failed to add product to cart. Please try again.')
        }
    }

    const handleContactLensAddToCart = async () => {
        if (!validateContactLensForm()) {
            return
        }

        setContactLensLoading(true)
        try {
            // Determine form type from config or subcategory
            const formType = contactLensFormConfig?.formType ||
                (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

            // Prepare checkout request for new API endpoint
            // Note: API expects all values as strings (per Postman collection)
            const checkoutRequest: ContactLensCheckoutRequest = {
                product_id: product!.id,
                form_type: formType,
                // Send as strings (API will convert internally if needed)
                right_qty: contactLensFormData.right_qty,
                right_base_curve: contactLensFormData.right_base_curve,
                right_diameter: contactLensFormData.right_diameter,
                left_qty: contactLensFormData.left_qty,
                left_base_curve: contactLensFormData.left_base_curve,
                left_diameter: contactLensFormData.left_diameter,
                // Power is required for BOTH Spherical and Astigmatism forms (already strings)
                right_power: contactLensFormData.right_power,
                left_power: contactLensFormData.left_power,
                // Cylinder and Axis are ONLY for Astigmatism forms
                // Note: Per Postman collection, axis values should be strings (e.g., "180", "90")
                ...(formType === 'astigmatism' && {
                    right_cylinder: contactLensFormData.right_cylinder,
                    right_axis: contactLensFormData.right_axis || undefined, // Keep as string
                    left_cylinder: contactLensFormData.left_cylinder,
                    left_axis: contactLensFormData.left_axis || undefined // Keep as string
                }),
                // Unit selection (pack size) - independent from qty
                selected_unit: selectedUnit || undefined
            }

            // Use new contact lens checkout API endpoint (requires authentication)
            if (isAuthenticated) {
                const result = await addContactLensToCart(checkoutRequest)

                // The API returns { success, message, data: { item } }
                // addContactLensToCart returns the full ContactLensCheckoutResponse
                if (result && result.success && result.data && result.data.item) {
                    if (import.meta.env.DEV) {
                        console.log('✅ Contact lens added to cart successfully:', result.data.item)
                    }
                    
                    // Calculate total price from API response
                    // API returns unit_price (price per unit/box/pack) and quantities
                    const apiItem = result.data.item
                    const apiUnitPrice = typeof apiItem.unit_price === 'string' 
                        ? parseFloat(apiItem.unit_price) 
                        : Number(apiItem.unit_price) || 0
                    
                    // For contact lenses, calculate total based on unit_price and quantities
                    // The API's unit_price is the price per unit/box/pack (based on product pricing)
                    // Total = unit_price * (right_qty + left_qty)
                    // This correctly accounts for the selected purchase type (unit/box/pack)
                    // Example: If unit='box' and right_qty=1, left_qty=1, then total = box_price * 2
                    const apiTotalPrice = apiUnitPrice * (apiItem.contact_lens_right_qty + apiItem.contact_lens_left_qty)
                    
                    // Use our calculated price which properly accounts for unit/box/pack selection
                    // The API might not know about the unit type, so we use our local calculation
                    // which uses getUnitPrice() to get the correct price for unit/box/pack
                    const finalPrice = calculateContactLensTotal > 0 ? calculateContactLensTotal : apiTotalPrice
                    
                    // Also add to local cart for UI consistency
                    const cartProduct = {
                        id: product.id || 0,
                        name: product.name || '',
                        brand: product.brand || '',
                        category: product.category?.slug || (isContactLens ? 'contact-lenses' : ''),
                        price: finalPrice,
                        image: getColorSpecificImageUrl(product, selectedImageIndex),
                        description: product.description || '',
                        inStock: product.in_stock || false,
                        unit: contactLensFormData.unit,
                        isContactLens: true,
                        customization: {
                            contactLens: {
                                unit: contactLensFormData.unit,
                                formType: formType, // Store form type (spherical or astigmatism)
                                right: {
                                    qty: contactLensFormData.right_qty,
                                    baseCurve: parseFloat(contactLensFormData.right_base_curve),
                                    diameter: parseFloat(contactLensFormData.right_diameter),
                                    // Power is required for BOTH Spherical and Astigmatism
                                    power: parseFloat(contactLensFormData.right_power) || 0,
                                    // Cylinder and Axis are ONLY for Astigmatism
                                    ...(formType === 'astigmatism' && {
                                        cylinder: contactLensFormData.right_cylinder ? parseFloat(contactLensFormData.right_cylinder) : undefined,
                                        axis: contactLensFormData.right_axis ? parseInt(contactLensFormData.right_axis) : undefined
                                    })
                                },
                                left: {
                                    qty: contactLensFormData.left_qty,
                                    baseCurve: parseFloat(contactLensFormData.left_base_curve),
                                    diameter: parseFloat(contactLensFormData.left_diameter),
                                    // Power is required for BOTH Spherical and Astigmatism
                                    power: parseFloat(contactLensFormData.left_power) || 0,
                                    // Cylinder and Axis are ONLY for Astigmatism
                                    ...(formType === 'astigmatism' && {
                                        cylinder: contactLensFormData.left_cylinder ? parseFloat(contactLensFormData.left_cylinder) : undefined,
                                        axis: contactLensFormData.left_axis ? parseInt(contactLensFormData.left_axis) : undefined
                                    })
                                }
                            }
                        }
                    }
                    addToCart(cartProduct)
                    navigate('/cart')
                } else {
                    // Log detailed error for debugging
                    if (import.meta.env.DEV) {
                        console.error('❌ Failed to add contact lens to cart:', {
                            result,
                            hasSuccess: result?.success,
                            hasData: !!result?.data,
                            hasItem: !!result?.data?.item
                        })
                    }
                    alert(result?.message || 'Failed to add contact lens to cart. Please try again.')
                }
            } else {
                // For non-authenticated users, still add to local cart
                // (but they'll need to login at checkout)
                const cartProduct = {
                    id: product.id || 0,
                    name: product.name || '',
                    brand: product.brand || '',
                    category: product.category?.slug || 'contact-lenses',
                    price: calculateContactLensTotal,
                    image: getColorSpecificImageUrl(product, selectedImageIndex),
                    description: product.description || '',
                    inStock: product.in_stock || false,
                    unit: contactLensFormData.unit,
                    isContactLens: true,
                    customization: {
                        contactLens: {
                            unit: contactLensFormData.unit,
                            right: {
                                qty: contactLensFormData.right_qty,
                                baseCurve: parseFloat(contactLensFormData.right_base_curve),
                                diameter: parseFloat(contactLensFormData.right_diameter),
                                // Power is required for BOTH Spherical and Astigmatism
                                power: parseFloat(contactLensFormData.right_power) || 0,
                                // Cylinder and Axis are ONLY for Astigmatism
                                ...(formType === 'astigmatism' && {
                                    cylinder: contactLensFormData.right_cylinder ? parseFloat(contactLensFormData.right_cylinder) : undefined,
                                    axis: contactLensFormData.right_axis ? parseInt(contactLensFormData.right_axis) : undefined
                                })
                            },
                            left: {
                                qty: contactLensFormData.left_qty,
                                baseCurve: parseFloat(contactLensFormData.left_base_curve),
                                diameter: parseFloat(contactLensFormData.left_diameter),
                                // Power is required for BOTH Spherical and Astigmatism
                                power: parseFloat(contactLensFormData.left_power) || 0,
                                // Cylinder and Axis are ONLY for Astigmatism
                                ...(formType === 'astigmatism' && {
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
            console.error('Error adding contact lens to cart:', error)
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
            <section className="py-4 md:py-6 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    {isContactLens ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {/* Product Images - Left Side */}
                            <div>
                                {isContactLens ? (
                                    <div className="space-y-4">
                                        {/* Single Product Image */}
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto" style={{ aspectRatio: '1/1', maxHeight: '300px' }}>
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

                                                // Use unit images if available, otherwise use color images or product images
                                                let productImage: string
                                                const isUsingUnitImages = unitImages.length > 0 && selectedImageIndex < unitImages.length
                                                if (isUsingUnitImages) {
                                                    // Use unit-specific images
                                                    productImage = unitImages[selectedImageIndex]
                                                } else if (imagesArray.length > 0 && selectedImageIndex < imagesArray.length) {
                                                    // Use color-specific images
                                                    productImage = imagesArray[selectedImageIndex]
                                                } else {
                                                    // Fallback to regular product image
                                                    productImage = getProductImageUrl(product, selectedImageIndex)
                                                }

                                                return (
                                                    <>
                                                        {isUsingUnitImages && selectedUnit && (
                                                            <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10 shadow-lg">
                                                                Unit {selectedUnit} Pack Images
                                                            </div>
                                                        )}
                                                        <img
                                                            key={`product-${product.id}-${selectedImageIndex}-${isUsingUnitImages ? 'unit' : 'default'}`}
                                                            src={productImage}
                                                            alt={product.name}
                                                            className="w-full h-full object-contain p-6"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                if (import.meta.env.DEV) {
                                                                    console.warn('Product image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
                                                                }
                                                                target.src = '/assets/images/frame1.png'
                                                            }}
                                                        />
                                                    </>
                                                )
                                            })()}
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

                                        {/* Price Display */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                                {calculateContactLensTotal > 0 ? 'Total Price' : 'Price'}
                                            </p>
                                            {(() => {
                                                const currentConfig = selectedConfig || selectedAstigmatismConfig
                                                const hasUnitPricing = currentConfig && ((currentConfig as any).unit_prices || (currentConfig as any).unit_images)
                                                
                                                // Get unit price: priority 1) config unit_prices (immediate), 2) fetched unitPrice, 3) base price
                                                let displayUnitPrice: number | null = null
                                                if (selectedUnit && currentConfig && (currentConfig as any).unit_prices) {
                                                    const configUnitPrice = (currentConfig as any).unit_prices[String(selectedUnit)]
                                                    if (configUnitPrice !== undefined && typeof configUnitPrice === 'number') {
                                                        displayUnitPrice = configUnitPrice
                                                    } else if (unitPrice !== null) {
                                                        displayUnitPrice = unitPrice
                                                    }
                                                } else if (unitPrice !== null) {
                                                    displayUnitPrice = unitPrice
                                                }
                                                
                                                return (
                                                    <>
                                                        {selectedUnit && hasUnitPricing && (
                                                            <p className="text-xs text-blue-600 font-medium mb-2">
                                                                Selected Pack Size: Unit {selectedUnit}
                                                                {displayUnitPrice !== null && (
                                                                    <span className="ml-2 text-gray-600">
                                                                        - ${displayUnitPrice.toFixed(2)} per pack
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                        <div className="flex items-baseline gap-3">
                                                            {calculateContactLensTotal > 0 ? (
                                                                <>
                                                                    <p className="text-3xl font-bold text-blue-950">
                                                                        ${calculateContactLensTotal.toFixed(2)}
                                                                    </p>
                                                                    {displayUnitPrice !== null && selectedUnit && (
                                                                        <p className="text-sm text-gray-500">
                                                                            (Pack Size: Unit {selectedUnit} - ${displayUnitPrice.toFixed(2)})
                                                                        </p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum ? (
                                                                        <>
                                                                            <p className="text-3xl font-bold text-blue-950">
                                                                                ${displayUnitPrice !== null ? displayUnitPrice.toFixed(2) : (salePriceNum || 0).toFixed(2)}
                                                                            </p>
                                                                            <p className="text-xl text-gray-400 line-through">
                                                                                ${(regularPriceNum || 0).toFixed(2)}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-3xl font-bold text-blue-950">
                                                                            ${displayUnitPrice !== null ? displayUnitPrice.toFixed(2) : (regularPriceNum || 0).toFixed(2)}
                                                                        </p>
                                                                    )}
                                                                    {displayUnitPrice !== null && selectedUnit && (
                                                                        <p className="text-sm text-gray-500">
                                                                            (Pack Size: Unit {selectedUnit} - ${displayUnitPrice.toFixed(2)} per pack)
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        {loadingUnitData && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                                <p className="text-xs text-gray-500">Loading pack price and images...</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
                                            {(() => {
                                                // Use color-specific image if color is selected
                                                const imageUrl = getColorSpecificImageUrl(product, selectedImageIndex)

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

                                        {/* Color Selection - supports both 'colors' array (preferred) and 'color_images' array (fallback) */}
                                        {(() => {
                                            const p = product as any
                                            const colorsArray = (p.colors && Array.isArray(p.colors) && p.colors.length > 0) 
                                                ? p.colors 
                                                : (product.color_images && product.color_images.length > 0 
                                                    ? product.color_images.map((ci: any) => ({
                                                        name: ci.name || ci.color,
                                                        display_name: ci.display_name || ci.name || ci.color,
                                                        value: ci.value || ci.color,
                                                        hexCode: ci.hexCode || '#E5E5E5',
                                                        price: ci.price,
                                                        images: ci.images || []
                                                    }))
                                                    : [])
                                            
                                            if (colorsArray.length === 0) return null
                                            
                                            return (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {t('shop.selectColor', 'Select Color')}
                                                    </label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {colorsArray.map((color: any, index: number) => {
                                                            const colorValue = color.value || color.hexCode || color.color || color.name
                                                            const hexCode = color.hexCode || '#E5E5E5'
                                                            const displayName = color.display_name || color.name || color.color || 'Color'
                                                            const isSelected = selectedColor && (
                                                                (color.value && color.value.toLowerCase() === selectedColor.toLowerCase()) ||
                                                                (color.hexCode && color.hexCode.toLowerCase() === selectedColor.toLowerCase()) ||
                                                                (color.color && color.color.toLowerCase() === selectedColor.toLowerCase()) ||
                                                                (color.name && color.name.toLowerCase() === selectedColor.toLowerCase())
                                                            )
                                                            
                                                            return (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => {
                                                                        setSelectedColor(colorValue)
                                                                        setSelectedImageIndex(0) // Reset to first image of selected color
                                                                        
                                                                        // Update URL without page reload
                                                                        const url = new URL(window.location.href)
                                                                        url.searchParams.set('color', colorValue)
                                                                        window.history.pushState({}, '', url)
                                                                    }}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:scale-105 ${
                                                                        isSelected
                                                                            ? 'border-blue-950 bg-blue-50 ring-2 ring-blue-200'
                                                                            : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                    title={displayName}
                                                                >
                                                                    {/* Color Swatch */}
                                                                    <span
                                                                        className="w-6 h-6 rounded-full border border-gray-300"
                                                                        style={{ backgroundColor: hexCode }}
                                                                    />
                                                                    <span className="text-sm font-medium capitalize">
                                                                        {displayName}
                                                                    </span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Thumbnail Images */}
                                        {(() => {
                                            // Priority: Use unit images if available, otherwise use color images or product images
                                            let imagesArray: string[] = []
                                            
                                            // First priority: Use unit-specific images
                                            if (unitImages.length > 0) {
                                                imagesArray = unitImages
                                            } else {
                                                // Second priority: Get images for selected color - supports both 'colors' array and 'color_images' array
                                                const p = product as any

                                                if (selectedColor) {
                                                    // First try 'colors' array (preferred)
                                                    if (p.colors && Array.isArray(p.colors)) {
                                                        const selectedColorLower = (selectedColor || '').toLowerCase()
                                                        const colorData = p.colors.find((c: any) => 
                                                            (c.value && c.value.toLowerCase() === selectedColorLower) ||
                                                            (c.hexCode && c.hexCode.toLowerCase() === selectedColorLower) ||
                                                            (c.name && c.name.toLowerCase() === selectedColorLower)
                                                        )
                                                        if (colorData && colorData.images && Array.isArray(colorData.images) && colorData.images.length > 0) {
                                                            imagesArray = colorData.images
                                                        }
                                                    }
                                                    
                                                    // Fallback to 'color_images' array
                                                    if (imagesArray.length === 0 && product.color_images) {
                                                        const selectedColorLower = (selectedColor || '').toLowerCase()
                                                        const colorImage = product.color_images.find(ci =>
                                                            (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
                                                            (ci.name && ci.name.toLowerCase() === selectedColorLower)
                                                        )
                                                        if (colorImage && colorImage.images) {
                                                            imagesArray = colorImage.images
                                                        }
                                                    }
                                                }

                                                // Fallback to regular images if no color images or no color selected
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
                                            }

                                            return imagesArray.length > 1 ? (
                                                <div className="flex gap-2 overflow-x-auto">
                                                    {imagesArray.map((image, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setSelectedImageIndex(index)}
                                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImageIndex === index
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

                            {/* Contact Lens Parameter Selection Form - Right Side */}
                                <div className="w-full">
                                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl w-full">
                                        <div className="mb-4 pb-3 border-b-2 border-gray-100">
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                                Select the parameters
                                            </h2>
                                            {product && (
                                                <p className="text-base md:text-lg text-gray-700 font-medium">
                                                    {product.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Unit Selection (Pack Sizes) - Independent from Qty */}
                                        {(() => {
                                            // Check both selected config and all configs to find units
                                            const currentConfig = selectedConfig || selectedAstigmatismConfig
                                            const allConfigs = isAstigmatismSubSubcategory ? astigmatismConfigs : sphericalConfigs
                                            
                                            // Debug logging
                                            if (import.meta.env.DEV) {
                                                console.log('🔍 Unit Selection Debug:', {
                                                    hasSelectedConfig: !!currentConfig,
                                                    selectedConfigId: currentConfig ? (currentConfig as any).id : null,
                                                    allConfigsCount: allConfigs.length,
                                                    selectedConfigAvailableUnits: currentConfig ? (currentConfig as any).available_units : null,
                                                    selectedConfigUnitPrices: currentConfig ? (currentConfig as any).unit_prices : null
                                                })
                                            }
                                            
                                            // Get available units - check selected config first, then all configs
                                            let availableUnits: number[] = []
                                            const allUnitPrices: Record<string, number> = {}
                                            
                                            // Priority 1: Check selected config first
                                            if (currentConfig) {
                                                const configAvailableUnits = (currentConfig as any).available_units
                                                if (configAvailableUnits && Array.isArray(configAvailableUnits) && configAvailableUnits.length > 0) {
                                                    availableUnits = configAvailableUnits
                                                        .filter((u: any) => u != null && u !== '' && !isNaN(Number(u)))
                                                        .map((u: any) => Number(u))
                                                        .filter((n: number) => !isNaN(n) && n > 0)
                                                    
                                                    if (import.meta.env.DEV) {
                                                        console.log('✅ Found units from selected config available_units:', availableUnits)
                                                    }
                                                }
                                                
                                                // Also collect unit prices from selected config
                                                const configUnitPrices = (currentConfig as any).unit_prices
                                                if (configUnitPrices && typeof configUnitPrices === 'object' && configUnitPrices !== null) {
                                                    Object.assign(allUnitPrices, configUnitPrices)
                                                }
                                                
                                                // Priority 2: If no available_units, use unit_prices keys from selected config
                                                if (availableUnits.length === 0 && Object.keys(allUnitPrices).length > 0) {
                                                    availableUnits = Object.keys(allUnitPrices)
                                                        .map(k => Number(k))
                                                        .filter(n => !isNaN(n) && n > 0)
                                                    
                                                    if (import.meta.env.DEV) {
                                                        console.log('✅ Found units from selected config unit_prices keys:', availableUnits)
                                                    }
                                                }
                                            }
                                            
                                            // Priority 3: If still no units, check all configs
                                            if (availableUnits.length === 0 && allConfigs && allConfigs.length > 0) {
                                                if (import.meta.env.DEV) {
                                                    console.log('🔍 Checking all configs for units. Config count:', allConfigs.length)
                                                }
                                                
                                                for (const config of allConfigs) {
                                                    if (import.meta.env.DEV) {
                                                        console.log('🔍 Checking config:', {
                                                            id: (config as any).id,
                                                            name: (config as any).name,
                                                            available_units: (config as any).available_units,
                                                            unit_prices: (config as any).unit_prices
                                                        })
                                                    }
                                                    
                                                    const configAvailableUnits = (config as any).available_units
                                                    if (configAvailableUnits && Array.isArray(configAvailableUnits) && configAvailableUnits.length > 0) {
                                                        const units = configAvailableUnits
                                                            .filter((u: any) => u != null && u !== '' && !isNaN(Number(u)))
                                                            .map((u: any) => Number(u))
                                                            .filter((n: number) => !isNaN(n) && n > 0)
                                                        availableUnits = [...new Set([...availableUnits, ...units])]
                                                        
                                                        if (import.meta.env.DEV && units.length > 0) {
                                                            console.log('✅ Found units in config:', (config as any).id, units)
                                                        }
                                                    }
                                                    
                                                    const configUnitPrices = (config as any).unit_prices
                                                    if (configUnitPrices && typeof configUnitPrices === 'object' && configUnitPrices !== null) {
                                                        Object.assign(allUnitPrices, configUnitPrices)
                                                        
                                                        if (import.meta.env.DEV) {
                                                            console.log('✅ Found unit_prices in config:', (config as any).id, configUnitPrices)
                                                        }
                                                    }
                                                }
                                                
                                                // If we have unit_prices but no available_units, use unit_prices keys
                                                if (availableUnits.length === 0 && Object.keys(allUnitPrices).length > 0) {
                                                    availableUnits = Object.keys(allUnitPrices)
                                                        .map(k => Number(k))
                                                        .filter(n => !isNaN(n) && n > 0)
                                                    
                                                    if (import.meta.env.DEV) {
                                                        console.log('✅ Using unit_prices keys as available units:', availableUnits)
                                                    }
                                                }
                                                
                                                if (import.meta.env.DEV && availableUnits.length > 0) {
                                                    console.log('✅ Found units from all configs:', availableUnits)
                                                }
                                            }
                                            
                                            // Only show if we have units to display
                                            if (availableUnits.length === 0) {
                                                if (import.meta.env.DEV) {
                                                    console.log('⚠️ No units found to display after checking all configs')
                                                }
                                                return null
                                            }
                                            
                                            // Sort units for consistent display
                                            availableUnits = [...new Set(availableUnits)].sort((a, b) => a - b)
                                            
                                            if (import.meta.env.DEV) {
                                                console.log('✅ Displaying unit buttons:', availableUnits, 'with prices:', allUnitPrices)
                                            }
                                            
                                            return (
                                                <div className="mb-8">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        Select Pack Size (Units)
                                                    </label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {availableUnits.map((unit: number) => {
                                                            const isSelected = selectedUnit === unit
                                                            // Get unit price from collected prices (from selected config or all configs)
                                                            const unitPrice = allUnitPrices[String(unit)]
                                                            const hasPrice = unitPrice !== undefined && typeof unitPrice === 'number'
                                                            
                                                            return (
                                                                <button
                                                                    key={unit}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Toggle selection: if already selected, unselect; otherwise select
                                                                        if (isSelected) {
                                                                            setSelectedUnit(null)
                                                                        } else {
                                                                        setSelectedUnit(unit)
                                                                        setSelectedImageIndex(0) // Reset to first image when unit changes
                                                                        }
                                                                    }}
                                                                    className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                                                                        isSelected
                                                                            ? 'bg-white text-gray-900 border-gray-900 shadow-md'
                                                                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex flex-col items-center">
                                                                        <span>Unit {unit}</span>
                                                                        {hasPrice && (
                                                                            <span className="text-xs font-normal mt-1">
                                                                                ${unitPrice.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Eyes Section - Horizontal Layout */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                                            {/* Left Eye Section */}
                                            <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border-2 shadow-sm transition-all h-full ${
                                                leftEyeEnabled ? 'border-purple-100' : 'border-gray-200 opacity-50'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={leftEyeEnabled}
                                                            onChange={(e) => setLeftEyeEnabled(e.target.checked)}
                                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                                        />
                                                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                                                            <span className="text-white font-bold text-sm">L</span>
                                                        </div>
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Left Eye OS</h3>
                                                    </label>
                                                </div>
                                                
                                                <div className={`space-y-3 ${!leftEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                    {/* Qty Number Input with Spinner - Full Width */}
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                            Quantity (Qty)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={contactLensFormData.left_qty || 1}
                                                            onChange={(e) => {
                                                                const selectedValue = parseInt(e.target.value) || 1
                                                                handleContactLensFieldChange('left_qty', selectedValue)
                                                            }}
                                                            disabled={!leftEyeEnabled}
                                                            className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.left_qty ? 'border-red-500' : 'border-gray-300'
                                                                } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        />
                                                        {contactLensErrors.left_qty && (
                                                            <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.left_qty}</p>
                                                        )}
                                                    </div>

                                                    {/* Base Curve and Diameter - Grouped Together (Fixed Values from Admin) */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Base Curve (B.C)
                                                            </label>
                                                            <div className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 transition-all shadow-sm text-sm ${!leftEyeEnabled ? 'opacity-50' : ''}`}>
                                                                <span className="text-gray-700 font-medium">
                                                                    {fixedBaseCurveAndDiameter.left_base_curve}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Diameter (DIA)
                                                            </label>
                                                            <div className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 transition-all shadow-sm text-sm ${!leftEyeEnabled ? 'opacity-50' : ''}`}>
                                                                <span className="text-gray-700 font-medium">
                                                                    {fixedBaseCurveAndDiameter.left_diameter}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Left Eye Parameters (Power, Cylinder, Axis for Astigmatism) */}
                                                {(() => {
                                                    const formType = contactLensFormConfig?.formType ||
                                                        (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

                                                    if (formType === 'spherical') {
                                                        return (
                                                            <div className={`pt-3 border-t border-purple-200 ${!leftEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                    * Power (PWR)
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.left_power || '00.00'}
                                                                    onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                    disabled={!leftEyeEnabled}
                                                                    className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-300'
                                                                        } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="00.00">00.00</option>
                                                                    {powerOptions.map((option: string | number) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.left_power && (
                                                                    <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.left_power}</p>
                                                                )}
                                                            </div>
                                                        )
                                                    } else if (formType === 'astigmatism') {
                                                        return (
                                                            <div className={`mt-4 space-y-4 ${!leftEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                                <div className="pt-3 border-t border-purple-200">
                                                                    <label className="block text-xs text-gray-500 mb-1">
                                                                        Power Setting
                                                                    </label>
                                                                    <select
                                                                        value={contactLensFormData.left_power || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                        disabled={!leftEyeEnabled}
                                                                        className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-300'
                                                                            } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00">00.00</option>
                                                                        {powerOptions.map((option: string | number) => (
                                                                            <option key={option} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {contactLensErrors.left_power && (
                                                                        <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.left_power}</p>
                                                                    )}
                                                                </div>

                                                                <div className="pt-4 border-t border-purple-200">
                                                                    <label className="block text-xs text-gray-500 mb-1">
                                                                        Cylinder & Axis
                                                                    </label>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Cylinder (CYL)</label>
                                                                            <select
                                                                                value={contactLensFormData.left_cylinder || '00.00'}
                                                                                onChange={(e) => handleContactLensFieldChange('left_cylinder', e.target.value)}
                                                                                disabled={!leftEyeEnabled}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${contactLensErrors.left_cylinder ? 'border-red-500' : 'border-gray-300'} ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <option value="00.00">00.00</option>
                                                                                {cylinderOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Axis (AX)</label>
                                                                            <select
                                                                                value={contactLensFormData.left_axis || '00.00'}
                                                                                onChange={(e) => handleContactLensFieldChange('left_axis', e.target.value)}
                                                                                disabled={!leftEyeEnabled}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${contactLensErrors.left_axis ? 'border-red-500' : 'border-gray-300'} ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <option value="00.00">00.00</option>
                                                                                {axisOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    {(contactLensErrors.left_cylinder || contactLensErrors.left_axis) && (
                                                                        <p className="mt-1 text-xs text-red-600 font-medium">Please select CYL and AXIS</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>

                                            {/* Right Eye Section */}
                                            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 shadow-sm transition-all h-full ${
                                                rightEyeEnabled ? 'border-blue-100' : 'border-gray-200 opacity-50'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={rightEyeEnabled}
                                                            onChange={(e) => setRightEyeEnabled(e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                                                            <span className="text-white font-bold text-sm">R</span>
                                                        </div>
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Right Eye OD</h3>
                                                    </label>
                                                </div>
                                                
                                                <div className={`space-y-3 ${!rightEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                    {/* Qty Number Input with Spinner - Full Width */}
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">
                                                            Quantity (Qty)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={contactLensFormData.right_qty || 1}
                                                            onChange={(e) => {
                                                                const selectedValue = parseInt(e.target.value) || 1
                                                                handleContactLensFieldChange('right_qty', selectedValue)
                                                            }}
                                                            disabled={!rightEyeEnabled}
                                                            className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.right_qty ? 'border-red-500' : 'border-gray-300'
                                                                } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        />
                                                        {contactLensErrors.right_qty && (
                                                            <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.right_qty}</p>
                                                        )}
                                                    </div>

                                                    {/* Base Curve and Diameter - Grouped Together (Fixed Values from Admin) */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Base Curve (B.C)
                                                            </label>
                                                            <div className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 transition-all shadow-sm text-sm ${!rightEyeEnabled ? 'opacity-50' : ''}`}>
                                                                <span className="text-gray-700 font-medium">
                                                                    {fixedBaseCurveAndDiameter.right_base_curve}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Diameter (DIA)
                                                            </label>
                                                            <div className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 transition-all shadow-sm text-sm ${!rightEyeEnabled ? 'opacity-50' : ''}`}>
                                                                <span className="text-gray-700 font-medium">
                                                                    {fixedBaseCurveAndDiameter.right_diameter}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Eye Parameters (Power, Cylinder, Axis for Astigmatism) */}
                                                {(() => {
                                                    const formType = contactLensFormConfig?.formType ||
                                                        (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

                                                    if (formType === 'spherical') {
                                                        return (
                                                            <div className={`pt-3 border-t border-blue-200 ${!rightEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                    * Power (PWR)
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.right_power || '00.00'}
                                                                    onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                    disabled={!rightEyeEnabled}
                                                                    className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-300'
                                                                        } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="00.00">00.00</option>
                                                                    {powerOptions.map((option: string | number) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {contactLensErrors.right_power && (
                                                                    <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.right_power}</p>
                                                                )}
                                                            </div>
                                                        )
                                                    } else if (formType === 'astigmatism') {
                                                        return (
                                                            <div className={`mt-4 space-y-4 ${!rightEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                                <div className="pt-3 border-t border-blue-200">
                                                                    <label className="block text-xs text-gray-500 mb-1">
                                                                        Power Setting
                                                                    </label>
                                                                    <select
                                                                        value={contactLensFormData.right_power || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                        disabled={!rightEyeEnabled}
                                                                        className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-300'
                                                                            } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00">00.00</option>
                                                                        {powerOptions.map((option: string | number) => (
                                                                            <option key={option} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {contactLensErrors.right_power && (
                                                                        <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.right_power}</p>
                                                                    )}
                                                                </div>

                                                                <div className="pt-4 border-t border-blue-200">
                                                                    <label className="block text-xs text-gray-500 mb-1">
                                                                        Cylinder & Axis
                                                                    </label>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Cylinder (CYL)</label>
                                                                            <select
                                                                                value={contactLensFormData.right_cylinder || '00.00'}
                                                                                onChange={(e) => handleContactLensFieldChange('right_cylinder', e.target.value)}
                                                                                disabled={!rightEyeEnabled}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${contactLensErrors.right_cylinder ? 'border-red-500' : 'border-gray-300'} ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <option value="00.00">00.00</option>
                                                                                {cylinderOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Axis (AX)</label>
                                                                            <select
                                                                                value={contactLensFormData.right_axis || '00.00'}
                                                                                onChange={(e) => handleContactLensFieldChange('right_axis', e.target.value)}
                                                                                disabled={!rightEyeEnabled}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${contactLensErrors.right_axis ? 'border-red-500' : 'border-gray-300'} ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <option value="00.00">00.00</option>
                                                                                {axisOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    {(contactLensErrors.right_cylinder || contactLensErrors.right_axis) && (
                                                                        <p className="mt-1 text-xs text-red-600 font-medium">Please select CYL and AXIS</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>
                                            </div>

                                        {/* Copy Left to Right Button */}
                                        <div className="mt-4 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setContactLensFormData(prev => ({
                                                        ...prev,
                                                        right_qty: prev.left_qty,
                                                        right_base_curve: prev.left_base_curve,
                                                        right_diameter: prev.left_diameter,
                                                        right_power: prev.left_power,
                                                        right_cylinder: prev.left_cylinder,
                                                        right_axis: prev.left_axis
                                                    }))
                                                    setRightEyeEnabled(leftEyeEnabled)
                                                }}
                                                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                title="Copy Left Eye settings to Right Eye"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                Copy Left to Right
                                            </button>
                                        </div>

                                        {/* Axis Diagram - Below both sections */}
                                        {(() => {
                                            // Show diagram if axis options exist or axis fields are present
                                            // This includes: Near Vision, Distance Vision, Astigmatism, and any form with axis fields
                                            const hasAxisFields = axisOptions.length > 0 || 
                                                                  contactLensFormData.right_axis !== undefined || 
                                                                  contactLensFormData.left_axis !== undefined ||
                                                                  selectedLensType === 'near_vision' ||
                                                                  selectedLensType === 'distance_vision' ||
                                                                  (contactLensFormConfig?.formType === 'astigmatism') ||
                                                                  (isAstigmatismSubSubcategory)
                                            
                                            if (hasAxisFields) {
                                                return (
                                                    <div className="mb-6">
                                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-base font-bold text-gray-900">Axis Measurement Guide</h4>
                                                                        <p className="text-xs text-gray-500 mt-0.5">For Customer Support</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                                <AxisDiagram compact={true} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}

                                        {/* Add to Cart Button */}
                                        <div className="mt-6 pt-4 border-t-2 border-gray-200">
                                            <button
                                                onClick={handleContactLensAddToCart}
                                                disabled={contactLensLoading || isProductOutOfStock}
                                                className={`w-full px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 shadow-lg ${contactLensLoading || isProductOutOfStock
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 text-white hover:from-green-700 hover:via-green-700 hover:to-emerald-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0'
                                                    }`}
                                            >
                                                {contactLensLoading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Adding to Cart...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        Add to Cart
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Product Images (Left Column) */}
                            <div>
                                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center mb-6">
                                    <img
                                        key={`product-${product.id}-img-${selectedImageIndex}-${selectedColor || 'default'}`}
                                        src={getColorSpecificImageUrl(product, selectedImageIndex)}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-8 transform transition-transform duration-500 hover:scale-105"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/assets/images/frame1.png'
                                        }}
                                    />
                                    {hasValidSale && (
                                        <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transform -rotate-2">
                                            Sale
                                        </div>
                                    )}
                                </div>

                                {/* Color Selection - supports both 'colors' array (preferred) and 'color_images' array (fallback) */}
                                {(() => {
                                    const p = product as any
                                    const colorsArray = (p.colors && Array.isArray(p.colors) && p.colors.length > 0) 
                                        ? p.colors 
                                        : (product.color_images && product.color_images.length > 0 
                                            ? product.color_images.map((ci: any) => ({
                                                name: ci.name || ci.color,
                                                display_name: ci.display_name || ci.name || ci.color,
                                                value: ci.value || ci.color,
                                                hexCode: ci.hexCode || '#E5E5E5',
                                                price: ci.price,
                                                images: ci.images || []
                                            }))
                                            : [])
                                    
                                    if (colorsArray.length === 0) return null
                                    
                                    return (
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                {t('shop.selectColor', 'Select Color')}
                                            </label>
                                            <div className="flex gap-3 flex-wrap">
                                                {colorsArray.map((color: any, index: number) => {
                                                    const colorValue = color.value || color.hexCode || color.color || color.name
                                                    const hexCode = color.hexCode || '#E5E5E5'
                                                    const displayName = color.display_name || color.name || color.color || 'Color'
                                                    const variantPrice = color.price !== undefined && color.price !== null
                                                        ? Number(color.price)
                                                        : null
                                                    const isSelected = selectedColor && (
                                                        (color.value && color.value.toLowerCase() === selectedColor.toLowerCase()) ||
                                                        (color.hexCode && color.hexCode.toLowerCase() === selectedColor.toLowerCase()) ||
                                                        (color.color && color.color.toLowerCase() === selectedColor.toLowerCase()) ||
                                                        (color.name && color.name.toLowerCase() === selectedColor.toLowerCase())
                                                    )
                                                    
                                                    return (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                const newColor = colorValue
                                                                setSelectedColor(newColor)
                                                                setSelectedImageIndex(0) // Reset to first image of selected color
                                                                
                                                                // Update URL without page reload
                                                                const url = new URL(window.location.href)
                                                                url.searchParams.set('color', newColor)
                                                                window.history.pushState({}, '', url)
                                                            }}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                                                                isSelected
                                                                    ? 'border-blue-950 bg-blue-50/50 scale-105 ring-2 ring-blue-100'
                                                                    : 'border-gray-200 hover:border-blue-200 hover:bg-white'
                                                            }`}
                                                            title={displayName}
                                                        >
                                                            {/* Color Swatch */}
                                                            <span
                                                                className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                                                                style={{ backgroundColor: hexCode }}
                                                            />
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className={`text-sm font-semibold capitalize ${isSelected ? 'text-blue-950' : 'text-gray-700'
                                                                    }`}>
                                                                    {displayName}
                                                                </span>
                                                                {variantPrice !== null && variantPrice !== Number(product.price) && (
                                                                    <span className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                                                        ${variantPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* Thumbnail Images */}
                                {(() => {
                                    // Get images for selected color - supports both 'colors' array and 'color_images' array
                                    let imagesArray: string[] = []
                                    const p = product as any

                                    if (selectedColor) {
                                        // First try 'colors' array (preferred)
                                        if (p.colors && Array.isArray(p.colors)) {
                                            const selectedColorLower = (selectedColor || '').toLowerCase()
                                            const colorData = p.colors.find((c: any) => 
                                                (c.value && c.value.toLowerCase() === selectedColorLower) ||
                                                (c.hexCode && c.hexCode.toLowerCase() === selectedColorLower) ||
                                                (c.name && c.name.toLowerCase() === selectedColorLower)
                                            )
                                            if (colorData && colorData.images && Array.isArray(colorData.images) && colorData.images.length > 0) {
                                                imagesArray = colorData.images
                                            }
                                        }
                                        
                                        // Fallback to 'color_images' array
                                        if (imagesArray.length === 0 && product.color_images) {
                                            const selectedColorLower = (selectedColor || '').toLowerCase()
                                            const colorImage = product.color_images.find(ci =>
                                                (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
                                                (ci.name && ci.name.toLowerCase() === selectedColorLower)
                                            )
                                            if (colorImage && colorImage.images) {
                                                imagesArray = colorImage.images
                                            }
                                        }
                                    }

                                    // Fallback to regular images if no color images or no color selected
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
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                            {imagesArray.map((image, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedImageIndex === index
                                                        ? 'border-blue-950 ring-2 ring-blue-100 scale-105 shadow-md'
                                                        : 'border-gray-200 hover:border-blue-200'
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
                            </div>

                            {/* Product Info (Right Column) */}
                            <div>
                                <div className="mb-6">
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2 px-1">
                                        {product.brand || product.category?.name || 'Brand'}
                                    </p>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                        {product.name}
                                    </h1>

                                    {/* Price */}
                                    <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                        {originalPrice ? (
                                            <div className="flex items-center gap-6">
                                                <span className="text-5xl font-extrabold text-blue-950">
                                                    ${(displayPrice || 0).toFixed(2)}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-xl text-gray-400 line-through font-medium">
                                                        ${(originalPrice || 0).toFixed(2)}
                                                    </span>
                                                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded ml-[-4px]">
                                                        SAVE {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-5xl font-extrabold text-blue-950">
                                                ${(displayPrice || 0).toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Eye Hygiene Fields Section with Dropdowns */}
                                    {isEyeHygiene && (
                                        <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-blue-200 pb-2">
                                                Select Options
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Size/Volume Dropdown */}
                                                {eyeHygieneOptions.size_volume.length > 0 && (
                                                    <div className="flex flex-col">
                                                        <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                            Size / Volume <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={eyeHygieneFormData.size_volume}
                                                            onChange={(e) => setEyeHygieneFormData(prev => ({ ...prev, size_volume: e.target.value }))}
                                                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium"
                                                            required
                                                        >
                                                            <option value="">Select Size/Volume</option>
                                                            {eyeHygieneOptions.size_volume.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Pack Type Dropdown */}
                                                {eyeHygieneOptions.pack_type.length > 0 && (
                                                    <div className="flex flex-col">
                                                        <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                            Pack Type <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={eyeHygieneFormData.pack_type}
                                                            onChange={(e) => setEyeHygieneFormData(prev => ({ ...prev, pack_type: e.target.value }))}
                                                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium"
                                                            required
                                                        >
                                                            <option value="">Select Pack Type</option>
                                                            {eyeHygieneOptions.pack_type.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Quantity Input */}
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                        Quantity <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={product.stock_quantity || 999}
                                                        value={eyeHygieneFormData.quantity}
                                                        onChange={(e) => setEyeHygieneFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium"
                                                        required
                                                    />
                                                </div>

                                                {/* Stock Quantity Display */}
                                                {product.stock_quantity !== undefined && (
                                                    <div className="flex flex-col justify-end">
                                                        <span className="text-xs font-bold text-gray-500 uppercase mb-1">Available Stock</span>
                                                        <span className={`font-semibold text-lg ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {product.stock_quantity > 0 ? product.stock_quantity : 'Out of Stock'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Expiry Date Display (if available) */}
                                                {(product as any).expiry_date && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</span>
                                                        <span className="text-gray-900 font-semibold text-lg">
                                                            {new Date((product as any).expiry_date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Product Details Grid (for non-Eye Hygiene products or additional details) */}
                                    {(!isEyeHygiene || (product.frame_shape || product.frame_material || product.gender)) && (
                                        <div className="mb-8 grid grid-cols-2 gap-y-4 gap-x-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            {product.frame_shape && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Frame Shape</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_shape.replace('_', ' ')}</span>
                                                </div>
                                            )}
                                            {product.frame_material && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Material</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.frame_material}</span>
                                                </div>
                                            )}
                                            {product.gender && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Gender</span>
                                                    <span className="text-gray-700 font-semibold capitalize">{product.gender}</span>
                                                </div>
                                            )}
                                            {product.category && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">Category</span>
                                                    <span className="text-gray-700 font-semibold">{translateCategory(product.category)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="space-y-4">
                                        {/* For Eye Hygiene: Only show Add to Cart button */}
                                        {isEyeHygiene ? (() => {
                                            const isFormValid = 
                                                (eyeHygieneOptions.size_volume.length === 0 || eyeHygieneFormData.size_volume) &&
                                                (eyeHygieneOptions.pack_type.length === 0 || eyeHygieneFormData.pack_type) &&
                                                eyeHygieneFormData.quantity >= 1
                                            const isDisabled = isProductOutOfStock || !isFormValid
                                            
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        handleAddToCart()
                                                    }}
                                                    disabled={isDisabled}
                                                    className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${!isDisabled
                                                        ? 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow-xl transform hover:-translate-y-1'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isProductOutOfStock ? 'Out of Stock' : !isFormValid ? 'Please Select All Options' : 'Add to Cart'}
                                                </button>
                                            )
                                        })() : (
                                            <>
                                                {/* For other products: Show both Add to Cart and Select Lenses */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleAddToCart()
                                                }}
                                                disabled={isProductOutOfStock}
                                                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${!isProductOutOfStock
                                                    ? 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow-xl transform hover:-translate-y-1'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isProductOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setShowCheckout(true)
                                                }}
                                                disabled={isProductOutOfStock}
                                                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${!isProductOutOfStock
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-1'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                Select Lenses
                                            </button>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setShowTryOn(true)
                                                }}
                                                className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Virtual Try-on
                                            </button>

                                            <a
                                                href={`https://wa.me/3912345678?text=I'm interested in ${encodeURIComponent(product.name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-4 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                                            >
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </a>
                                        </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Description Section with Toggle Button */}
                                    {product.description && (
                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setShowDescription(!showDescription)}
                                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                                            >
                                                <h2 className="text-lg font-bold text-gray-900">Description</h2>
                                                <span className="text-blue-950 font-semibold">
                                                    {showDescription ? 'Hide' : 'Show'}
                                                </span>
                                            </button>
                                            {showDescription && (
                                                <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200">
                                                    <p className="text-gray-600 leading-relaxed text-lg">
                                                        {product.description}
                                                    </p>
                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Product Specifications for Contact Lenses */}
            {isContactLens && (
                <section className="py-12 md:py-16 bg-gray-50 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{t('shop.productSpecifications')}</h2>
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                            {/* Product Description from Admin */}
                            {product.description && (
                                <div className="mb-8 pb-8 border-b border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowSpecsDescription(!showSpecsDescription)}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 mb-3"
                                    >
                                        <h3 className="text-xl font-bold text-gray-900">Product Description</h3>
                                        <span className="text-blue-950 font-semibold">
                                            {showSpecsDescription ? 'Hide' : 'Show'}
                                        </span>
                                    </button>
                                    {showSpecsDescription && (
                                        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Product Specifications - Two Column Layout */}
                            <div className="space-y-0">
                                {(() => {
                                    const specs: Array<{ label: string; value: string | number | null | undefined; show?: boolean }> = []
                                    
                                    // Producer (contact_lens_brand or brand)
                                    if ((product as any).contact_lens_brand || product.brand) {
                                        specs.push({
                                            label: 'Producer',
                                            value: (product as any).contact_lens_brand || product.brand
                                        })
                                    }
                                    
                                    // Brand (if different from producer, or use brand field)
                                    if (product.brand && (product as any).contact_lens_brand !== product.brand) {
                                        specs.push({
                                            label: 'Brand',
                                            value: product.brand
                                        })
                                    }
                                    
                                    // Material
                                    if ((product as any).contact_lens_material) {
                                        specs.push({
                                            label: 'Material',
                                            value: (product as any).contact_lens_material
                                        })
                                    }
                                    
                                    // Product Type
                                    if ((product as any).contact_lens_type) {
                                        specs.push({
                                            label: 'Product Type',
                                            value: (product as any).contact_lens_type
                                        })
                                    }
                                    
                                    // Replacement Frequency
                                    if ((product as any).replacement_frequency) {
                                        specs.push({
                                            label: 'Replacement Frequency',
                                            value: (product as any).replacement_frequency
                                        })
                                    }
                                    
                                    // Water Content
                                    if ((product as any).water_content !== undefined && (product as any).water_content !== null) {
                                        specs.push({
                                            label: 'Water Content',
                                            value: typeof (product as any).water_content === 'number' 
                                                ? `${(product as any).water_content}%`
                                                : (product as any).water_content
                                        })
                                    }
                                    
                                    // Powers Range
                                    if ((product as any).powers_range) {
                                        const powersValue = typeof (product as any).powers_range === 'object'
                                            ? JSON.stringify((product as any).powers_range)
                                            : (product as any).powers_range
                                        specs.push({
                                            label: 'Powers',
                                            value: powersValue
                                        })
                                    }
                                    
                                    // Sleeping with Lenses - HIDDEN
                                    // Medical Device - HIDDEN
                                    // UV Filter - HIDDEN
                                    
                                    if (specs.length === 0) return null
                                    
                                    // Split specs into two columns
                                    const leftColumn = specs.filter((_, index) => index % 2 === 0)
                                    const rightColumn = specs.filter((_, index) => index % 2 === 1)
                                    
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                                            {/* Left Column */}
                                            <div className="space-y-0 pr-4 md:pr-8">
                                                {leftColumn.map((spec, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`flex items-center justify-between py-3 ${index < leftColumn.length - 1 ? 'border-b border-gray-100' : ''}`}
                                                    >
                                                        <span className="font-semibold text-gray-700">{spec.label}:</span>
                                                        <span className="text-gray-900 font-medium text-right ml-4">{spec.value || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Right Column */}
                                            <div className="space-y-0 pl-4 md:pl-8">
                                                {rightColumn.map((spec, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`flex items-center justify-between py-3 ${index < rightColumn.length - 1 ? 'border-b border-gray-100' : ''}`}
                                                    >
                                                        <span className="font-semibold text-gray-700">{spec.label}:</span>
                                                        <span className="text-gray-900 font-medium text-right ml-4">{spec.value || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })()}
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

            {/* Checkout Modal - Only for non-contact lens and non-eye hygiene products */}
            {showCheckout && product && !isContactLens && !isEyeHygiene && (
                <ProductCheckout
                    product={product}
                    onClose={() => setShowCheckout(false)}
                    initialFrameMaterials={selectedFrameMaterial ? [selectedFrameMaterial] : []}
                    initialLensType={selectedLensType || undefined}
                    initialSelectedColor={selectedColor || undefined}
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

