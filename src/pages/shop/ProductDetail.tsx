import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart, type CartProduct } from '../../context/CartContext'
import { useCategoryTranslation } from '../../utils/categoryTranslations'
import {
    getProductBySlug,
    getRelatedProducts,
    getProductCalibers,
    getProductEyeHygieneVariants,
    type Product,
    type MMCaliber,
    type EyeHygieneVariant
} from '../../services/productsService'
import { addItemToCart, type AddToCartRequest } from '../../services/cartService'
import { getProductImageUrl, getVariantImageUrl } from '../../utils/productImage'
import ProductCheckout from '../../components/shop/ProductCheckout'
import VirtualTryOnModal from '../../components/home/VirtualTryOnModal'
import EyeAxisDiagram from '../../components/shop/EyeAxisDiagram'
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
import { getGiftsByProduct, type ProductGift } from '../../services/productGiftsService'
import {
    getEyeHygieneOptions,
    getSizeVolumeVariants,
    type EyeHygieneOptions,
    type SizeVolumeVariant
} from '../../services/eyeHygieneFormsService'

const ProductDetail = () => {
    const { t } = useTranslation()
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [product, setProduct] = useState<Product | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [selectedColor, setSelectedColor] = useState<string | null>(null) // For color_images support
    const [quantity] = useState(1)
    const [showCheckout, setShowCheckout] = useState(false)
    const [isManuallySelectingImage, setIsManuallySelectingImage] = useState(false) // Track manual image selection
    const [showTryOn, setShowTryOn] = useState(false)
    const [showDescription, setShowDescription] = useState(false)
    const [showSpecsDescription, setShowSpecsDescription] = useState(false)
    const [selectedFrameMaterial, setSelectedFrameMaterial] = useState<string>('') // Single selection
    const [selectedLensType, setSelectedLensType] = useState<'distance_vision' | 'near_vision' | 'progressive' | ''>('') // Proper lens type enum
    const [productGifts, setProductGifts] = useState<ProductGift[]>([])
    const lastProductIdRef = useRef<number | null>(null)
    const formInitializedRef = useRef<number | null>(null)

    // MM Caliber State - using product's mm_calibers data directly
    const [productCalibers, setProductCalibers] = useState<MMCaliber[]>([])
    const [selectedCaliber, setSelectedCaliber] = useState<MMCaliber | null>(null)

    // Eye Hygiene Variants State
    const [productEyeHygieneVariants, setProductEyeHygieneVariants] = useState<EyeHygieneVariant[]>([])
    const [selectedEyeHygieneVariant, setSelectedEyeHygieneVariant] = useState<EyeHygieneVariant | null>(null)

    // Contact Lens Forms API Integration State
    const [contactLensFormConfig, setContactLensFormConfig] = useState<ContactLensFormConfig | null>(null)
    // Separate state for spherical power values (from spherical configs, not astigmatism dropdown API)
    const [sphericalPowerValues, setSphericalPowerValues] = useState<string[]>([])

    // Fetch product gifts
    useEffect(() => {
        if (product?.id) {
            getGiftsByProduct(product.id).then(gifts => {
                setProductGifts(gifts)
            })
        }
    }, [product?.id])

    // Load product calibers from product data
    useEffect(() => {
        if (product?.id) {
            const p = product as any
            console.log('[ProductDetail] Loading calibers for product:', p.id, p.name)
            console.log('[ProductDetail] Product mm_calibers:', p.mm_calibers)
            
            // Use mm_calibers from product data directly
            if (p.mm_calibers) {
                let calibersData = [];
                
                // Parse mm_calibers if it's a string, otherwise use as-is
                try {
                    if (typeof p.mm_calibers === 'string') {
                        calibersData = JSON.parse(p.mm_calibers);
                    } else if (Array.isArray(p.mm_calibers)) {
                        calibersData = p.mm_calibers;
                    }
                } catch (error) {
                    console.error('[ProductDetail] Error parsing mm_calibers:', error);
                    calibersData = [];
                }
                
                if (calibersData.length > 0) {
                    const calibers = calibersData.map((caliber: any, index: number) => {
                        console.log(`[ProductDetail] Processing caliber ${index}:`, {
                            mm: caliber.mm,
                            original_image_url: caliber.image_url,
                            is_blob: caliber.image_url?.startsWith('blob:'),
                            is_3d_glasses: caliber.image_url?.includes('3d-glasses.png')
                        });
                        
                        // Use actual product images instead of blob URLs
                        let caliberImage = '';
                        
                        // Handle blob URLs by using different product images as fallbacks since blob URLs won't work cross-origin
                        if (caliber.image_url?.startsWith('blob:')) {
                            // Blob URLs won't work across origins, so use different product images for different calibers
                            if (product.images && product.images.length > 0) {
                                // Use different images based on caliber index to enable image switching
                                const imageIndex = index % product.images.length;
                                caliberImage = product.images[imageIndex];
                                console.log(`[ProductDetail] Blob URL detected, using product image ${imageIndex} for caliber ${caliber.mm}:`, caliberImage);
                            } else {
                                caliberImage = `/assets/images/frame${(index % 5) + 1}.png`;
                                console.log(`[ProductDetail] Blob URL detected, using fallback frame image for caliber ${caliber.mm}:`, caliberImage);
                            }
                        } else if (caliber.image_url && !caliber.image_url.includes('3d-glasses.png')) {
                            // Use the caliber image if it's valid
                            caliberImage = caliber.image_url;
                        } else {
                            // Fallback to different product images for different calibers
                            if (product.images && product.images.length > 0) {
                                // Use different images based on caliber index to enable image switching
                                const imageIndex = index % product.images.length;
                                caliberImage = product.images[imageIndex];
                                console.log(`[ProductDetail] Using product image ${imageIndex} for caliber ${caliber.mm}:`, caliberImage);
                            } else {
                                caliberImage = `/assets/images/frame${(index % 5) + 1}.png`;
                            }
                        }
                        
                        return {
                            mm: caliber.mm,
                            image_url: caliberImage,
                            price: caliber.price,
                            stock_quantity: caliber.stock_quantity,
                            is_active: caliber.is_active !== false
                        };
                    });
                
                console.log('[ProductDetail] Product calibers loaded from product data:', calibers.length, calibers)
                
                // Set the calibers in state
                setProductCalibers(calibers)
                
                // Don't auto-select first caliber - let user see product image first
                // User can manually select caliber when they want to see caliber-specific options
                console.log('[ProductDetail] Product calibers loaded:', calibers.length)
                }
            } else {
                console.log('[ProductDetail] No valid calibers data found, trying API fallback')
                // Fallback: try to fetch from API if product doesn't have mm_calibers
                getProductCalibers(product.id).then(calibers => {
                    if (calibers) {
                        setProductCalibers(calibers)
                        // Don't auto-select first caliber here either
                        console.log('[ProductDetail] Product calibers loaded from API fallback:', calibers.length)
                    } else {
                        console.log('[ProductDetail] No calibers found from API fallback')
                    }
                }).catch(error => {
                    console.error('[ProductDetail] Error fetching calibers:', error)
                })
            }
        } else {
            setProductCalibers([])
            setSelectedCaliber(null)
        }
    }, [product?.id, product?.mm_calibers])

    // Fetch eye hygiene variants
    useEffect(() => {
        if (product?.id) {
            getProductEyeHygieneVariants(product.id).then(variants => {
                if (variants && variants.length > 0) {
                    // Process variants to handle blob URLs and problematic images
                    const processedVariants = variants.map((variant, index) => {
                        if (import.meta.env.DEV) {
                            console.log(`[ProductDetail] Processing eye hygiene variant ${index}:`, {
                                id: variant.id,
                                name: variant.name,
                                image_url: variant.image_url,
                                image: variant.image,
                                is_blob: variant.image_url?.startsWith('blob:'),
                                is_3d_glasses: variant.image_url?.includes('3d-glasses.png')
                            });
                        }
                        
                        // Create a processed variant with proper image handling
                        const processedVariant = { ...variant };
                        
                        // Handle blob URLs and problematic images
                        if (!variant.image_url || variant.image_url.startsWith('blob:') || variant.image_url.includes('3d-glasses.png')) {
                            // Use fallback image strategy for eye hygiene variants
                            let fallbackImage = `/assets/images/frame${(index % 5) + 1}.png`;
                            
                            // Check if we can use size_volume-specific eye hygiene images
                            if (variant.size_volume) {
                                const sizeVolume = variant.size_volume.toLowerCase();
                                if (sizeVolume.includes('5ml')) {
                                    fallbackImage = '/assets/images/eye-hygiene-5ml.png';
                                } else if (sizeVolume.includes('10ml')) {
                                    fallbackImage = '/assets/images/eye-hygiene-10ml.png';
                                } else if (sizeVolume.includes('30ml')) {
                                    fallbackImage = '/assets/images/eye-hygiene-30ml.png';
                                }
                            }
                            
                            processedVariant.image_url = fallbackImage;
                            if (import.meta.env.DEV) {
                                console.log(`[ProductDetail] Set fallback image for variant ${variant.name}:`, fallbackImage);
                            }
                        }
                        
                        return processedVariant;
                    });
                    
                    setProductEyeHygieneVariants(processedVariants)
                    // Auto-select first variant if none selected and variants are available
                    if (!selectedEyeHygieneVariant && processedVariants.length > 0) {
                        setSelectedEyeHygieneVariant(processedVariants[0])
                    }
                    if (import.meta.env.DEV) {
                        console.log('[ProductDetail] Product eye hygiene variants loaded and processed:', processedVariants.length)
                    }
                } else {
                    // No variants available - this is normal for most products
                    if (import.meta.env.DEV) {
                        console.log(`[ProductDetail] No eye hygiene variants available for product ${product.id} - this is normal`)
                    }
                    setProductEyeHygieneVariants([])
                    setSelectedEyeHygieneVariant(null)
                }
            }).catch(error => {
                // Handle errors quietly - most products don't have variants
                if (import.meta.env.DEV) {
                    console.warn(`[ProductDetail] Could not load eye hygiene variants for product ${product.id} - using fallback:`, error)
                }
                setProductEyeHygieneVariants([])
                setSelectedEyeHygieneVariant(null)
            })
        } else {
            setProductEyeHygieneVariants([])
            setSelectedEyeHygieneVariant(null)
        }
    }, [product?.id])

    // Sync checkout modal state with URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const action = searchParams.get('action')
        if (action === 'checkout') {
            setShowCheckout(true)
        } else {
            setShowCheckout(false)
        }
    }, [location.search])

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
    const [showAxisGuide, setShowAxisGuide] = useState(false) // Toggle for Axis Measurement Guide

    // Unit-based pricing and images state (independent from qty)
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null) // Selected unit (pack size), e.g., 10, 20, 30
    const [unitPrice, setUnitPrice] = useState<number | null>(null)
    const [unitImages, setUnitImages] = useState<string[]>([])
    const [loadingUnitData, setLoadingUnitData] = useState(false)

    // Eye Hygiene Form Data State (legacy - for backward compatibility with products without variants)
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

    // Fetched variants from API
    const [fetchedVariants, setFetchedVariants] = useState<SizeVolumeVariant[]>([])
    const [variantsLoading, setVariantsLoading] = useState(false)

    // Size/Volume Variant Selection State (for products with sizeVolumeVariants from API)
    const [selectedSizeVolumeVariant, setSelectedSizeVolumeVariant] = useState<{
        id: number;
        size_volume: string;
        pack_type?: string | null;
        price: number;
        compare_at_price?: number | null;
        stock_quantity: number;
        stock_status?: 'in_stock' | 'out_of_stock' | 'backorder';
        expiry_date?: string | null;
        image_url?: string | null; // New field for variant image URL
        is_active: boolean;
        sort_order: number;
    } | null>(null)
    
    // Quantity state for variant-based products
    const [variantQuantity, setVariantQuantity] = useState(1)

    // MM Caliber State (for frames/glasses) - using fetched calibers as fallback

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

    // Price calculation - uses variant price if size/volume variant, eye hygiene variant, or color is selected
    // Priority: eye hygiene variant > size/volume variant > color variant > product price
    const { displayPrice, originalPrice, hasValidSale } = useMemo(() => {
        if (!product) return { displayPrice: 0, originalPrice: null, hasValidSale: false }

        // Priority 1: Use eye hygiene variant price if selected
        let basePrice = Number(product.price || 0)
        if (selectedEyeHygieneVariant) {
            basePrice = Number(selectedEyeHygieneVariant.price || 0)
        } else if (selectedSizeVolumeVariant) {
            // Priority 2: Use size/volume variant price if selected
            basePrice = Number(selectedSizeVolumeVariant.price || 0)
        } else if (selectedColorVariant) {
            // Priority 3: Use color variant price if selected
            const variantPrice = (selectedColorVariant as any).price
            if (variantPrice !== undefined && variantPrice !== null) {
                basePrice = Number(variantPrice)
            }
        }

        // Apply caliber price adjustment if selected
        if (selectedCaliber && selectedCaliber.price) {
            basePrice += Number(selectedCaliber.price)
        }

        // For variants, use compare_at_price if available for sale display
        let salePrice: number | null = null
        if (selectedEyeHygieneVariant && (selectedEyeHygieneVariant as any).compare_at_price) {
            salePrice = Number((selectedEyeHygieneVariant as any).compare_at_price)
            // Apply caliber price adjustment to sale price as well
            if (selectedCaliber && selectedCaliber.price) {
                salePrice += Number(selectedCaliber.price)
            }
        } else if (selectedSizeVolumeVariant && selectedSizeVolumeVariant.compare_at_price) {
            salePrice = Number(selectedSizeVolumeVariant.compare_at_price)
            // Apply caliber price adjustment to sale price as well
            if (selectedCaliber && selectedCaliber.price) {
                salePrice += Number(selectedCaliber.price)
            }
        } else {
            salePrice = product.sale_price ? Number(product.sale_price) : null
            // Apply caliber price adjustment to sale price as well
            if (salePrice && selectedCaliber && selectedCaliber.price) {
                salePrice += Number(selectedCaliber.price)
            }
        }

        const isValidSale = !!(salePrice && salePrice < basePrice)
        const finalPrice = isValidSale ? salePrice : basePrice

        return {
            displayPrice: finalPrice,
            originalPrice: isValidSale ? basePrice : null,
            hasValidSale: isValidSale
        }
    }, [product, selectedColorVariant, selectedSizeVolumeVariant, selectedEyeHygieneVariant, selectedCaliber])

    // Helper variables for backward compatibility with legacy JSX sections
    const regularPriceNum = originalPrice || displayPrice
    const salePriceNum = hasValidSale ? displayPrice : null

    // Check if product is eye hygiene (check category, subcategory, product_type, and variants)
    const isEyeHygiene = useMemo(() => {
        if (!product) return false
        const p = product as any
        const categorySlug = product.category?.slug || ''
        const categoryName = product.category?.name || ''
        const subCategorySlug = p.subCategory?.slug || p.sub_category?.slug || ''
        const subCategoryName = p.subCategory?.name || p.sub_category?.name || ''

        // Check product_type
        const isEyeHygieneType = p.product_type === 'eye_hygiene'

        // Check if category or subcategory contains "eye hygiene" or "hygiene"
        const categoryMatch = categorySlug.toLowerCase().includes('eye-hygiene') ||
            categorySlug.toLowerCase().includes('hygiene') ||
            categoryName.toLowerCase().includes('eye hygiene') ||
            categoryName.toLowerCase().includes('hygiene')

        const subCategoryMatch = subCategorySlug.toLowerCase().includes('eye-hygiene') ||
            subCategorySlug.toLowerCase().includes('hygiene') ||
            subCategoryName.toLowerCase().includes('eye hygiene') ||
            subCategoryName.toLowerCase().includes('hygiene')

        // Check if product has Eye Hygiene fields
        const hasEyeHygieneFields = !!(p.size_volume || p.pack_type || p.expiry_date)

        // Check if product has sizeVolumeVariants (indicates it's an eye hygiene product)
        const hasVariants = p.sizeVolumeVariants && Array.isArray(p.sizeVolumeVariants) && p.sizeVolumeVariants.length > 0

        const result = isEyeHygieneType || categoryMatch || subCategoryMatch || hasEyeHygieneFields || hasVariants
        
        if (import.meta.env.DEV) {
            console.log('[ProductDetail] isEyeHygiene calculation:', {
                product_type: p.product_type,
                categorySlug,
                categoryName,
                isEyeHygieneType,
                categoryMatch,
                subCategoryMatch,
                hasEyeHygieneFields,
                hasVariants,
                result
            })
        }

        return result
    }, [product])

    const isContactLens = useMemo(() => {
        if (!product) return false
        const p = product as any
        const categorySlug = product.category?.slug || ''
        const categoryName = product.category?.name || ''
        const result = categorySlug.toLowerCase().includes('contact') ||
            categoryName.toLowerCase().includes('contact') ||
            categorySlug.toLowerCase().includes('lens') ||
            (p.contact_lens_type && p.contact_lens_type.length > 0)
            
        if (import.meta.env.DEV) {
            console.log('[ProductDetail] isContactLens calculation:', {
                product_type: p.product_type,
                categorySlug,
                categoryName,
                contact_lens_type: p.contact_lens_type,
                result
            })
        }
        
        return result
    }, [product])

    // Helper function to determine if calibers should be shown
    const shouldShowCalibers = useMemo(() => {
        if (!product) {
            console.log('[ProductDetail] shouldShowCalibers: No product')
            return false
        }
        
        if (productCalibers.length === 0) {
            console.log('[ProductDetail] shouldShowCalibers: No calibers loaded', productCalibers)
            return false
        }
        
        const p = product as any
        const productType = p.product_type || ''
        
        // Always show calibers for these product types
        const frameProductTypes = ['sunglasses', 'eyeglasses', 'glasses', 'frames', 'eyewear']
        const isFrameProduct = frameProductTypes.includes(productType.toLowerCase())
        
        // Also show for any product that's not eye hygiene or contact lens
        const shouldShow = !isEyeHygiene && !isContactLens
        
        const result = isFrameProduct || shouldShow
        
        console.log('[ProductDetail] shouldShowCalibers calculation:', {
            productName: p.name,
            productType,
            isFrameProduct,
            isEyeHygiene,
            isContactLens,
            shouldShow,
            result,
            productCalibersLength: productCalibers.length
        })
        
        return result
    }, [product, productCalibers.length, isEyeHygiene, isContactLens])

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
                setIsManuallySelectingImage(false) // Reset manual selection flag
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

                // Variant selection is now handled by the fetchVariants useEffect
                // This section just resets if product changes
                setSelectedSizeVolumeVariant(null)
                setFetchedVariants([])

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

                // Fetch related products - more for Eye Hygiene products
                // Reuse 'p' variable that was already declared above
                const isEyeHygieneProduct = productData.category?.slug?.toLowerCase().includes('eye-hygiene') ||
                    productData.category?.slug?.toLowerCase().includes('hygiene') ||
                    productData.category?.name?.toLowerCase().includes('eye hygiene') ||
                    false

                // Fetch more related products for Eye Hygiene (8 instead of 4)
                const relatedLimit = isEyeHygieneProduct ? 8 : 6
                const related = await getRelatedProducts(productData.id, relatedLimit)
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
                            // No configs found - create a default fallback configuration
                            // This allows users to still see the form and enter values
                            console.info('ℹ️ API returned empty spherical configs - creating fallback form configuration')
                            
                            setContactLensFormConfig({
                                formType: 'spherical',
                                subCategory: subCategoryData || {
                                    id: numericId,
                                    name: '',
                                    slug: ''
                                },
                                formFields: {
                                    rightEye: {
                                        qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                        base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                        diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                        power: { type: 'number', label: 'Power', required: true, default: 0 }
                                    },
                                    leftEye: {
                                        qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                        base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                        diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                        power: { type: 'number', label: 'Power', required: true, default: 0 }
                                    }
                                }
                            })
                            
                            // Set empty configs array but keep the form visible
                            setSphericalConfigs([])
                            setSelectedConfig(null)
                            
                            // Set common power values as fallback
                            const fallbackPowerValues = ['-8.00', '-7.50', '-7.00', '-6.50', '-6.00', '-5.50', '-5.00', '-4.50', '-4.00', '-3.50', '-3.00', '-2.50', '-2.00', '-1.50', '-1.00', '-0.75', '-0.50', '-0.25', '0.00', '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00', '+5.50', '+6.00', '+6.50', '+7.00', '+8.00']
                            setSphericalPowerValues(fallbackPowerValues)
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
                        // No configs found - create a default fallback configuration
                        // This allows users to still see the form and enter values
                        console.info('ℹ️ API returned empty spherical configs for sub-category:', subCategoryId, '- creating fallback form configuration')
                        
                        setContactLensFormConfig({
                            formType: 'spherical',
                            subCategory: subCategoryData || {
                                id: numericId,
                                name: '',
                                slug: ''
                            },
                            formFields: {
                                rightEye: {
                                    qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                    base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                    diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                    power: { type: 'number', label: 'Power', required: true, default: 0 }
                                },
                                leftEye: {
                                    qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                    base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                    diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                    power: { type: 'number', label: 'Power', required: true, default: 0 }
                                }
                            }
                        })
                        
                        // Set empty configs array but keep the form visible
                        setSphericalConfigs([])
                        setSelectedConfig(null)
                        
                        // Set common power values as fallback
                        const fallbackPowerValues = ['-8.00', '-7.50', '-7.00', '-6.50', '-6.00', '-5.50', '-5.00', '-4.50', '-4.00', '-3.50', '-3.00', '-2.50', '-2.00', '-1.50', '-1.00', '-0.75', '-0.50', '-0.25', '0.00', '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00', '+5.50', '+6.00', '+6.50', '+7.00', '+8.00']
                        setSphericalPowerValues(fallbackPowerValues)
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
                    
                    // Create fallback configuration even on error
                    console.info('ℹ️ Creating fallback form configuration due to API error')
                    
                    setContactLensFormConfig({
                        formType: 'spherical',
                        subCategory: subCategoryData || {
                            id: numericId,
                            name: '',
                            slug: ''
                        },
                        formFields: {
                            rightEye: {
                                qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                power: { type: 'number', label: 'Power', required: true, default: 0 }
                            },
                            leftEye: {
                                qty: { type: 'number', label: 'Quantity', required: true, default: 1 },
                                base_curve: { type: 'number', label: 'Base Curve', required: true, default: 8.5 },
                                diameter: { type: 'number', label: 'Diameter', required: true, default: 14.2 },
                                power: { type: 'number', label: 'Power', required: true, default: 0 }
                            }
                        }
                    })
                    
                    // Set empty configs array but keep the form visible
                    setSphericalConfigs([])
                    setSelectedConfig(null)
                    
                    // Set common power values as fallback
                    const fallbackPowerValues = ['-8.00', '-7.50', '-7.00', '-6.50', '-6.00', '-5.50', '-5.00', '-4.50', '-4.00', '-3.50', '-3.00', '-2.50', '-2.00', '-1.50', '-1.00', '-0.75', '-0.50', '-0.25', '0.00', '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00', '+5.50', '+6.00', '+6.50', '+7.00', '+8.00']
                    setSphericalPowerValues(fallbackPowerValues)
                }
            } finally {
                // Form config loading complete
            }
        }

        fetchFormConfig()
    }, [product?.id, isContactLens])

    // Fetch Eye Hygiene Options (only for legacy products without variants)
    useEffect(() => {
        const fetchEyeHygieneOptions = async () => {
            if (!product || !isEyeHygiene) {
                setEyeHygieneOptions({ size_volume: [], pack_type: [] })
                setEyeHygieneFormData({ size_volume: '', pack_type: '', quantity: 1 })
                return
            }

            try {
                const p = product as any

                // Skip API call if product has variants - use variants instead (handle both property names)
                const variantsArray = p.sizeVolumeVariants || p.size_volume_variants
                const hasVariants = variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0

                if (hasVariants) {
                    // Products with variants don't need options from API
                    setEyeHygieneOptions({ size_volume: [], pack_type: [] })
                    return
                }

                // Only fetch options for products without variants (legacy support)
                const subCategoryId = p.subCategory?.id || p.sub_category?.id || p.subcategory?.id || p.sub_category_id

                if (subCategoryId) {
                    try {
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
                    } catch (apiError: any) {
                        // API call failed (404 or other error) - use product's own data as fallback
                        if (import.meta.env.DEV) {
                            console.warn('⚠️ Eye Hygiene Options API not available, using product data:', apiError.message)
                        }
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
                // Final fallback - use product's own data
                const p = product as any
                const fallbackOptions: EyeHygieneOptions = {
                    size_volume: p.size_volume ? [p.size_volume] : [],
                    pack_type: p.pack_type ? [p.pack_type] : []
                }
                setEyeHygieneOptions(fallbackOptions)
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Error fetching Eye Hygiene options, using fallback:', error)
                }
            }
        }

        fetchEyeHygieneOptions()
    }, [product?.id, isEyeHygiene])

    // Fetch Size/Volume Variants from API for Eye Hygiene products
    useEffect(() => {
        const fetchVariants = async () => {
            if (!product || !isEyeHygiene || !product.id) {
                setFetchedVariants([])
                setSelectedSizeVolumeVariant(null)
                return
            }

            setVariantsLoading(true)
            try {
                const variants = await getSizeVolumeVariants(product.id)
                if (variants && variants.length > 0) {
                    setFetchedVariants(variants)
                    // Auto-select first active variant
                    const firstActiveVariant = variants.find((v) => v.is_active !== false)
                    if (firstActiveVariant) {
                        setSelectedSizeVolumeVariant({
                            id: firstActiveVariant.id,
                            size_volume: firstActiveVariant.size_volume,
                            pack_type: firstActiveVariant.pack_type || null,
                            price: Number(firstActiveVariant.price || 0),
                            compare_at_price: firstActiveVariant.compare_at_price ? Number(firstActiveVariant.compare_at_price) : null,
                            stock_quantity: Number(firstActiveVariant.stock_quantity || 0),
                            stock_status: (firstActiveVariant.stock_status || 'in_stock') as 'in_stock' | 'out_of_stock' | 'backorder',
                            expiry_date: firstActiveVariant.expiry_date || null,
                            image_url: firstActiveVariant.image_url || null, // Include image_url field
                            is_active: firstActiveVariant.is_active !== false,
                            sort_order: firstActiveVariant.sort_order || 0
                        })
                    }
                } else {
                    // Handle empty array (could be due to 500 error handled in service)
                    if (variants === null) {
                        console.warn('⚠️ Failed to fetch size-volume variants for product:', product.id)
                    } else {
                        console.log('ℹ️ No size-volume variants available for product:', product.id)
                    }
                    setFetchedVariants([])
                    setSelectedSizeVolumeVariant(null)
                }
            } catch (error) {
                console.error('Error fetching variants:', error)
                setFetchedVariants([])
                setSelectedSizeVolumeVariant(null)
            } finally {
                setVariantsLoading(false)
            }
        }

        fetchVariants()
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

    // Generate base curve options from astigmatism configs
    const baseCurveOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

        // For astigmatism forms, use astigmatism configs
        if (formType === 'astigmatism') {
            if (astigmatismConfigs.length > 0) {
                const allBaseCurveValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightBaseCurve = (config.right_base_curve && Array.isArray(config.right_base_curve)) ? config.right_base_curve : []
                    const leftBaseCurve = (config.left_base_curve && Array.isArray(config.left_base_curve)) ? config.left_base_curve : []
                    rightBaseCurve.forEach(v => {
                        if (v != null && v !== '') {
                            allBaseCurveValues.add(String(v))
                        }
                    })
                    leftBaseCurve.forEach(v => {
                        if (v != null && v !== '') {
                            allBaseCurveValues.add(String(v))
                        }
                    })
                })
                if (allBaseCurveValues.size > 0) {
                    const baseCurveArray = Array.from(allBaseCurveValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using base curve options from astigmatism configs:', baseCurveArray)
                    }
                    return baseCurveArray
                }
            }
        }

        // For spherical forms or fallback, use subSubcategoryOptions
        return subSubcategoryOptions?.baseCurveOptions || []
    }, [contactLensFormConfig?.formType, astigmatismConfigs, subSubcategoryOptions, isAstigmatismSubSubcategory])

    // Generate diameter options from astigmatism configs
    const diameterOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

        // For astigmatism forms, use astigmatism configs
        if (formType === 'astigmatism') {
            if (astigmatismConfigs.length > 0) {
                const allDiameterValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightDiameter = (config.right_diameter && Array.isArray(config.right_diameter)) ? config.right_diameter : []
                    const leftDiameter = (config.left_diameter && Array.isArray(config.left_diameter)) ? config.left_diameter : []
                    rightDiameter.forEach(v => {
                        if (v != null && v !== '') {
                            allDiameterValues.add(String(v))
                        }
                    })
                    leftDiameter.forEach(v => {
                        if (v != null && v !== '') {
                            allDiameterValues.add(String(v))
                        }
                    })
                })
                if (allDiameterValues.size > 0) {
                    const diameterArray = Array.from(allDiameterValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using diameter options from astigmatism configs:', diameterArray)
                    }
                    return diameterArray
                }
            }
        }

        // For spherical forms or fallback, use subSubcategoryOptions
        return subSubcategoryOptions?.diameterOptions || []
    }, [contactLensFormConfig?.formType, astigmatismConfigs, subSubcategoryOptions, isAstigmatismSubSubcategory])

    // Generate quantity options from astigmatism configs
    const quantityOptions = useMemo(() => {
        const formType = contactLensFormConfig?.formType || (isAstigmatismSubSubcategory ? 'astigmatism' : 'spherical')

        // For astigmatism forms, use astigmatism configs
        if (formType === 'astigmatism') {
            if (astigmatismConfigs.length > 0) {
                const allQtyValues = new Set<string>()
                astigmatismConfigs.forEach(config => {
                    const rightQty = (config.right_qty && Array.isArray(config.right_qty)) ? config.right_qty : []
                    const leftQty = (config.left_qty && Array.isArray(config.left_qty)) ? config.left_qty : []
                    rightQty.forEach(v => {
                        if (v != null && v !== '') {
                            allQtyValues.add(String(v))
                        }
                    })
                    leftQty.forEach(v => {
                        if (v != null && v !== '') {
                            allQtyValues.add(String(v))
                        }
                    })
                })
                if (allQtyValues.size > 0) {
                    const qtyArray = Array.from(allQtyValues).sort((a, b) => {
                        const numA = parseFloat(a)
                        const numB = parseFloat(b)
                        if (!isNaN(numA) && !isNaN(numB)) {
                            return numA - numB
                        }
                        return a.localeCompare(b)
                    })
                    if (import.meta.env.DEV) {
                        console.log('✅ Using quantity options from astigmatism configs:', qtyArray)
                    }
                    return qtyArray
                }
            }
        }

        // For spherical forms or fallback, return empty array (qty is number input)
        return []
    }, [contactLensFormConfig?.formType, astigmatismConfigs, isAstigmatismSubSubcategory])

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
        // Example: Unit 30 pack = €9.00 → Total = €9.00 (regardless of qty)
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

        // Contact lenses are configuration-based, not inventory-based
        // They should check if configurations are available AND if stock is available
        if (isContactLens) {
            // For contact lenses, don't show as out of stock just because configs are missing
            // Allow users to see the form and enter values even without predefined configs
            // Only show as out of stock if stock status is explicitly 'out_of_stock' or stock quantity is 0
            
            const stockQty = product.stock_quantity
            const stockStatus = (product as any).stock_status
            
            // If stock status is explicitly 'out_of_stock', show as out of stock
            if (stockStatus === 'out_of_stock') {
                return true
            }
            
            // If stock quantity is explicitly 0 (not undefined), show as out of stock
            // But if stock_quantity is undefined/null, assume it's available (made-to-order)
            if (stockQty !== undefined && stockQty !== null && stockQty <= 0) {
                return true
            }
            
            // Otherwise, consider it in stock (contact lenses are typically made-to-order)
            return false
        }

        // For non-contact-lens products, check stock quantity and status
        const stockQty = product.stock_quantity
        const stockStatus = (product as any).stock_status
        
        // If product has explicit stock quantity > 0, consider it in stock
        if (stockQty !== undefined && stockQty > 0) {
            return false
        }
        
        // If stock_status is explicitly 'in_stock', consider it in stock
        if (stockStatus === 'in_stock') {
            return false
        }

        // Check if product has variants (for Eye Hygiene products with sizeVolumeVariants)
        const p = product as any
        const variantsArray = fetchedVariants.length > 0
            ? fetchedVariants
            : (p.sizeVolumeVariants || p.size_volume_variants || [])
        const hasVariants = variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0

        // If product has variants, check the selected variant's stock
        if (hasVariants && selectedSizeVolumeVariant) {
            const variantStockStatus = selectedSizeVolumeVariant.stock_status
            const variantStockQty = selectedSizeVolumeVariant.stock_quantity
            
            return variantStockStatus === 'out_of_stock' ||
                (variantStockStatus !== 'in_stock' && variantStockQty !== undefined && variantStockQty <= 0) ||
                (variantStockStatus === undefined && variantStockQty !== undefined && variantStockQty <= 0)
        }

        // If product has variants but no variant is selected yet, check if any variant is in stock
        if (hasVariants && !selectedSizeVolumeVariant) {
            // Check if at least one variant is in stock
            const hasInStockVariant = variantsArray.some((variant: any) => {
                const variantStockStatus = variant.stock_status
                const variantStockQty = variant.stock_quantity
                return variantStockStatus === 'in_stock' && variantStockQty > 0
            })
            // If no variant is in stock, show as out of stock
            return !hasInStockVariant
        }

        // Original logic for non-contact-lens products without variants (glasses, etc.)

        // Fix for Eye Hygiene products showing "Out of Stock" incorrectly
        if (isEyeHygiene && !hasVariants) {
            // If it's eye hygiene without variants, only show out of stock if stock_status is explicitly 'out_of_stock'
            // or if stock_quantity is explicitly 0
            if (stockStatus === 'out_of_stock') return true
            if (stockQty !== undefined && stockQty <= 0) return true
            return false
        }

        return stockStatus === 'out_of_stock' ||
            (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
            (stockStatus === undefined && product.in_stock === false) ||
            (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
    }, [product, isContactLens, contactLensFormConfig, sphericalConfigs, astigmatismConfigs, fetchedVariants, selectedSizeVolumeVariant, isEyeHygiene])

    // Debug: Log when selected variant changes (for development)
    useEffect(() => {
        if (import.meta.env.DEV && selectedSizeVolumeVariant && isEyeHygiene) {
            console.log('🔄 [Eye Hygiene] Variant changed:', {
                variantId: selectedSizeVolumeVariant.id,
                sizeVolume: selectedSizeVolumeVariant.size_volume,
                packType: selectedSizeVolumeVariant.pack_type,
                price: selectedSizeVolumeVariant.price,
                hasImages: !!((selectedSizeVolumeVariant as any).images && (selectedSizeVolumeVariant as any).images.length > 0),
                imageCount: (selectedSizeVolumeVariant as any).images?.length || 0,
                hasImageUrl: !!selectedSizeVolumeVariant.image_url,
                imageUrl: selectedSizeVolumeVariant.image_url
            })
        }
    }, [selectedSizeVolumeVariant, isEyeHygiene])

    // Debug: Log when image index changes (for development)
    useEffect(() => {
        if (import.meta.env.DEV && isEyeHygiene && selectedSizeVolumeVariant) {
            console.log('🔄 [Eye Hygiene] Image index changed:', {
                imageIndex: selectedImageIndex,
                variantId: selectedSizeVolumeVariant.id,
                sizeVolume: selectedSizeVolumeVariant.size_volume
            })
        }
    }, [selectedImageIndex, isEyeHygiene, selectedSizeVolumeVariant])

    // Handler for caliber change
    const handleCaliberChange = (mm: number | string) => {
        const mmStr = mm.toString();
        const matchingCaliber = productCalibers.find(c => c.mm.toString() === mmStr)
        if (matchingCaliber) {
            setSelectedCaliber(matchingCaliber)
            // Don't reset image index - let user continue viewing their selected image
            // Only show caliber image when user explicitly wants to see it
            setIsManuallySelectingImage(false) // Reset manual selection flag
            console.log('[ProductDetail] Caliber changed to:', matchingCaliber);
        } else {
            setSelectedCaliber(null)
            // Don't reset image index when clearing caliber selection
            setIsManuallySelectingImage(false) // Reset manual selection flag
            console.log('[ProductDetail] No matching caliber found for:', mm);
        }
    }

    // Handler for eye hygiene variant change
    const handleEyeHygieneVariantChange = (variantId: number) => {
        const matchingVariant = productEyeHygieneVariants.find(v => v.id === variantId)
        if (matchingVariant) {
            setSelectedEyeHygieneVariant(matchingVariant)
            setSelectedImageIndex(0) // Reset image index to show variant's image
            setIsManuallySelectingImage(false) // Reset manual selection flag
        } else {
            setSelectedEyeHygieneVariant(null)
            setSelectedImageIndex(0) // Reset image index
            setIsManuallySelectingImage(false) // Reset manual selection flag
        }
    }

    // Don't automatically reset image index when caliber changes
    // User should be able to see product image first and only see caliber image when explicitly selected

    // Reset image index when eye hygiene variant changes to show variant-specific image
    useEffect(() => {
        if (selectedEyeHygieneVariant) {
            setSelectedImageIndex(0)
        }
    }, [selectedEyeHygieneVariant])

    // Helper function to get the variant-specific image URL (supports color, unit, ML variants, caliber, and eye hygiene variants)
    const getVariantSpecificImageUrl = (product: Product, imageIndex: number = 0): string => {
        // Priority 1: Use unit-specific images if available
        if (unitImages.length > 0 && imageIndex < unitImages.length) {
            return unitImages[imageIndex]
        }

        // Priority 2: Use regular product images FIRST - only use caliber/variant images if user has explicitly selected them
        // Check if user has manually made a selection (either by clicking thumbnails or selecting variants)
        if (!isManuallySelectingImage && !selectedCaliber && !selectedEyeHygieneVariant) {
            // No manual selection and no variant selected - use regular product images
            return getProductImageUrl(product, imageIndex)
        }

        // Priority 3: Use caliber-specific images ONLY if caliber is explicitly selected by user
        if (selectedCaliber && selectedCaliber.image_url) {
            console.log('[ProductDetail] Using caliber image (user selected):', {
                caliber_mm: selectedCaliber.mm,
                image_url: selectedCaliber.image_url,
                is_product_image: selectedCaliber.image_url.includes('uploads/products'),
                is_fallback: selectedCaliber.image_url.includes('frame') || selectedCaliber.image_url.includes('rayban-4926'),
                main_images: product.images
            });
            
            return selectedCaliber.image_url;
        }

        // Priority 3: Use eye hygiene variant-specific images if variant is selected
        if (selectedEyeHygieneVariant) {
            let variantImageUrl = selectedEyeHygieneVariant.image_url || selectedEyeHygieneVariant.image || '';
            
            console.log('[ProductDetail] Eye hygiene variant image processing:', {
                variant_id: selectedEyeHygieneVariant.id,
                variant_name: selectedEyeHygieneVariant.name,
                image_url: selectedEyeHygieneVariant.image_url,
                image: selectedEyeHygieneVariant.image,
                is_blob: variantImageUrl?.startsWith('blob:'),
                is_3d_glasses: variantImageUrl?.includes('3d-glasses.png')
            });
            
            // Handle blob URLs and problematic images
            if (variantImageUrl && !variantImageUrl.startsWith('blob:') && !variantImageUrl.includes('3d-glasses.png')) {
                return variantImageUrl;
            } else {
                // Use fallback for eye hygiene variants
                console.log('[ProductDetail] Using fallback for eye hygiene variant image');
                return '/assets/images/frame1.png';
            }
        }

        // Priority 4: Use eye hygiene size/volume variant-specific images if variant is selected
        if (isEyeHygiene && selectedSizeVolumeVariant) {
            return getVariantImageUrl(product, selectedSizeVolumeVariant as any, imageIndex)
        }

        // Priority 5: Use color-specific images if color is selected
        if (selectedColor) {
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
        }

        // Priority 6: Check if product has multiple images in the images array and use the index
        if (product.images) {
            let imagesArray: string[] = []
            if (typeof product.images === 'string') {
                try {
                    imagesArray = JSON.parse(product.images)
                } catch (e) {
                    imagesArray = [product.images]
                }
            } else if (Array.isArray(product.images)) {
                imagesArray = product.images
            }
            
            // If we have multiple images and the index is valid, use the indexed image
            if (imagesArray.length > 0 && imageIndex < imagesArray.length) {
                return imagesArray[imageIndex]
            }
        }

        // Fallback to regular product image
        return getProductImageUrl(product, imageIndex)
    }

    // Helper function to get the color-specific image URL (with unit images support) - DEPRECATED, use getVariantSpecificImageUrl
    const getColorSpecificImageUrl = (product: Product, imageIndex: number = 0): string => {
        return getVariantSpecificImageUrl(product, imageIndex)
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
        // Enforce Login: Redirect to login if not authenticated
        if (!isAuthenticated) {
            const currentPath = location.pathname + location.search
            navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)
            return
        }

        if (!product) return

        // Check if product has variants (new approach) - prioritize fetched variants, then check product object
        const p = product as any
        const variantsArray = fetchedVariants.length > 0
            ? fetchedVariants
            : (p.sizeVolumeVariants || p.size_volume_variants || [])
        const hasVariants = variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0

        // Validate Eye Hygiene form if it's an Eye Hygiene product
        if (isEyeHygiene) {
            if (hasVariants) {
                // Variant-based validation
                if (!selectedSizeVolumeVariant) {
                    alert('Please select a Capacity option')
                    return
                }
                if (selectedSizeVolumeVariant.stock_status !== 'in_stock' || selectedSizeVolumeVariant.stock_quantity <= 0) {
                    alert('Selected variant is out of stock')
                    return
                }
            } else {
                // Legacy form-based validation (for products without variants)
                if (eyeHygieneOptions.size_volume.length > 0 && !eyeHygieneFormData.size_volume) {
                    alert('Please select Capacity')
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
        }

        try {
            // Convert API product to cart-compatible format
            // Determine quantity and stock based on variant or legacy form
            const productQuantity = hasVariants && selectedSizeVolumeVariant ? quantity : (isEyeHygiene ? eyeHygieneFormData.quantity : quantity)
            const productInStock = hasVariants && selectedSizeVolumeVariant
                ? (selectedSizeVolumeVariant.stock_status === 'in_stock' && selectedSizeVolumeVariant.stock_quantity > 0)
                : (product.in_stock || false)

            const cartProduct = {
                id: product.id || 0,
                name: product.name || '',
                brand: product.brand || '',
                category: product.category?.slug || 'eyeglasses',
                price: displayPrice || 0,
                image: getVariantSpecificImageUrl(product, selectedImageIndex), // Use variant-specific image (supports caliber images)
                description: product.description || '',
                inStock: productInStock,
                rating: product.rating ? Number(product.rating) : undefined,
                quantity: productQuantity,
                frame_material: selectedFrameMaterial || undefined, // Include selected frame material (single)
                lens_type: selectedLensType || undefined, // Include selected lens type (single)
                selectedColor: selectedColor || undefined, // Store selected color for reference
                // Eye Hygiene specific fields (legacy - for backward compatibility)
                ...(isEyeHygiene && !hasVariants && {
                    size_volume: eyeHygieneFormData.size_volume || undefined,
                    pack_type: eyeHygieneFormData.pack_type || undefined
                }),
                // Variant-specific fields (new)
                ...(hasVariants && selectedSizeVolumeVariant && {
                    size_volume: selectedSizeVolumeVariant.size_volume,
                    pack_type: selectedSizeVolumeVariant.pack_type || undefined,
                    size_volume_variant_id: selectedSizeVolumeVariant.id
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
                    quantity: productQuantity,
                    selected_color: colorValue || undefined, // Pass color value (hex code) for variant matching
                    selected_mm_caliber: selectedCaliber?.toString() || undefined, // Pass selected MM caliber
                    size_volume_variant_id: hasVariants && selectedSizeVolumeVariant ? selectedSizeVolumeVariant.id : undefined, // Variant ID for Eye Hygiene products
                    eye_hygiene_variant_id: selectedEyeHygieneVariant?.id || undefined, // Eye hygiene variant ID
                    customization: {
                        frame_material: cartProduct.frame_material,
                        color: colorValue || undefined,
                        // Store caliber selection in customization
                        ...(selectedCaliber && {
                            selected_mm_caliber: selectedCaliber.toString(),
                            caliber_image_url: productCalibers.find(c => c.mm.toString() === selectedCaliber.toString())?.image_url
                        }),
                        // Store color variant details if available
                        ...(selectedColorVariant ? {
                            color_name: (selectedColorVariant as any).name || (selectedColorVariant as any).color,
                            color_display_name: (selectedColorVariant as any).display_name || (selectedColorVariant as any).name || (selectedColorVariant as any).color,
                            variant_price: (selectedColorVariant as any).price,
                            variant_images: (selectedColorVariant as any).images || []
                        } : {}),
                        // Store eye hygiene variant details if available
                        ...(selectedEyeHygieneVariant && {
                            eye_hygiene_variant_id: selectedEyeHygieneVariant.id,
                            eye_hygiene_variant_name: selectedEyeHygieneVariant.name,
                            eye_hygiene_variant_price: selectedEyeHygieneVariant.price,
                            eye_hygiene_variant_image_url: selectedEyeHygieneVariant.image_url
                        }),
                        // Eye Hygiene specific customization (legacy - for backward compatibility)
                        ...(isEyeHygiene && !hasVariants && {
                            size_volume: eyeHygieneFormData.size_volume || undefined,
                            pack_type: eyeHygieneFormData.pack_type || undefined
                        }),
                        // Variant-specific customization (new)
                        ...(hasVariants && selectedSizeVolumeVariant && {
                            size_volume: selectedSizeVolumeVariant.size_volume,
                            pack_type: selectedSizeVolumeVariant.pack_type || undefined,
                            size_volume_variant_id: selectedSizeVolumeVariant.id
                        })
                    },
                    lens_type: selectedLensType === '' ? undefined : selectedLensType
                }

                // Try to add to cart via API, but don't block local cart if it fails
                addItemToCart(cartRequest).then(result => {
                    if (!result.success) {
                        console.error('Failed to add to cart via API:', result.message)
                        // Still add to local cart as fallback
                    }
                }).catch(err => {
                    console.error('API cart error:', err)
                    // Still add to local cart as fallback
                })
            }

            // Always add to local cart context
            for (let i = 0; i < productQuantity; i++) {
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
        // Enforce Login: Redirect to login if not authenticated
        if (!isAuthenticated) {
            const currentPath = location.pathname + location.search
            // Use encodeURIComponent to ensure the URL is safe
            navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)
            return
        }

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
                    // calculateContactLensTotal returns the price per unit/pack
                    // We need to multiply by the total number of units (right + left)

                    // Use our calculated price which properly accounts for unit/box/pack selection
                    // The API might not know about the unit type, so we use our local calculation
                    // which uses getUnitPrice() to get the correct price for unit/box/pack
                    // Fix: Multiply unit price by total quantity
                    // calculateContactLensTotal returns the price *per unit/pack*
                    // We need to multiply by the total number of units (right + left)
                    const totalQty = contactLensFormData.right_qty + contactLensFormData.left_qty
                    const unitPriceToUse = calculateContactLensTotal > 0 ? calculateContactLensTotal : apiUnitPrice
                    const finalPrice = unitPriceToUse * totalQty

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
                    // Handle structured error response from improved service
                    const errorMessage = result?.message || 'Failed to add contact lens to cart. Please try again.'
                    
                    // Log detailed error for debugging (but only in development)
                    if (import.meta.env.DEV) {
                        console.error('❌ Failed to add contact lens to cart:', {
                            result,
                            hasSuccess: result?.success,
                            hasData: !!result?.data,
                            hasItem: !!result?.data?.item,
                            errorMessage
                        })
                    }
                    
                    // Provide user-friendly error messages
                    if (errorMessage.includes('Insufficient stock') || errorMessage.includes('Out of stock')) {
                        alert('This product is currently out of stock or the requested quantity exceeds available stock. Please try a smaller quantity or contact customer service.')
                    } else if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
                        alert('You need to be logged in to add contact lenses to cart. Please log in and try again.')
                    } else if (errorMessage.includes('Network') || errorMessage.includes('connection')) {
                        alert('Network error occurred. Please check your internet connection and try again.')
                    } else {
                        alert(errorMessage)
                    }
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

            {/* DEBUG SECTION - TEMPORARY */}
            {import.meta.env.DEV && (
                <div className="bg-yellow-50 border-2 border-yellow-300 p-4 m-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🔍 DEBUG INFO - Calibers</h3>
                    <div className="text-sm space-y-1">
                        <p><strong>Product ID:</strong> {product?.id}</p>
                        <p><strong>Product Name:</strong> {product?.name}</p>
                        <p><strong>Product Type:</strong> {(product as any)?.product_type}</p>
                        <p><strong>Calibers Count:</strong> {productCalibers.length}</p>
                        <p><strong>shouldShowCalibers:</strong> {shouldShowCalibers ? 'TRUE' : 'FALSE'}</p>
                        <p><strong>isEyeHygiene:</strong> {isEyeHygiene ? 'TRUE' : 'FALSE'}</p>
                        <p><strong>isContactLens:</strong> {isContactLens ? 'TRUE' : 'FALSE'}</p>
                        <p><strong>Selected Caliber:</strong> {selectedCaliber ? `${selectedCaliber.mm}mm` : 'None'}</p>
                        <details className="mt-2">
                            <summary className="cursor-pointer font-semibold">Raw mm_calibers data:</summary>
                            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {JSON.stringify((product as any)?.mm_calibers, null, 2)}
                            </pre>
                        </details>
                        <details className="mt-2">
                            <summary className="cursor-pointer font-semibold">Processed calibers:</summary>
                            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {JSON.stringify(productCalibers, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            )}

            
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
                                                    // Fallback to variant-specific image (includes size/volume variant images)
                                                    productImage = getVariantSpecificImageUrl(product, selectedImageIndex)
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
                                            {isProductOutOfStock && (
                                                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-20 border-2 border-white">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        {isContactLens ? 'Configurations Unavailable' : t('shop.outOfStock')}
                                                    </div>
                                                </div>
                                            )}
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
                                                                        - €{displayUnitPrice.toFixed(2)} per pack
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                        <div className="flex items-baseline gap-3">
                                                            {calculateContactLensTotal > 0 ? (
                                                                <>
                                                                    <p className="text-3xl font-bold text-blue-950">
                                                                        €{calculateContactLensTotal.toFixed(2)}
                                                                    </p>
                                                                    {displayUnitPrice !== null && selectedUnit && (
                                                                        <p className="text-sm text-gray-500">
                                                                            (Pack Size: Unit {selectedUnit} - €{displayUnitPrice.toFixed(2)})
                                                                        </p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {salePriceNum && regularPriceNum && salePriceNum < regularPriceNum ? (
                                                                        <>
                                                                            <p className="text-3xl font-bold text-blue-950">
                                                                                €{displayUnitPrice !== null ? displayUnitPrice.toFixed(2) : (salePriceNum || 0).toFixed(2)}
                                                                            </p>
                                                                            <p className="text-xl text-gray-400 line-through">
                                                                                €{(regularPriceNum || 0).toFixed(2)}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-3xl font-bold text-blue-950">
                                                                            €{displayUnitPrice !== null ? displayUnitPrice.toFixed(2) : (regularPriceNum || 0).toFixed(2)}
                                                                        </p>
                                                                    )}
                                                                    {displayUnitPrice !== null && selectedUnit && (
                                                                        <p className="text-sm text-gray-500">
                                                                            (Pack Size: Unit {selectedUnit} - €{displayUnitPrice.toFixed(2)} per pack)
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
                                            {isProductOutOfStock && (
                                                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-20 border-2 border-white">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        {isContactLens ? 'Configurations Unavailable' : 'Out of Stock'}
                                                    </div>
                                                </div>
                                            )}
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
                                                    <label className="block text-sm font-semibold text-blue-950 mb-2">
                                                        {t('shop.selectColor', 'Select Color')}
                                                    </label>
                                                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
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
                                                                        setIsManuallySelectingImage(false) // Reset manual selection flag

                                                                        // Update URL without page reload
                                                                        const url = new URL(window.location.href)
                                                                        url.searchParams.set('color', colorValue)
                                                                        window.history.pushState({}, '', url)
                                                                    }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 flex-shrink-0 ${isSelected
                                                                        ? 'border-blue-950 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-950/20'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                                                        }`}
                                                                    title={displayName}
                                                                >
                                                                    {/* Color Swatch */}
                                                                    <span
                                                                        className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-inner"
                                                                        style={{ backgroundColor: hexCode }}
                                                                    />
                                                                    <span className="text-xs font-semibold capitalize whitespace-nowrap">
                                                                        {displayName}
                                                                    </span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* MM Caliber Selection - Dropdown */}
                                        {shouldShowCalibers && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-blue-950 mb-2">
                                                    {t('shop.selectCaliber', 'Select Size (MM)')}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedCaliber?.mm?.toString() || ''}
                                                        onChange={(e) => {
                                                            const mmValue = e.target.value;
                                                            if (mmValue) {
                                                                handleCaliberChange(mmValue);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                                                    >
                                                        <option value="" disabled>
                                                            Select frame size...
                                                        </option>
                                                        {productCalibers
                                                            .filter(c => c.is_active !== false)
                                                            .sort((a, b) => Number(a.mm) - Number(b.mm))
                                                            .map((caliber) => (
                                                                <option 
                                                                    key={caliber.mm} 
                                                                    value={caliber.mm.toString()}
                                                                >
                                                                    {caliber.mm}mm{caliber.price ? ` (+$${caliber.price})` : ''}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {selectedCaliber && (
                                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                                        Selected: {selectedCaliber.mm}mm frame size
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Eye Hygiene Variants Selection */}
                                        {productEyeHygieneVariants.length > 0 && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-blue-950 mb-2">
                                                    {t('shop.selectVariant', 'Select Variant')}
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {productEyeHygieneVariants.map((variant: EyeHygieneVariant) => {
                                                        const isSelected = selectedEyeHygieneVariant?.id === variant.id

                                                        return (
                                                            <button
                                                                key={variant.id}
                                                                onClick={() => handleEyeHygieneVariantChange(variant.id)}
                                                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                                                    isSelected
                                                                        ? 'border-blue-950 bg-blue-50 text-blue-950 shadow-sm ring-2 ring-blue-950/20'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:shadow-sm'
                                                                    }`}
                                                            >
                                                                {/* Variant Image */}
                                                                {variant.image_url && (
                                                                    <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 mb-3">
                                                                        <img
                                                                            src={variant.image_url}
                                                                            alt={variant.name}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement
                                                                                target.style.display = 'none'
                                                                                const fallback = target.nextElementSibling as HTMLElement
                                                                                if (fallback) fallback.style.display = 'flex'
                                                                            }}
                                                                        />
                                                                        <div className="w-full h-full items-center justify-center text-gray-400" style={{ display: 'none' }}>
                                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Variant Info */}
                                                                <div className="space-y-2">
                                                                    <h4 className="font-semibold text-sm leading-tight">{variant.name}</h4>
                                                                    {variant.description && (
                                                                        <p className="text-xs text-gray-600 line-clamp-2">{variant.description}</p>
                                                                    )}
                                                                    
                                                                    {/* Eye Hygiene Specific Details */}
                                                                    <div className="text-xs space-y-1">
                                                                        {variant.size_volume && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Size:</span>
                                                                                <span className="font-medium text-gray-900">{variant.size_volume}</span>
                                                                            </div>
                                                                        )}
                                                                        {variant.pack_type && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Pack:</span>
                                                                                <span className="font-medium text-gray-900">{variant.pack_type}</span>
                                                                            </div>
                                                                        )}
                                                                        {variant.expiry_date && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Expires:</span>
                                                                                <span className="font-medium text-gray-900">
                                                                                    {new Date(variant.expiry_date).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Stock:</span>
                                                                            <span className={`font-medium ${
                                                                                variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                                            }`}>
                                                                                {variant.stock_quantity} available
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                                        <p className="font-bold text-base">€{variant.price.toFixed(2)}</p>
                                                                        {variant.compare_at_price && variant.compare_at_price > variant.price && (
                                                                            <span className="text-xs text-green-600 font-medium">
                                                                                Save €{(variant.compare_at_price - variant.price).toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Selected Badge */}
                                                                {isSelected && (
                                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-950 text-white rounded-full flex items-center justify-center">
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

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
                                                <div className="flex flex-col gap-2">
                                                    {imagesArray.map((image, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSelectedImageIndex(index)
                                                            setIsManuallySelectingImage(true) // User is manually selecting
                                                        }}
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
                                                                        setIsManuallySelectingImage(false) // Reset manual selection flag
                                                                    }
                                                                }}
                                                                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${isSelected
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
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
                                        {/* Right Eye Section */}
                                        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 shadow-sm transition-all h-full w-full ${rightEyeEnabled ? 'border-blue-100' : 'border-gray-200 opacity-50'
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
                                                {/* Qty Dropdown or Number Input - Full Width */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                        Quantity (Qty)
                                                    </label>
                                                    {quantityOptions.length > 0 ? (
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.right_qty || 1}
                                                                onChange={(e) => {
                                                                    const selectedValue = parseInt(e.target.value) || 1
                                                                    handleContactLensFieldChange('right_qty', selectedValue)
                                                                }}
                                                                disabled={!rightEyeEnabled}
                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm appearance-none cursor-pointer ${contactLensErrors.right_qty ? 'border-red-500' : 'border-gray-300'
                                                                    } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="1">1</option>
                                                                {quantityOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()}>{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-2 bottom-2 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ) : (
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
                                                    )}
                                                    {contactLensErrors.right_qty && (
                                                        <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.right_qty}</p>
                                                    )}
                                                </div>

                                                {/* Base Curve and Diameter - Grouped Together (Dropdown Selections) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                            Base Curve (B.C)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.right_base_curve || '00.00'}
                                                                onChange={(e) => handleContactLensFieldChange('right_base_curve', e.target.value)}
                                                                disabled={!rightEyeEnabled}
                                                                className={`w-full px-2 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-base ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-200'}`}
                                                            >
                                                                <option value="00.00" className="text-gray-900">--</option>
                                                                {baseCurveOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()} className="text-gray-900">{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                            Diameter (DIA)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.right_diameter || '00.00'}
                                                                onChange={(e) => handleContactLensFieldChange('right_diameter', e.target.value)}
                                                                disabled={!rightEyeEnabled}
                                                                className={`w-full px-2 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-base ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-200'}`}
                                                            >
                                                                <option value="00.00" className="text-gray-900">--</option>
                                                                {diameterOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()} className="text-gray-900">{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
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
                                                            <label className="block text-xs text-gray-500 mb-3">
                                                                * Power (PWR)
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={contactLensFormData.right_power || '00.00'}
                                                                    onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                    disabled={!rightEyeEnabled}
                                                                    className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-sm ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-200'
                                                                        } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="00.00">00.00 (Power)</option>
                                                                    {powerOptions.map((v) => (
                                                                        <option key={v} value={v.toString()}>{v}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-2 bottom-2 pointer-events-none opacity-40">
                                                                    <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            {contactLensErrors.right_power && (
                                                                <p className="mt-2 text-xs text-red-600 font-medium">{contactLensErrors.right_power}</p>
                                                            )}
                                                        </div>
                                                    )
                                                } else if (formType === 'astigmatism') {
                                                    return (
                                                        <div className={`mt-4 ${!rightEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                            {/* Labels Row */}
                                                            <div className="grid grid-cols-3 gap-2 mb-1 text-center">
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">SPH</label>
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">CYL</label>
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">AXIS</label>
                                                            </div>

                                                            {/* Inputs Row */}
                                                            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                                                {/* SPH (Power) */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.right_power || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('right_power', e.target.value)}
                                                                        disabled={!rightEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-sm ${contactLensErrors.right_power ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {powerOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>

                                                                {/* CYL (Cylinder) */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.right_cylinder || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('right_cylinder', e.target.value)}
                                                                        disabled={!rightEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-sm ${contactLensErrors.right_cylinder ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {cylinderOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>

                                                                {/* AXIS */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.right_axis || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('right_axis', e.target.value)}
                                                                        disabled={!rightEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-blue-700 appearance-none cursor-pointer text-sm ${contactLensErrors.right_axis ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!rightEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {axisOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Error Messages */}
                                                            {(contactLensErrors.right_power || contactLensErrors.right_cylinder || contactLensErrors.right_axis) && (
                                                                <div className="mt-2 text-center text-xs text-red-600 font-medium">
                                                                    {contactLensErrors.right_power && <p>{contactLensErrors.right_power}</p>}
                                                                    {(contactLensErrors.right_cylinder || contactLensErrors.right_axis) && <p>Please select CYL and AXIS</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }

                                                return null
                                            })()}
                                        </div>

                                        {/* Left Eye Section */}
                                        <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border-2 shadow-sm transition-all h-full w-full ${leftEyeEnabled ? 'border-purple-100' : 'border-gray-200 opacity-50'
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
                                                {/* Qty Dropdown or Number Input - Full Width */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                        Quantity (Qty)
                                                    </label>
                                                    {quantityOptions.length > 0 ? (
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.left_qty || 1}
                                                                onChange={(e) => {
                                                                    const selectedValue = parseInt(e.target.value) || 1
                                                                    handleContactLensFieldChange('left_qty', selectedValue)
                                                                }}
                                                                disabled={!leftEyeEnabled}
                                                                className={`w-full px-3 py-2 border-2 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm appearance-none cursor-pointer ${contactLensErrors.left_qty ? 'border-red-500' : 'border-gray-300'
                                                                    } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="1">1</option>
                                                                {quantityOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()}>{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-2 bottom-2 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ) : (
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
                                                    )}
                                                    {contactLensErrors.left_qty && (
                                                        <p className="mt-1 text-xs text-red-600 font-medium">{contactLensErrors.left_qty}</p>
                                                    )}
                                                </div>

                                                {/* Base Curve and Diameter - Grouped Together (Dropdown Selections) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                            Base Curve (B.C)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.left_base_curve || '00.00'}
                                                                onChange={(e) => handleContactLensFieldChange('left_base_curve', e.target.value)}
                                                                disabled={!leftEyeEnabled}
                                                                className={`w-full px-2 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-base ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-200'}`}
                                                            >
                                                                <option value="00.00" className="text-gray-900">--</option>
                                                                {baseCurveOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()} className="text-gray-900">{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                            Diameter (DIA)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={contactLensFormData.left_diameter || '00.00'}
                                                                onChange={(e) => handleContactLensFieldChange('left_diameter', e.target.value)}
                                                                disabled={!leftEyeEnabled}
                                                                className={`w-full px-2 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-base ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-200'}`}
                                                            >
                                                                <option value="00.00" className="text-gray-900">--</option>
                                                                {diameterOptions.map((v: string) => (
                                                                    <option key={v} value={v.toString()} className="text-gray-900">{v}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
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
                                                            <label className="block text-xs text-gray-500 mb-3">
                                                                * Power (PWR)
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={contactLensFormData.left_power || '00.00'}
                                                                    onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                    disabled={!leftEyeEnabled}
                                                                    className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-sm ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-200'
                                                                        } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="00.00">00.00 (Power)</option>
                                                                    {powerOptions.map((v) => (
                                                                        <option key={v} value={v.toString()}>{v}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-2 bottom-2 pointer-events-none opacity-40">
                                                                    <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            {contactLensErrors.left_power && (
                                                                <p className="mt-2 text-xs text-red-600 font-medium">{contactLensErrors.left_power}</p>
                                                            )}
                                                        </div>
                                                    )
                                                } else if (formType === 'astigmatism') {
                                                    return (
                                                        <div className={`mt-4 ${!leftEyeEnabled ? 'pointer-events-none' : ''}`}>
                                                            {/* Labels Row */}
                                                            <div className="grid grid-cols-3 gap-2 mb-1 text-center">
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">SPH</label>
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">CYL</label>
                                                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">AXIS</label>
                                                            </div>

                                                            {/* Inputs Row */}
                                                            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                                                {/* SPH (Power) */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.left_power || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('left_power', e.target.value)}
                                                                        disabled={!leftEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-sm ${contactLensErrors.left_power ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {powerOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>

                                                                {/* CYL (Cylinder) */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.left_cylinder || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('left_cylinder', e.target.value)}
                                                                        disabled={!leftEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-sm ${contactLensErrors.left_cylinder ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {cylinderOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>

                                                                {/* AXIS */}
                                                                <div className="relative">
                                                                    <select
                                                                        value={contactLensFormData.left_axis || '00.00'}
                                                                        onChange={(e) => handleContactLensFieldChange('left_axis', e.target.value)}
                                                                        disabled={!leftEyeEnabled}
                                                                        className={`w-full px-1 py-3 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-left font-bold text-purple-700 appearance-none cursor-pointer text-sm ${contactLensErrors.left_axis ? 'border-red-500' : 'border-gray-200'
                                                                            } ${!leftEyeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="00.00" className="text-gray-400">--</option>
                                                                        {axisOptions.map((v) => (
                                                                            <option key={v} value={v.toString()}>{v}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-1 bottom-1 pointer-events-none opacity-40">
                                                                        <svg className="w-2.5 h-2.5 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Error Messages */}
                                                            {(contactLensErrors.left_power || contactLensErrors.left_cylinder || contactLensErrors.left_axis) && (
                                                                <div className="mt-2 text-center text-xs text-red-600 font-medium">
                                                                    {contactLensErrors.left_power && <p>{contactLensErrors.left_power}</p>}
                                                                    {(contactLensErrors.left_cylinder || contactLensErrors.left_axis) && <p>Please select CYL and AXIS</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }

                                                return null
                                            })()}
                                        </div>
                                    </div>

                                    {/* Copy Right to Left Button */}
                                    <div className="mt-6 mb-6 px-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContactLensFormData(prev => ({
                                                    ...prev,
                                                    left_qty: prev.right_qty,
                                                    left_base_curve: prev.right_base_curve,
                                                    left_diameter: prev.right_diameter,
                                                    left_power: prev.right_power,
                                                    left_cylinder: prev.right_cylinder,
                                                    left_axis: prev.right_axis
                                                }))
                                                setLeftEyeEnabled(rightEyeEnabled)
                                            }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-blue-500/20"
                                            title="Copy Right Eye settings to Left Eye"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                            Copy Right to Left
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
                                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                                                        <button
                                                            onClick={() => setShowAxisGuide(!showAxisGuide)}
                                                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                                                            type="button"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="text-left">
                                                                    <h4 className="text-base font-bold text-gray-900">Axis Measurement Guide</h4>
                                                                    <p className="text-xs text-gray-500 mt-0.5">For Customer Support</p>
                                                                </div>
                                                            </div>
                                                            <svg
                                                                className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${showAxisGuide ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>

                                                        {showAxisGuide && (
                                                            <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                                                                <div className="mt-4 flex justify-center">
                                                                    <EyeAxisDiagram 
                                                                        compact={true} 
                                                                        rightEyeAxis={contactLensFormData.right_axis ? parseInt(contactLensFormData.right_axis) : 0}
                                                                        leftEyeAxis={contactLensFormData.left_axis ? parseInt(contactLensFormData.left_axis) : 0}
                                                                        onRightEyeAxisChange={(value) => {
                                                                            setContactLensFormData(prev => ({ ...prev, right_axis: value.toString() }))
                                                                        }}
                                                                        onLeftEyeAxisChange={(value) => {
                                                                            setContactLensFormData(prev => ({ ...prev, left_axis: value.toString() }))
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}

                                    {/* Stock Quantity Display for Contact Lenses */}
                                    {product.stock_quantity !== undefined && product.stock_quantity !== null && product.stock_quantity > 0 && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-green-700 font-semibold">
                                                    {product.stock_quantity} items available
                                                </span>
                                            </div>
                                        </div>
                                    )}

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
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Product Images (Left Column) */}
                            <div>
                                {(() => {
                                    // Get all images for the selected color/fallback
                                    let imagesArray: string[] = []
                                    const p = product as any

                                    // First priority: Use unit-specific images
                                    if (unitImages.length > 0) {
                                        imagesArray = unitImages
                                    } else {
                                        // For eye hygiene products with variants, use variant-specific images
                                        if (isEyeHygiene && selectedSizeVolumeVariant) {
                                            // Check if variant has multiple images (legacy support)
                                            const variantImages = (selectedSizeVolumeVariant as any).images
                                            if (variantImages && Array.isArray(variantImages) && variantImages.length > 0) {
                                                imagesArray = variantImages
                                            } else {
                                                // Use single variant image (image_url)
                                                const variantImageUrl = getVariantImageUrl(product, selectedSizeVolumeVariant as any, 0)
                                                imagesArray = [variantImageUrl]
                                            }
                                        } else if (selectedColor) {
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
                                                const colorImage = product.color_images.find((ci: any) =>
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

                                        // Ensure at least one image
                                        if (imagesArray.length === 0) {
                                            imagesArray = [getColorSpecificImageUrl(product, 0)]
                                        }
                                    }

                                    // Ensure selectedImageIndex is within bounds
                                    const safeSelectedIndex = imagesArray.length > 0 ? Math.min(selectedImageIndex, imagesArray.length - 1) : 0
                                    
                                    // Use regular product images by default
                                    // Only use variant-specific images if user has explicitly selected a variant AND hasn't manually clicked a thumbnail
                                    const selectedImage = !isManuallySelectingImage && (selectedCaliber || selectedEyeHygieneVariant)
                                        ? getVariantSpecificImageUrl(product, selectedImageIndex)
                                        : imagesArray[safeSelectedIndex]

                                    return (
                                        <div className="flex gap-4 mb-6">
                                            {/* Left: Small thumbnails stacked vertically */}
                                            <div className="flex flex-col gap-3">
                                                {imagesArray.map((image, index) => (
                                                    <button
                                                        key={`${index}-${selectedSizeVolumeVariant?.id || 'no-variant'}-${selectedCaliber?.mm || 'no-caliber'}-${selectedEyeHygieneVariant?.id || 'no-eye-variant'}`}
                                                        onClick={() => {
                                                            setSelectedImageIndex(index)
                                                            setIsManuallySelectingImage(true) // User is manually selecting
                                                        }}
                                                        className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 flex items-center justify-center ${index === safeSelectedIndex
                                                            ? 'border-blue-950 ring-2 ring-blue-100 scale-105 shadow-md'
                                                            : 'border-gray-200 hover:border-blue-200'
                                                            }`}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt={`${product.name} view ${index + 1}`}
                                                            className="w-full h-full object-contain p-2"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = '/assets/images/frame1.png'
                                                            }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Right: Large main image display area */}
                                            <div className="flex-1">
                                                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center">
                                                    <img
                                                        key={`product-${product.id}-img-${safeSelectedIndex}-${selectedColor || 'default'}-${selectedSizeVolumeVariant?.id || 'no-variant'}-${selectedCaliber?.mm || 'no-caliber'}-${selectedEyeHygieneVariant?.id || 'no-eye-variant'}`}
                                                        src={selectedImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain p-8 transform transition-transform duration-500 hover:scale-105"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            const attemptedUrl = target.src
                                                            
                                                            if (import.meta.env.DEV) {
                                                                console.warn('[ProductDetail] Main image failed to load:', {
                                                                    product: product.name,
                                                                    attemptedUrl,
                                                                    isBlob: attemptedUrl.includes('blob:'),
                                                                    selectedCaliber: selectedCaliber?.mm,
                                                                    selectedVariant: selectedSizeVolumeVariant?.id
                                                                })
                                                            }
                                                            
                                                            // If blob URL failed, try to use a different product image for this caliber
                                                            if (attemptedUrl.includes('blob:') && selectedCaliber && product.images && product.images.length > 1) {
                                                                const caliberIndex = productCalibers.findIndex(c => c.mm === selectedCaliber.mm)
                                                                const fallbackIndex = (caliberIndex + 1) % product.images.length
                                                                target.src = product.images[fallbackIndex]
                                                                console.log('[ProductDetail] Blob URL failed, using fallback image for caliber:', selectedCaliber.mm, product.images[fallbackIndex])
                                                            } else {
                                                                // Final fallback
                                                                target.src = '/assets/images/frame1.png'
                                                            }
                                                        }}
                                                    />
                                                    {hasValidSale && (
                                                        <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transform -rotate-2">
                                                            Sale
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Color Selection below the large image */}
                                                {(() => {
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
                                                        <div className="mt-6">
                                                            <label className="block text-sm font-semibold text-blue-950 mb-3">
                                                                {t('shop.selectColor', 'Select Color')}
                                                            </label>
                                                            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
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
                                                                                setIsManuallySelectingImage(false) // Reset manual selection flag

                                                                                // Update URL without page reload
                                                                                const url = new URL(window.location.href)
                                                                                url.searchParams.set('color', newColor)
                                                                                window.history.pushState({}, '', url)
                                                                            }}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-sm flex-shrink-0 ${isSelected
                                                                                ? 'border-blue-950 bg-blue-50 text-blue-950 ring-1 ring-blue-950/20'
                                                                                : 'border-gray-200 bg-white hover:border-blue-200 text-gray-700'
                                                                                }`}
                                                                            title={displayName}
                                                                        >
                                                                            {/* Color Swatch */}
                                                                            <span
                                                                                className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0 shadow-inner"
                                                                                style={{ backgroundColor: hexCode }}
                                                                            />
                                                                            <div className="flex flex-col items-start leading-none">
                                                                                <span className="text-xs font-semibold capitalize whitespace-nowrap">
                                                                                    {displayName}
                                                                                </span>
                                                                                {variantPrice !== null && variantPrice !== Number(product.price || 0) && (
                                                                                    <span className="text-[10px] opacity-70 mt-0.5">
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
                                            </div>
                                        </div>
                                    )
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

                                    {/* Free Gift Badge */}
                                    {productGifts.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {productGifts.map(gift => (
                                                <div key={gift.id} className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H5.5A2.5 2.5 0 003 10.5v2a2.5 2.5 0 002.5 2.5h13a2.5 2.5 0 002.5-2.5v-2a2.5 2.5 0 00-2.5-2.5H12z" />
                                                    </svg>
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        Free Gift: {gift.gift_product?.name || 'Bonus Item'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

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
                                                        SAVE {Math.round(((originalPrice - (displayPrice || 0)) / originalPrice) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-5xl font-extrabold text-blue-950">
                                                ${(displayPrice || 0).toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Eye Hygiene Fields Section - Variant Selector (New) or Legacy Form */}
                                    {isEyeHygiene && (() => {
                                        const p = product as any
                                        // Check for variants - prioritize fetched variants, then check product object
                                        const variantsArray = fetchedVariants.length > 0
                                            ? fetchedVariants
                                            : (p.sizeVolumeVariants || p.size_volume_variants || [])
                                        const hasVariants = variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0

                                        // Show loading state while fetching variants
                                        if (variantsLoading) {
                                            return (
                                                <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-blue-200 pb-2">
                                                        Select Options
                                                    </h2>
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="text-gray-500">Loading variants...</div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        // If product has variants from API, use variant selector
                                        if (hasVariants) {
                                            // Extract unique size_volume and pack_type options from variants
                                            const activeVariants = variantsArray.filter((v: SizeVolumeVariant | any) =>
                                                (v.is_active !== false && v.is_active !== undefined) || v.is_active === true
                                            )

                                            const sizeVolumeOptions = Array.from(new Set(
                                                activeVariants
                                                    .map((v: SizeVolumeVariant | any) => v.size_volume)
                                                    .filter(Boolean)
                                            )).sort()

                                            const selectedSizeVolume = selectedSizeVolumeVariant?.size_volume || ''

                                            // Find matching variant
                                            const findMatchingVariant = (sizeVol: string, packType: string | null) => {
                                                if (!sizeVol) return null

                                                if (packType) {
                                                    return activeVariants.find((v: SizeVolumeVariant | any) =>
                                                        v.size_volume === sizeVol && v.pack_type === packType
                                                    ) || null
                                                }

                                                // If no pack_type, find variant without pack_type or first available
                                                const variantWithoutPackType = activeVariants.find((v: SizeVolumeVariant | any) =>
                                                    v.size_volume === sizeVol && !v.pack_type
                                                )

                                                return variantWithoutPackType || activeVariants.find((v: SizeVolumeVariant | any) =>
                                                    v.size_volume === sizeVol
                                                ) || null
                                            }

                                            // Handler for size/volume change
                                            const handleSizeVolumeChange = (sizeVol: string) => {
                                                if (!sizeVol) {
                                                    setSelectedSizeVolumeVariant(null)
                                                    setVariantQuantity(1)
                                                    setSelectedImageIndex(0) // Reset image index
                                                    return
                                                }

                                                // Find first available variant for the selected size/volume (ignore pack type)
                                                const matchingVariant = findMatchingVariant(sizeVol, null)

                                                if (matchingVariant) {
                                                    const variant = matchingVariant as SizeVolumeVariant
                                                    setSelectedSizeVolumeVariant({
                                                        id: variant.id,
                                                        size_volume: variant.size_volume,
                                                        pack_type: variant.pack_type || null,
                                                        price: Number(variant.price || 0),
                                                        compare_at_price: variant.compare_at_price ? Number(variant.compare_at_price) : null,
                                                        stock_quantity: Number(variant.stock_quantity || 0),
                                                        stock_status: (variant.stock_status || 'in_stock') as 'in_stock' | 'out_of_stock' | 'backorder',
                                                        expiry_date: variant.expiry_date || null,
                                                        image_url: variant.image_url || null, // Include image_url field
                                                        is_active: variant.is_active !== false,
                                                        sort_order: variant.sort_order || 0
                                                    })
                                                    // Reset quantity to 1 when variant changes
                                                    setVariantQuantity(1)
                                                    setSelectedImageIndex(0) // Reset image index to show variant's first image
                                                } else {
                                                    setSelectedSizeVolumeVariant(null)
                                                    setVariantQuantity(1)
                                                    setSelectedImageIndex(0) // Reset image index
                                                }
                                            }

                                            return (
                                                <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-blue-200 pb-2">
                                                        Select Options
                                                    </h2>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                        {/* Size/Volume Dropdown */}
                                                        {sizeVolumeOptions.length > 0 && (
                                                            <div className="flex flex-col">
                                                                <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                                    Capacity in ML <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={selectedSizeVolume}
                                                                    onChange={(e) => handleSizeVolumeChange(e.target.value)}
                                                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium"
                                                                    required
                                                                >
                                                                    <option value="">Select Capacity</option>
                                                                    {sizeVolumeOptions.map((option) => (
                                                                        <option key={option} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Caliber (MM) Selector for Frames/Glasses */}
                                                        {productCalibers.length > 0 && (
                                                            <div className="flex flex-col">
                                                                <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                                    Frame Size (mm) <span className="text-red-500">*</span>
                                                                </label>
                                                                <select
                                                                    value={selectedCaliber?.mm || ''}
                                                                    onChange={(e) => handleCaliberChange(e.target.value)}
                                                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium"
                                                                    required
                                                                >
                                                                    <option value="">Select Frame Size</option>
                                                                    {productCalibers
                                                                        .filter(c => c.is_active !== false)
                                                                        .sort((a, b) => Number(a.mm) - Number(b.mm))
                                                                        .map((caliber) => (
                                                                            <option key={caliber.mm} value={caliber.mm}>
                                                                                {caliber.mm}mm
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                                
                                                                {/* Button to view caliber-specific image */}
                                                                {selectedCaliber && selectedCaliber.image_url && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedImageIndex(0)
                                                                            setIsManuallySelectingImage(false)
                                                                            console.log('[ProductDetail] User requested to view caliber image for:', selectedCaliber.mm)
                                                                        }}
                                                                        className="mt-2 w-full px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        View {selectedCaliber.mm}mm Frame Image
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Quantity Selector */}
                                                        <div className="flex flex-col">
                                                            <label className="text-xs font-bold text-gray-700 uppercase mb-2">
                                                                Quantity <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                value={variantQuantity}
                                                                onChange={(e) => setVariantQuantity(parseInt(e.target.value) || 1)}
                                                                disabled={!selectedSizeVolume}
                                                                className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-gray-900 font-medium ${!selectedSizeVolume ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                required
                                                            >
                                                                {selectedSizeVolumeVariant ? (
                                                                    Array.from({ length: Math.min(selectedSizeVolumeVariant.stock_quantity || 10, 10) }, (_, i) => i + 1).map((num) => (
                                                                        <option key={num} value={num}>
                                                                            {num}
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <option value="1">1</option>
                                                                )}
                                                            </select>
                                                            {!selectedSizeVolume && (
                                                                <p className="text-xs text-gray-500 mt-1">Please select Capacity first</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Selected Variant Details */}
                                                    {selectedSizeVolumeVariant && (
                                                        <div className="pt-4 border-t border-blue-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Stock Quantity Display */}
                                                                <div className="flex flex-col justify-end">
                                                                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Available Stock</span>
                                                                    <span className={`font-semibold text-lg ${selectedSizeVolumeVariant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {selectedSizeVolumeVariant.stock_quantity > 0 ? selectedSizeVolumeVariant.stock_quantity : 'Out of Stock'}
                                                                    </span>
                                                                </div>

                                                                {/* Expiry Date Display (if available) */}
                                                                {selectedSizeVolumeVariant.expiry_date && (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</span>
                                                                        <span className="text-gray-900 font-semibold text-lg">
                                                                            {new Date(selectedSizeVolumeVariant.expiry_date).toLocaleDateString('en-US', {
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
                                                </div>
                                            )
                                        }

                                        // Legacy: Show dropdown form for products without variants
                                        return (
                                            <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-blue-200 pb-2">
                                                    Select Options
                                                </h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Size/Volume Dropdown */}
                                                    {eyeHygieneOptions.size_volume.length > 0 ? (
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
                                                    ) : null}

                                                    {/* Pack Type Dropdown */}
                                                    {eyeHygieneOptions.pack_type.length > 0 ? (
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
                                                    ) : null}

                                                    {/* Quantity Input - Always show for Eye Hygiene products */}
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
                                                    {product.stock_quantity !== undefined && product.stock_quantity !== null && (
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
                                        )
                                    })()}

                                    {/* Caliber (MM) Selection for Frames/Glasses - Dropdown */}
                                    {shouldShowCalibers && (
                                        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-900">Frame Size</h3>
                                                {selectedCaliber && (
                                                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        {selectedCaliber.mm}mm selected
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="relative">
                                                <select
                                                    value={selectedCaliber?.mm?.toString() || ''}
                                                    onChange={(e) => {
                                                        const mmValue = e.target.value;
                                                        if (mmValue) {
                                                            handleCaliberChange(mmValue);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                                                >
                                                    <option value="" disabled>
                                                        Select frame size...
                                                    </option>
                                                    {productCalibers
                                                        .filter(c => c.is_active !== false)
                                                        .sort((a, b) => Number(a.mm) - Number(b.mm))
                                                        .map((caliber) => (
                                                            <option 
                                                                key={caliber.mm} 
                                                                value={caliber.mm.toString()}
                                                            >
                                                                {caliber.mm}mm{caliber.price ? ` (+$${caliber.price})` : ''}
                                                            </option>
                                                        ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {selectedCaliber && (
                                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-sm font-semibold text-blue-900">
                                                                Selected: {selectedCaliber.mm}mm frame size
                                                            </p>
                                                            <p className="text-xs text-blue-700 mt-1">
                                                                This size will be applied to your order
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Product Details Grid (for non-Eye Hygiene products or additional details) */}
                                    {(() => {
                                        const p = product as any
                                        const hasAdditionalAttrs = p.color || p.frame_color || p.size || p.bridge || p.temples || p.clip || p.lens_color || p.lensColor || 
                                                                  (p.frameSizes && p.frameSizes.length > 0) || (p.color_images && p.color_images.length > 0) || (p.colors && p.colors.length > 0)
                                        return (!isEyeHygiene || (product.frame_shape || product.frame_material || hasAdditionalAttrs))
                                    })() && (
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
                                            {product.gender && !isEyeHygiene && (
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
                                            {(() => {
                                                const p = product as any
                                                // Get color from product.color, product.frame_color, or first color from color_images
                                                const color = p.color || p.frame_color || (p.color_images && p.color_images.length > 0 ? p.color_images[0].name : null) || (p.colors && p.colors.length > 0 ? p.colors[0].name : null)
                                                return color ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Color</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{color}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                // Get size from product.size or first frameSize
                                                const size = p.size || (p.frameSizes && p.frameSizes.length > 0 ? p.frameSizes[0].size_label : null)
                                                return size ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Size</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{size}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                // Get bridge from product.bridge or first frameSize bridge_width
                                                const bridge = p.bridge || (p.frameSizes && p.frameSizes.length > 0 ? p.frameSizes[0].bridge_width : null)
                                                return bridge ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Bridge</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{bridge}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                // Get temples from product.temples or first frameSize temple_length
                                                const temples = p.temples || (p.frameSizes && p.frameSizes.length > 0 ? p.frameSizes[0].temple_length : null)
                                                return temples ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Temples</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{temples}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                const clip = p.clip
                                                return clip ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Clip</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{clip}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                            {(() => {
                                                const p = product as any
                                                const lensColor = p.lens_color || p.lensColor
                                                return lensColor ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1">Lens Color</span>
                                                        <span className="text-gray-700 font-semibold capitalize">{lensColor}</span>
                                                    </div>
                                                ) : null
                                            })()}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="space-y-4">
                                        {/* For Eye Hygiene: Only show Add to Cart button */}
                                        <>
                                            {isEyeHygiene ? (() => {
                                            const p = product as any

                                            // Check if product has variants - prioritize fetched variants, then check product object
                                            const variantsArray = fetchedVariants.length > 0
                                                ? fetchedVariants
                                                : (p.sizeVolumeVariants || p.size_volume_variants || [])
                                            const hasVariants = variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0

                                            // Validation for variant-based or legacy form-based
                                            const isFormValid = hasVariants
                                                ? !!selectedSizeVolumeVariant && selectedSizeVolumeVariant.stock_status === 'in_stock' && selectedSizeVolumeVariant.stock_quantity > 0
                                                : (
                                                    (eyeHygieneOptions.size_volume.length === 0 || eyeHygieneFormData.size_volume) &&
                                                    (eyeHygieneOptions.pack_type.length === 0 || eyeHygieneFormData.pack_type) &&
                                                    eyeHygieneFormData.quantity >= 1
                                                )

                                            // Stock check for variant or product
                                            const variantOutOfStock = hasVariants && selectedSizeVolumeVariant
                                                ? (selectedSizeVolumeVariant.stock_status !== 'in_stock' || selectedSizeVolumeVariant.stock_quantity <= 0)
                                                : false

                                            const isDisabled = variantOutOfStock || isProductOutOfStock || !isFormValid

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
                                                    {variantOutOfStock || isProductOutOfStock
                                                        ? 'Out of Stock'
                                                        : !isFormValid
                                                            ? (hasVariants ? 'Please Select a Size/Volume Option' : 'Please Select All Options')
                                                            : 'Add to Cart'}
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
                                                            // Reset image selection to show main product image instead of caliber image
                                                            setSelectedImageIndex(0)
                                                            setIsManuallySelectingImage(false)
                                                            // Navigate to the same URL with ?action=checkout query param
                                                            // This will trigger the useEffect to set showCheckout(true)
                                                            navigate(`${location.pathname}?action=checkout`)
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

                                                <div className="mt-4">
                                                    <a
                                                        href={`https://wa.me/3912345678?text=I'm interested in ${encodeURIComponent(product.name)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full px-8 py-4 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-3 font-bold text-lg transform hover:-translate-y-1"
                                                    >
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                        </svg>
                                                        <span>Inquiry on WhatsApp</span>
                                                    </a>
                                                </div>
                                            </>
                                        )}
                                        </>
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
                            </>
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

            {/* Eye Hygiene Variants Section */}
            {productEyeHygieneVariants.length > 0 && (
                <section className="py-12 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {t('shop.completeEyeCare', 'Complete Your Eye Care Routine')}
                            </h2>
                            <p className="text-gray-600">
                                {t('shop.eyeHygieneDescription', 'Enhance your eye health with these complementary products')}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {productEyeHygieneVariants.map((variant: EyeHygieneVariant) => (
                                <div 
                                    key={variant.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                                >
                                    {/* Variant Image */}
                                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                        {variant.image_url ? (
                                            <img
                                                src={variant.image_url}
                                                alt={variant.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDc1VjE3NUgxMjVWMTI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDEyNUgxNzVWMTc1SDIyNVYxMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMjUgMjI1SDc1VjI3NUgxMjVWMjI1WiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjI1IDIyNUgxNzVWMjc1SDIyNVYyMjVaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwSDE1MFYxNzVIMTAwVjE1MFoiIGZpbGw9IiNBMkEyQTQiLz4KPHA+PC9wPgo8L3N2Zz4='
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Variant Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {variant.name}
                                        </h3>
                                        
                                        {variant.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {variant.description}
                                            </p>
                                        )}
                                        
                                        {/* Eye Hygiene Details */}
                                        <div className="space-y-1 mb-3 text-xs">
                                            {variant.size_volume && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Size:</span>
                                                    <span className="font-medium text-gray-900">{variant.size_volume}</span>
                                                </div>
                                            )}
                                            {variant.pack_type && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Pack:</span>
                                                    <span className="font-medium text-gray-900">{variant.pack_type}</span>
                                                </div>
                                            )}
                                            {variant.expiry_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Expires:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {new Date(variant.expiry_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Stock:</span>
                                                <span className={`font-medium ${
                                                    variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {variant.stock_quantity} available
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Price and Add to Cart */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                {variant.compare_at_price && variant.compare_at_price > variant.price ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-gray-900">
                                                            €{variant.price.toFixed(2)}
                                                        </span>
                                                        <span className="text-sm text-gray-400 line-through">
                                                            €{variant.compare_at_price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-bold text-gray-900">
                                                        €{variant.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                // Add variant to cart
                                                const cartProduct: CartProduct = {
                                                    id: product?.id || 0,
                                                    name: variant.name,
                                                    brand: product?.brand || '',
                                                    category: 'eye-hygiene',
                                                    price: variant.price,
                                                    image: variant.image_url || getProductImageUrl(product),
                                                    description: variant.description || '',
                                                    inStock: variant.stock_quantity > 0,
                                                    rating: product?.rating ? Number(product.rating) : undefined,
                                                    type: 'eye_hygiene_variant',
                                                    customization: {
                                                        variant_id: variant.id,
                                                        size_volume: variant.size_volume,
                                                        pack_type: variant.pack_type || undefined
                                                    }
                                                }
                                                addToCart(cartProduct as unknown as CartProduct)
                                            }}
                                            disabled={variant.stock_quantity <= 0}
                                            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                                variant.stock_quantity <= 0
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                                            }`}
                                        >
                                            {variant.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="py-12 md:py-16 bg-gray-50 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {isEyeHygiene ? 'More Eye Hygiene Products' : 'Related Products'}
                            </h2>
                            {isEyeHygiene && (
                                <Link
                                    to="/shop?category=eye-hygiene"
                                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm md:text-base transition-colors"
                                >
                                    View All Eye Hygiene →
                                </Link>
                            )}
                        </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isEyeHygiene ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-4'} gap-6`}>
                            {relatedProducts.map((relatedProduct) => {
                                // Check if related product is a contact lens
                                // Contact lenses don't use inventory stock, so we shouldn't show "Out of stock"
                                const isRelatedContactLens =
                                    relatedProduct.category?.slug?.toLowerCase().includes('contact') ||
                                    relatedProduct.category?.name?.toLowerCase().includes('contact') ||
                                    relatedProduct.slug?.toLowerCase().includes('contact') ||
                                    relatedProduct.name?.toLowerCase().includes('contact') ||
                                    false

                                return (
                                    <Link
                                        key={relatedProduct.id}
                                        to={`/shop/product/${relatedProduct.slug}`}
                                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col hover:-translate-y-1"
                                    >
                                        <div className="relative h-64 bg-gray-100 overflow-hidden">
                                            <img
                                                src={getProductImageUrl(relatedProduct)}
                                                alt={relatedProduct.name}
                                                className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = '/assets/images/frame1.png'
                                                }}
                                            />
                                            {/* Show variant badge for Eye Hygiene products */}
                                            {false && (
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    0 sizes
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-grow flex flex-col">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                                                {relatedProduct.name}
                                            </h3>
                                            {relatedProduct.brand && (
                                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                                                    {relatedProduct.brand}
                                                </p>
                                            )}
                                            <div className="mt-auto pt-4">
                                                {relatedProduct.sale_price && Number(relatedProduct.sale_price) < Number(relatedProduct.price) ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-bold text-blue-950">
                                                            ${Number(relatedProduct.sale_price).toFixed(2)}
                                                        </span>
                                                        <span className="text-sm text-gray-400 line-through">
                                                            ${Number(relatedProduct.price).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                            {Math.round(((Number(relatedProduct.price) - Number(relatedProduct.sale_price)) / Number(relatedProduct.price)) * 100)}% OFF
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xl font-bold text-blue-950">
                                                        ${Number(relatedProduct.price || 0).toFixed(2)}
                                                    </span>
                                                )}
                                                {/* Show stock status - ONLY for non-contact lens products */}
                                                {!isRelatedContactLens && relatedProduct.stock_quantity !== undefined && (
                                                    <p className={`text-xs mt-1 font-medium ${relatedProduct.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {relatedProduct.stock_quantity > 0 ? `${relatedProduct.stock_quantity} in stock` : 'Out of stock'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            {/* Checkout Modal - Only for non-contact lens and non-eye hygiene products */}
            {showCheckout && product && !isContactLens && !isEyeHygiene && (
                <ProductCheckout
                    product={product}
                    onClose={() => {
                        // Navigate back to the product page without query params
                        navigate(location.pathname)
                    }}
                    initialSelectedColor={selectedColor || undefined}
                    initialSelectedImageIndex={selectedImageIndex}
                    initialSelectedCaliber={selectedCaliber}
                    categoryContext={{
                        category: product.category ? {
                            id: product.category.id || 0,
                            name: product.category.name || '',
                            slug: product.category.slug || ''
                        } : null,
                        subcategory: (product as any).subCategory ? {
                            id: (product as any).subCategory.id || 0,
                            name: (product as any).subCategory.name || '',
                            slug: (product as any).subCategory.slug || ''
                        } : null,
                        subSubcategory: (product as any).subSubcategory ? {
                            id: (product as any).subSubcategory.id || 0,
                            name: (product as any).subSubcategory.name || '',
                            slug: (product as any).subSubcategory.slug || ''
                        } : null
                    }}
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


