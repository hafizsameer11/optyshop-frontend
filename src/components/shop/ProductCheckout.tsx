import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { getProductOptions, type LensType, type LensCoating, type Product } from '../../services/productsService'
import { 
  createPrescription, 
  getPrescriptions,
  type PrescriptionData,
  type Prescription 
} from '../../services/prescriptionsService'
import { addItemToCart, type PrescriptionData as CartPrescriptionData } from '../../services/cartService'
import { createOrder, createGuestOrder, type Address as OrderAddress } from '../../services/ordersService'
import { applyCoupon, type CouponDiscount, type CartItemForCoupon } from '../../services/couponsService'
import { getProductImageUrl } from '../../utils/productImage'
import { useLensCustomization } from '../../hooks/useLensCustomization'
import { 
  calculateCustomizationPriceWithPrescription,
  getProductCustomizationOptions,
  calculateCustomizationPrice,
  type PrescriptionLensType,
  type ProductCustomizationOptions
} from '../../services/customizationService'
import {
  getPrescriptionLensTypes,
  getPrescriptionLensVariantsByType,
  type PrescriptionLensType as ApiPrescriptionLensType,
  type PrescriptionLensVariant
} from '../../services/prescriptionLensService'
import {
  getProductConfiguration,
  getLensThicknessMaterials,
  getLensThicknessOptions,
  getLensTreatments,
  type ProductConfiguration as ProductConfig,
  type LensThicknessMaterial,
  type LensThicknessOption,
  type LensTreatment
} from '../../services/productConfigurationService'
import {
  getShippingMethods,
  type ShippingMethod
} from '../../services/shippingMethodsService'
import {
  getLensOptions,
  getLensColors,
  getPrescriptionSunColors,
  getPhotochromicLenses,
  getPrescriptionSunLenses,
  type LensOption,
  type LensColor,
  type PhotochromicLens,
  type PrescriptionSunLens,
} from '../../services/lensOptionsService'

// Import test function in dev mode
if (import.meta.env.DEV) {
  import('../../utils/testLensOptionsAPI').then(module => {
    if (typeof window !== 'undefined') {
      (window as any).testLensOptionsAPI = module.testLensOptionsAPI;
    }
  });
}

interface ProductCheckoutProps {
  product: Product
  onClose?: () => void
  initialFrameMaterials?: string[] // Optional: pre-selected frame materials from product page
  initialLensType?: string // Optional: pre-selected lens type from product page
  initialSelectedColor?: string | null // Optional: pre-selected product color variant from product page
}

type CheckoutStep = 'lens_type' | 'prescription' | 'progressive' | 'lens_thickness' | 'treatment' | 'summary' | 'shipping' | 'payment'

interface LensSelection {
  type: 'distance_vision' | 'near_vision' | 'progressive' | 'single_vision' | 'bifocal' | 'reading' | 'glasses_only' | 'no_lenses'
  lensIndex?: number
  lensTypeId?: number
  progressiveOption?: string // For progressive lens options (premium, standard, etc.) - stores slug or ID
  progressiveVariantId?: number // Numeric ID of the selected progressive variant from API
  lensThickness?: 'plastic' | 'glass' // Unbreakable (Plastic) or Minerals (Glass)
  lensThicknessMaterialId?: number // ID of selected lens thickness material from API
  lensThicknessOption?: string // Additional thickness option
  coatings: string[]
  treatments: string[] // Treatment IDs from API
  selectedLensTypeId?: string // Selected lens type from API (e.g., "Blokz® Sunglasses")
  selectedColorId?: string // Selected color ID
  selectedColor?: { id: string; name: string; color: string; gradient?: boolean } // Selected color details
  photochromicColor?: { id: string; name: string; color: string; gradient?: boolean } // Selected photochromic color
  prescriptionSunColor?: { id: string; name: string; color: string; gradient?: boolean } // Selected prescription sun color
}

interface PrescriptionFormData {
  pd_binocular: string
  pd_right?: string // For progressive vision
  pd_mm?: string // For progressive vision
  h?: string // Height for progressive vision
  year_of_birth?: string // Year of birth for progressive vision
  select_option?: string // ADD for progressive vision
  od_sphere: string
  od_cylinder: string
  od_axis: string
  os_sphere: string
  os_cylinder: string
  os_axis: string
}

