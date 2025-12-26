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
import { useAuth } from '../../context/AuthContext'
import {
    getContactLensFormConfig,
    getAstigmatismConfigs,
    getSphericalConfigs,
    addContactLensToCart,
    getContactLensOptions,
    type ContactLensFormConfig,
    type DropdownValue,
    type SphericalConfig,
    type ContactLensCheckoutRequest
} from '../../services/contactLensFormsService'

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
    const [selectedFrameMaterial, setSelectedFrameMaterial] = useState<string>('') // Single selection
    const [selectedLensType, setSelectedLensType] = useState<'distance_vision' | 'near_vision' | 'progressive' | ''>('') // Proper lens type enum
    const lastProductIdRef = useRef<number | null>(null)
    const formInitializedRef = useRef<number | null>(null)

    // Contact Lens Forms API Integration State
    const [contactLensFormConfig, setContactLensFormConfig] = useState<ContactLensFormConfig | null>(null)
    const [astigmatismDropdownValues, setAstigmatismDropdownValues] = useState<{
        power: DropdownValue[]
        cylinder: DropdownValue[]
        axis: DropdownValue[]
    }>({ power: [], cylinder: [], axis: [] })
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
        right_base_curve: '',
        right_diameter: '',
        right_power: '',
        left_qty: 0,
        left_base_curve: '',
        left_diameter: '',
        left_power: '',
        unit: 'unit'
    })
    const [contactLensErrors, setContactLensErrors] = useState<Record<string, string>>({})
    const [contactLensLoading, setContactLensLoading] = useState(false)
    const [selectedConfig, setSelectedConfig] = useState<SphericalConfig | null>(null)
    const [sphericalConfigs, setSphericalConfigs] = useState<SphericalConfig[]>([])
    const [subSubcategoryOptions, setSubSubcategoryOptions] = useState<any>(null)

    // Check if product is a contact lens
    const { translateCategory } = useCategoryTranslation()

    // Get selected color variant
    const selectedColorVariant = useMemo(() => {
        if (!product || !selectedColor || !product.color_images) return null
        const selectedColorLower = (selectedColor || '').toLowerCase()
        return product.color_images.find(ci => 
            (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
            (ci.name && ci.name.toLowerCase() === selectedColorLower)
        ) || null
    }, [product, selectedColor])

    // Price calculation - uses variant price if color is selected
    const { displayPrice, originalPrice, hasValidSale } = useMemo(() => {
        if (!product) return { displayPrice: 0, originalPrice: null, hasValidSale: false }

        // Use variant price if color is selected and variant has a price
        let basePrice = Number(product.price || 0)
        if (selectedColorVariant && selectedColorVariant.price !== undefined && selectedColorVariant.price !== null) {
            basePrice = Number(selectedColorVariant.price)
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
    const p = product as any

    // Check if product is eye hygiene
    const isEyeHygiene = useMemo(() => {
        if (!product) return false
        const categorySlug = product.category?.slug || ''
        const categoryName = product.category?.name || ''
        return categorySlug.toLowerCase().includes('eye-hygiene') || 
               categorySlug.toLowerCase().includes('hygiene') ||
               categoryName.toLowerCase().includes('eye hygiene') ||
               categoryName.toLowerCase().includes('hygiene')
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
                
                // Auto-select first color variant if available
                if (productData.color_images && productData.color_images.length > 0) {
                    const firstColor = productData.color_images[0]
                    setSelectedColor(firstColor.color)
                    if (import.meta.env.DEV) {
                        console.log('🎨 Auto-selected first color variant:', firstColor.color, firstColor)
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
                return
            }

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

                    // For Astigmatism, extract dropdown values from the configuration itself
                    // The backend stores dropdown values directly in the config (right_power, right_cylinder, etc.)
                    if (config.formType === 'astigmatism') {
                        // Extract unique values from the configuration arrays
                        const configData = config as any
                        
                        // Combine left and right values for each field type
                        const powerValues = [
                            ...(configData.left_power || []),
                            ...(configData.right_power || [])
                        ].filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates
                        
                        const cylinderValues = [
                            ...(configData.left_cylinder || []),
                            ...(configData.right_cylinder || [])
                        ].filter((v, i, arr) => arr.indexOf(v) === i)
                        
                        const axisValues = [
                            ...(configData.left_axis || []),
                            ...(configData.right_axis || [])
                        ].filter((v, i, arr) => arr.indexOf(v) === i)

                        // Convert to DropdownValue format for consistency
                        const formatValues = (values: string[], fieldType: string) => {
                            return values.map((value, index) => ({
                                id: index,
                                field_type: fieldType as any,
                                value: value,
                                label: value,
                                eye_type: 'both' as const,
                                is_active: true,
                                sort_order: index
                            }))
                        }

                        setAstigmatismDropdownValues({
                            power: formatValues(powerValues, 'power'),
                            cylinder: formatValues(cylinderValues, 'cylinder'),
                            axis: formatValues(axisValues, 'axis')
                        })

                        if (import.meta.env.DEV) {
                            console.log('✅ Astigmatism dropdown values extracted from config:', {
                                power: powerValues.length,
                                cylinder: cylinderValues.length,
                                axis: axisValues.length,
                                powerValues,
                                cylinderValues,
                                axisValues
                            })
                        }
                    } else {
                        // For Spherical, fetch configurations which contain the dropdown values
                        const configs = await getSphericalConfigs(numericId)
                        if (configs && configs.length > 0) {
                            setSphericalConfigs(configs)
                            // Auto-select first config if available
                            if (configs.length > 0) {
                                setSelectedConfig(configs[0])
                            }
                            
                            // Extract power values from all spherical configs (right_power and left_power arrays)
                            // IMPORTANT: Only use power values from spherical configs, NOT from astigmatism dropdown API
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
                            
                            // Store in spherical power values state (NOT in astigmatism dropdown values)
                            setSphericalPowerValues(powerValuesArray)
                            
                            // Clear astigmatism dropdown values for spherical forms
                            setAstigmatismDropdownValues({
                                power: [],
                                cylinder: [],
                                axis: []
                            })

                            if (import.meta.env.DEV) {
                                console.log('✅ Spherical configurations loaded:', {
                                    count: configs.length,
                                    powerValues: powerValuesArray.length,
                                    powerValuesArray,
                                    configs: configs
                                })
                            }
                        } else {
                            // No configs found, set empty values
                            setSphericalPowerValues([])
                            setAstigmatismDropdownValues({
                                power: [],
                                cylinder: [],
                                axis: []
                            })
                        }
                    }
                } else {
                    // Config endpoint failed (404 or other error) - try fallback: fetch spherical configs directly
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ Failed to load contact lens form config for sub-category:', subCategoryId, '- trying fallback: fetching spherical configs directly')
                    }
                    
                    // Fallback: Try to fetch spherical configs directly
                    // If configs exist, assume it's a spherical form
                    const configs = await getSphericalConfigs(numericId)
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
                        setAstigmatismDropdownValues({
                            power: [],
                            cylinder: [],
                            axis: []
                        })

                        if (import.meta.env.DEV) {
                            console.log('✅ Spherical configurations loaded (fallback):', {
                                count: configs.length,
                                powerValues: powerValuesArray.length,
                                powerValuesArray,
                                configs: configs
                            })
                        }
                    } else {
                        if (import.meta.env.DEV) {
                            console.warn('⚠️ No spherical configs found either for sub-category:', subCategoryId)
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching contact lens form config:', error)
                // Try fallback on error as well
                try {
                    const configs = await getSphericalConfigs(numericId)
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
                        setAstigmatismDropdownValues({
                            power: [],
                            cylinder: [],
                            axis: []
                        })
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
                    const configs = await getAstigmatismConfigs(numericId)
                    
                    if (configs && configs.length > 0) {
                        // Extract unique dropdown values from all configurations
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
                        
                        // Convert to DropdownValue format and sort
                        const formatValues = (values: Set<string>, fieldType: string) => {
                            return Array.from(values)
                                .map((value, index) => ({
                                    id: index,
                                    field_type: fieldType as any,
                                    value: value,
                                    label: value,
                                    eye_type: 'both' as const,
                                    is_active: true,
                                    sort_order: index
                                }))
                                .sort((a, b) => {
                                    const numA = parseFloat(a.value)
                                    const numB = parseFloat(b.value)
                                    if (!isNaN(numA) && !isNaN(numB)) {
                                        return numA - numB
                                    }
                                    return a.value.localeCompare(b.value)
                                })
                        }
                        
                        const powerValues = formatValues(allPowerValues, 'power')
                        const cylinderValues = formatValues(allCylinderValues, 'cylinder')
                        const axisValues = formatValues(allAxisValues, 'axis')
                        
                        // Update state with extracted values
                        setAstigmatismDropdownValues({
                            power: powerValues,
                            cylinder: cylinderValues,
                            axis: axisValues
                        })

                        if (import.meta.env.DEV) {
                            console.log('✅ Astigmatism dropdown values extracted from configurations:', {
                                configsCount: configs.length,
                                power: powerValues.length,
                                cylinder: cylinderValues.length,
                                axis: axisValues.length,
                                powerValues: Array.from(allPowerValues),
                                cylinderValues: Array.from(allCylinderValues),
                                axisValues: Array.from(allAxisValues)
                            })
                        }
                    }
                } catch (error) {
                    console.error('Error fetching astigmatism configurations:', error)
                    // Don't throw - use values from config as fallback
                }
            }
        }

        fetchAstigmatismConfigs()
    }, [contactLensFormConfig?.formType, isAstigmatismSubSubcategory, isContactLens, product])

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // This ensures hooks run in the same order on every render

    // Qty Options - from form config (admin-managed dropdowns)
    const qtyOptions = useMemo(() => {
        // Priority 1: Use formFields from API config (most reliable - admin-managed)
        if (contactLensFormConfig?.formFields?.rightEye?.qty?.options) {
            const options = contactLensFormConfig.formFields.rightEye.qty.options
            if (options.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using qty options from formFields:', options)
                }
                return options.map(opt => opt.value)
            }
        }

        // Priority 2: Use dropdownValues from API config
        if (contactLensFormConfig?.dropdownValues?.qty && contactLensFormConfig.dropdownValues.qty.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using qty options from dropdownValues:', contactLensFormConfig.dropdownValues.qty.length)
            }
            return contactLensFormConfig.dropdownValues.qty.map(dv => dv.value || dv.label)
        }

        // Priority 3: Use selected configuration data if available
        if (selectedConfig && selectedConfig.right_qty && Array.isArray(selectedConfig.right_qty) && selectedConfig.right_qty.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using qty options from selected configuration:', selectedConfig.right_qty)
            }
            return selectedConfig.right_qty.map(v => String(v))
        }

        // Priority 3b: Use all spherical configs to aggregate qty options
        if (sphericalConfigs.length > 0) {
            const allQtyOptions = new Set<number>()
            sphericalConfigs.forEach(config => {
                if (config.right_qty && Array.isArray(config.right_qty)) {
                    config.right_qty.forEach(qty => allQtyOptions.add(qty))
                }
                if (config.left_qty && Array.isArray(config.left_qty)) {
                    config.left_qty.forEach(qty => allQtyOptions.add(qty))
                }
            })
            if (allQtyOptions.size > 0) {
                const sortedOptions = Array.from(allQtyOptions).sort((a, b) => a - b)
                if (import.meta.env.DEV) {
                    console.log('✅ Using qty options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // No fallback - return empty array if no API data
        return []
    }, [contactLensFormConfig, selectedConfig, sphericalConfigs])

    const baseCurveOptions = useMemo(() => {
        // Priority 1: Use formFields from API config (most reliable - admin-managed)
        if (contactLensFormConfig?.formFields?.rightEye?.baseCurve?.options) {
            const options = contactLensFormConfig.formFields.rightEye.baseCurve.options
            if (options.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using base curve options from formFields:', options)
                }
                return options.map(opt => opt.value)
            }
        }

        // Priority 2: Use dropdownValues from API config
        if (contactLensFormConfig?.dropdownValues?.base_curve && contactLensFormConfig.dropdownValues.base_curve.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using base curve options from dropdownValues:', contactLensFormConfig.dropdownValues.base_curve.length)
            }
            return contactLensFormConfig.dropdownValues.base_curve.map(dv => dv.value || dv.label)
        }

        // Priority 3: Use selected configuration data if available
        if (selectedConfig && selectedConfig.right_base_curve && Array.isArray(selectedConfig.right_base_curve) && selectedConfig.right_base_curve.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using base curve options from selected configuration:', selectedConfig.right_base_curve)
            }
            return selectedConfig.right_base_curve.map(v => String(v))
        }

        // Priority 3b: Use all spherical configs to aggregate base curve options
        if (sphericalConfigs.length > 0) {
            const allBCOptions = new Set<number>()
            sphericalConfigs.forEach(config => {
                if (config.right_base_curve && Array.isArray(config.right_base_curve)) {
                    config.right_base_curve.forEach(bc => allBCOptions.add(bc))
                }
                if (config.left_base_curve && Array.isArray(config.left_base_curve)) {
                    config.left_base_curve.forEach(bc => allBCOptions.add(bc))
                }
            })
            if (allBCOptions.size > 0) {
                const sortedOptions = Array.from(allBCOptions).sort((a, b) => a - b)
                if (import.meta.env.DEV) {
                    console.log('✅ Using base curve options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API (formFields, dropdownValues, or Spherical configs)
        return []
    }, [contactLensFormConfig, product, isContactLens, subSubcategoryOptions, selectedConfig, sphericalConfigs])

    const diameterOptions = useMemo(() => {
        // Priority 1: Use formFields from API config (most reliable - admin-managed)
        if (contactLensFormConfig?.formFields?.rightEye?.diameter?.options) {
            const options = contactLensFormConfig.formFields.rightEye.diameter.options
            if (options.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using diameter options from formFields:', options)
                }
                return options.map(opt => opt.value)
            }
        }

        // Priority 2: Use dropdownValues from API config
        if (contactLensFormConfig?.dropdownValues?.diameter && contactLensFormConfig.dropdownValues.diameter.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using diameter options from dropdownValues:', contactLensFormConfig.dropdownValues.diameter.length)
            }
            return contactLensFormConfig.dropdownValues.diameter.map(dv => dv.value || dv.label)
        }

        // Priority 3: Use selected configuration data if available
        if (selectedConfig && selectedConfig.right_diameter && Array.isArray(selectedConfig.right_diameter) && selectedConfig.right_diameter.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using diameter options from selected configuration:', selectedConfig.right_diameter)
            }
            return selectedConfig.right_diameter.map(v => String(v))
        }

        // Priority 3b: Use all spherical configs to aggregate diameter options
        if (sphericalConfigs.length > 0) {
            const allDiaOptions = new Set<number>()
            sphericalConfigs.forEach(config => {
                if (config.right_diameter && Array.isArray(config.right_diameter)) {
                    config.right_diameter.forEach(dia => allDiaOptions.add(dia))
                }
                if (config.left_diameter && Array.isArray(config.left_diameter)) {
                    config.left_diameter.forEach(dia => allDiaOptions.add(dia))
                }
            })
            if (allDiaOptions.size > 0) {
                const sortedOptions = Array.from(allDiaOptions).sort((a, b) => a - b)
                if (import.meta.env.DEV) {
                    console.log('✅ Using diameter options from spherical configs:', sortedOptions)
                }
                return sortedOptions.map(v => String(v))
            }
        }

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API (formFields, dropdownValues, or Spherical configs)
        return []
    }, [contactLensFormConfig, product, isContactLens, subSubcategoryOptions, selectedConfig, sphericalConfigs])

    // Generate cylinder options (from -6.00 to +6.00 in 0.25 steps)
    // Priority: API Dropdown Values > Configuration > Sub-subcategory > Standard
    const cylinderOptions = useMemo(() => {
        // Priority 1: Use API dropdown values if available (from admin panel)
        if (astigmatismDropdownValues.cylinder.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using cylinder options from API:', astigmatismDropdownValues.cylinder.length, 'values')
            }
            return astigmatismDropdownValues.cylinder.map(dv => dv.value || dv.label)
        }

        // Priority 2: Use sub-subcategory options if available (aggregated from products)
        if (subSubcategoryOptions?.cylinderOptions && subSubcategoryOptions.cylinderOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using cylinder options from sub-subcategory options:', subSubcategoryOptions.cylinderOptions.length, 'values')
            }
            return subSubcategoryOptions.cylinderOptions.map((v: number) => String(v.toFixed(2)))
        }

        // Note: SphericalConfig doesn't have cylinder fields - cylinder only comes from astigmatism dropdown values API

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API
        return []
    }, [astigmatismDropdownValues.cylinder, subSubcategoryOptions, selectedConfig])

    // Generate axis options (0 to 180 in 1 degree steps)
    // Priority: API Dropdown Values > Configuration > Sub-subcategory > Standard
    const axisOptions = useMemo(() => {
        // Priority 1: Use API dropdown values if available (from admin panel)
        if (astigmatismDropdownValues.axis.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using axis options from API:', astigmatismDropdownValues.axis.length, 'values')
            }
            return astigmatismDropdownValues.axis.map(dv => dv.value || dv.label)
        }

        // Priority 2: Use sub-subcategory options if available (aggregated from products)
        if (subSubcategoryOptions?.axisOptions && subSubcategoryOptions.axisOptions.length > 0) {
            if (import.meta.env.DEV) {
                console.log('✅ Using axis options from sub-subcategory options:', subSubcategoryOptions.axisOptions.length, 'values')
            }
            return subSubcategoryOptions.axisOptions.map((v: number) => String(v))
        }

        // Note: SphericalConfig doesn't have axis fields - axis only comes from astigmatism dropdown values API

        // No fallback - return empty array if no API data
        // All dropdown values must come from admin-managed API
        return []
    }, [astigmatismDropdownValues.axis, subSubcategoryOptions, selectedConfig])

    // Parse power range to generate options (memoized)
    // CRITICAL: Astigmatism dropdown values API should NEVER be used for Spherical forms
    // - Spherical forms: MUST use power from spherical configs (right_power/left_power arrays) ONLY
    // - Astigmatism forms: Use power from astigmatism dropdown values API
    const powerOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType

        // For Spherical forms: Use power values from spherical configurations ONLY
        // DO NOT use astigmatismDropdownValues.power for spherical forms
        if (formType === 'spherical') {
            // Priority 1: Use power values from spherical configs (right_power/left_power arrays)
            // These come from the spherical configs API response, NOT from astigmatism dropdown API
            if (sphericalPowerValues.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using power options from spherical configs:', sphericalPowerValues.length, 'values')
                }
                return sphericalPowerValues
            }

            // Priority 2: Use sub-subcategory options as fallback (aggregated from products)
            if (subSubcategoryOptions?.powerOptions && subSubcategoryOptions.powerOptions.length > 0) {
                if (import.meta.env.DEV) {
                    console.log('✅ Using power options from sub-subcategory options (fallback):', subSubcategoryOptions.powerOptions.length, 'values')
                }
                return [...subSubcategoryOptions.powerOptions].sort((a: string, b: string) => {
                    return parseFloat(b) - parseFloat(a)
                })
            }

            // No fallback - return empty array if no config data
            return []
        }

        // For Astigmatism forms: Use power values from astigmatism dropdown values API
        if (formType === 'astigmatism') {
            // Priority 1: Use astigmatism dropdown values API (from admin panel)
        if (astigmatismDropdownValues.power.length > 0) {
            if (import.meta.env.DEV) {
                    console.log('✅ Using power options from astigmatism dropdown API:', astigmatismDropdownValues.power.length, 'values')
            }
            return astigmatismDropdownValues.power.map(dv => dv.value || dv.label)
        }

            // Priority 2: Use sub-subcategory options as fallback (aggregated from products)
        if (subSubcategoryOptions?.powerOptions && subSubcategoryOptions.powerOptions.length > 0) {
            if (import.meta.env.DEV) {
                    console.log('✅ Using power options from sub-subcategory options (fallback):', subSubcategoryOptions.powerOptions.length, 'values')
            }
            return [...subSubcategoryOptions.powerOptions].sort((a: string, b: string) => {
                return parseFloat(b) - parseFloat(a)
            })
        }

        // No fallback - return empty array if no API data
        return []
        }

        // If form type is not determined yet, return empty array
        return []
    }, [contactLensFormConfig?.formType, sphericalPowerValues, astigmatismDropdownValues.power, subSubcategoryOptions])

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

    // Helper function to get the color-specific image URL
    const getColorSpecificImageUrl = (product: Product, imageIndex: number = 0): string => {
        // If color is selected and product has color_images, use color-specific image
        if (selectedColor && product.color_images) {
            const selectedColorLower = (selectedColor || '').toLowerCase()
            const colorImage = product.color_images.find(ci =>
                ci.color && ci.color.toLowerCase() === selectedColorLower
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
                quantity: quantity, // Include quantity
                frame_material: selectedFrameMaterial || undefined, // Include selected frame material (single)
                lens_type: selectedLensType || undefined, // Include selected lens type (single)
                selectedColor: selectedColor || undefined // Store selected color for reference
            }

            // Use services/cartService addItemToCart if authenticated
            if (isAuthenticated) {
                const cartRequest: AddToCartRequest = {
                    product_id: cartProduct.id,
                    quantity: quantity,
                    selected_color: selectedColor || undefined, // Pass selected color for variant matching
                    customization: {
                        frame_material: cartProduct.frame_material,
                        color: selectedColor || undefined,
                        // Store color variant details if available
                        ...(selectedColorVariant ? {
                            color_name: selectedColorVariant.name,
                            color_display_name: selectedColorVariant.display_name,
                            variant_price: selectedColorVariant.price,
                            variant_images: selectedColorVariant.images
                        } : {})
                    },
                    lens_type: selectedLensType === '' ? undefined : selectedLensType
                }
                addItemToCart(cartRequest).catch(err => console.error('API cart error:', err))
            }

            // Always add to local cart context
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
                })
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
            <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6">
                <div className="w-[90%] mx-auto max-w-7xl">
                    {isContactLens ? (
                        /* Contact Lens Layout: Images and Form Side by Side */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Product Images - Left Side */}
                            <div>
                                {isContactLens ? (
                                    /* Contact Lens - Single Product Image with Price */
                                    <div className="space-y-6">
                                        {/* Single Product Image */}
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
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

                                                // Get first image or fallback
                                                const productImage = imagesArray.length > 0
                                                    ? imagesArray[0]
                                                    : getProductImageUrl(product, 0)

                                                return (
                                                    <img
                                                        key={`product-${product.id}`}
                                                        src={productImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover p-8"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            if (import.meta.env.DEV) {
                                                                console.warn('Product image failed to load for product:', product.id, product.name, 'Attempted URL:', target.src)
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
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                                {calculateContactLensTotal > 0 ? 'Total Price' : 'Price'}
                                            </p>
                                            <div className="flex items-baseline gap-3">
                                                {calculateContactLensTotal > 0 ? (
                                                    <p className="text-3xl font-bold text-blue-950">
                                                        €{calculateContactLensTotal.toFixed(2)}
                                                    </p>
                                                ) : (
                                                    <>
                                                        {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum ? (
                                                            <>
                                                                <p className="text-3xl font-bold text-blue-950">
                                                                    €{salePriceNum.toFixed(2)}
                                                                </p>
                                                                <p className="text-xl text-gray-400 line-through">
                                                                    €{regularPriceNum.toFixed(2)}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-3xl font-bold text-blue-950">
                                                                €{regularPriceNum.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {contactLensFormData.unit && calculateContactLensTotal > 0 && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Per {contactLensFormData.unit}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Regular Product - Single Image Display */
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
                                                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${selectedColor === colorImage.color
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
                                                const colorImage = product.color_images.find(ci =>
                                                    ci.color.toLowerCase() === selectedColor.toLowerCase()
                                                )
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
                            {isContactLens && (
                                <div>
                                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-10 shadow-xl">
                                        <div className="mb-8 pb-6 border-b-2 border-gray-100">
                                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                                Select the parameters
                                            </h2>
                                        </div>

                                        {/* Unit Selection */}
                                        <div className="mb-8">
                                            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                                                Purchase Type
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleContactLensFieldChange('unit', 'unit')}
                                                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 shadow-sm ${contactLensFormData.unit === 'unit'
                                                        ? 'bg-gradient-to-r from-blue-950 to-blue-900 text-white border-blue-950 shadow-md transform scale-105'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    Unit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleContactLensFieldChange('unit', 'box')}
                                                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 shadow-sm ${contactLensFormData.unit === 'box'
                                                        ? 'bg-gradient-to-r from-blue-950 to-blue-900 text-white border-blue-950 shadow-md transform scale-105'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    Box
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleContactLensFieldChange('unit', 'pack')}
                                                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 shadow-sm ${contactLensFormData.unit === 'pack'
                                                        ? 'bg-gradient-to-r from-blue-950 to-blue-900 text-white border-blue-950 shadow-md transform scale-105'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-blue-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    Pack
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Eye Section */}
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 border-2 border-purple-100">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">L</span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">Left Eye</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {/* Qty Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Quantity <span className="text-gray-500 font-normal">(Qty)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.left_qty || ''}
                                                            onChange={(e) => handleContactLensFieldChange('left_qty', parseInt(e.target.value) || 1)}
                                                            className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.left_qty ? 'border-red-500' : 'border-gray-300'
                                                                }`}
                                                        >
                                                            <option value="">Select Qty</option>
                                                            {qtyOptions.map((option: number | string) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {contactLensErrors.left_qty && (
                                                            <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.left_qty}</p>
                                                        )}
                                                    </div>

                                                    {/* Raggio Base (B.C) Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Base Curve <span className="text-gray-500 font-normal">(B.C)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.left_base_curve || ''}
                                                            onChange={(e) => handleContactLensFieldChange('left_base_curve', e.target.value)}
                                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                                        >
                                                            <option value="">Select B.C</option>
                                                            {baseCurveOptions.map((option: number | string) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Diametro (DIA) Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Diameter <span className="text-gray-500 font-normal">(DIA)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.left_diameter || ''}
                                                            onChange={(e) => handleContactLensFieldChange('left_diameter', e.target.value)}
                                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                                        >
                                                            <option value="">Select DIA</option>
                                                            {diameterOptions.map((option: number | string) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Left Eye Parameters (Power, Cylinder, Axis for Astigmatism) */}
                                                {(() => {
                                                    const formType = contactLensFormConfig?.formType ||
                                                        (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

                                                    if (formType === 'spherical') {
                                                        return (
                                                            <div className="mt-4">
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    * Power <span className="text-gray-500 font-normal">(PWR)</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.left_power || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                    className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-300'
                                                                        }`}
                                                                >
                                                                    <option value="">Select Power</option>
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
                                                            <div className="mt-6 space-y-6">
                                                                <div className="pt-4 border-t border-purple-200">
                                                                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
                                                                        Power Setting
                                                                    </label>
                                                                    <select
                                                                        value={contactLensFormData.left_power || ''}
                                                                        onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-300'
                                                                            }`}
                                                                    >
                                                                        <option value="">Select Power</option>
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
                                                                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
                                                                        Cylinder & Axis
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Cylinder (CYL)</label>
                                                                            <select
                                                                                value={contactLensFormData.left_cylinder || ''}
                                                                                onChange={(e) => handleContactLensFieldChange('left_cylinder', e.target.value)}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${contactLensErrors.left_cylinder ? 'border-red-500' : 'border-gray-300'}`}
                                                                            >
                                                                                <option value="">Select</option>
                                                                                {cylinderOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Axis (AX)</label>
                                                                            <select
                                                                                value={contactLensFormData.left_axis || ''}
                                                                                onChange={(e) => handleContactLensFieldChange('left_axis', e.target.value)}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${contactLensErrors.left_axis ? 'border-red-500' : 'border-gray-300'}`}
                                                                            >
                                                                                <option value="">Select</option>
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
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8 border-2 border-blue-100">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">R</span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">Right Eye</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {/* Qty Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Quantity <span className="text-gray-500 font-normal">(Qty)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.right_qty || ''}
                                                            onChange={(e) => handleContactLensFieldChange('right_qty', parseInt(e.target.value) || 1)}
                                                            className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.right_qty ? 'border-red-500' : 'border-gray-300'
                                                                }`}
                                                        >
                                                            <option value="">Select Qty</option>
                                                            {qtyOptions.map((option: number | string) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {contactLensErrors.right_qty && (
                                                            <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.right_qty}</p>
                                                        )}
                                                    </div>

                                                    {/* Raggio Base (B.C) Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Base Curve <span className="text-gray-500 font-normal">(B.C)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.right_base_curve || ''}
                                                            onChange={(e) => handleContactLensFieldChange('right_base_curve', e.target.value)}
                                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                                        >
                                                            <option value="">Select B.C</option>
                                                            {baseCurveOptions.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Diametro (DIA) Dropdown */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Diameter <span className="text-gray-500 font-normal">(DIA)</span>
                                                        </label>
                                                        <select
                                                            value={contactLensFormData.right_diameter || ''}
                                                            onChange={(e) => handleContactLensFieldChange('right_diameter', e.target.value)}
                                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                                        >
                                                            <option value="">Select DIA</option>
                                                            {diameterOptions.map((option: number | string) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Right Eye Parameters (Power, Cylinder, Axis for Astigmatism) */}
                                                {(() => {
                                                    const formType = contactLensFormConfig?.formType ||
                                                        (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

                                                    if (formType === 'spherical') {
                                                        return (
                                                            <div className="mt-4">
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    * Power <span className="text-gray-500 font-normal">(PWR)</span>
                                                                </label>
                                                                <select
                                                                    value={contactLensFormData.right_power || ''}
                                                                    onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                    className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-300'
                                                                        }`}
                                                                >
                                                                    <option value="">Select Power</option>
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
                                                            <div className="mt-6 space-y-6">
                                                                <div className="pt-4 border-t border-blue-200">
                                                                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
                                                                        Power Setting
                                                                    </label>
                                                                    <select
                                                                        value={contactLensFormData.right_power || ''}
                                                                        onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                        className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-300'
                                                                            }`}
                                                                    >
                                                                        <option value="">Select Power</option>
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
                                                                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
                                                                        Cylinder & Axis
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Cylinder (CYL)</label>
                                                                            <select
                                                                                value={contactLensFormData.right_cylinder || ''}
                                                                                onChange={(e) => handleContactLensFieldChange('right_cylinder', e.target.value)}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${contactLensErrors.right_cylinder ? 'border-red-500' : 'border-gray-300'}`}
                                                                            >
                                                                                <option value="">Select</option>
                                                                                {cylinderOptions.map((option: number | string) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Axis (AX)</label>
                                                                            <select
                                                                                value={contactLensFormData.right_axis || ''}
                                                                                onChange={(e) => handleContactLensFieldChange('right_axis', e.target.value)}
                                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${contactLensErrors.right_axis ? 'border-red-500' : 'border-gray-300'}`}
                                                                            >
                                                                                <option value="">Select</option>
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

                                        {/* Add to Cart Button */}
                                        <div className="mt-10 pt-6 border-t-2 border-gray-200">
                                            <button
                                                onClick={handleContactLensAddToCart}
                                                disabled={contactLensLoading || isProductOutOfStock}
                                                className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${contactLensLoading || isProductOutOfStock
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
                            )}
                        </div>
                    ) : (
                        /* Regular Product Layout: Images and Info Side by Side */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Product Images (Left Column) */}
                            <div>
                                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center mb-6">
                                    <img
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

                                {/* Color Selection (if color_images available) */}
                                {product.color_images && product.color_images.length > 0 && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            {t('shop.selectColor', 'Select Color')}
                                        </label>
                                        <div className="flex gap-3 flex-wrap">
                                            {product.color_images.map((colorImage, index) => {
                                                const isSelected = selectedColor === colorImage.color
                                                const variantPrice = colorImage.price !== undefined && colorImage.price !== null
                                                    ? Number(colorImage.price)
                                                    : null
                                                const displayName = colorImage.display_name || colorImage.name || colorImage.color
                                                
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedColor(colorImage.color)
                                                            setSelectedImageIndex(0) // Reset to first image of selected color
                                                        }}
                                                        className={`px-5 py-2.5 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${isSelected
                                                            ? 'border-blue-950 bg-blue-50/50 scale-105 ring-2 ring-blue-100'
                                                            : 'border-gray-200 hover:border-blue-200 hover:bg-white'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-center gap-1">
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
                                )}

                                {/* Thumbnail Images */}
                                {(() => {
                                    // Use color_images if available and color is selected, otherwise use regular images
                                    let imagesArray: string[] = []

                                    if (selectedColor && product.color_images) {
                                        const selectedColorLower = (selectedColor || '').toLowerCase()
                                        const colorImage = product.color_images.find(ci =>
                                            ci.color && ci.color.toLowerCase() === selectedColorLower
                                        )
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
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                        {product.name}
                                    </h1>

                                    {/* Price */}
                                    <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                        {originalPrice ? (
                                            <div className="flex items-center gap-6">
                                                <span className="text-5xl font-extrabold text-blue-950">
                                                    ${displayPrice.toFixed(2)}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-xl text-gray-400 line-through font-medium">
                                                        ${originalPrice.toFixed(2)}
                                                    </span>
                                                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded ml-[-4px]">
                                                        SAVE {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-5xl font-extrabold text-blue-950">
                                                ${displayPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {product.description && (
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Description</h2>
                                            <p className="text-gray-600 leading-relaxed text-lg">
                                                {product.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Product Details Grid */}
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

                                    {/* Actions */}
                                    <div className="space-y-4">
                                        {/* For Eye Hygiene: Only show Add to Cart button */}
                                        {isEyeHygiene ? (
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isProductOutOfStock}
                                                className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${!isProductOutOfStock
                                                    ? 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow-xl transform hover:-translate-y-1'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isProductOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        ) : (
                                            <>
                                                {/* For other products: Show both Add to Cart and Select Lenses */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isProductOutOfStock}
                                                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${!isProductOutOfStock
                                                    ? 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow-xl transform hover:-translate-y-1'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isProductOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                            </button>

                                            <button
                                                onClick={() => setShowCheckout(true)}
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
                                                onClick={() => setShowTryOn(true)}
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