const ProductCheckout: React.FC<ProductCheckoutProps> = ({ product, onClose, initialFrameMaterials, initialLensType, initialSelectedColor }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  
  // Store selected product color variant (from product page selection)
  const [selectedProductColor, setSelectedProductColor] = useState<string | null>(initialSelectedColor || null)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('lens_type')
  const [lensOptions, setLensOptions] = useState<LensType[]>([])
  const [coatingOptions, setCoatingOptions] = useState<LensCoating[]>([])
  const [lensIndexOptions, setLensIndexOptions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImageIndex] = useState(0)
  
  // Helper function to get the color-specific image URL
  const getColorSpecificImageUrl = useCallback((product: Product, imageIndex: number = 0): string => {
    if (!selectedProductColor) {
      // Fallback to regular product image if no color selected
      return getProductImageUrl(product, imageIndex)
    }
    
    const p = product as any
    const selectedColorLower = (selectedProductColor || '').toLowerCase()
    
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
  }, [selectedProductColor])
  
  const [lensSelection, setLensSelection] = useState<LensSelection>({
    type: 'distance_vision',
    coatings: [],
    treatments: []
  })

  // State for order summary
  const [orderSummary, setOrderSummary] = useState<Array<{
    name: string
    price: number
    type: 'product' | 'lens_type' | 'coating' | 'treatment' | 'lens_thickness' | 'shipping'
    id?: string | number
    removable?: boolean
  }>>([])

  // Use the API hook to fetch treatments, lens types, and shipping options
  const {
    treatments: apiTreatments,
    lensTypes: apiLensTypes,
    loading: customizationLoading,
    error: customizationError,
    refetch: refetchCustomization
  } = useLensCustomization()
  
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionFormData>({
    pd_binocular: '',
    pd_right: '',
    pd_mm: '',
    h: '',
    year_of_birth: '',
    select_option: '',
    od_sphere: '',
    od_cylinder: '',
    od_axis: '',
    os_sphere: '',
    os_cylinder: '',
    os_axis: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null)
  const [savedPrescriptions, setSavedPrescriptions] = useState<Prescription[]>([])
  const [selectedSavedPrescription, setSelectedSavedPrescription] = useState<number | null>(null)
  const [prescriptionLensTypes, setPrescriptionLensTypes] = useState<PrescriptionLensType[]>([])
  // Store the actual API prescription lens types with their IDs for fetching variants
  const [apiPrescriptionLensTypes, setApiPrescriptionLensTypes] = useState<ApiPrescriptionLensType[]>([])
  const [, setPriceCalculation] = useState<{ total: number; breakdown: Array<{ item: string; price: number }> } | null>(null)
  const [, setProductCustomizationOptions] = useState<ProductCustomizationOptions | null>(null)
  // Start with empty array - will be populated from API (admin data)
  // Type matches API guide structure: isRecommended, viewingRange, useCases
  const [progressiveOptions, setProgressiveOptions] = useState<Array<{ 
    id: string; 
    name: string; 
    price: number; 
    description: string; 
    recommended?: boolean; 
    viewingRange?: string;
    useCases?: string;
    icon?: string; 
    variantId?: number 
  }>>([])
  const [progressiveOptionsLoading, setProgressiveOptionsLoading] = useState(true)
  
  // New API configuration state
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null)
  const [lensThicknessMaterials, setLensThicknessMaterials] = useState<LensThicknessMaterial[]>([])
  const [lensThicknessOptions, setLensThicknessOptions] = useState<LensThicknessOption[]>([])
  const [configTreatments, setConfigTreatments] = useState<LensTreatment[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [shippingLoading, setShippingLoading] = useState(true)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [photochromicOptions, setPhotochromicOptions] = useState<LensOption[]>([])
  const [prescriptionSunOptions, setPrescriptionSunOptions] = useState<LensOption[]>([])
  const [prescriptionSunColors, setPrescriptionSunColors] = useState<LensColor[]>([])
  const [lensColors, setLensColors] = useState<LensColor[]>([])
  const [lensOptionsLoading, setLensOptionsLoading] = useState(true)
  
  // Checkout flow states
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'checkout'>('cart') // 'cart' = add to cart, 'checkout' = direct checkout
  const [shippingAddress, setShippingAddress] = useState<OrderAddress & { state?: string }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip_code: '',
    country: '',
    state: ''
  })
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe')
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  useEffect(() => {
    // PRIMARY API: GET /api/products/:id/configuration (from API guide)
    // This returns all lens configuration including variants
    // FALLBACK APIs: Individual endpoints if configuration fails
    fetchProductConfiguration()
    fetchProductOptions()
    fetchProductCustomizationOptions()
    fetchPhotochromicOptions()
    fetchPrescriptionSunOptions()
    fetchPrescriptionSunColors()
    fetchLensColors()
    fetchShippingMethods()
    if (isAuthenticated) {
      fetchSavedPrescriptions()
    }
  }, [isAuthenticated, product.id])
  
  // Debug: Log when lensColors state changes
  useEffect(() => {
    console.log('🔄 [ProductCheckout] lensColors state changed:', lensColors.length, 'colors')
    if (lensColors.length > 0) {
      console.log('🔄 [ProductCheckout] First lens color:', lensColors[0])
      console.log('🔄 [ProductCheckout] First lens color lensOption:', lensColors[0].lensOption)
    }
  }, [lensColors])
  
  // PRIMARY METHOD: Get Product Configuration
  // GET /api/products/:id/configuration
  // This is the recommended endpoint per API guide - returns all config including variants
  const fetchProductConfiguration = async () => {
    setConfigLoading(true)
    setProgressiveOptionsLoading(true)
    
    try {
      console.log(`🔄 [API] PRIMARY: GET /api/products/${product.id}/configuration`)
      const config = await getProductConfiguration(product.id)
      
      if (config) {
        setProductConfig(config)
        
        // Set prescription lens types from configuration
        if (config.prescriptionLensTypes && config.prescriptionLensTypes.length > 0) {
          // Store the actual API types with their real IDs - map to ApiPrescriptionLensType format
          const apiTypes: ApiPrescriptionLensType[] = config.prescriptionLensTypes.map(type => ({
            id: type.id,
            name: type.name,
            slug: type.slug,
            description: type.description || '',
            prescription_type: type.prescriptionType === 'progressive' ? 'progressive' : 'single_vision',
            base_price: type.basePrice || 0,
            is_active: true,
            sort_order: 0,
            colors: [],
            variants: (type.variants || [])
              .filter(variant => variant && variant.id) // Filter out null/undefined variants
              .map(variant => ({
                id: variant.id,
                prescription_lens_type_id: type.id,
                name: variant.name || 'Unknown',
                slug: variant.slug || '',
                description: variant.description || null,
                price: variant.price || 0,
                is_recommended: variant.isRecommended || false,
                viewing_range: variant.viewingRange || null,
                use_cases: variant.useCases || null,
                is_active: true,
                sort_order: 0,
                colors: []
              }))
          }))
          setApiPrescriptionLensTypes(apiTypes)
          
          // Also set the simplified version for UI display
          setPrescriptionLensTypes(config.prescriptionLensTypes.map(type => ({
            id: type.slug === 'distance-vision' ? 'distance_vision' : 
                type.slug === 'near-vision' ? 'near_vision' : 'progressive',
            name: type.name,
            description: type.description,
            type: type.prescriptionType === 'progressive' ? 'progressive' : 
                  type.slug === 'distance-vision' ? 'distance_vision' : 'near_vision'
          })))
          console.log('✅ [API] Prescription lens types loaded from configuration:', config.prescriptionLensTypes.length)
          console.log('📋 [API] Actual API types with IDs:', apiTypes.map(t => ({ id: t.id, name: t.name, prescription_type: t.prescription_type, is_active: t.is_active })))
        }
        
        // Extract Progressive variants from configuration (PRIMARY METHOD)
        // Use the actual API type with prescription_type = 'progressive'
        const progressiveType = config.prescriptionLensTypes?.find(
          t => t.prescriptionType === 'progressive' || t.slug === 'progressive'
        )
        
        if (progressiveType && progressiveType.variants && progressiveType.variants.length > 0) {
          // Filter to only active variants
          const activeVariants = progressiveType.variants.filter((v: any) => {
            const isActive = v.isActive !== undefined 
              ? (v.isActive === true || v.isActive === 1 || v.isActive === '1')
              : (v.is_active === true || v.is_active === 1 || v.is_active === '1')
            return isActive !== false
          })
          
          console.log(`📊 [API] Progressive variants from configuration: ${progressiveType.variants.length} total, ${activeVariants.length} active`)
          
          if (activeVariants.length > 0) {
            // Map variants according to the API guide structure
            // API returns: isRecommended, viewingRange, useCases (camelCase)
            const mappedOptions = activeVariants
              .filter((v: any) => v && v.id) // Filter out null/undefined variants
              .map((v: any) => ({
                id: v.slug || v.id?.toString() || '',
                name: v.name || 'Unknown',
                price: v.price || 0,
                description: String(v.description || v.useCases || v.viewingRange || ''),
                recommended: v.isRecommended || v.is_recommended || false,
                viewingRange: typeof v.viewingRange === 'string' ? v.viewingRange : (typeof v.viewing_range === 'string' ? v.viewing_range : null),
                useCases: typeof v.useCases === 'string' ? v.useCases : (typeof v.use_cases === 'string' ? v.use_cases : null),
                variantId: v.id
              }))
            
            // Sort by sortOrder if available, then by recommended, then by name
            mappedOptions.sort((a, b) => {
              const variantA = activeVariants.find((v: any) => (v.slug || v.id.toString()) === a.id)
              const variantB = activeVariants.find((v: any) => (v.slug || v.id.toString()) === b.id)
              const sortOrderA = (variantA as any)?.sortOrder || (variantA as any)?.sort_order || 0
              const sortOrderB = (variantB as any)?.sortOrder || (variantB as any)?.sort_order || 0
              if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB
              if (a.recommended && !b.recommended) return -1
              if (!a.recommended && b.recommended) return 1
              const aName = (a.name || '').toLowerCase()
              const bName = (b.name || '').toLowerCase()
              return aName.localeCompare(bName)
            })
            
            console.log('✅ [API] Progressive options loaded from configuration:', mappedOptions.length, 'options')
            console.log('📦 [API] Mapped variants:', mappedOptions.map(o => ({
              id: o.id,
              name: o.name,
              price: o.price,
              recommended: o.recommended,
              variantId: o.variantId
            })))
            setProgressiveOptions(mappedOptions)
            setProgressiveOptionsLoading(false)
          } else {
            console.warn('⚠️ [API] No active variants in configuration, trying fallback API...')
            // Try fallback API before using defaults
            await fetchProgressiveVariantsFallback()
          }
        } else {
          console.warn('⚠️ [API] No Progressive type or variants in configuration, trying fallback API...')
          // Try fallback API before using defaults
          await fetchProgressiveVariantsFallback()
        }
        
        // Set other configuration data
        setLensThicknessMaterials(config.lensThicknessMaterials || [])
        setLensThicknessOptions(config.lensThicknessOptions || [])
        setConfigTreatments(config.lensTreatments || [])
      } else {
        console.warn('⚠️ [API] Configuration API returned null, trying fallback API...')
        // Try fallback API before using defaults
        await fetchProgressiveVariantsFallback()
        // Also fetch other data using individual endpoints
        fetchLensThicknessMaterials()
        fetchLensThicknessOptions()
        fetchLensTreatments()
      }
    } catch (error) {
      console.error('❌ [API] Error fetching product configuration:', error)
      console.log('⚠️ [API] Configuration API failed, trying fallback API...')
      // Try fallback API before using defaults
      await fetchProgressiveVariantsFallback()
      // Also fetch other data using individual endpoints
      fetchLensThicknessMaterials()
      fetchLensThicknessOptions()
      fetchLensTreatments()
    } finally {
      setConfigLoading(false)
    }
  }
  
  // FALLBACK METHOD: Get Progressive Variants using alternative endpoints
  // GET /api/lens/prescription-lens-types - Get all types
  // GET /api/lens/prescription-lens-types/{id}/variants - Get variants
  const fetchProgressiveVariantsFallback = async () => {
    try {
      console.log('🔄 [API] FALLBACK: Using alternative endpoints for Progressive variants')
      
      // Step 1: Use stored API types if available, otherwise fetch from API
      let types: ApiPrescriptionLensType[] = apiPrescriptionLensTypes
      
      if (!types || types.length === 0) {
        console.log('📥 [API] No stored types, fetching from API...')
        // First try to get active types
        const activeTypes = await getPrescriptionLensTypes({ isActive: true })
        
        // If no active types found, try fetching all types (including inactive)
        if (!activeTypes || activeTypes.length === 0) {
          console.log('📥 [API] No active types found, fetching all types (including inactive)...')
          const allTypes = await getPrescriptionLensTypes({}) // No filter - get all types
          if (allTypes && allTypes.length > 0) {
            types = allTypes
            setApiPrescriptionLensTypes(allTypes)
            console.log(`✅ [API] Fetched ${allTypes.length} prescription lens types (including inactive)`)
          }
        } else {
          types = activeTypes
          setApiPrescriptionLensTypes(activeTypes)
          console.log(`✅ [API] Fetched ${activeTypes.length} active prescription lens types`)
        }
      } else {
        console.log('✅ [API] Using stored API types:', types.length)
      }
      
      if (!types || types.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [API] No prescription lens types found in database.')
          console.warn('   → Please add prescription lens types in admin panel')
          console.warn('   → Make sure at least one type has prescription_type="progressive"')
          console.warn('   → Using default fallback options as last resort')
        }
        // Only use defaults if API completely fails
        const defaultOptions = [
          {
            id: 'premium',
            name: 'Premium Progressive',
            price: 150,
            description: 'High-quality progressive lenses with advanced technology',
            recommended: true,
            variantId: undefined
          },
          {
            id: 'standard',
            name: 'Standard Progressive',
            price: 100,
            description: 'Standard progressive lenses for everyday use',
            recommended: false,
            variantId: undefined
          },
          {
            id: 'basic',
            name: 'Basic Progressive',
            price: 75,
            description: 'Affordable progressive lens option',
            recommended: false,
            variantId: undefined
          }
        ]
        setProgressiveOptions(defaultOptions)
        setProgressiveOptionsLoading(false)
        return
      }
      
      // Log all found types for debugging
      console.log('📋 [API] Found prescription lens types:', types.map(t => ({
        id: t.id,
        name: t.name,
        type: t.prescription_type,
        slug: t.slug,
        is_active: t.is_active
      })))
      
      // Step 2: Find Progressive type using actual prescription_type from API
      // Use the actual type from API, not hardcoded "progressive"
      console.log('🔍 [API] Searching for progressive type among', types.length, 'types:')
      types.forEach(t => {
        console.log('   - Type:', { 
          id: t.id, 
          name: t.name, 
          prescription_type: t.prescription_type,
          is_active: t.is_active 
        })
      })
      
      let progressiveType = types.find(t => {
        const typeMatch = t.prescription_type?.toLowerCase() === 'progressive'
        if (typeMatch) {
          console.log('✅ [API] Found progressive type from API:', { id: t.id, name: t.name, prescription_type: t.prescription_type, is_active: t.is_active })
        }
        return typeMatch
      })
      
      // If not found by prescription_type, check if any type has "progressive" in name/slug
      if (!progressiveType) {
        console.log('🔍 [API] No type with prescription_type="progressive", checking names/slugs...')
        progressiveType = types.find(t => {
          const nameMatch = t.name?.toLowerCase().includes('progressive')
          const slugMatch = t.slug?.toLowerCase().includes('progressive')
          if (nameMatch || slugMatch) {
            console.log('✅ [API] Found progressive type by name/slug:', { id: t.id, name: t.name, slug: t.slug, prescription_type: t.prescription_type })
          }
          return nameMatch || slugMatch
        })
      }
      
      // If still not found, try to find by checking if any type has progressive variants
      if (!progressiveType) {
        progressiveType = types.find(t => {
          const nameMatch = t.name?.toLowerCase().includes('progressive')
          const slugMatch = t.slug?.toLowerCase().includes('progressive')
          return nameMatch || slugMatch
        })
      }
      
      // If still not found, check all types to see which one has variants
      // This handles cases where variants exist but the type isn't properly marked as progressive
      if (!progressiveType) {
        console.log('🔍 [API] Progressive type not found by name/type, checking all types for variants...')
        let typeWithMostVariants = null
        let maxVariants = 0
        
        for (const type of types) {
          try {
            console.log(`🔍 [API] Checking type "${type.name}" (ID: ${type.id}) for variants...`)
            const testVariants = await getPrescriptionLensVariantsByType(type.id, { limit: 100 })
            if (testVariants && testVariants.length > 0) {
              console.log(`✅ [API] Type "${type.name}" has ${testVariants.length} variants`)
              // Use the type with the most variants (likely the progressive one)
              if (testVariants.length > maxVariants) {
                maxVariants = testVariants.length
                typeWithMostVariants = type
              }
            }
          } catch (err) {
            console.log(`⚠️ [API] Error checking type "${type.name}":`, err)
            // Continue checking other types
            continue
          }
        }
        
        if (typeWithMostVariants) {
          progressiveType = typeWithMostVariants
          console.log(`⚠️ [API] Using type "${progressiveType.name}" (ID: ${progressiveType.id}) as progressive - found ${maxVariants} variants`)
          console.log(`⚠️ [API] Note: Please mark this type as prescription_type="progressive" in admin panel for proper identification`)
        }
      }
      
      if (!progressiveType) {
        console.warn('⚠️ [API] Progressive lens type not found in database.')
        console.warn('   → Available types:', types.map(t => ({
          id: t.id,
          name: t.name,
          prescription_type: t.prescription_type,
          slug: t.slug
        })))
        if (import.meta.env.DEV) {
          console.warn('   → Please ensure a lens type with prescription_type="progressive" exists')
          console.warn('   → Using default fallback options as last resort')
        }
        // Only use defaults if progressive type doesn't exist
        const defaultOptions = [
          {
            id: 'premium',
            name: 'Premium Progressive',
            price: 150,
            description: 'High-quality progressive lenses with advanced technology',
            recommended: true,
            variantId: undefined
          },
          {
            id: 'standard',
            name: 'Standard Progressive',
            price: 100,
            description: 'Standard progressive lenses for everyday use',
            recommended: false,
            variantId: undefined
          },
          {
            id: 'basic',
            name: 'Basic Progressive',
            price: 75,
            description: 'Affordable progressive lens option',
            recommended: false,
            variantId: undefined
          }
        ]
        setProgressiveOptions(defaultOptions)
        setProgressiveOptionsLoading(false)
        return
      }
      
      console.log('✅ [API] Progressive type found in fallback:', { 
        id: progressiveType.id, 
        name: progressiveType.name,
        prescription_type: progressiveType.prescription_type
      })
      console.log('🔍 [API] Fetching variants for prescription_lens_type_id:', progressiveType.id)
      
      // Step 3: Get variants for Progressive type
      // First try with isActive filter, but if none found, try without filter to see all variants
      let variants = await getPrescriptionLensVariantsByType(progressiveType.id, { 
        isActive: true,
        limit: 100 
      })
      
      console.log('📥 [API] Variants response (active only):', {
        total: variants?.length || 0,
        variantIds: variants?.map(v => v.id) || [],
        variantNames: variants?.map(v => v.name) || []
      })
      
      // If no active variants found, try fetching all variants (including inactive)
      if (!variants || variants.length === 0) {
        console.log('🔍 [API] No active variants found, fetching all variants (including inactive)...')
        variants = await getPrescriptionLensVariantsByType(progressiveType.id, { 
          limit: 100 
        })
        console.log('📥 [API] All variants response:', {
          total: variants?.length || 0,
          variantIds: variants?.map(v => v.id) || [],
          variantNames: variants?.map(v => v.name) || [],
          activeCount: variants?.filter(v => {
            const active = (v as any).is_active
            return active === true || active === 1 || active === '1'
          }).length || 0
        })
      }
      
      if (!variants || variants.length === 0) {
        console.info('ℹ️ [API] No progressive variants found for type:', progressiveType.name)
        console.info('   → Checking if variants exist but are inactive...')
        
        // Try fetching ALL variants (including inactive) to see if any exist
        const allVariants = await getPrescriptionLensVariantsByType(progressiveType.id, { 
          limit: 100 
        })
        
        if (allVariants && allVariants.length > 0) {
          console.warn('⚠️ [API] Found variants but they are marked as INACTIVE')
          console.warn('   → Please activate variants in admin panel to display them')
          console.warn('   → Found inactive variants:', allVariants.map(v => ({
            id: v.id,
            name: v.name,
            is_active: v.is_active
          })))
          // Show inactive variants as a last resort (with a note)
          const inactiveOptions = allVariants.map((variant: PrescriptionLensVariant) => ({
            id: variant.slug || variant.id.toString(),
            name: variant.name + ' (Inactive)',
            price: variant.price || 0,
            description: (variant.description || variant.use_cases || variant.viewing_range || '') + ' - Note: This variant is currently inactive in admin panel',
            recommended: variant.is_recommended || false,
            variantId: variant.id
          }))
          setProgressiveOptions(inactiveOptions)
          setProgressiveOptionsLoading(false)
          return
        }
        
        if (import.meta.env.DEV) {
          console.info('   → No variants found (active or inactive). Using default fallback options.')
        }
        // Only use defaults if truly no variants exist
        const defaultOptions = [
          {
            id: 'premium',
            name: 'Premium Progressive',
            price: 150,
            description: 'High-quality progressive lenses with advanced technology',
            recommended: true,
            variantId: undefined
          },
          {
            id: 'standard',
            name: 'Standard Progressive',
            price: 100,
            description: 'Standard progressive lenses for everyday use',
            recommended: false,
            variantId: undefined
          },
          {
            id: 'basic',
            name: 'Basic Progressive',
            price: 75,
            description: 'Affordable progressive lens option',
            recommended: false,
            variantId: undefined
          }
        ]
        setProgressiveOptions(defaultOptions)
        setProgressiveOptionsLoading(false)
        return
      }
      
      // Filter to only active variants (double-check even though API should filter)
      const activeVariants = variants.filter(v => {
        const active = (v as any).is_active
        const isActive = active === true || active === 1 || active === '1'
        if (!isActive) {
          console.debug(`   ⚠️ Variant ${v.id} (${v.name}) is inactive - filtering out`)
        }
        return isActive
      })
      
      console.log(`📊 [API] Fallback variants: ${variants.length} total, ${activeVariants.length} active`)
      if (variants.length > 0 && activeVariants.length === 0) {
        console.warn('⚠️ [API] All variants are inactive! Check database:')
        console.warn('   → Run: SELECT * FROM prescription_lens_variants WHERE prescription_lens_type_id = ' + progressiveType.id)
        console.warn('   → Verify: is_active = 1 for variants you want to display')
      }
      
      if (activeVariants.length > 0) {
        // Sort variants: by sort_order, then recommended, then name
        const sortedVariants = [...activeVariants].sort((a, b) => {
          if (a.sort_order !== undefined && b.sort_order !== undefined) {
            return a.sort_order - b.sort_order
          }
          if (a.sort_order !== undefined) return -1
          if (b.sort_order !== undefined) return 1
          if (a.is_recommended && !b.is_recommended) return -1
          if (!a.is_recommended && b.is_recommended) return 1
          const aName = (a.name || '').toLowerCase()
          const bName = (b.name || '').toLowerCase()
          return aName.localeCompare(bName)
        })
        
        // Map variants to progressive options format according to API guide
        // Handle both camelCase (from API) and snake_case (from database) formats
        const mappedOptions = sortedVariants
          .filter((variant: PrescriptionLensVariant) => variant && variant.id) // Filter out null/undefined variants
          .map((variant: PrescriptionLensVariant) => ({
            id: variant.slug || variant.id?.toString() || '',
            name: variant.name || 'Unknown',
            price: variant.price || 0,
            description: String(variant.description || (variant as any).useCases || (variant as any).use_cases || (variant as any).viewingRange || (variant as any).viewing_range || ''),
            recommended: (variant as any).isRecommended || variant.is_recommended || false,
            viewingRange: typeof (variant as any).viewingRange === 'string' ? (variant as any).viewingRange : (typeof (variant as any).viewing_range === 'string' ? (variant as any).viewing_range : null),
            useCases: typeof (variant as any).useCases === 'string' ? (variant as any).useCases : (typeof (variant as any).use_cases === 'string' ? (variant as any).use_cases : null),
            variantId: variant.id
          }))
        
        console.log('📋 [API] Sorted variants before mapping:', sortedVariants.map(v => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          price: v.price,
          sort_order: v.sort_order,
          is_recommended: v.is_recommended
        })))
        
        console.log('✅ [API] Progressive options loaded from fallback:', mappedOptions.length, 'options')
        console.log('📦 [API] Final mapped options:', mappedOptions.map(o => ({
          id: o.id,
          name: o.name,
          price: o.price,
          recommended: o.recommended,
          variantId: o.variantId
        })))
        setProgressiveOptions(mappedOptions)
        setProgressiveOptionsLoading(false)
      } else {
        console.warn('⚠️ [API] Variants found but none are marked as active')
        console.warn('   → Please activate at least one variant in admin panel')
        console.warn('   → Showing inactive variants as fallback (with warning)')
        
        // Try to get inactive variants to show them
        const allVariants = await getPrescriptionLensVariantsByType(progressiveType.id, { 
          limit: 100 
        })
        
        if (allVariants && allVariants.length > 0) {
          const inactiveOptions = allVariants.map((variant: PrescriptionLensVariant) => ({
            id: variant.slug || variant.id.toString(),
            name: variant.name + ' (Inactive)',
            price: variant.price || 0,
            description: (variant.description || variant.use_cases || variant.viewing_range || '') + ' - Note: This variant is currently inactive in admin panel',
            recommended: variant.is_recommended || false,
            variantId: variant.id
          }))
          setProgressiveOptions(inactiveOptions)
        setProgressiveOptionsLoading(false)
        } else {
          // Only use defaults if truly no variants exist
          if (import.meta.env.DEV) {
            console.warn('   → No variants found at all. Using default fallback options.')
          }
          const defaultOptions = [
            {
              id: 'premium',
              name: 'Premium Progressive',
              price: 150,
              description: 'High-quality progressive lenses with advanced technology',
              recommended: true,
              variantId: undefined
            },
            {
              id: 'standard',
              name: 'Standard Progressive',
              price: 100,
              description: 'Standard progressive lenses for everyday use',
              recommended: false,
              variantId: undefined
            },
            {
              id: 'basic',
              name: 'Basic Progressive',
              price: 75,
              description: 'Affordable progressive lens option',
              recommended: false,
              variantId: undefined
            }
          ]
          setProgressiveOptions(defaultOptions)
          setProgressiveOptionsLoading(false)
        }
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ [API] Error in fallback method:', error?.message || error)
        console.info('   → Using default fallback options')
      }
      // Use default fallback options on error
      const defaultOptions = [
        {
          id: 'premium',
          name: 'Premium Progressive',
          price: 150,
          description: 'High-quality progressive lenses with advanced technology',
          recommended: true,
          variantId: undefined
        },
        {
          id: 'standard',
          name: 'Standard Progressive',
          price: 100,
          description: 'Standard progressive lenses for everyday use',
          recommended: false,
          variantId: undefined
        },
        {
          id: 'basic',
          name: 'Basic Progressive',
          price: 75,
          description: 'Affordable progressive lens option',
          recommended: false,
          variantId: undefined
        }
      ]
      setProgressiveOptions(defaultOptions)
      setProgressiveOptionsLoading(false)
    }
  }
  
  // Fetch lens thickness materials using documented API
  // GET /api/lens/thickness-materials
  const fetchLensThicknessMaterials = async () => {
    try {
      console.log('🔄 [API] Fetching lens thickness materials: GET /api/lens/thickness-materials')
      const materials = await getLensThicknessMaterials()
      if (materials && materials.length > 0) {
        setLensThicknessMaterials(materials)
        console.log('✅ [API] Lens thickness materials loaded:', materials.length)
        console.log('📋 [API] Thickness materials:', materials.map(m => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          price: m.price
        })))
      } else {
        console.warn('⚠️ [API] No lens thickness materials found in API response')
      }
    } catch (error) {
      console.error('❌ [API] Error fetching lens thickness materials:', error)
    }
  }
  
  // Fetch lens thickness options using documented API
  // GET /api/lens/thickness-options
  const fetchLensThicknessOptions = async () => {
    try {
      console.log('🔄 [API] Fetching lens thickness options: GET /api/lens/thickness-options')
      const options = await getLensThicknessOptions()
      if (options && options.length > 0) {
        setLensThicknessOptions(options)
        console.log('✅ [API] Lens thickness options loaded:', options.length)
        console.log('📋 [API] Thickness options:', options.map(o => ({
          id: o.id,
          name: o.name,
          thicknessValue: o.thicknessValue
        })))
      } else {
        console.warn('⚠️ [API] No lens thickness options found in API response')
      }
    } catch (error) {
      console.error('❌ [API] Error fetching lens thickness options:', error)
    }
  }
  
  // Fetch lens treatments using documented API
  // GET /api/lens/treatments
  const fetchLensTreatments = async () => {
    try {
      console.log('🔄 [API] Fetching lens treatments: GET /api/lens/treatments')
      const treatments = await getLensTreatments()
      if (treatments && treatments.length > 0) {
        setConfigTreatments(treatments)
        console.log('✅ [API] Lens treatments loaded:', treatments.length)
      }
    } catch (error) {
      console.error('❌ [API] Error fetching lens treatments:', error)
    }
  }

  // Fetch shipping methods using documented API
  // GET /api/shipping-methods
  const fetchShippingMethods = async () => {
    setShippingLoading(true)
    try {
      console.log('🔄 [API] Fetching shipping methods: GET /api/shipping-methods')
      // Public endpoint returns active methods by default
      const methods = await getShippingMethods()
      if (methods && methods.length > 0) {
        setShippingMethods(methods)
        // Auto-select the first shipping method (or free shipping if available)
        const freeShipping = methods.find(m => m.price === 0 || m.type === 'free')
        setSelectedShippingMethod(freeShipping || methods[0])
        console.log('✅ [API] Shipping methods loaded:', methods.length)
      } else {
        console.warn('⚠️ [API] No shipping methods available')
      }
    } catch (error) {
      console.error('❌ [API] Error fetching shipping methods:', error)
    } finally {
      setShippingLoading(false)
    }
  }

  // Fetch photochromic lens options from API
  // GET /api/lens/options?type=photochromic
  const fetchPhotochromicOptions = async () => {
    try {
      console.log('🔄 [API] Fetching photochromic lenses: GET /api/photochromic-lenses')
      
      // Use dedicated endpoint from Postman collection
      const lenses = await getPhotochromicLenses()
      
      // Log what we got
      console.log('📊 [API] Photochromic API response:', {
        lenses: lenses,
        count: lenses?.length || 0,
        hasData: !!lenses && lenses.length > 0
      })
      
      // Handle null response
      if (lenses === null) {
        console.warn('⚠️ [API] getPhotochromicLenses returned null - API might have errored')
        setPhotochromicOptions([])
        return
      }
      
      if (lenses && lenses.length > 0) {
        console.log('✅ [API] Found', lenses.length, 'photochromic lenses from dedicated endpoint')
        
        // Convert PhotochromicLens to LensOption format for compatibility
        const options: LensOption[] = lenses.map(lens => ({
          id: lens.id,
          name: lens.name,
          slug: lens.slug,
          type: 'photochromic',
          description: lens.description,
          basePrice: lens.basePrice || lens.base_price,
          base_price: lens.base_price || lens.basePrice,
          isActive: true,
          is_active: true,
          colors: lens.colors || [],
          sortOrder: 0,
          sort_order: 0
        }))
        
        // Log all options
        options.forEach((opt, idx) => {
          console.log(`  [${idx + 1}] ${opt.name} (id: ${opt.id}, colors: ${opt.colors?.length || 0})`)
          if (opt.colors && opt.colors.length > 0) {
            console.log(`    Colors:`, opt.colors.map(c => `${c.name} (${c.hexCode || c.hex_code || 'no hex'})`).join(', '))
          } else {
            console.warn(`    ⚠️ No colors found for ${opt.name}`)
          }
        })
        
        setPhotochromicOptions(options)
        console.log('✅ [API] Photochromic options loaded:', options.length, 'options')
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [API] No photochromic lenses available from API')
          console.warn('   → This is normal if you haven\'t created photochromic lenses yet')
        }
        setPhotochromicOptions([])
      }
    } catch (error) {
      console.error('❌ [API] Error fetching photochromic lenses:', error)
      setPhotochromicOptions([])
    } finally {
      setLensOptionsLoading(false)
    }
  }

  // Fetch prescription sun lens options from API
  // Primary: GET /api/prescription-sun-lenses
  // Fallback: GET /api/lens/options?type=prescription_sun (from Postman collection)
  const fetchPrescriptionSunOptions = async () => {
    try {
      console.log('🔄 [API] Fetching prescription sun lenses: GET /api/prescription-sun-lenses')
      
      // Try primary endpoint from Postman collection
      const lenses = await getPrescriptionSunLenses()
      
      // Log what we got
      console.log('📊 [API] Prescription Sun API response:', {
        lenses: lenses,
        count: lenses?.length || 0,
        hasData: !!lenses && lenses.length > 0
      })
      
      let options: LensOption[] = []
      
      // Handle null response - try fallback endpoint
      if (lenses === null || (lenses && lenses.length === 0)) {
        console.log('🔄 [API] Primary endpoint returned no data, trying fallback: GET /api/lens/options?type=prescription_sun')
        
        // Try alternative endpoint from Postman collection
        const fallbackOptions = await getLensOptions({ type: 'prescription_sun', isActive: true })
        
        if (fallbackOptions && fallbackOptions.length > 0) {
          console.log('✅ [API] Found', fallbackOptions.length, 'prescription sun options from fallback endpoint')
          options = fallbackOptions
        } else {
          console.warn('⚠️ [API] Both endpoints returned no data')
          if (import.meta.env.DEV) {
            console.warn('   → This is normal if you haven\'t created prescription sun lenses yet')
            console.warn('   → The API endpoints returned empty arrays')
            console.warn('   → To fix: Create prescription sun lenses via admin panel or API')
          }
          setPrescriptionSunOptions([])
          return
        }
      } else if (lenses && lenses.length > 0) {
        console.log('✅ [API] Found', lenses.length, 'prescription sun lenses from dedicated endpoint')
        
        // Convert PrescriptionSunLens to LensOption format for compatibility
        // Handle structured data with finishes
        options = lenses.flatMap(lens => {
          // If lens has finishes, create options for each finish
          if (lens.finishes && lens.finishes.length > 0) {
            return lens.finishes.map(finish => ({
              id: finish.id,
              name: `${lens.name} - ${finish.name}`,
              slug: finish.slug,
              type: 'prescription_sun',
              description: lens.description,
              basePrice: (lens.basePrice || lens.base_price || 0) + (finish.price || 0),
              base_price: (lens.base_price || lens.basePrice || 0) + (finish.price || 0),
              isActive: true,
              is_active: true,
              colors: finish.colors || [],
              sortOrder: 0,
              sort_order: 0
            }))
          }
          // Otherwise, use lens directly
          return [{
            id: lens.id,
            name: lens.name,
            slug: lens.slug,
            type: 'prescription_sun',
            description: lens.description,
            basePrice: lens.basePrice || lens.base_price,
            base_price: lens.base_price || lens.basePrice,
            isActive: true,
            is_active: true,
            colors: lens.colors || [],
            sortOrder: 0,
            sort_order: 0
          }]
        })
      }
      
      // Log all options
      if (options.length > 0) {
        options.forEach((opt, idx) => {
          console.log(`  [${idx + 1}] ${opt.name} (id: ${opt.id}, colors: ${opt.colors?.length || 0})`)
          if (opt.colors && opt.colors.length > 0) {
            console.log(`    Colors:`, opt.colors.map(c => `${c.name} (${c.hexCode || c.hex_code || 'no hex'})`).join(', '))
          } else {
            console.warn(`    ⚠️ No colors found for ${opt.name}`)
          }
        })
        
        setPrescriptionSunOptions(options)
        console.log('✅ [API] Prescription sun options loaded:', options.length, 'options')
      } else {
        setPrescriptionSunOptions([])
      }
    } catch (error) {
      console.error('❌ [API] Error fetching prescription sun options:', error)
      
      // Try fallback endpoint on error
      try {
        console.log('🔄 [API] Error occurred, trying fallback endpoint: GET /api/lens/options?type=prescription_sun')
        const fallbackOptions = await getLensOptions({ type: 'prescription_sun', isActive: true })
        
        if (fallbackOptions && fallbackOptions.length > 0) {
          console.log('✅ [API] Found', fallbackOptions.length, 'prescription sun options from fallback endpoint')
          setPrescriptionSunOptions(fallbackOptions)
        } else {
          setPrescriptionSunOptions([])
        }
      } catch (fallbackError) {
        console.error('❌ [API] Fallback endpoint also failed:', fallbackError)
        setPrescriptionSunOptions([])
      }
    }
  }

  // Fetch all lens colors from dedicated endpoint
  // GET /api/lens/colors
  const fetchLensColors = async () => {
    try {
      console.log('🔄 [ProductCheckout] fetchLensColors called')
      console.log('🔄 [API] Fetching all lens colors: GET /api/lens/colors')
      
      const colors = await getLensColors()
      
      console.log('🔄 [ProductCheckout] getLensColors returned:', colors?.length || 0, 'colors')
      
      if (colors && colors.length > 0) {
        console.log('✅ [ProductCheckout] Found', colors.length, 'lens colors, setting state')
        console.log('✅ [ProductCheckout] First color:', colors[0])
        setLensColors(colors)
      } else {
        console.log('⚠️ [ProductCheckout] No lens colors found, setting empty array')
        setLensColors([])
      }
    } catch (error) {
      console.error('❌ [ProductCheckout] Error fetching lens colors:', error)
      if (error instanceof Error) {
        console.error('   Error details:', error.message, error.stack)
      }
      setLensColors([])
    }
  }

  // Fetch prescription sun colors from dedicated endpoint
  // GET /api/lens/prescription-sun-colors
  const fetchPrescriptionSunColors = async () => {
    try {
      console.log('🔄 [API] Fetching prescription sun colors: GET /api/lens/prescription-sun-colors')
      
      const colors = await getPrescriptionSunColors()
      
      if (colors && colors.length > 0) {
        console.log('✅ [API] Found', colors.length, 'prescription sun colors from dedicated endpoint')
        setPrescriptionSunColors(colors)
      } else {
        console.log('⚠️ [API] No prescription sun colors found from dedicated endpoint')
        setPrescriptionSunColors([])
      }
    } catch (error) {
      console.error('❌ [API] Error fetching prescription sun colors:', error)
      setPrescriptionSunColors([])
    }
  }

  const fetchProductOptions = async () => {
    try {
      const options = await getProductOptions()
      if (options) {
        setLensOptions(options.lensTypes || [])
        setCoatingOptions(options.lensCoatings || [])
        // Get lens index options from API, or extract from lensTypes if available
        if (options.lensIndexOptions && options.lensIndexOptions.length > 0) {
          setLensIndexOptions(options.lensIndexOptions)
        } else if (options.lensTypes && options.lensTypes.length > 0) {
          // Extract unique index values from lens types
          const uniqueIndexes = [...new Set(options.lensTypes.map(lt => lt.index).filter(idx => idx != null))].sort((a, b) => a - b) as number[]
          setLensIndexOptions(uniqueIndexes)
        } else {
          // Fallback to default values
          setLensIndexOptions([1.50, 1.60, 1.67, 1.74])
        }
      }
    } catch (error) {
      console.error('Error fetching product options:', error)
      // Fallback to default lens index options
      setLensIndexOptions([1.50, 1.60, 1.67, 1.74])
    }
  }

  const fetchSavedPrescriptions = async () => {
    try {
      const prescriptions = await getPrescriptions()
      setSavedPrescriptions(prescriptions || [])
    } catch (error) {
      console.error('Error fetching saved prescriptions:', error)
    }
  }

  const fetchProductCustomizationOptions = async () => {
    try {
      // This is an optional call - if it fails, we continue with getProductConfiguration data
      const options = await getProductCustomizationOptions(product.id)
      if (options) {
        setProductCustomizationOptions(options)
        console.log('✅ Product customization options loaded (optional)')
      } else {
        // This is expected if the endpoint doesn't exist or returns no data
        // We continue using getProductConfiguration as the primary source
        setProductCustomizationOptions(null)
      }
    } catch (error: any) {
      // Silently handle errors - this is an optional endpoint
      // The primary data source is getProductConfiguration
      console.warn('⚠️ Optional: Product customization options unavailable, using product configuration instead')
      setProductCustomizationOptions(null)
    }
  }



  // Helper function for default progressive options (unused - kept for reference)
  // const getDefaultProgressiveOptions = () => [
  //   {
  //     id: 'premium',
  //     name: 'Premium',
  //     price: 52.95,
  //     description: 'Up to 40% wider viewing areas than Standard. Maximum comfort & balanced vision.',
  //     recommended: true,
  //     icon: 'premium'
  //   },
  //   {
  //     id: 'standard',
  //     name: 'Standard',
  //     price: 37.95,
  //     description: 'Perfect for everyday tasks, offering a comfortable and well-balanced view.',
  //     icon: 'standard'
  //   },
  //   {
  //     id: 'mid-range',
  //     name: 'Mid-Range',
  //     price: 37.95,
  //     description: 'Clear vision within 14 ft, ideal for work, dining out or watching TV. Not for driving.',
  //     icon: 'mid-range'
  //   },
  //   {
  //     id: 'near-range',
  //     name: 'Near-Range',
  //     price: 37.95,
  //     description: 'Clear vision within 3 ft, ideal for reading and heavy screen use. Not for driving.',
  //     icon: 'near-range'
  //   }
  // ]

  // Calculate price using API when selections change (debounced)
  useEffect(() => {
    const calculatePrice = async () => {
      if (!product.id) return

      // Only calculate if we have meaningful selections
      const hasSelections = lensSelection.selectedLensTypeId || 
                           lensSelection.treatments.length > 0 ||
                           (prescriptionData.pd_binocular && prescriptionData.od_sphere && prescriptionData.os_sphere)

      if (!hasSelections) {
        setPriceCalculation(null)
        return
      }

      try {
        const customizationData: any = {
          quantity: 1
        }

        // Add lens option if selected
        if (lensSelection.selectedLensTypeId) {
          customizationData.lens_option_id = parseInt(lensSelection.selectedLensTypeId)
        }

        // Add lens color if selected
        if (lensSelection.selectedColorId) {
          customizationData.lens_color_id = parseInt(lensSelection.selectedColorId)
        }

        // Add treatments - only if there are treatments selected
        if (lensSelection.treatments && lensSelection.treatments.length > 0) {
          customizationData.treatment_ids = lensSelection.treatments
            .filter(id => id != null && id !== '')
            .map(id => parseInt(id))
            .filter(id => !isNaN(id))
        }

        // Add prescription data if available
        if (prescriptionData.od_sphere && prescriptionData.os_sphere) {
          customizationData.prescription_lens_type = lensSelection.type
          
          // Add progressive variant ID if a progressive option is selected
          if (lensSelection.type === 'progressive' && lensSelection.progressiveVariantId) {
            customizationData.prescription_lens_variant_id = lensSelection.progressiveVariantId
          }
          
          // Build prescription data based on lens type
          const prescriptionDataPayload: any = {
            od_sphere: parseFloat(prescriptionData.od_sphere),
            od_cylinder: prescriptionData.od_cylinder ? parseFloat(prescriptionData.od_cylinder) : 0,
            od_axis: prescriptionData.od_axis ? parseInt(prescriptionData.od_axis) : undefined,
            os_sphere: parseFloat(prescriptionData.os_sphere),
            os_cylinder: prescriptionData.os_cylinder ? parseFloat(prescriptionData.os_cylinder) : 0,
            os_axis: prescriptionData.os_axis ? parseInt(prescriptionData.os_axis) : undefined,
          }

          // For Progressive Vision, use pd_mm instead of pd_binocular
          if (lensSelection.type === 'progressive') {
            if (prescriptionData.pd_mm) {
              prescriptionDataPayload.pd = parseFloat(prescriptionData.pd_mm)
            }
            // Add progressive-specific fields
            if (prescriptionData.h) {
              prescriptionDataPayload.h = parseFloat(prescriptionData.h)
            }
            if (prescriptionData.select_option) {
              prescriptionDataPayload.add = prescriptionData.select_option
            }
            if (prescriptionData.year_of_birth) {
              prescriptionDataPayload.year_of_birth = parseInt(prescriptionData.year_of_birth)
            }
          } else {
            // For Distance and Near Vision, use pd_binocular
            if (prescriptionData.pd_binocular) {
              prescriptionDataPayload.pd = parseFloat(prescriptionData.pd_binocular)
            }
          }

          customizationData.prescription_data = prescriptionDataPayload

          const priceData = await calculateCustomizationPriceWithPrescription(product.id, customizationData)
          setPriceCalculation({
            total: priceData.total,
            breakdown: priceData.breakdown || []
          })
        } else {
          // Calculate without prescription if no prescription data
          const priceData = await calculateCustomizationPrice(product.id, customizationData)
          setPriceCalculation({
            total: priceData.total,
            breakdown: priceData.breakdown || []
          })
        }
      } catch (error: any) {
        // Check if it's a 404 error (route not found)
        const is404Error = error?.message?.includes('Route not found') || 
                          error?.message?.includes('404') ||
                          error?.message?.includes('not found')
        
        if (is404Error) {
          // Price calculation endpoint not available - use base product price
          if (import.meta.env.DEV) {
            console.warn('⚠️ [API] Price calculation endpoint not available (404). Using base product price.')
          }
          // Fallback to base product price
          setPriceCalculation({
            total: Number(product.price || 0),
            breakdown: [{ item: 'Base Product', price: Number(product.price || 0) }]
          })
        } else {
          console.error('❌ [API] Error calculating price:', error)
          // Fallback to manual calculation
          setPriceCalculation(null)
        }
      }
    }

    // Debounce API calls to avoid too many requests
    const timeoutId = setTimeout(calculatePrice, 500)
    return () => clearTimeout(timeoutId)
  }, [product.id, lensSelection.selectedLensTypeId, lensSelection.selectedColorId, lensSelection.treatments.join(','), lensSelection.type, prescriptionData.pd_binocular, prescriptionData.od_sphere, prescriptionData.os_sphere])

  const loadSavedPrescription = (prescriptionId: number) => {
    const prescription = savedPrescriptions.find(p => p.id === prescriptionId)
    if (prescription) {
      setPrescriptionData({
        pd_binocular: prescription.pd_binocular?.toString() || '',
        od_sphere: prescription.od_sphere?.toString() || '',
        od_cylinder: prescription.od_cylinder?.toString() || '',
        od_axis: prescription.od_axis?.toString() || '',
        os_sphere: prescription.os_sphere?.toString() || '',
        os_cylinder: prescription.os_cylinder?.toString() || '',
        os_axis: prescription.os_axis?.toString() || ''
      })
      setPrescriptionId(prescription.id)
      setSelectedSavedPrescription(prescriptionId)
      // Update lens type if available
      if (prescription.prescription_type) {
        setLensSelection(prev => ({
          ...prev,
          type: prescription.prescription_type as LensSelection['type']
        }))
      }
    }
  }

  const validatePrescription = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // For Progressive Vision, validate pd_mm instead of pd_binocular
    if (lensSelection.type === 'progressive') {
      if (!prescriptionData.pd_mm) {
        newErrors.pd_mm = 'Pupillary Distance is required'
      } else {
        const pd = parseFloat(prescriptionData.pd_mm)
        if (isNaN(pd) || pd <= 0) {
          newErrors.pd_mm = 'PD must be a valid positive number'
        }
      }
    } else {
      // For Distance and Near Vision, validate pd_binocular
    if (!prescriptionData.pd_binocular) {
      newErrors.pd_binocular = 'Pupillary Distance is required'
    } else {
        // For dropdown values, we need to check if it's a valid selection
        // The dropdown shows 1-30, but we should validate the actual PD value
        // Since these are dropdowns, we'll just check if something is selected
        // The actual PD validation should be done on the server side
      }
    }

    // Validate right eye
    if (!prescriptionData.od_sphere) {
      newErrors.od_sphere = 'Right eye sphere is required'
    } else {
      const sphere = parseFloat(prescriptionData.od_sphere)
      if (isNaN(sphere) || sphere < -20 || sphere > 20) {
        newErrors.od_sphere = 'Sphere must be between -20 and +20'
      }
    }

    if (prescriptionData.od_cylinder && prescriptionData.od_cylinder !== '0') {
      if (!prescriptionData.od_axis) {
        newErrors.od_axis = 'Axis is required when cylinder is specified'
      } else {
        const axis = parseInt(prescriptionData.od_axis)
        if (isNaN(axis) || axis < 0 || axis > 180) {
          newErrors.od_axis = 'Axis must be between 0 and 180'
        }
      }
    }

    // Validate left eye
    if (!prescriptionData.os_sphere) {
      newErrors.os_sphere = 'Left eye sphere is required'
    } else {
      const sphere = parseFloat(prescriptionData.os_sphere)
      if (isNaN(sphere) || sphere < -20 || sphere > 20) {
        newErrors.os_sphere = 'Sphere must be between -20 and +20'
      }
    }

    if (prescriptionData.os_cylinder && prescriptionData.os_cylinder !== '0') {
      if (!prescriptionData.os_axis) {
        newErrors.os_axis = 'Axis is required when cylinder is specified'
      } else {
        const axis = parseInt(prescriptionData.os_axis)
        if (isNaN(axis) || axis < 0 || axis > 180) {
          newErrors.os_axis = 'Axis must be between 0 and 180'
        }
      }
    }

    // Validate Progressive Vision specific fields
    if (lensSelection.type === 'progressive') {
      if (!prescriptionData.h) {
        newErrors.h = 'Height (H) is required for progressive lenses'
      }
      if (!prescriptionData.select_option) {
        newErrors.select_option = 'ADD value is required for progressive lenses'
      }
      if (!prescriptionData.year_of_birth) {
        newErrors.year_of_birth = 'Year of birth is required for progressive lenses'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLensTypeChange = (type: 'distance_vision' | 'near_vision' | 'progressive') => {
    setLensSelection(prev => ({ 
      ...prev, 
      type: type as LensSelection['type'], 
      progressiveOption: type !== 'progressive' ? undefined : prev.progressiveOption,
      progressiveVariantId: type !== 'progressive' ? undefined : prev.progressiveVariantId
    }))
  }


  const handleLensThicknessChange = (thickness: 'plastic' | 'glass', materialId?: number) => {
    setLensSelection(prev => {
      // If materialId is undefined and we're clicking the same thickness, deselect it
      if (materialId === undefined && prev.lensThickness === thickness) {
        return {
          ...prev,
          lensThickness: undefined,
          lensThicknessMaterialId: undefined
        }
      }
      // Otherwise, select the new option
      return {
        ...prev,
        lensThickness: thickness,
        lensThicknessMaterialId: materialId
      }
    })
  }

  const handleLensThicknessOptionChange = (option: string) => {
    setLensSelection(prev => ({ ...prev, lensThicknessOption: option }))
  }


  // const handleLensIndexChange = (index: number) => {
  //   setLensSelection(prev => ({ ...prev, lensIndex: index, progressiveOption: undefined, progressiveVariantId: undefined }))
  // }

  const handleProgressiveOptionChange = (optionId: string) => {
    // Find the variant ID for the selected option
    const selectedOption = progressiveOptions.find(opt => opt.id === optionId)
    setLensSelection(prev => ({ 
      ...prev, 
      progressiveOption: optionId, 
      progressiveVariantId: selectedOption?.variantId,
      type: 'progressive' 
    }))
  }

  // const handleCoatingToggle = (coatingSlug: string) => {
  //   setLensSelection(prev => ({
  //     ...prev,
  //     coatings: prev.coatings.includes(coatingSlug)
  //       ? prev.coatings.filter(c => c !== coatingSlug)
  //       : [...prev.coatings, coatingSlug]
  //   }))
  // }

  // Handle removing items from order summary
  const handleRemoveFromSummary = (item: { name: string; price: number; type: string; id?: string | number; removable?: boolean }) => {
    if (!item.removable || !item.id) return

    // Remove based on item type
    if (item.type === 'lens_thickness') {
      setLensSelection(prev => ({
        ...prev,
        lensThickness: undefined,
        lensThicknessMaterialId: undefined
      }))
    } else if (item.type === 'coating') {
      const coatingSlug = String(item.id).replace('coating_', '')
      setLensSelection(prev => ({
        ...prev,
        coatings: prev.coatings.filter(c => c !== coatingSlug)
      }))
    } else if (item.type === 'treatment') {
      const treatmentId = String(item.id).replace('treatment_', '')
      setLensSelection(prev => ({
        ...prev,
        treatments: prev.treatments.filter(t => t !== treatmentId)
      }))
    } else if (item.type === 'lens_type') {
      if (String(item.id).startsWith('progressive_')) {
        setLensSelection(prev => ({
          ...prev,
          progressiveOption: undefined,
          progressiveVariantId: undefined
        }))
      } else {
        setLensSelection(prev => ({
          ...prev,
          selectedLensTypeId: undefined,
          selectedColorId: undefined,
          selectedColor: undefined
        }))
      }
    }
  }

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    setIsApplyingCoupon(true)
    setCouponError('')

    try {
      // Calculate subtotal from order summary (excluding shipping)
      const subtotal = orderSummary
        .filter(item => item.type !== 'shipping')
        .reduce((sum, item) => sum + (Number(item.price) || 0), 0)

      // Build cart items for coupon API
      const cartItemsForCoupon: CartItemForCoupon[] = [{
        product_id: product.id,
        quantity: 1,
        unit_price: subtotal
      }]

      const result = await applyCoupon(couponCode, subtotal, cartItemsForCoupon)

      setAppliedCoupon(result)
      setCouponError('')
    } catch (error: any) {
      // Display the actual error message from the backend
      setAppliedCoupon(null)
      setCouponError(error?.message || 'Invalid or expired coupon code')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
    setCouponError('')
  }

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (appliedCoupon) {
      return appliedCoupon.discount_amount || 0
    }
    return 0
  }

  // Calculate subtotal (before discount and shipping)
  const getSubtotal = () => {
    return orderSummary
      .filter(item => item.type !== 'shipping')
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  }

  // Calculate final total (with coupon discount and shipping)
  const getFinalTotal = () => {
    const subtotal = getSubtotal()
    const discount = getDiscountAmount()
    const shipping = selectedShippingMethod ? (Number(selectedShippingMethod.price) || 0) : 0
    
    if (appliedCoupon) {
      // Use coupon's final_total and add shipping
      return (appliedCoupon.final_total || 0) + shipping
    }
    
    return subtotal - discount + shipping
  }

  // Update order summary whenever selections change
  const updateOrderSummary = useCallback(() => {
    const summary: Array<{ name: string; price: number; type: 'product' | 'lens_type' | 'coating' | 'treatment' | 'lens_thickness' | 'shipping'; id?: string | number; removable?: boolean }> = []
    
    // Add base product (not removable)
    const basePrice = product.sale_price && Number(product.sale_price) < Number(product.price)
      ? Number(product.sale_price)
      : Number(product.price) || 0
    summary.push({
      name: product.name || 'Product',
      price: basePrice,
      type: 'product',
      id: 'product',
      removable: false
    })

    // Add selected lens type from API
    if (lensSelection.selectedLensTypeId) {
      const selectedLensType = apiLensTypes.find(lt => lt.id === lensSelection.selectedLensTypeId)
      if (selectedLensType) {
        const price = selectedLensType.price || 0
        summary.push({
          name: `${selectedLensType.name || 'Lens Type'}${lensSelection.selectedColor && lensSelection.selectedColor.name ? ` (${lensSelection.selectedColor.name})` : ''}`,
          price: price,
          type: 'lens_type',
          id: `lens_type_${lensSelection.selectedLensTypeId}`,
          removable: true
        })
      }
    }
    

    // Add selected coatings
    lensSelection.coatings.forEach(coatingSlug => {
      const coating = coatingOptions.find(c => c.slug === coatingSlug)
      if (coating) {
        summary.push({
          name: coating.name,
          price: Number(coating.price_adjustment) || 0,
          type: 'coating',
          id: `coating_${coatingSlug}`,
          removable: true
        })
      }
    })

    // Add lens thickness material from API
    if (lensSelection.lensThicknessMaterialId) {
      const selectedMaterial = lensThicknessMaterials.find(m => m.id === lensSelection.lensThicknessMaterialId)
      if (selectedMaterial) {
        summary.push({
          name: selectedMaterial.name,
          price: selectedMaterial.price || 0,
          type: 'lens_thickness',
          id: `lens_thickness_${lensSelection.lensThicknessMaterialId}`,
          removable: true
        })
      }
    } else if (lensSelection.lensThickness) {
      // Fallback to hardcoded values if material ID not found
    if (lensSelection.lensThickness === 'plastic') {
      summary.push({
        name: 'Unbreakable (Plastic)',
        price: 30.00,
          type: 'lens_thickness',
          id: 'lens_thickness_plastic',
          removable: true
      })
    } else if (lensSelection.lensThickness === 'glass') {
      summary.push({
        name: 'Minerals (Glass)',
        price: 60.00,
          type: 'lens_thickness',
          id: 'lens_thickness_glass',
          removable: true
      })
      }
    }

    // Add progressive option price - use actual variant name from API
    if (lensSelection.progressiveOption) {
      const progressiveOption = progressiveOptions.find(opt => opt.id === lensSelection.progressiveOption)
      if (progressiveOption) {
        const price = progressiveOption.price || 0
        // Use the actual variant name from API (e.g., "Premium Progressive", "Standard Progressive")
        const variantName = progressiveOption.name || `Progressive - ${lensSelection.progressiveOption.charAt(0).toUpperCase() + lensSelection.progressiveOption.slice(1)}`
      if (price > 0) {
        summary.push({
            name: variantName,
          price: price,
          type: 'lens_type',
          id: `progressive_${lensSelection.progressiveOption}`,
          removable: true
        })
        }
      }
    }

    // Add selected treatments from API
    lensSelection.treatments.forEach(treatmentId => {
      const treatment = configTreatments.find(t => t.id.toString() === treatmentId) || 
                        apiTreatments.find(t => t.id === treatmentId)
      if (treatment) {
        summary.push({
          name: treatment.name,
          price: treatment.price || 0,
          type: 'treatment',
          id: `treatment_${treatmentId}`,
          removable: true
        })
      }
    })

    // Add photochromic color selection
    if (lensSelection.photochromicColor) {
      // Find the photochromic option that contains this color
      const photochromicOption = photochromicOptions.find(opt => 
        opt.colors?.some(color => color.id.toString() === lensSelection.photochromicColor?.id)
      )
      if (photochromicOption) {
        const selectedColor = photochromicOption.colors?.find(c => c.id.toString() === lensSelection.photochromicColor?.id);
        // Support both camelCase and snake_case for priceAdjustment
        const colorPrice = (selectedColor as any)?.priceAdjustment !== undefined 
          ? (selectedColor as any).priceAdjustment 
          : (selectedColor as any)?.price_adjustment || 0;
        // The mapped photochromicOption has a 'price' property (base price)
        const totalPrice = (photochromicOption as any).price + colorPrice;
        if (totalPrice > 0 && lensSelection.photochromicColor && lensSelection.photochromicColor.name) {
          summary.push({
            name: `Photochromic - ${lensSelection.photochromicColor.name}`,
            price: totalPrice,
            type: 'treatment',
            id: `photochromic_${lensSelection.photochromicColor.id || 'unknown'}`,
            removable: true
          })
        }
      }
    }

    // Add prescription sun color selection
    if (lensSelection.prescriptionSunColor) {
      // Find the prescription sun option that contains this color
      // Note: prescriptionSunOptions are mapped to a different structure with subOptions
      const prescriptionSunOption = (prescriptionSunOptions as any[]).find((opt: any) => {
        if (opt.subOptions) {
          return opt.subOptions.some((subOpt: any) => 
            subOpt.colors?.some((color: any) => color.id.toString() === lensSelection.prescriptionSunColor?.id)
          )
        }
        return false
      })
      if (prescriptionSunOption) {
        // Find the sub-option and color
        let colorPrice = 0
        let basePrice = prescriptionSunOption.price || 0
        for (const subOpt of prescriptionSunOption.subOptions || []) {
          const color = subOpt.colors?.find((c: any) => c.id.toString() === lensSelection.prescriptionSunColor?.id)
          if (color) {
            colorPrice = subOpt.price || 0
            break
          }
        }
        const totalPrice = basePrice + colorPrice
        if (totalPrice > 0 && lensSelection.prescriptionSunColor && lensSelection.prescriptionSunColor.name) {
          summary.push({
            name: `Prescription Sun - ${lensSelection.prescriptionSunColor.name}`,
            price: totalPrice,
            type: 'treatment',
            id: `prescription_sun_${lensSelection.prescriptionSunColor.id || 'unknown'}`,
            removable: true
          })
        }
      }
    }

    // Add selected shipping method
    if (selectedShippingMethod) {
      summary.push({
        name: selectedShippingMethod.name,
        price: selectedShippingMethod.price || 0,
        type: 'shipping',
        id: `shipping_${selectedShippingMethod.id}`,
        removable: false
      })
    }

    setOrderSummary(summary)
  }, [lensSelection, apiLensTypes, apiTreatments, configTreatments, coatingOptions, product, progressiveOptions, lensThicknessMaterials, selectedShippingMethod, photochromicOptions, prescriptionSunOptions])

  const handleTreatmentToggle = (treatmentId: string) => {
    setLensSelection(prev => ({
      ...prev,
      // Only one standard treatment can be selected at a time (photochromic and prescription sun are separate)
      treatments: prev.treatments.includes(treatmentId)
        ? [] // Deselect if clicking the same treatment
        : [treatmentId] // Replace with new selection
    }))
  }

  // const handleLensTypeSelect = (lensTypeId: string, colorId: string, color: { id: string; name: string; color: string; gradient?: boolean }) => {
  //   setLensSelection(prev => ({
  //     ...prev,
  //     selectedLensTypeId: lensTypeId,
  //     selectedColorId: colorId,
  //     selectedColor: color
  //   }))
  // }

  // Update order summary when selections change
  useEffect(() => {
    updateOrderSummary()
  }, [updateOrderSummary])

  const handlePrescriptionChange = (field: keyof PrescriptionFormData, value: string) => {
    setPrescriptionData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate pd_mm when both pd_binocular (left) and pd_right are filled
      if (field === 'pd_binocular' || field === 'pd_right') {
        const leftPD = field === 'pd_binocular' ? value : prev.pd_binocular
        const rightPD = field === 'pd_right' ? value : prev.pd_right
        
        // If both are filled and are valid numbers, calculate the sum
        if (leftPD && rightPD) {
          const leftNum = parseFloat(leftPD)
          const rightNum = parseFloat(rightPD)
          
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            updated.pd_mm = (leftNum + rightNum).toString()
          }
        } else {
          // If either is cleared, clear pd_mm
          updated.pd_mm = ''
        }
      }
      
      return updated
    })
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCheckoutNow = () => {
    setCheckoutMode('checkout')
    // Navigate to summary first, then shipping
    if (currentStep === 'treatment' || currentStep === 'summary') {
      setCurrentStep('shipping')
    } else {
      // Continue through normal flow, then go to shipping
      handleNext()
    }
  }

  const handleNext = async () => {
    if (currentStep === 'lens_type') {
      // Navigate based on lens type selection
      if (lensSelection.type === 'progressive') {
        setCurrentStep('progressive')
      } else {
        setCurrentStep('prescription')
      }
    } else if (currentStep === 'progressive') {
      // After selecting progressive option, go to prescription
      setCurrentStep('prescription')
    } else if (currentStep === 'prescription') {
      // Client-side validation first
      if (!validatePrescription()) {
        return
      }
      setCurrentStep('lens_thickness')
    } else if (currentStep === 'lens_thickness') {
      setCurrentStep('treatment')
    } else if (currentStep === 'treatment') {
      if (checkoutMode === 'checkout') {
        setCurrentStep('shipping')
      } else {
        setCurrentStep('summary')
      }
    } else if (currentStep === 'summary') {
      if (checkoutMode === 'checkout') {
        setCurrentStep('shipping')
      }
    } else if (currentStep === 'shipping') {
      setCurrentStep('payment')
    }
  }

  const handleBack = () => {
    if (currentStep === 'progressive') {
      setCurrentStep('lens_type')
    } else if (currentStep === 'prescription') {
      if (lensSelection.type === 'progressive') {
        setCurrentStep('progressive')
      } else {
        setCurrentStep('lens_type')
      }
    } else if (currentStep === 'lens_thickness') {
      setCurrentStep('prescription')
    } else if (currentStep === 'treatment') {
      setCurrentStep('lens_thickness')
    } else if (currentStep === 'summary') {
      setCurrentStep('treatment')
    } else if (currentStep === 'shipping') {
      setCurrentStep('summary')
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping')
    }
  }

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      let finalPrescriptionId = prescriptionId

      // If user is authenticated, save prescription (if not using saved one)
      if (isAuthenticated && !selectedSavedPrescription) {
        const prescriptionPayload: PrescriptionData = {
          prescription_type: lensSelection.type,
          od_sphere: parseFloat(prescriptionData.od_sphere),
          od_cylinder: prescriptionData.od_cylinder ? parseFloat(prescriptionData.od_cylinder) : 0,
          od_axis: prescriptionData.od_axis ? parseInt(prescriptionData.od_axis) : undefined,
          os_sphere: parseFloat(prescriptionData.os_sphere),
          os_cylinder: prescriptionData.os_cylinder ? parseFloat(prescriptionData.os_cylinder) : 0,
          os_axis: prescriptionData.os_axis ? parseInt(prescriptionData.os_axis) : undefined,
        }

        // Add PD based on lens type
        if (lensSelection.type === 'progressive') {
          if (prescriptionData.pd_mm) {
            prescriptionPayload.pd_binocular = parseFloat(prescriptionData.pd_mm)
          }
          // Add progressive-specific fields
          if (prescriptionData.h) {
            prescriptionPayload.ph_od = parseFloat(prescriptionData.h)
            prescriptionPayload.ph_os = parseFloat(prescriptionData.h)
          }
          if (prescriptionData.select_option) {
            prescriptionPayload.od_add = prescriptionData.select_option
            prescriptionPayload.os_add = prescriptionData.select_option
          }
        } else {
          if (prescriptionData.pd_binocular) {
            prescriptionPayload.pd_binocular = parseFloat(prescriptionData.pd_binocular)
          }
        }

        const result = await createPrescription(prescriptionPayload)
        if (result.success && result.prescription) {
          finalPrescriptionId = result.prescription.id
          setPrescriptionId(result.prescription.id)
        }
      }

      // Calculate final price with lens options
      // Ensure basePrice is a number, not a string
      const basePriceRaw: string | number = product.sale_price && Number(product.sale_price) < Number(product.price)
        ? product.sale_price 
        : product.price
      
      const basePrice = typeof basePriceRaw === 'string'
        ? parseFloat(String(basePriceRaw).replace(/[^0-9.]/g, '')) || 0
        : Number(basePriceRaw) || 0

      let finalPrice: number = basePrice
      
      // Add lens type price adjustment
      // For progressive lenses, use the progressive option price
      if (lensSelection.progressiveOption) {
        const progressiveOption = progressiveOptions.find(opt => opt.id === lensSelection.progressiveOption)
        if (progressiveOption) {
          const priceValue: string | number | undefined = progressiveOption.price
          const progressivePrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
        finalPrice += progressivePrice
        }
      } else if (lensSelection.lensIndex) {
        // For regular lens index selection
        const selectedLensType = lensOptions.find(lt => lt.index === lensSelection.lensIndex)
        if (selectedLensType && selectedLensType.price_adjustment != null) {
          const priceValue: string | number | undefined = selectedLensType.price_adjustment
          const lensPrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
          finalPrice += lensPrice
          // Store the lens type ID for API
          lensSelection.lensTypeId = selectedLensType.id
        }
      }

      // Add coating price adjustments
      lensSelection.coatings.forEach(coatingSlug => {
        const coating = coatingOptions.find(c => c.slug === coatingSlug)
        if (coating && coating.price_adjustment != null) {
          const priceValue: string | number | undefined = coating.price_adjustment
          const coatingPrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
          finalPrice += coatingPrice
        }
      })

      // Add lens thickness price from API
      if (lensSelection.lensThicknessMaterialId) {
        const selectedMaterial = lensThicknessMaterials.find(m => m.id === lensSelection.lensThicknessMaterialId)
        if (selectedMaterial && selectedMaterial.price != null) {
          const priceValue: string | number | undefined = selectedMaterial.price
          const materialPrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
          finalPrice += materialPrice
        }
      } else if (lensSelection.lensThickness) {
        // Fallback to slug-based lookup if material ID not available
        const materialSlug = lensSelection.lensThickness === 'plastic' ? 'plastic' : 'glass'
        const selectedMaterial = lensThicknessMaterials.find(m => m.slug === materialSlug)
        if (selectedMaterial && selectedMaterial.price != null) {
          const priceValue: string | number | undefined = selectedMaterial.price
          const materialPrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
          finalPrice += materialPrice
        }
      }

      // Add treatment price adjustments from API
      lensSelection.treatments.forEach(treatmentId => {
        const treatment = apiTreatments.find(t => t.id === treatmentId)
        if (treatment && treatment.price != null) {
          const priceValue: string | number | undefined = treatment.price
          const treatmentPrice = typeof priceValue === 'string'
            ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
            : Number(priceValue) || 0
          finalPrice += treatmentPrice
        }
      })

      // Add shipping method price to final price
      if (selectedShippingMethod && selectedShippingMethod.price != null) {
        const priceValue = selectedShippingMethod.price
        const shippingPrice = typeof priceValue === 'string'
          ? parseFloat(String(priceValue).replace(/[^0-9.]/g, '')) || 0
          : Number(priceValue) || 0
        finalPrice += shippingPrice
      }

      // If authenticated, add to cart via API
      if (isAuthenticated) {
        // Build prescription data for cart
        // Construct od and os objects separately to avoid initialization issues
        const odData = {
          sph: parseFloat(prescriptionData.od_sphere),
          cyl: prescriptionData.od_cylinder ? parseFloat(prescriptionData.od_cylinder) : undefined,
          axis: prescriptionData.od_axis ? parseInt(prescriptionData.od_axis) : undefined
        }
        
        const osData = {
          sph: parseFloat(prescriptionData.os_sphere),
          cyl: prescriptionData.os_cylinder ? parseFloat(prescriptionData.os_cylinder) : undefined,
          axis: prescriptionData.os_axis ? parseInt(prescriptionData.os_axis) : undefined
        }
        
        const cartPrescriptionData: CartPrescriptionData = {
          pd: lensSelection.type === 'progressive' && prescriptionData.pd_mm
            ? parseFloat(prescriptionData.pd_mm)
            : prescriptionData.pd_binocular
            ? parseFloat(prescriptionData.pd_binocular)
            : undefined,
          pd_right: lensSelection.type === 'progressive' && prescriptionData.pd_right
            ? parseFloat(prescriptionData.pd_right)
            : undefined,
          h: lensSelection.type === 'progressive' && prescriptionData.h
            ? parseFloat(prescriptionData.h)
            : undefined,
          year_of_birth: lensSelection.type === 'progressive' && prescriptionData.year_of_birth
            ? parseInt(prescriptionData.year_of_birth)
            : undefined,
          od: odData,
          os: osData
        }

        // Get lens thickness material ID
        let lensThicknessMaterialId: number | undefined
        if (lensSelection.lensThickness === 'plastic') {
          const material = lensThicknessMaterials.find(m => m.slug === 'unbreakable-plastic' || (m.name && m.name.toLowerCase().includes('plastic')))
          lensThicknessMaterialId = material?.id
        } else if (lensSelection.lensThickness === 'glass') {
          const material = lensThicknessMaterials.find(m => m.slug === 'minerals-glass' || (m.name && m.name.toLowerCase().includes('glass')))
          lensThicknessMaterialId = material?.id
        }

        // Get lens thickness option ID
        let lensThicknessOptionId: number | undefined
        if (lensSelection.lensThicknessOption) {
          const option = lensThicknessOptions.find(o => 
            lensSelection.lensThicknessOption?.includes(o.thicknessValue.toString())
          )
          lensThicknessOptionId = option?.id
        }

        // Convert treatment IDs from strings to numbers
        const treatmentIds = lensSelection.treatments
          .map(id => {
            // Try to find treatment in configTreatments
            const treatment = configTreatments.find(t => t.id.toString() === id || t.slug === id)
            return treatment ? treatment.id : parseInt(id)
          })
          .filter(id => !isNaN(id)) as number[]

        // Get color IDs - use the ID directly from the selected color object
        // The color ID comes from the lens options API response
        const photochromicColorId = lensSelection.photochromicColor 
          ? (parseInt(lensSelection.photochromicColor.id) || null)
          : null
        const prescriptionSunColorId = lensSelection.prescriptionSunColor
          ? (parseInt(lensSelection.prescriptionSunColor.id) || null)
          : null

        // Map lens type to valid API type
        const apiLensType = lensSelection.type === 'progressive' ? 'progressive' :
                           lensSelection.type === 'distance_vision' ? 'distance_vision' :
                           lensSelection.type === 'near_vision' ? 'near_vision' :
                           undefined

        // Get selected color variant details if color is selected
        const selectedColorVariant = selectedProductColor && product.color_images
          ? product.color_images.find(ci => {
              const selectedColorLower = (selectedProductColor || '').toLowerCase()
              return (ci.color && ci.color.toLowerCase() === selectedColorLower) ||
                     (ci.name && ci.name.toLowerCase() === selectedColorLower)
            })
          : null

        const cartResult = await addItemToCart({
          product_id: product.id || 0,
          quantity: 1,
          selected_color: selectedProductColor || undefined, // Pass selected product color variant
          lens_type: apiLensType,
          prescription_data: cartPrescriptionData,
          progressive_variant_id: lensSelection.progressiveVariantId,
          lens_thickness_material_id: lensThicknessMaterialId,
          lens_thickness_option_id: lensThicknessOptionId,
          treatment_ids: treatmentIds.length > 0 ? treatmentIds : undefined,
          photochromic_color_id: photochromicColorId,
          prescription_sun_color_id: prescriptionSunColorId,
          shipping_method_id: selectedShippingMethod?.id,
          customization: {
            // Store color variant details if available
            ...(selectedColorVariant ? {
              selected_color: selectedProductColor,
              color_name: selectedColorVariant.name,
              color_display_name: selectedColorVariant.display_name,
              variant_price: selectedColorVariant.price,
              variant_images: selectedColorVariant.images
            } : {})
          }
        })

        if (!cartResult.success) {
          throw new Error(cartResult.message || 'Failed to add item to cart')
        }
      }

      // Also add to local cart for immediate UI update (for both authenticated and guest users)
      // Ensure finalPrice is a proper number (not string concatenation)
      const finalPriceNumber = typeof finalPrice === 'string' 
        ? parseFloat(String(finalPrice).replace(/[^0-9.]/g, '')) || 0
        : Number(finalPrice) || 0
      
      const cartProduct = {
        id: product.id || 0,
        name: product.name || '',
        brand: product.brand || '',
        category: product.category?.slug || 'eyeglasses',
        price: finalPriceNumber, // Ensure it's a number, not a string
        image: getProductImageUrl(product, selectedImageIndex),
        description: product.description || '',
        inStock: product.in_stock || false,
        rating: product.rating ? Number(product.rating) : undefined,
        hasLensCustomization: true, // Flag to identify products with lens customizations
        // Additional fields for API
        lens_index: lensSelection.lensIndex,
        lens_type: lensSelection.type,
        lens_coatings: lensSelection.coatings,
        prescription_id: finalPrescriptionId,
        // Store in a way that can be accessed later
        customization: {
          lensType: lensSelection.type,
          lensIndex: lensSelection.lensIndex,
          lensTypeId: lensSelection.lensTypeId,
          progressiveOption: lensSelection.progressiveOption,
          lensThickness: lensSelection.lensThickness,
          lensThicknessOption: lensSelection.lensThicknessOption,
          coatings: lensSelection.coatings,
          treatments: lensSelection.treatments,
          prescription: prescriptionData,
          prescriptionId: finalPrescriptionId,
          // Store shipping method info
          shippingMethod: selectedShippingMethod ? {
            id: selectedShippingMethod.id,
            name: selectedShippingMethod.name,
            price: selectedShippingMethod.price || 0,
            estimatedDays: selectedShippingMethod.estimated_days || selectedShippingMethod.estimatedDays,
            description: selectedShippingMethod.description,
            type: selectedShippingMethod.type
          } : undefined
        }
      } as any

      // Debug: Log the price being added
      if (import.meta.env.DEV) {
        console.log('🔍 Adding product to cart:', {
          productName: product.name,
          basePrice: basePrice,
          finalPrice: finalPrice,
          finalPriceNumber: finalPriceNumber,
          lensSelection: lensSelection.type,
          progressiveOption: lensSelection.progressiveOption,
          cartProduct: cartProduct
        })
      }

      addToCart(cartProduct)
      
      // Navigate to cart or close modal
      if (onClose) {
        onClose()
      } else {
        navigate('/shop/cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add product to cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Create order directly - matches Postman collection structure
  const handleCreateOrder = async () => {
    setIsProcessingOrder(true)
    setOrderError(null)
    
    try {
      // Validate shipping address
      if (!shippingAddress.first_name || !shippingAddress.last_name || 
          !shippingAddress.email || !shippingAddress.phone ||
          !shippingAddress.address || !shippingAddress.city || 
          !shippingAddress.zip_code || !shippingAddress.country) {
        setOrderError('Please fill in all shipping address fields')
        setIsProcessingOrder(false)
        return
      }

      let finalPrescriptionId = prescriptionId

      // If user is authenticated, save prescription (if not using saved one)
      if (isAuthenticated && !selectedSavedPrescription) {
        const prescriptionPayload: PrescriptionData = {
          prescription_type: lensSelection.type,
          od_sphere: parseFloat(prescriptionData.od_sphere),
          od_cylinder: prescriptionData.od_cylinder ? parseFloat(prescriptionData.od_cylinder) : 0,
          od_axis: prescriptionData.od_axis ? parseInt(prescriptionData.od_axis) : undefined,
          os_sphere: parseFloat(prescriptionData.os_sphere),
          os_cylinder: prescriptionData.os_cylinder ? parseFloat(prescriptionData.os_cylinder) : 0,
          os_axis: prescriptionData.os_axis ? parseInt(prescriptionData.os_axis) : undefined,
        }

        // Add PD based on lens type
        if (lensSelection.type === 'progressive') {
          if (prescriptionData.pd_mm) {
            prescriptionPayload.pd_binocular = parseFloat(prescriptionData.pd_mm)
          }
          if (prescriptionData.h) {
            prescriptionPayload.ph_od = parseFloat(prescriptionData.h)
            prescriptionPayload.ph_os = parseFloat(prescriptionData.h)
          }
          if (prescriptionData.select_option) {
            prescriptionPayload.od_add = prescriptionData.select_option
            prescriptionPayload.os_add = prescriptionData.select_option
          }
        } else {
          if (prescriptionData.pd_binocular) {
            prescriptionPayload.pd_binocular = parseFloat(prescriptionData.pd_binocular)
          }
        }

        const result = await createPrescription(prescriptionPayload)
        if (result.success && result.prescription) {
          finalPrescriptionId = result.prescription.id
          setPrescriptionId(result.prescription.id)
        }
      }

      // Build order items matching Postman collection structure
      const orderItems = [{
        product_id: product.id,
        quantity: 1,
        lens_index: lensSelection.lensIndex || undefined,
        lens_coatings: lensSelection.coatings.length > 0 ? lensSelection.coatings : undefined,
        // Add treatment IDs if available
        ...(lensSelection.treatments && lensSelection.treatments.length > 0 && {
          treatment_ids: lensSelection.treatments.map(id => parseInt(id)).filter(id => !isNaN(id))
        })
      }]

      // Build shipping address matching Postman collection structure
      const shippingAddr = {
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || shippingAddress.zip_code, // Use state if provided, fallback to zip_code
        zip: shippingAddress.zip_code,
        country: shippingAddress.country
      }

      // Build order payload matching Postman collection structure
      const orderPayload = {
        cart_items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          lens_index: item.lens_index,
          lens_coatings: item.lens_coatings,
          prescription_id: finalPrescriptionId || null,
          customization: {
            lensType: lensSelection.type,
            treatments: lensSelection.treatments,
            lensThicknessMaterialId: lensSelection.lensThicknessMaterialId
          }
        })),
        shipping_address: {
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          zip_code: shippingAddress.zip_code,
          country: shippingAddress.country
        },
        billing_address: {
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          zip_code: shippingAddress.zip_code,
          country: shippingAddress.country
        },
        payment_method: (paymentMethod || 'stripe').toLowerCase(), // Backend expects lowercase (stripe, paypal, cod)
        shipping_method_id: selectedShippingMethod?.id, // Include shipping method ID
        coupon_code: appliedCoupon ? couponCode : undefined // Include coupon code if applied
      }

      // Use appropriate order creation function based on authentication status
      let order: any = null
      let orderError: string | null = null
      
      if (isAuthenticated) {
        // Authenticated user - use createOrder
        order = await createOrder(orderPayload)
        if (!order) {
          orderError = 'Failed to create order. Please check your authentication and try again.'
        }
      } else {
        // Guest user - use createGuestOrder with customer details
        // Note: If backend doesn't support guest checkout, user will need to login
        order = await createGuestOrder({
          ...orderPayload,
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          zip_code: shippingAddress.zip_code,
          country: shippingAddress.country,
          payment_info: {
            payment_method: (paymentMethod || 'stripe').toLowerCase() // Backend expects lowercase (stripe, paypal, cod)
          }
        })
        
        if (!order) {
          // Check if it's an authorization error - prompt user to login
          orderError = 'Please login to complete your order. Guest checkout may not be available.'
        }
      }

      if (!order) {
        setOrderError(orderError || 'Failed to create order. Please try again or contact support.')
        setIsProcessingOrder(false)
        return
      }

      setCreatedOrder(order)

      // If payment method is Stripe, redirect to payment page
      if (paymentMethod && paymentMethod.toLowerCase() === 'stripe' && order.id) {
        // Close modal if open
        if (onClose) {
          onClose()
        }
        // Navigate to payment page
        navigate(`/payment?orderId=${order.id}`)
      } else {
        // For other payment methods (PayPal, COD), show success and navigate to order
        if (onClose) {
          onClose()
        }
        navigate(`/customer/orders/${order.id}`)
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      
      // Extract error message from API response if available
      let errorMessage = 'Failed to create order. Please try again.'
      
      if (error.response) {
        // If error has response object
        errorMessage = error.response.message || error.response.error || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Check for authorization errors specifically
      if (errorMessage && (errorMessage.toLowerCase().includes('not authorized') || 
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('401'))) {
        if (!isAuthenticated) {
          errorMessage = 'Please login to complete your order. Guest checkout requires authentication.'
        } else {
          errorMessage = 'Your session has expired. Please login again and try completing your order.'
        }
      }
      
      setOrderError(errorMessage)
    } finally {
      setIsProcessingOrder(false)
    }
  }

  // Get product images (unused - kept for reference)
  // const productImages: string[] = (() => {
  //   if (product.images) {
  //     if (typeof product.images === 'string') {
  //       try {
  //         return JSON.parse(product.images)
  //       } catch {
  //         return [product.images]
  //       }
  //     }
  //     if (Array.isArray(product.images)) {
  //       return product.images
  //     }
  //   }
  //   return [product.image || product.image_url || '/assets/images/frame1.png']
  // })()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-3xl font-bold text-gray-900">{product.name}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 border border-gray-200 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {orderSummary.length === 0 ? (
                  <p className="text-sm text-gray-500">No items selected</p>
                ) : (
                  orderSummary.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center text-sm pb-2 border-b border-gray-100 last:border-0 group">
                      <span className="text-gray-700 flex-1 pr-2">{item.name}</span>
                      <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium whitespace-nowrap">
                        {item.price > 0 ? `+$${item.price.toFixed(2)}` : 'Free'}
                      </span>
                        {item.removable && (
                          <button
                            onClick={() => handleRemoveFromSummary(item)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Shipping Method Selection */}
              {shippingMethods.length > 0 && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {t('common.shipping')}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedShippingMethod?.id === method.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-method"
                          checked={selectedShippingMethod?.id === method.id}
                          onChange={() => setSelectedShippingMethod(method)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{method.name}</div>
                              {method.description && (
                                <div className="text-xs text-gray-600 mt-0.5 truncate">{method.description}</div>
                              )}
                              {(method.estimated_days || method.estimatedDays) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {(method.estimated_days || method.estimatedDays)} {t('shop.businessDays', 'business days')}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-2">
                              {method.price === 0 ? (
                                <span className="text-green-600">{t('shop.free', 'Free')}</span>
                              ) : (
                                `$${method.price.toFixed(2)}`
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {shippingLoading && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="text-sm text-gray-500">{t('shop.loadingShipping', 'Loading shipping options...')}</div>
                </div>
              )}

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Have a coupon code?</h3>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase())
                        setCouponError('')
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCoupon()
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">
                        {couponCode} Applied
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-sm text-red-600">{couponError}</p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('shop.paymentMethod', 'Payment Method')}
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'stripe', name: 'Credit/Debit Card', description: 'Pay securely with Stripe', icon: '💳' },
                    { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal account', icon: '🔵' },
                    { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '💵' }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{method.name}</div>
                              {method.description && (
                                <div className="text-xs text-gray-600 mt-0.5">{method.description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-300 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500">
                    {t('common.subtotal')} ({orderSummary.filter(item => item.type !== 'shipping').length} {t('shop.items', 'items')})
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${getSubtotal().toFixed(2)}
                  </div>
                </div>
                {appliedCoupon && getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-green-600 font-medium">
                      Discount ({couponCode})
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      -${getDiscountAmount().toFixed(2)}
                    </div>
                  </div>
                )}
                {selectedShippingMethod && (
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                      {t('common.shipping')} 
                      {selectedShippingMethod.name && (
                        <span className="ml-1 text-xs text-gray-400">({selectedShippingMethod.name})</span>
                      )}
                      {(selectedShippingMethod.estimated_days || selectedShippingMethod.estimatedDays) && (
                        <span className="ml-1 text-xs text-gray-400">
                          - {(selectedShippingMethod.estimated_days || selectedShippingMethod.estimatedDays)} {t('shop.businessDays', 'business days')}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-medium ${selectedShippingMethod.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {selectedShippingMethod.price === 0 ? t('shop.free', 'Free') : `$${selectedShippingMethod.price.toFixed(2)}`}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-1 mt-3">{t('shop.estimateTotal', 'Estimate Total')}</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${getFinalTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Product Image */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex-1 flex items-center justify-center relative" style={{ minHeight: '500px' }}>
              <img
                key={`product-${product.id}-img-${selectedImageIndex}-${selectedProductColor || 'default'}`}
                src={getColorSpecificImageUrl(product, selectedImageIndex)}
                alt={product.name}
                className="w-full h-full object-contain p-8"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/assets/images/frame1.png'
                }}
              />
              {/* Color overlay effect on lenses - positioned over lens area */}
              {(() => {
                // Priority: prescription sun color > photochromic color > selected color
                const activeColor = lensSelection.prescriptionSunColor || 
                                  lensSelection.photochromicColor || 
                                  lensSelection.selectedColor
                
                if (!activeColor) return null
                
                return (
                <>
                  {/* Left lens overlay */}
                  <div 
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: '25%',
                      top: '35%',
                      width: '20%',
                      height: '25%',
                      borderRadius: '50%',
                        background: activeColor.gradient
                          ? activeColor.color
                          : activeColor.color,
                      opacity: 0.7,
                      mixBlendMode: 'multiply',
                      filter: 'blur(2px)'
                    }}
                  />
                  {/* Right lens overlay */}
                  <div 
                    className="absolute pointer-events-none z-10"
                    style={{
                      right: '25%',
                      top: '35%',
                      width: '20%',
                      height: '25%',
                      borderRadius: '50%',
                        background: activeColor.gradient
                          ? activeColor.color
                          : activeColor.color,
                      opacity: 0.7,
                      mixBlendMode: 'multiply',
                      filter: 'blur(2px)'
                    }}
                  />
                </>
                )
              })()}
            </div>
            
            {/* Product name and base price */}
            <div className="mt-4">
              <div className="text-lg font-semibold text-gray-900">{product.name}</div>
              <div className="text-xl font-bold text-gray-900">
                ${(product.sale_price && Number(product.sale_price) < Number(product.price)
                  ? Number(product.sale_price)
                  : Number(product.price) || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Right: Customization Options */}
          <div className="lg:col-span-1 flex flex-col">
            {currentStep === 'lens_type' && (
              <LensTypeSelectionStep
                lensSelection={lensSelection}
                prescriptionLensTypes={prescriptionLensTypes}
                onLensTypeChange={handleLensTypeChange}
                onNext={handleNext}
                onNavigateToPrescription={() => setCurrentStep('prescription')}
                onNavigateToProgressive={() => setCurrentStep('progressive')}
              />
            )}

            {currentStep === 'progressive' && (
              <ProgressiveLensStep
                lensSelection={lensSelection}
                progressiveOptions={progressiveOptions}
                progressiveOptionsLoading={progressiveOptionsLoading}
                onProgressiveOptionChange={handleProgressiveOptionChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 'prescription' && (
              <PrescriptionInputStep
                prescriptionData={prescriptionData}
                errors={errors}
                lensType={lensSelection.type}
                onPrescriptionChange={handlePrescriptionChange}
                onNext={handleNext}
                onBack={handleBack}
                savedPrescriptions={savedPrescriptions}
                selectedSavedPrescription={selectedSavedPrescription}
                onLoadSavedPrescription={loadSavedPrescription}
                isAuthenticated={isAuthenticated}
              />
            )}

            {currentStep === 'lens_thickness' && (
              <LensThicknessStep
                lensSelection={lensSelection}
                lensThicknessMaterials={lensThicknessMaterials}
                lensThicknessOptions={lensThicknessOptions}
                lensIndexOptions={lensIndexOptions}
                prescriptionData={prescriptionData}
                onLensThicknessChange={handleLensThicknessChange}
                onLensThicknessOptionChange={handleLensThicknessOptionChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 'treatment' && (
              <TreatmentStep
                lensSelection={lensSelection}
                treatments={configTreatments.map(t => ({
                  id: t.id.toString(),
                  name: t.name,
                  price: t.price,
                  description: t.description,
                  slug: t.slug,
                  type: t.type
                }))}
                productConfig={productConfig}
                photochromicOptions={photochromicOptions}
                prescriptionSunOptions={prescriptionSunOptions}
                prescriptionSunColors={prescriptionSunColors}
                lensColors={lensColors}
                onTreatmentToggle={handleTreatmentToggle}
                onColorSelect={(colorType, color) => {
                  if (colorType === 'photochromic') {
                    setLensSelection(prev => ({ 
                      ...prev, 
                      photochromicColor: color, 
                      prescriptionSunColor: undefined
                      // Keep standard treatments - photochromic can be selected alongside them
                    }))
                  } else if (colorType === 'prescription_sun') {
                    setLensSelection(prev => ({ 
                      ...prev, 
                      prescriptionSunColor: color, 
                      photochromicColor: undefined
                      // Keep standard treatments - prescription sun can be selected alongside them
                    }))
                  }
                }}
                onNext={handleNext}
                onBack={handleBack}
                loading={configLoading || customizationLoading || lensOptionsLoading}
                error={customizationError}
                onRetry={() => {
                  fetchLensTreatments()
                  refetchCustomization()
                  fetchPhotochromicOptions()
                  fetchPrescriptionSunOptions()
                }}
              />
            )}

            {currentStep === 'summary' && (
              <SummaryStep
                product={product}
                lensSelection={lensSelection}
                prescriptionData={prescriptionData}
                lensOptions={lensOptions}
                coatingOptions={coatingOptions}
                treatments={apiTreatments}
                progressiveOptions={progressiveOptions}
                lensThicknessMaterials={lensThicknessMaterials}
                onBack={handleBack}
                onAddToCart={handleAddToCart}
                onCheckoutNow={handleCheckoutNow}
                loading={loading}
                checkoutMode={checkoutMode}
              />
            )}

            {currentStep === 'shipping' && (
              <ShippingStep
                shippingAddress={shippingAddress}
                onAddressChange={(field, value) => setShippingAddress(prev => ({ ...prev, [field]: value }))}
                onNext={handleNext}
                onBack={handleBack}
                errors={orderError ? { general: orderError } : {}}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentStep
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onBack={handleBack}
                onCreateOrder={handleCreateOrder}
                isProcessing={isProcessingOrder}
                error={orderError}
                order={createdOrder}
                onLogin={() => navigate('/login')}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

// Lens Type Selection Step Component
interface LensTypeSelectionStepProps {
  lensSelection: LensSelection
  prescriptionLensTypes?: PrescriptionLensType[]
  onLensTypeChange: (type: 'distance_vision' | 'near_vision' | 'progressive') => void
  onNext: () => void
  onNavigateToPrescription?: () => void
  onNavigateToProgressive?: () => void
}

const LensTypeSelectionStep: React.FC<LensTypeSelectionStepProps> = ({
  lensSelection,
  prescriptionLensTypes = [],
  onLensTypeChange,
  onNext,
  onNavigateToPrescription,
  onNavigateToProgressive
}) => {
  // Use API data if available, otherwise fallback to defaults
  const apiLensTypeOptions = prescriptionLensTypes.length > 0
    ? prescriptionLensTypes
        .map(type => {
          const typeId = type.type || (typeof type.id === 'string' ? type.id : String(type.id))
          return {
            id: typeId,
            name: type.name || 'Unknown',
            description: type.description || ''
          }
        })
        .filter(option => option.id && ['distance_vision', 'near_vision', 'progressive'].includes(option.id)) // Filter out invalid options
    : []
  
  // Combine API options with default options
  const lensTypeOptions = [
    ...apiLensTypeOptions,
    ...(apiLensTypeOptions.length === 0 ? [
      {
        id: 'distance_vision',
        name: 'Distance Vision',
        description: 'For distance (Thin, anti-glare, blue-cut options)'
      },
      {
        id: 'near_vision',
        name: 'Near Vision',
        description: 'For near vision (Thin, anti-glare, blue-cut options)'
      },
      {
        id: 'progressive',
        name: 'Progressive',
        description: 'Progressives (For two powers in same lenses)'
      }
    ] : [])
  ]

  const handleOptionClick = (optionId: string) => {
    if (!optionId) {
      console.error('Invalid option ID:', optionId)
      return
    }
    
    const type = optionId as 'distance_vision' | 'near_vision' | 'progressive'
    
    // Validate the type
    if (!['distance_vision', 'near_vision', 'progressive'].includes(type)) {
      console.error('Invalid lens type:', type)
      return
    }
    
    onLensTypeChange(type)
    
    // Handle lens type navigation
    if (type === 'progressive') {
      // Navigate to progressive step
      if (onNavigateToProgressive) {
        onNavigateToProgressive()
      } else {
        onNext() // Fallback to onNext which handles progressive navigation
      }
    } else {
      // Navigate to prescription step
      if (onNavigateToPrescription) {
        onNavigateToPrescription()
      } else {
        onNext() // Fallback to onNext which handles prescription navigation
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Select Lens Type</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-3">
        {lensTypeOptions.length > 0 ? (
          lensTypeOptions.map((option) => {
            if (!option.id) {
              console.warn('Skipping option with missing ID:', option)
              return null
            }
            return (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
                type="button"
            className={`w-full p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
              lensSelection.type === option.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{option.name}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
            )
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No lens types available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Progressive Lens Step Component
interface ProgressiveLensStepProps {
  lensSelection: LensSelection
  progressiveOptions: Array<{ 
    id: string; 
    name: string; 
    price: number; 
    description: string; 
    recommended?: boolean; 
    viewingRange?: string;
    useCases?: string;
    icon?: string; 
    variantId?: number 
  }>
  progressiveOptionsLoading?: boolean
  onProgressiveOptionChange: (optionId: string) => void
  onNext: () => void
  onBack: () => void
}

const ProgressiveLensStep: React.FC<ProgressiveLensStepProps> = ({
  lensSelection,
  progressiveOptions,
  progressiveOptionsLoading = false,
  onProgressiveOptionChange,
  onNext,
  onBack
}) => {

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">Progressive</h3>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-6">Progressives (For two powers in same lenses)</p>
      
      {/* Progressive Options List */}
      <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-3">
        {progressiveOptionsLoading ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Loading progressive options from API...</p>
            <p className="text-xs text-gray-400">Fetching admin-inserted data...</p>
          </div>
        ) : progressiveOptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No progressive options available</p>
            <p className="text-xs text-gray-400">Please check the admin panel to ensure variants are added and active.</p>
          </div>
        ) : (
          progressiveOptions
            .filter(option => option && option.id && option.name) // Filter out null/undefined options
            .map((option) => {
            const isSelected = lensSelection.progressiveOption === option.id || 
                              (option.id === 'premium' && !lensSelection.progressiveOption && progressiveOptions.length > 0)
            
            return (
              <button
                key={option.id || `option-${Math.random()}`}
                onClick={() => onProgressiveOptionChange(option.id)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-base">{option.name || 'Unknown'}</span>
                    {option.recommended && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                          Recommended
                        </span>
                    )}
                  </div>
                  {option.price > 0 && (
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        ${option.price.toFixed(2)}
                      </div>
                  )}
                  {option.description && (
                      <div className="text-sm text-gray-600 leading-relaxed mb-2">{option.description}</div>
                  )}
                  {option.useCases && typeof option.useCases === 'string' && (
                      <div className="text-xs text-gray-500 italic">{option.useCases}</div>
                  )}
                  {option.viewingRange && typeof option.viewingRange === 'string' && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Viewing Range:</span> {option.viewingRange}
                      </div>
                  )}
                </div>
                <svg 
                    className={`w-5 h-5 flex-shrink-0 transition-colors mt-1 ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
          })
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={onNext}
        disabled={!lensSelection.progressiveOption && progressiveOptions.length > 0}
        className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

// Lens Thickness Step Component
interface LensThicknessStepProps {
  lensSelection: LensSelection
  lensThicknessMaterials?: LensThicknessMaterial[]
  lensThicknessOptions?: LensThicknessOption[]
  lensIndexOptions?: number[]
  prescriptionData?: PrescriptionFormData
  onLensThicknessChange: (thickness: 'plastic' | 'glass', materialId?: number) => void
  onLensThicknessOptionChange: (option: string) => void
  onNext: () => void
  onBack: () => void
}

const LensThicknessStep: React.FC<LensThicknessStepProps> = ({
  lensSelection,
  lensThicknessMaterials = [],
  lensThicknessOptions = [],
  lensIndexOptions = [1.49, 1.56, 1.60, 1.67, 1.74],
  prescriptionData,
  onLensThicknessChange,
  onLensThicknessOptionChange,
  onNext,
  onBack
}) => {
  // Calculate recommended lens index based on SPH + CYL
  const calculateRecommendedIndex = (): number | null => {
    if (!prescriptionData || !prescriptionData.od_sphere || !prescriptionData.os_sphere) {
      return null
    }
    
    const odSph = Math.abs(parseFloat(prescriptionData.od_sphere) || 0)
    const odCyl = Math.abs(parseFloat(prescriptionData.od_cylinder) || 0)
    const osSph = Math.abs(parseFloat(prescriptionData.os_sphere) || 0)
    const osCyl = Math.abs(parseFloat(prescriptionData.os_cylinder) || 0)
    
    const odTotal = odSph + odCyl
    const osTotal = osSph + osCyl
    const total = Math.max(odTotal, osTotal)
    
    if (total <= 1.50) return 1.49
    if (total <= 3.50) return 1.56
    if (total <= 5.50) return 1.60
    if (total <= 8.00) return 1.67
    return 1.74
  }

  const recommendedIndex = calculateRecommendedIndex()

  // Helper function to format lens index option label
  const getLensIndexLabel = (index: number): string => {
    if (index === 1.49) return 'Standard (1.49)'
    if (index === 1.50) return 'Standard (1.50)'
    if (index === 1.56) return 'Thin (1.56)'
    if (index === 1.60) return 'Thin (1.60)'
    if (index === 1.67) return 'Extra Thin (1.67)'
    if (index === 1.74) return 'Ultra Thin (1.74)'
    return `Index ${index}`
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">Lens Thickness</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
        <div className="space-y-3">
          {lensThicknessMaterials.length > 0 ? (
            lensThicknessMaterials.map((material) => {
              const isPlastic = material.slug === 'unbreakable-plastic' || (material.name && material.name.toLowerCase().includes('plastic'))
              const isGlass = material.slug === 'minerals-glass' || (material.name && material.name.toLowerCase().includes('glass'))
              // Check if this specific material is selected
              // Priority: match by material ID if set, otherwise match by type
              const isSelected = lensSelection.lensThicknessMaterialId !== undefined
                ? lensSelection.lensThicknessMaterialId === material.id
                : ((isPlastic && lensSelection.lensThickness === 'plastic') ||
                   (isGlass && lensSelection.lensThickness === 'glass'))
              
              return (
                <label
                  key={material.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="lensThickness"
                    checked={isSelected}
                    onChange={() => {
                      // Toggle: if already selected, deselect; otherwise select
                      if (isSelected) {
                        onLensThicknessChange(isPlastic ? 'plastic' : 'glass', undefined)
                      } else {
                        onLensThicknessChange(isPlastic ? 'plastic' : 'glass', material.id)
                      }
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">{material.name}</span>
                  <span className="text-sm font-semibold text-gray-700">${material.price.toFixed(2)}</span>
                </label>
              )
            })
          ) : (
            // Fallback to default options if API data not available
            <>
          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            lensSelection.lensThickness === 'plastic' 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="lensThickness"
              checked={lensSelection.lensThickness === 'plastic'}
              onChange={() => {
                // Toggle: if already selected, deselect; otherwise select
                if (lensSelection.lensThickness === 'plastic') {
                  onLensThicknessChange('plastic', undefined)
                } else {
                  onLensThicknessChange('plastic')
                }
              }}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="flex-1 text-sm font-medium text-gray-900">Unbreakable (Plastic)</span>
            <span className="text-sm font-semibold text-gray-700">$30.00</span>
          </label>

          <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            lensSelection.lensThickness === 'glass' 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}>
            <input
              type="radio"
              name="lensThickness"
              checked={lensSelection.lensThickness === 'glass'}
              onChange={() => {
                // Toggle: if already selected, deselect; otherwise select
                if (lensSelection.lensThickness === 'glass') {
                  onLensThicknessChange('glass', undefined)
                } else {
                  onLensThicknessChange('glass')
                }
              }}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="flex-1 text-sm font-medium text-gray-900">Minerals (Glass)</span>
            <span className="text-sm font-semibold text-gray-700">$60.00</span>
          </label>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Lens Index (Thickness)</label>
            {recommendedIndex && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Auto-recommended: {recommendedIndex}
              </span>
            )}
          </div>
          {recommendedIndex && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Recommended lens thickness: {recommendedIndex}</strong>
                <br />
                <span className="text-xs text-blue-700">
                  Based on your prescription (SPH + CYL)
                </span>
              </p>
            </div>
          )}
          <select
            value={lensSelection.lensThicknessOption || (recommendedIndex ? `index_${recommendedIndex}` : '')}
            onChange={(e) => onLensThicknessOptionChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Please select</option>
            {lensThicknessOptions.length > 0 ? (
              lensThicknessOptions.map((option) => {
                const isRecommended = recommendedIndex !== null && Number(option.thicknessValue) === recommendedIndex
                return (
                  <option key={option.id} value={`option_${option.id}`}>
                    {option.name} {option.thicknessValue ? `(${option.thicknessValue})` : ''} {isRecommended ? '⭐ Recommended' : ''}
                  </option>
                )
              })
            ) : (
              lensIndexOptions.map((index) => {
                const isRecommended = recommendedIndex === index
                return (
                  <option key={index} value={`index_${index}`}>
                    {getLensIndexLabel(index)} {isRecommended ? '⭐ Recommended' : ''}
                  </option>
                )
              })
            )}
          </select>
          {recommendedIndex && (
            <p className="mt-2 text-xs text-gray-500">
              You can override the recommendation by selecting a different option above.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors mt-auto"
      >
        Add
      </button>
    </div>
  )
}

// Treatment Step Component
interface TreatmentStepProps {
  lensSelection: LensSelection
  treatments: Array<{ id: string; name: string; price: number; description?: string; slug?: string; type?: string }>
  productConfig?: ProductConfig | null
  photochromicOptions?: LensOption[]
  prescriptionSunOptions?: LensOption[]
  prescriptionSunColors?: LensColor[]
  lensColors?: LensColor[]
  onTreatmentToggle: (treatmentId: string) => void
  onColorSelect?: (colorType: 'photochromic' | 'prescription_sun', color: { id: string; name: string; color: string; gradient?: boolean }) => void
  onNext: () => void
  onBack: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

const TreatmentStep: React.FC<TreatmentStepProps> = ({
  lensSelection,
  treatments,
  productConfig: _productConfig,
  photochromicOptions: apiPhotochromicOptions = [],
  prescriptionSunOptions: apiPrescriptionSunOptions = [],
  prescriptionSunColors: apiPrescriptionSunColors = [],
  lensColors: apiLensColors = [],
  onTreatmentToggle,
  onColorSelect,
  onNext,
  onBack,
  loading = false,
  error = null,
  onRetry
}) => {
  const { t } = useTranslation()
  const [showPhotochromic, setShowPhotochromic] = useState(false)
  const [showPrescriptionSun, setShowPrescriptionSun] = useState(false)
  const [selectedColor, setSelectedColor] = useState<{ type: string; colorId: string } | null>(null)

  // Use API treatments - filter out photochromic and prescription_sun as they have special handling
  // Standard treatments are those that are not photochromic or prescription_sun
  const standardTreatments = treatments
    .filter(t => {
      const treatmentType = t.type?.toLowerCase() || t.slug?.toLowerCase() || ''
      return treatmentType !== 'photochromic' && 
             treatmentType !== 'prescription_sun' && 
             treatmentType !== 'prescription-sun' &&
             t.type !== 'photochromic' &&
             t.slug !== 'photochromic' &&
             t.slug !== 'prescription-sun'
    })
    .map(t => ({
      id: t.id,
      name: t.name,
      price: t.price || 0,
      description: t.description,
      slug: t.slug,
      type: t.type
    }))

  // Map API photochromic options to UI format
  // Also merges colors from the dedicated /api/lens/colors endpoint
  const mapPhotochromicOptions = () => {
    console.log('🔍 [UI] mapPhotochromicOptions called')
    console.log('🔍 [UI] apiPhotochromicOptions:', apiPhotochromicOptions?.length || 0, 'options')
    console.log('🔍 [UI] apiLensColors:', apiLensColors?.length || 0, 'colors')
    console.log('🔍 [UI] apiLensColors type:', typeof apiLensColors, 'isArray:', Array.isArray(apiLensColors))
    
    if (apiLensColors && apiLensColors.length > 0) {
      console.log('🔍 [UI] First lens color sample:', {
        id: apiLensColors[0].id,
        name: apiLensColors[0].name,
        hasLensOption: !!apiLensColors[0].lensOption,
        lensOptionType: apiLensColors[0].lensOption?.type,
        lensOptionName: apiLensColors[0].lensOption?.name
      })
    }
    
    // Filter colors that belong to photochromic lens options
    const photochromicColors = apiLensColors?.filter(color => {
      if (!color.lensOption) {
        console.log('  ⚠️ Color', color.id, 'has no lensOption')
        return false
      }
      const type = (color.lensOption.type || '').toLowerCase()
      const slug = (color.lensOption.slug || '').toLowerCase()
      const name = (color.lensOption.name || '').toLowerCase()
      const isPhotochromic = type === 'photochromic' || 
             slug === 'photochromic' ||
             name.includes('photochromic')
      
      if (isPhotochromic) {
        console.log('  ✅ Color', color.id, 'is photochromic (type:', type, 'slug:', slug, 'name:', name, ')')
      }
      
      return isPhotochromic
    }) || []
    
    console.log('📥 [API] Found', photochromicColors.length, 'photochromic colors from /api/lens/colors')
    if (photochromicColors.length > 0) {
      console.log('📥 [API] First photochromic color:', JSON.stringify(photochromicColors[0], null, 2))
    } else if (apiLensColors && apiLensColors.length > 0) {
      console.log('📥 [API] No photochromic colors found, but we have', apiLensColors.length, 'total colors')
      console.log('📥 [API] Sample lensOption types:', apiLensColors.slice(0, 5).map(c => c.lensOption?.type || 'null').join(', '))
    }
    
    // If we have colors from the dedicated endpoint but no options, create options from colors
    if ((!apiPhotochromicOptions || apiPhotochromicOptions.length === 0) && 
        photochromicColors.length > 0) {
      console.log('📥 [API] No photochromic options found, creating options from lens colors endpoint')
      
      // Group colors by lensOption
      const colorsByOption: Record<number, LensColor[]> = {}
      photochromicColors.forEach(color => {
        if (color.lensOption && color.lensOption.id) {
          if (!colorsByOption[color.lensOption.id]) {
            colorsByOption[color.lensOption.id] = []
          }
          colorsByOption[color.lensOption.id].push(color)
        }
      })
      
      console.log('📥 [API] Grouped colors into', Object.keys(colorsByOption).length, 'options')
      
      // Create options from grouped colors
      const optionsFromColors: LensOption[] = Object.entries(colorsByOption).map(([optionId, colors]) => {
        const firstColor = colors[0]
        const lensOption = firstColor.lensOption!
        return {
          id: parseInt(optionId),
          name: lensOption.name || 'Photochromic',
          slug: lensOption.slug || lensOption.type || 'photochromic',
          type: lensOption.type || 'photochromic',
          colors: colors.map(color => ({
            ...color,
            // Ensure consistent field names
            hexCode: color.hexCode || color.hex_code,
            colorCode: color.colorCode || color.color_code,
            isActive: color.isActive !== undefined ? color.isActive : color.is_active,
            priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment
          }))
        } as LensOption
      })
      
      console.log('📥 [API] Created', optionsFromColors.length, 'photochromic options from colors')
      console.log('📥 [API] First option colors:', optionsFromColors[0]?.colors?.length || 0)
      
      // Use these options for mapping (this will format colors properly)
      return mapPhotochromicOptionsToUI(optionsFromColors, apiLensColors)
    }
    
    if (apiPhotochromicOptions && apiPhotochromicOptions.length > 0) {
      console.log('📥 [API] Mapping photochromic options from API:', apiPhotochromicOptions.length, 'options')
      console.log('📥 [API] Raw options data:', JSON.stringify(apiPhotochromicOptions, null, 2))
      return mapPhotochromicOptionsToUI(apiPhotochromicOptions, apiLensColors)
    }
    
    // Return empty array if no API data
    if (import.meta.env.DEV) {
      console.warn('⚠️ [UI] No photochromic options to map.')
      console.warn('   → apiPhotochromicOptions:', apiPhotochromicOptions?.length || 0)
      console.warn('   → photochromicColors from /api/lens/colors:', photochromicColors.length)
      console.warn('   → Check if fetchPhotochromicOptions and fetchLensColors were called')
    }
    return []
  }
  
  // Helper function to map photochromic options to UI format
  const mapPhotochromicOptionsToUI = (options: LensOption[], additionalColors?: LensColor[]) => {
    // Merge colors from dedicated endpoint into options
    if (additionalColors && additionalColors.length > 0) {
      console.log('🔄 [UI] Merging', additionalColors.length, 'colors from dedicated endpoint into photochromic options')
      options.forEach(option => {
        // Find colors that belong to this option (by lensOption.id or type matching)
        const matchingColors = additionalColors.filter(color => {
          if (!color.lensOption) return false
          // Match by ID if available
          if (color.lensOption.id === option.id) return true
          // Match by type/slug if IDs don't match
          const optionType = (option.type || option.slug || '').toLowerCase()
          const colorType = (color.lensOption.type || color.lensOption.slug || '').toLowerCase()
          return optionType === 'photochromic' && 
                 (colorType === 'photochromic' || colorType.includes('photochromic'))
        })
        
        if (matchingColors.length > 0) {
          console.log(`  ✅ Found ${matchingColors.length} colors for photochromic option ${option.name} (id: ${option.id})`)
          // Merge colors, avoiding duplicates
          const existingColorIds = new Set((option.colors || []).map(c => c.id))
          const newColors = matchingColors
            .filter(c => !existingColorIds.has(c.id))
            .map(color => ({
              ...color,
              // Ensure consistent field names
              hexCode: color.hexCode || color.hex_code,
              colorCode: color.colorCode || color.color_code,
              isActive: color.isActive !== undefined ? color.isActive : color.is_active,
              priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment
            }))
          
          option.colors = [...(option.colors || []), ...newColors]
        }
      })
    }
    
    return options
        .filter(option => {
          // Support both camelCase and snake_case
          const isActive = option.isActive !== undefined ? option.isActive : option.is_active;
          return isActive !== false;
        })
        .sort((a, b) => {
          const sortA = a.sortOrder !== undefined ? a.sortOrder : a.sort_order || 0;
          const sortB = b.sortOrder !== undefined ? b.sortOrder : b.sort_order || 0;
          return sortA - sortB;
        })
        .map(option => {
          const basePrice = option.basePrice !== undefined ? option.basePrice : option.base_price || 0;
          return {
            id: option.slug || option.id.toString(),
            name: option.name,
            description: option.description || '',
            price: basePrice,
            colors: (option.colors || [])
              .filter(color => {
                // Support both camelCase and snake_case
                const isActive = color.isActive !== undefined ? color.isActive : color.is_active;
                return isActive !== false;
              })
              .sort((a, b) => {
                const sortA = a.sortOrder !== undefined ? a.sortOrder : a.sort_order || 0;
                const sortB = b.sortOrder !== undefined ? b.sortOrder : b.sort_order || 0;
                return sortA - sortB;
              })
              .map(color => {
                // Support both camelCase and snake_case
                const hexCode = color.hexCode || color.hex_code || '#000000';
                const colorCode = color.colorCode || color.color_code || '';
                return {
                  id: color.id.toString(),
                  name: color.name,
                  color: hexCode,
                  gradient: (colorCode || '').toLowerCase().includes('gradient') || false,
                  priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment || 0
                };
              })
          };
        })
  }

  // Map API prescription sun options to UI format
  // The API returns lens options with type='prescription_sun' or similar
  // Each option can have colors, and we need to group them by main type (polarized, classic, blokz)
  // Also merges colors from the dedicated prescription-sun-colors endpoint and /api/lens/colors
  const mapPrescriptionSunOptions = () => {
    console.log('🔍 [UI] mapPrescriptionSunOptions called with:', apiPrescriptionSunOptions?.length || 0, 'options')
    console.log('🔍 [UI] Prescription sun colors from dedicated endpoint:', apiPrescriptionSunColors?.length || 0, 'colors')
    console.log('🔍 [UI] All lens colors from /api/lens/colors:', apiLensColors?.length || 0, 'colors')
    
    // Collect all prescription sun colors from both endpoints
    const allPrescriptionSunColors: LensColor[] = []
    
    // Add colors from prescription-sun-colors endpoint
    if (apiPrescriptionSunColors && apiPrescriptionSunColors.length > 0) {
      allPrescriptionSunColors.push(...apiPrescriptionSunColors)
    }
    
    // Add colors from /api/lens/colors that have prescriptionLensType
    if (apiLensColors && apiLensColors.length > 0) {
      const prescriptionSunColorsFromLensColors = apiLensColors.filter(color => 
        color.prescriptionLensType !== null && color.prescriptionLensType !== undefined
      )
      console.log('📥 [API] Found', prescriptionSunColorsFromLensColors.length, 'prescription sun colors from /api/lens/colors')
      allPrescriptionSunColors.push(...prescriptionSunColorsFromLensColors)
    }
    
    // If we have colors but no options, create options from colors
    if ((!apiPrescriptionSunOptions || apiPrescriptionSunOptions.length === 0) && 
        allPrescriptionSunColors.length > 0) {
      console.log('📥 [API] No options found, creating options from prescription sun colors')
      
      // Group colors by prescriptionLensType
      const colorsByType: Record<number, LensColor[]> = {}
      allPrescriptionSunColors.forEach(color => {
        if (color.prescriptionLensType && color.prescriptionLensType.id) {
          const typeId = color.prescriptionLensType.id
          if (!colorsByType[typeId]) {
            colorsByType[typeId] = []
          }
          colorsByType[typeId].push(color)
        } else if (color.lensOption && color.lensOption.id) {
          // Fallback to lensOption if prescriptionLensType is not available
          const optionId = color.lensOption.id
          if (!colorsByType[optionId]) {
            colorsByType[optionId] = []
          }
          colorsByType[optionId].push(color)
        }
      })
      
      // Create options from grouped colors
      const optionsFromColors: LensOption[] = Object.entries(colorsByType).map(([typeId, colors]) => {
        const firstColor = colors[0]
        const prescriptionType = firstColor.prescriptionLensType || firstColor.lensOption
        if (!prescriptionType) return null
        
        return {
          id: parseInt(typeId),
          name: prescriptionType.name || 'Prescription Sun',
          slug: prescriptionType.slug || 'prescription-sun',
          type: 'prescription_sun',
          colors: colors
        } as LensOption
      }).filter((opt): opt is LensOption => opt !== null)
      
      if (optionsFromColors.length > 0) {
        // Use these options for mapping
        return mapOptionsToUI(optionsFromColors, allPrescriptionSunColors)
      }
    }
    
    if (apiPrescriptionSunOptions && apiPrescriptionSunOptions.length > 0) {
      console.log('📥 [API] Mapping prescription sun options from API:', apiPrescriptionSunOptions.length, 'options')
      console.log('📥 [API] Raw options data:', JSON.stringify(apiPrescriptionSunOptions, null, 2))
      
      // Merge colors from both endpoints
      const allColors = [...(apiPrescriptionSunColors || []), ...(apiLensColors?.filter(c => c.prescriptionLensType) || [])]
      return mapOptionsToUI(apiPrescriptionSunOptions, allColors)
    }
    
    // Fallback: Create sample data for development/testing when API returns no data
    // This matches the structure described in the Postman collection
    if (import.meta.env.DEV && (!apiPrescriptionSunOptions || apiPrescriptionSunOptions.length === 0)) {
      console.info('ℹ️ [UI] No prescription sun options from API, using sample data for development')
      console.info('   → This is sample data for UI testing')
      console.info('   → Create prescription sun lenses via admin panel to use real data')
      
      // Create sample options matching Postman collection structure
      const sampleOptions: any[] = [
        {
          id: 'polarized',
          name: 'Polarized',
          price: 76.95,
          description: 'Reduce glare and see clearly for outdoor activities and driving.',
          subOptions: [
            {
              id: 'polarized_classic',
              name: 'Classic',
              price: 0,
              colors: [
                { id: '1', name: 'Gray', color: '#808080', gradient: false, priceAdjustment: 0 },
                { id: '2', name: 'Brown', color: '#8B4513', gradient: false, priceAdjustment: 0 },
                { id: '3', name: 'Green', color: '#228B22', gradient: false, priceAdjustment: 0 }
              ]
            },
            {
              id: 'polarized_mirror',
              name: 'Mirror',
              price: 27.95,
              colors: [
                { id: '4', name: 'Blue Mirror', color: '#4169E1', gradient: true, priceAdjustment: 0 },
                { id: '5', name: 'Silver Mirror', color: '#C0C0C0', gradient: true, priceAdjustment: 0 }
              ]
            }
          ]
        },
        {
          id: 'classic',
          name: 'Classic',
          price: 60.90,
          description: 'Classic prescription sun lenses with various finishes.',
          subOptions: [
            {
              id: 'classic_fashion',
              name: 'Fashion',
              price: 0,
              colors: [
                { id: '6', name: 'Rose', color: '#FFB6C1', gradient: false, priceAdjustment: 0 },
                { id: '7', name: 'Amber', color: '#FFBF00', gradient: false, priceAdjustment: 0 }
              ]
            },
            {
              id: 'classic_mirror',
              name: 'Mirror',
              price: 20.00,
              colors: [
                { id: '8', name: 'Gold Mirror', color: '#FFD700', gradient: true, priceAdjustment: 0 },
                { id: '9', name: 'Blue Mirror', color: '#1E90FF', gradient: true, priceAdjustment: 0 }
              ]
            },
            {
              id: 'classic_gradient',
              name: 'Gradient',
              price: 4.00,
              colors: [
                { id: '10', name: 'Gray Gradient', color: '#808080', gradient: true, priceAdjustment: 0 },
                { id: '11', name: 'Brown Gradient', color: '#8B4513', gradient: true, priceAdjustment: 0 }
              ]
            },
            {
              id: 'classic_classic',
              name: 'Classic',
              price: 0,
              colors: [
                { id: '12', name: 'Gray', color: '#808080', gradient: false, priceAdjustment: 0 },
                { id: '13', name: 'Brown', color: '#8B4513', gradient: false, priceAdjustment: 0 }
              ]
            }
          ]
        },
        {
          id: 'blokz',
          name: 'Blokz® Sunglasses',
          price: 95.90,
          description: 'Advanced blue light blocking with UV protection.',
          subOptions: [
            {
              id: 'blokz_mirror',
              name: 'Mirror',
              price: 20.00,
              colors: [
                { id: '14', name: 'Blue Mirror', color: '#4169E1', gradient: true, priceAdjustment: 0 },
                { id: '15', name: 'Green Mirror', color: '#32CD32', gradient: true, priceAdjustment: 0 }
              ]
            },
            {
              id: 'blokz_classic',
              name: 'Classic',
              price: 0,
              colors: [
                { id: '16', name: 'Gray', color: '#808080', gradient: false, priceAdjustment: 0 },
                { id: '17', name: 'Brown', color: '#8B4513', gradient: false, priceAdjustment: 0 }
              ]
            }
          ]
        }
      ]
      
      return sampleOptions
    }
    
    // Return empty array if no API data and not in dev mode
    if (import.meta.env.DEV) {
      console.info('ℹ️ [UI] No prescription sun options to map. apiPrescriptionSunOptions:', apiPrescriptionSunOptions)
      console.info('   → This is normal if prescription sun lenses haven\'t been created yet')
      console.info('   → Check browser console for API fetch logs to see if the API was called')
      console.info('   → The API endpoint /api/prescription-sun-lenses should return structured data')
    }
    return []
  }
  
  // Helper function to map options to UI format
  const mapOptionsToUI = (options: LensOption[], additionalColors?: LensColor[]) => {
    // Merge colors from dedicated endpoint into options
    if (additionalColors && additionalColors.length > 0) {
      console.log('🔄 [UI] Merging', additionalColors.length, 'colors from dedicated endpoint into options')
      options.forEach(option => {
        // Find colors that belong to this option
        const matchingColors = additionalColors.filter(color => 
          color.lensOption && color.lensOption.id === option.id
        )
        
        if (matchingColors.length > 0) {
          console.log(`  ✅ Found ${matchingColors.length} colors for option ${option.name} (id: ${option.id})`)
          // Merge colors, avoiding duplicates
          const existingColorIds = new Set((option.colors || []).map(c => c.id))
          const newColors = matchingColors
            .filter(c => !existingColorIds.has(c.id))
            .map(color => ({
              ...color,
              // Ensure consistent field names
              hexCode: color.hexCode || color.hex_code,
              colorCode: color.colorCode || color.color_code,
              isActive: color.isActive !== undefined ? color.isActive : color.is_active,
              priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment
            }))
          
          option.colors = [...(option.colors || []), ...newColors]
        }
      })
    }
      
      // Filter active options and sort
    const activeOptions = options
        .filter(option => {
          // Support both camelCase and snake_case
          const isActive = option.isActive !== undefined ? option.isActive : option.is_active;
          return isActive !== false;
        })
        .sort((a, b) => {
          const sortA = a.sortOrder !== undefined ? a.sortOrder : a.sort_order || 0;
          const sortB = b.sortOrder !== undefined ? b.sortOrder : b.sort_order || 0;
          return sortA - sortB;
        })
      
      // Group by main option type (polarized, classic, blokz, etc.)
      // The grouping is based on the option name or slug
      const grouped: Record<string, any> = {}
      
      activeOptions.forEach(option => {
        // Determine main type from name or slug
        // Examples: "Polarized", "Polarized Classic", "Polarized Mirror" -> group under "polarized"
        const nameLower = (option.name || '').toLowerCase()
        const slugLower = (option.slug || '').toLowerCase()
        
        let mainType = ''
        if (nameLower.includes('polarized') || slugLower.includes('polarized')) {
          mainType = 'polarized'
        } else if (nameLower.includes('blokz') || slugLower.includes('blokz')) {
          mainType = 'blokz'
        } else if (nameLower.includes('classic') || slugLower.includes('classic')) {
          mainType = 'classic'
        } else {
          // Use first word of name or slug as main type
          mainType = (option.name ? option.name.split(' ')[0].toLowerCase() : '') || option.slug?.split('_')[0] || 'other'
        }
        
        // Initialize main option if not exists
        if (!grouped[mainType]) {
          // Find the base option for this type (usually the one without sub-type in name)
          const baseOption = activeOptions.find(opt => {
            const optName = (opt.name || '').toLowerCase()
            return (optName === mainType || optName.includes(mainType)) && 
                   !optName.includes('mirror') && 
                   !optName.includes('gradient') && 
                   !optName.includes('fashion')
          }) || option
          
          const basePrice = baseOption.basePrice !== undefined ? baseOption.basePrice : baseOption.base_price || 0;
          grouped[mainType] = {
            id: baseOption.slug || baseOption.id.toString(),
            name: baseOption.name,
            price: basePrice,
            description: baseOption.description || '',
            subOptions: []
          }
        }
        
        // Determine sub-option type (classic, mirror, gradient, fashion)
        let subOptionType = 'classic'
        if (nameLower.includes('mirror') || slugLower.includes('mirror')) {
          subOptionType = 'mirror'
        } else if (nameLower.includes('gradient') || slugLower.includes('gradient')) {
          subOptionType = 'gradient'
        } else if (nameLower.includes('fashion') || slugLower.includes('fashion')) {
          subOptionType = 'fashion'
        } else if (nameLower.includes('classic') || slugLower.includes('classic')) {
          subOptionType = 'classic'
        }
        
        // Check if sub-option already exists
        const existingSubOption = grouped[mainType].subOptions.find((sub: any) => {
          const subName = (sub.name || '').toLowerCase()
          const optionName = (option.name || '').toLowerCase()
          return subName === optionName
        })
        
        const optionBasePrice = option.basePrice !== undefined ? option.basePrice : option.base_price || 0;
        if (!existingSubOption && option.colors && option.colors.length > 0) {
          // Add as new sub-option with colors
          grouped[mainType].subOptions.push({
            id: `${mainType}_${subOptionType}_${option.id}`,
            name: option.name,
            price: optionBasePrice,
            colors: option.colors
              .filter(color => {
                // Support both camelCase and snake_case
                const isActive = color.isActive !== undefined ? color.isActive : color.is_active;
                return isActive !== false;
              })
              .sort((a, b) => {
                const sortA = a.sortOrder !== undefined ? a.sortOrder : a.sort_order || 0;
                const sortB = b.sortOrder !== undefined ? b.sortOrder : b.sort_order || 0;
                return sortA - sortB;
              })
              .map(color => {
                // Support both camelCase and snake_case
                const hexCode = color.hexCode || color.hex_code || '#000000';
                const colorCode = color.colorCode || color.color_code || '';
                return {
                  id: color.id.toString(),
                  name: color.name,
                  color: hexCode,
                  gradient: (colorCode || '').toLowerCase().includes('gradient') || false,
                  priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment || 0
                };
              })
          })
        } else if (existingSubOption && option.colors && option.colors.length > 0) {
          // Merge colors into existing sub-option
          const newColors = option.colors
            .filter(color => {
              // Support both camelCase and snake_case
              const isActive = color.isActive !== undefined ? color.isActive : color.is_active;
              return isActive !== false;
            })
            .map(color => {
              // Support both camelCase and snake_case
              const hexCode = color.hexCode || color.hex_code || '#000000';
              const colorCode = color.colorCode || color.color_code || '';
              return {
                id: color.id.toString(),
                name: color.name,
                color: hexCode,
                gradient: colorCode.toLowerCase().includes('gradient') || false,
                priceAdjustment: color.priceAdjustment !== undefined ? color.priceAdjustment : color.price_adjustment || 0
              };
            })
          existingSubOption.colors = [...(existingSubOption.colors || []), ...newColors]
        } else if (!existingSubOption) {
          // Add sub-option without colors (e.g., Gradient option)
          grouped[mainType].subOptions.push({
            id: `${mainType}_${subOptionType}_${option.id}`,
            name: option.name,
            price: optionBasePrice,
          colors: []
          })
        }
      })
      
      // Sort sub-options and return grouped values
      Object.values(grouped).forEach((group: any) => {
        group.subOptions.sort((a: any, b: any) => {
          const order = ['classic', 'fashion', 'mirror', 'gradient']
          const aName = (a.name || '').toLowerCase()
          const bName = (b.name || '').toLowerCase()
          const aIndex = order.findIndex(o => aName.includes(o))
          const bIndex = order.findIndex(o => bName.includes(o))
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          // Use the already declared aName and bName variables
          return aName.localeCompare(bName)
        })
      })
      
      const result = Object.values(grouped)
      console.log('✅ [API] Mapped prescription sun options:', result.length, 'main options')
      return result
  }

  // Use mapped API options or fallback
  const photochromicOptions = mapPhotochromicOptions()
  const prescriptionSunOptions = mapPrescriptionSunOptions()
  
  // Debug logging
  console.log('🎨 [UI] Final photochromicOptions:', photochromicOptions.length, 'options')
  if (photochromicOptions.length > 0) {
    console.log('🎨 [UI] First photochromic option:', {
      id: photochromicOptions[0].id,
      name: photochromicOptions[0].name,
      colorsCount: photochromicOptions[0].colors?.length || 0,
      colors: photochromicOptions[0].colors?.map((c: any) => ({ 
        id: c.id, 
        name: c.name, 
        hex: c.hexCode || c.hex_code || c.color 
      }))
    })
  }

  const handlePhotochromicClick = () => {
    setShowPhotochromic(!showPhotochromic)
    setShowPrescriptionSun(false)
  }

  const handlePrescriptionSunClick = () => {
    setShowPrescriptionSun(!showPrescriptionSun)
    setShowPhotochromic(false)
  }

  const handleColorSelect = (type: string, colorId: string, treatmentId: string, color: { id: string; name: string; color: string; gradient?: boolean }) => {
    setSelectedColor({ type, colorId })
    
    // Determine if this is photochromic or prescription sun based on the option type
    // Check if it's from photochromic options
    const isPhotochromic = photochromicOptions.some(opt => 
      type.includes(opt.id) || opt.id === type.split('_')[0]
    )
    
    // Check if it's from prescription sun options
    const isPrescriptionSun = prescriptionSunOptions.some(opt => 
      type.includes(opt.id) || opt.id === type.split('_')[0]
    )
    
    if (isPhotochromic) {
      // Photochromic color - handled separately, don't add to treatments array
      if (onColorSelect) {
        onColorSelect('photochromic', color)
      }
    } else if (isPrescriptionSun) {
      // Prescription sun color - handled separately, don't add to treatments array
      if (onColorSelect) {
        onColorSelect('prescription_sun', color)
      }
    } else {
      // Standard treatment - add to treatments array
      onTreatmentToggle(treatmentId)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">Treatment</h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
          <span className="ml-3 text-gray-600">{t('shop.loadingTreatments')}</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 mb-2">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && (
        <>
          <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-3">
            {/* Photochromic Section */}
            {photochromicOptions.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handlePhotochromicClick}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    showPhotochromic || lensSelection.photochromicColor
                      ? 'border-black bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900">Photochromic</span>
                    {lensSelection.photochromicColor && (
                      <span className="text-sm text-blue-600 font-medium">Selected</span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${showPhotochromic ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPhotochromic && (
                  <div className="mt-3 space-y-4">
                    {photochromicOptions.map((option) => (
                      <div key={option.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        <div>
                          <div className="font-semibold text-gray-900 text-base">{option.name}</div>
                          {option.description && (
                            <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                          )}
                        </div>
                        {option.colors && option.colors.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {option.colors.map((color: any) => {
                              const isSelected = lensSelection.photochromicColor?.id === color.id
                              return (
                                <button
                                  key={color.id}
                                  onClick={() => {
                                    if (onColorSelect) {
                                      onColorSelect('photochromic', {
                                        id: color.id.toString(),
                                        name: color.name,
                                        color: color.hexCode || color.hex_code || color.color || '#000000',
                                        gradient: color.gradient || false
                                      })
                                    }
                                  }}
                                  className="relative flex flex-col items-center gap-1 group"
                                  title={color.name}
                                >
                                  <div
                                    className={`w-14 h-14 rounded-full border-2 transition-all ${
                                      isSelected
                                        ? 'border-blue-600 ring-2 ring-blue-200'
                                        : 'border-gray-300 group-hover:border-gray-400'
                                    }`}
                                    style={{
                                      background: color.gradient
                                        ? `linear-gradient(135deg, ${color.hexCode || color.hex_code || color.color || '#000000'} 0%, ${color.hexCode2 || color.hex_code2 || color.color || '#000000'} 100%)`
                                        : color.hexCode || color.hex_code || color.color || '#000000'
                                    }}
                                  />
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600 text-center max-w-[60px]">{color.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No colors available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescription Sun Lenses Section */}
            {prescriptionSunOptions.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handlePrescriptionSunClick}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    showPrescriptionSun || lensSelection.prescriptionSunColor
                      ? 'border-black bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900">Prescription Sun Lenses</span>
                    {lensSelection.prescriptionSunColor && (
                      <span className="text-sm text-blue-600 font-medium">Selected</span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${showPrescriptionSun ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPrescriptionSun && (
                  <div className="mt-3 space-y-4">
                    {prescriptionSunOptions.map((mainOption: any) => (
                      <div key={mainOption.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                        <div>
                          <div className="font-semibold text-gray-900 text-base flex items-center gap-2">
                            {mainOption.name}
                            {mainOption.price > 0 && (
                              <span className="text-sm font-medium text-blue-600">
                                (+${mainOption.price.toFixed(2)})
                              </span>
                            )}
                          </div>
                          {mainOption.description && (
                            <div className="text-sm text-gray-600 mt-1">{mainOption.description}</div>
                          )}
                        </div>

                        {mainOption.subOptions && mainOption.subOptions.length > 0 ? (
                          <div className="space-y-4">
                            {mainOption.subOptions.map((subOption: any) => (
                              <div key={subOption.id} className="space-y-2">
                                <div className="font-medium text-gray-700 flex items-center gap-2">
                                  {subOption.name}
                                  {subOption.price > 0 && (
                                    <span className="text-sm font-medium text-blue-600">
                                      (+${subOption.price.toFixed(2)})
                                    </span>
                                  )}
                                  {subOption.price === 0 && subOption.name && subOption.name.toLowerCase().includes('free') && (
                                    <span className="text-sm font-medium text-green-600">(Free)</span>
                                  )}
                                </div>
                                {subOption.colors && subOption.colors.length > 0 ? (
                                  <div className="flex flex-wrap gap-3">
                                    {subOption.colors.map((color: any) => {
                                      const isSelected = lensSelection.prescriptionSunColor?.id === color.id
                                      const totalPrice = (mainOption.price || 0) + (subOption.price || 0) + (color.priceAdjustment || 0)
                                      return (
                                        <button
                                          key={color.id}
                                          onClick={() => {
                                            if (onColorSelect) {
                                              onColorSelect('prescription_sun', {
                                                id: color.id.toString(),
                                                name: color.name,
                                                color: color.color || '#000000',
                                                gradient: color.gradient || false
                                              })
                                            }
                                          }}
                                          className="relative flex flex-col items-center gap-1 group"
                                          title={`${color.name}${totalPrice > 0 ? ` (+$${totalPrice.toFixed(2)})` : ''}`}
                                        >
                                          <div
                                            className={`w-14 h-14 rounded-full border-2 transition-all ${
                                              isSelected
                                                ? 'border-blue-600 ring-2 ring-blue-200'
                                                : 'border-gray-300 group-hover:border-gray-400'
                                            }`}
                                            style={{
                                              background: color.gradient
                                                ? `linear-gradient(to bottom, ${color.color || '#000000'} 0%, ${color.color2 || color.color || '#000000'} 100%)`
                                                : color.color || '#000000'
                                            }}
                                          />
                                          {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                          )}
                                          <span className="text-xs text-gray-600 text-center max-w-[60px]">{color.name}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">No colors available for this option</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : mainOption.colors && mainOption.colors.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {mainOption.colors.map((color: any) => {
                              const isSelected = lensSelection.prescriptionSunColor?.id === color.id
                              const totalPrice = (mainOption.price || 0) + (color.priceAdjustment || 0)
                              return (
                                <button
                                  key={color.id}
                                  onClick={() => {
                                    if (onColorSelect) {
                                      onColorSelect('prescription_sun', {
                                        id: color.id.toString(),
                                        name: color.name,
                                        color: color.color || '#000000',
                                        gradient: color.gradient || false
                                      })
                                    }
                                  }}
                                  className="relative flex flex-col items-center gap-1 group"
                                  title={`${color.name}${totalPrice > 0 ? ` (+$${totalPrice.toFixed(2)})` : ''}`}
                                >
                                  <div
                                    className={`w-14 h-14 rounded-full border-2 transition-all ${
                                      isSelected
                                        ? 'border-blue-600 ring-2 ring-blue-200'
                                        : 'border-gray-300 group-hover:border-gray-400'
                                    }`}
                                    style={{
                                      background: color.gradient
                                        ? `linear-gradient(to bottom, ${color.color || '#000000'} 0%, ${color.color2 || color.color || '#000000'} 100%)`
                                        : color.color || '#000000'
                                    }}
                                  />
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600 text-center max-w-[60px]">{color.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No colors available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Standard Treatments from API */}
            {standardTreatments.length > 0 ? (
              standardTreatments.map((treatment) => {
              const isSelected = lensSelection.treatments.includes(treatment.id)
              
              return (
                <label
                  key={treatment.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onTreatmentToggle(treatment.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{treatment.name}</div>
                    {treatment.description && (
                      <div className="text-sm text-gray-500 mt-1">{treatment.description}</div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">${treatment.price.toFixed(2)}</span>
                </label>
              )
              })
            ) : (
              !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('shop.noTreatmentsAvailable', 'No treatments available at the moment.')}</p>
                </div>
              )
            )}

          </div>

          <button
            onClick={onNext}
            className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors mt-auto"
          >
            {t('shop.addToCart')}
          </button>
        </>
      )}
    </div>
  )
}

// Prescription Input Step Component
interface PrescriptionInputStepProps {
  prescriptionData: PrescriptionFormData
  errors: Record<string, string>
  lensType: LensSelection['type']
  onPrescriptionChange: (field: keyof PrescriptionFormData, value: string) => void
  onNext: () => void
  onBack: () => void
  savedPrescriptions?: Prescription[]
  selectedSavedPrescription?: number | null
  onLoadSavedPrescription?: (prescriptionId: number) => void
  isAuthenticated?: boolean
}

const PrescriptionInputStep: React.FC<PrescriptionInputStepProps> = ({
  prescriptionData,
  errors,
  lensType,
  onPrescriptionChange,
  onNext,
  onBack,
  savedPrescriptions: _savedPrescriptions = [],
  selectedSavedPrescription: _selectedSavedPrescription,
  onLoadSavedPrescription: _onLoadSavedPrescription,
  isAuthenticated: _isAuthenticated = false
}) => {
  const isProgressive = lensType === 'progressive'
  const isDistanceVision = lensType === 'distance_vision'
  const isNearVision = lensType === 'near_vision'

  // Generate PD options (1-30)
  const pdOptions = Array.from({ length: 30 }, (_, i) => i + 1)
  
  // Generate SPH and CYL options from -16.00 to +16.00 in steps of 0.25
  const generateSphereCylinderOptions = () => {
    const options: string[] = []
    // Generate from -16.00 to +16.00 in steps of 0.25 (using integer steps to avoid floating point issues)
    // -16.00 = -64 * 0.25, +16.00 = 64 * 0.25, so we need 129 values (from -64 to +64)
    for (let i = -64; i <= 64; i++) {
      const value = (i * 0.25).toFixed(2)
      // Format with + sign for positive values, - for negative, and 0.00 for zero
      if (i > 0) {
        options.push(`+${value}`)
      } else if (i < 0) {
        options.push(value)
      } else {
        options.push('0.00')
      }
    }
    return options
  }
  
  const sphereCylinderOptions = generateSphereCylinderOptions()
  
  // Generate SPH, CYL, AXIS options based on lens type
  const getSphereOptions = () => {
    // Return all options from -16.00 to +16.00 for all lens types
    return sphereCylinderOptions
  }

  const getCylinderOptions = () => {
    // Return all options from -16.00 to +16.00 for all lens types
    return sphereCylinderOptions
  }

  const getAxisOptions = () => {
    if (isProgressive) {
      return ['10', '45', '90', '135', '180']
    } else if (isDistanceVision) {
      return ['10', '45', '90', '135', '180']
    } else if (isNearVision) {
      return ['5', '45', '90', '135', '180']
    }
    return []
  }

  const getOSSphereOptions = () => {
    // Return all options from -16.00 to +16.00 for all lens types
    return sphereCylinderOptions
  }

  const getOSCylinderOptions = () => {
    // Return all options from -16.00 to +16.00 for all lens types
    return sphereCylinderOptions
  }

  const getOSAxisOptions = () => {
    if (isProgressive) {
      return ['20', '60', '100', '140', '180']
    } else if (isDistanceVision) {
      return ['20', '60', '100', '140', '180']
    } else if (isNearVision) {
      return ['10', '60', '100', '140', '180']
    }
    return []
  }

  const addOptions = ['-0.5', '-0.75', '-1.25', '-1.5', '-1.75', '-2', '-2.25', '-2.5', '-2.75', '-3', '-3.25', '-3.50', '-3.75', '-4']
  const hOptions = Array.from({ length: 30 }, (_, i) => i + 1)
  const yearOptions = Array.from({ length: 100 }, (_, i) => 2025 - i) // Years from 2025 to 1925

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">
          {isProgressive ? 'Progressive Vision' : isDistanceVision ? 'Distance Vision' : isNearVision ? 'Near Vision' : 'Prescription'}
        </h3>
      </div>

      {/* General Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* PD Input - Different for Progressive */}
      {isProgressive ? (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">PD</label>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
              title="Pupillary Distance"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <select
                value={prescriptionData.pd_binocular}
                onChange={(e) => onPrescriptionChange('pd_binocular', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Enter Your Pupillary distance</option>
                {pdOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <select
                value={prescriptionData.pd_right || ''}
                onChange={(e) => onPrescriptionChange('pd_right', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Enter Your Right Pupillary distance</option>
                {pdOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
        <input
                type="text"
                value={prescriptionData.pd_mm || ''}
                onChange={(e) => onPrescriptionChange('pd_mm', e.target.value)}
                placeholder="mm"
                className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pd_mm ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                title="Pupillary Distance in millimeters"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          {errors.pd_mm && (
            <p className="text-sm text-red-500 mt-1">{errors.pd_mm}</p>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">PD</label>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Pupillary Distance is the distance between the centers of your pupils"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <select
          value={prescriptionData.pd_binocular}
          onChange={(e) => onPrescriptionChange('pd_binocular', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.pd_binocular ? 'border-red-500' : 'border-gray-300'
          }`}
          >
            <option value="">Enter Your Pupillary distance</option>
            {pdOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        {errors.pd_binocular && (
          <p className="text-sm text-red-500 mt-1">{errors.pd_binocular}</p>
        )}
      </div>
      )}

      {/* H (Height) - Only for Progressive */}
      {isProgressive && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">H</label>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Height"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <select
            value={prescriptionData.h || ''}
            onChange={(e) => onPrescriptionChange('h', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.h ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">- Select -</option>
            {hOptions.map(opt => (
              <option key={opt} value={opt.toString()}>{opt}</option>
            ))}
          </select>
          {errors.h && (
            <p className="text-sm text-red-500 mt-1">{errors.h}</p>
          )}
        </div>
      )}

      {/* Right Eye (OD) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-gray-700">Right Eye OD</label>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            title="OD = Oculus Dexter (Right Eye)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <select
              value={prescriptionData.od_sphere}
              onChange={(e) => onPrescriptionChange('od_sphere', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.od_sphere ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">SPH</option>
              {getSphereOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.od_sphere && (
              <p className="text-xs text-red-500 mt-1">{errors.od_sphere}</p>
            )}
          </div>
          <div>
            <select
              value={prescriptionData.od_cylinder}
              onChange={(e) => onPrescriptionChange('od_cylinder', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.od_cylinder ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">CYL</option>
              {getCylinderOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.od_cylinder && (
              <p className="text-xs text-red-500 mt-1">{errors.od_cylinder}</p>
            )}
          </div>
          <div>
            <select
              value={prescriptionData.od_axis}
              onChange={(e) => onPrescriptionChange('od_axis', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.od_axis ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">AXIS</option>
              {getAxisOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.od_axis && (
              <p className="text-xs text-red-500 mt-1">{errors.od_axis}</p>
            )}
          </div>
        </div>
      </div>

      {/* Left Eye (OS) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-gray-700">Left Eye OS</label>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            title="OS = Oculus Sinister (Left Eye)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <select
              value={prescriptionData.os_sphere}
              onChange={(e) => onPrescriptionChange('os_sphere', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.os_sphere ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">SPH</option>
              {getOSSphereOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.os_sphere && (
              <p className="text-xs text-red-500 mt-1">{errors.os_sphere}</p>
            )}
          </div>
          <div>
            <select
              value={prescriptionData.os_cylinder}
              onChange={(e) => onPrescriptionChange('os_cylinder', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.os_cylinder ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">CYL</option>
              {getOSCylinderOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.os_cylinder && (
              <p className="text-xs text-red-500 mt-1">{errors.os_cylinder}</p>
            )}
          </div>
          <div>
            <select
              value={prescriptionData.os_axis}
              onChange={(e) => onPrescriptionChange('os_axis', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.os_axis ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">AXIS</option>
              {getOSAxisOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.os_axis && (
              <p className="text-xs text-red-500 mt-1">{errors.os_axis}</p>
            )}
          </div>
        </div>
      </div>

      {/* Select Option (ADD) - Only for Progressive */}
      {isProgressive && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Option</label>
          <select
            value={prescriptionData.select_option || ''}
            onChange={(e) => onPrescriptionChange('select_option', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.select_option ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">- Select -</option>
            {addOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.select_option && (
            <p className="text-sm text-red-500 mt-1">{errors.select_option}</p>
          )}
        </div>
      )}

      {/* Year of Birth - Only for Progressive */}
      {isProgressive && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Year of Birth</label>
          <select
            value={prescriptionData.year_of_birth || ''}
            onChange={(e) => onPrescriptionChange('year_of_birth', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.year_of_birth ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">--- Please select ---</option>
            {yearOptions.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          {errors.year_of_birth && (
            <p className="text-sm text-red-500 mt-1">{errors.year_of_birth}</p>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

// Summary Step Component
interface SummaryStepProps {
  product: Product
  lensSelection: LensSelection
  prescriptionData: PrescriptionFormData
  lensOptions: LensType[]
  coatingOptions: LensCoating[]
  treatments: Array<{ id: string; name: string; price: number }>
  progressiveOptions: Array<{ id: string; name: string; price: number; description: string; recommended?: boolean; variantId?: number }>
  lensThicknessMaterials: Array<{ id: number; name: string; slug: string; price: number }>
  onBack: () => void
  onAddToCart: () => void
  onCheckoutNow?: () => void
  loading: boolean
  checkoutMode?: 'cart' | 'checkout'
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  product,
  lensSelection,
  prescriptionData,
  lensOptions,
  coatingOptions,
  treatments,
  progressiveOptions,
  lensThicknessMaterials,
  onBack,
  onAddToCart,
  onCheckoutNow,
  loading,
  checkoutMode = 'cart'
}) => {
  const { t } = useTranslation()
  const basePrice = product.sale_price && Number(product.sale_price) < Number(product.price)
    ? Number(product.sale_price)
    : Number(product.price) || 0

  let total: number = basePrice

  // For progressive lenses, use the progressive option price from API
  if (lensSelection.progressiveOption) {
    const progressiveOption = progressiveOptions.find(opt => opt.id === lensSelection.progressiveOption)
    if (progressiveOption) {
      total += progressiveOption.price || 0
    }
  } else if (lensSelection.lensIndex) {
    const selectedLensType = lensOptions.find(lt => lt.index === lensSelection.lensIndex)
    if (selectedLensType) {
      total += Number(selectedLensType.price_adjustment) || 0
    }
  }

  // Add lens thickness price from API
  if (lensSelection.lensThicknessMaterialId) {
    const selectedMaterial = lensThicknessMaterials.find(m => m.id === lensSelection.lensThicknessMaterialId)
    if (selectedMaterial) {
      total += selectedMaterial.price || 0
    }
  } else if (lensSelection.lensThickness) {
    // Fallback to slug-based lookup if material ID not available
    const materialSlug = lensSelection.lensThickness === 'plastic' ? 'plastic' : 'glass'
    const selectedMaterial = lensThicknessMaterials.find(m => m.slug === materialSlug)
    if (selectedMaterial) {
      total += selectedMaterial.price || 0
    }
  }

  lensSelection.coatings.forEach(coatingSlug => {
    const coating = coatingOptions.find(c => c.slug === coatingSlug)
    if (coating) {
      total += Number(coating.price_adjustment) || 0
    }
  })

  // Add treatment prices from API
  lensSelection.treatments.forEach(treatmentId => {
    const treatment = treatments.find(t => t.id === treatmentId)
    if (treatment) {
      total += treatment.price || 0
    }
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">Summary</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="text-sm text-gray-600">Product</div>
          <div className="font-semibold text-gray-900">{product.name}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Lens Type</div>
          <div className="font-semibold text-gray-900 capitalize">
            {lensSelection.type.replace('_', ' ')}
          </div>
        </div>

        {lensSelection.progressiveOption && (
          <div>
            <div className="text-sm text-gray-600">Progressive Option</div>
            <div className="font-semibold text-gray-900 capitalize">
              {lensSelection.progressiveOption.replace('-', ' ')}
            </div>
          </div>
        )}

        {lensSelection.lensIndex && (
          <div>
            <div className="text-sm text-gray-600">Lens Index</div>
            <div className="font-semibold text-gray-900">{lensSelection.lensIndex}</div>
          </div>
        )}

        {lensSelection.lensThickness && (
          <div>
            <div className="text-sm text-gray-600">Lens Thickness</div>
            <div className="font-semibold text-gray-900">
              {lensSelection.lensThickness === 'plastic' ? 'Unbreakable (Plastic)' : 'Minerals (Glass)'}
            </div>
          </div>
        )}

        {lensSelection.coatings.length > 0 && (
          <div>
            <div className="text-sm text-gray-600">Coatings</div>
            <div className="font-semibold text-gray-900">
              {lensSelection.coatings.map(slug => {
                const coating = coatingOptions.find(c => c.slug === slug)
                return coating?.name || slug
              }).join(', ')}
            </div>
          </div>
        )}

        {lensSelection.treatments.length > 0 && (
          <div>
            <div className="text-sm text-gray-600">Treatments</div>
            <div className="font-semibold text-gray-900">
              {lensSelection.treatments.map(treatmentId => {
                const treatment = treatments.find(t => t.id === treatmentId)
                return treatment?.name || treatmentId
              }).join(', ')}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm text-gray-600">Prescription</div>
          <div className="text-sm text-gray-700">
            PD: {prescriptionData.pd_binocular}mm<br />
            OD: {prescriptionData.od_sphere} {prescriptionData.od_cylinder} {prescriptionData.od_axis}<br />
            OS: {prescriptionData.os_sphere} {prescriptionData.os_cylinder} {prescriptionData.os_axis}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-900">Total</div>
            <div className="text-2xl font-bold text-blue-950">${total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {onCheckoutNow && (
          <button
            onClick={onCheckoutNow}
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('shop.checkoutNow', 'Checkout Now')}
          </button>
        )}
        <button
          onClick={onAddToCart}
          disabled={loading}
          className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('shop.addingToCart') : t('shop.addToCart')}
        </button>
      </div>
    </div>
  )
}

// Shipping Step Component
interface ShippingStepProps {
  shippingAddress: OrderAddress & { state?: string }
  onAddressChange: (field: keyof (OrderAddress & { state?: string }), value: string) => void
  onNext: () => void
  onBack: () => void
  errors: Record<string, string>
}

const ShippingStep: React.FC<ShippingStepProps> = ({
  shippingAddress,
  onAddressChange,
  onNext,
  onBack,
  errors
}) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">{t('shop.shippingAddress', 'Shipping Address')}</h3>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.firstName', 'First Name')} *
            </label>
            <input
              type="text"
              value={shippingAddress.first_name}
              onChange={(e) => onAddressChange('first_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.lastName', 'Last Name')} *
            </label>
            <input
              type="text"
              value={shippingAddress.last_name}
              onChange={(e) => onAddressChange('last_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.email', 'Email')} *
          </label>
          <input
            type="email"
            value={shippingAddress.email}
            onChange={(e) => onAddressChange('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.phone', 'Phone')} *
          </label>
          <input
            type="tel"
            value={shippingAddress.phone}
            onChange={(e) => onAddressChange('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.address', 'Address')} *
          </label>
          <input
            type="text"
            value={shippingAddress.address}
            onChange={(e) => onAddressChange('address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.city', 'City')} *
            </label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => onAddressChange('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.state', 'State')}
            </label>
            <input
              type="text"
              value={shippingAddress.state || ''}
              onChange={(e) => onAddressChange('state', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.zipCode', 'Zip Code')} *
          </label>
          <input
            type="text"
            value={shippingAddress.zip_code}
            onChange={(e) => onAddressChange('zip_code', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.country', 'Country')} *
          </label>
          <input
            type="text"
            value={shippingAddress.country}
            onChange={(e) => onAddressChange('country', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          {t('common.back', 'Back')}
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
        >
          {t('common.continue', 'Continue')}
        </button>
      </div>
    </div>
  )
}

// Payment Step Component
interface PaymentStepProps {
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  onBack: () => void
  onCreateOrder: () => void
  isProcessing: boolean
  error: string | null
  order: any
  onLogin?: () => void
  isAuthenticated?: boolean
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  onBack,
  onCreateOrder,
  isProcessing,
  error,
  order,
  onLogin,
  isAuthenticated
}) => {
  const { t } = useTranslation()
  
  // Check if error is login-related
  const isLoginError = error && typeof error === 'string' && (
    error.toLowerCase().includes('login') ||
    error.toLowerCase().includes('authentication') ||
    error.toLowerCase().includes('unauthorized') ||
    error.toLowerCase().includes('session expired')
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">{t('shop.payment', 'Payment')}</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm mb-2">
            {error}
          </div>
          {isLoginError && onLogin && !isAuthenticated && (
            <button
              onClick={onLogin}
              className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              {t('auth.login', 'Login')}
            </button>
          )}
        </div>
      )}

      {order && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {t('shop.orderCreated', 'Order created successfully!')} #{order.order_number || order.id}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('shop.paymentMethod', 'Payment Method')}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="stripe">Stripe (Credit/Debit Card)</option>
            <option value="paypal">PayPal</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>

        {paymentMethod === 'stripe' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {t('shop.stripeInfo', 'You will be redirected to Stripe to complete your payment securely.')}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t('common.back', 'Back')}
        </button>
        <button
          onClick={onCreateOrder}
          disabled={isProcessing}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? t('shop.processing', 'Processing...') : t('shop.completeOrder', 'Complete Order')}
        </button>
      </div>
    </div>
  )
}

export default ProductCheckout

