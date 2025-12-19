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
import { getProductImageUrl } from '../../utils/productImage'
import { useLensCustomization } from '../../hooks/useLensCustomization'
import { 
  getPrescriptionLensTypes as getPrescriptionLensTypesFromCustomization, 
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
  type LensTreatment,
  type PrescriptionLensType as ConfigPrescriptionLensType
} from '../../services/productConfigurationService'

interface ProductCheckoutProps {
  product: Product
  onClose?: () => void
}

type CheckoutStep = 'lens_type' | 'prescription' | 'progressive' | 'lens_thickness' | 'treatment' | 'summary'

interface LensSelection {
  type: 'distance_vision' | 'near_vision' | 'progressive' | 'single_vision' | 'bifocal' | 'reading'
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

const ProductCheckout: React.FC<ProductCheckoutProps> = ({ product, onClose }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('lens_type')
  const [lensOptions, setLensOptions] = useState<LensType[]>([])
  const [coatingOptions, setCoatingOptions] = useState<LensCoating[]>([])
  const [lensIndexOptions, setLensIndexOptions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  const [lensSelection, setLensSelection] = useState<LensSelection>({
    type: 'distance_vision',
    coatings: [],
    treatments: []
  })

  // State for order summary
  const [orderSummary, setOrderSummary] = useState<Array<{
    name: string
    price: number
    type: 'product' | 'lens_type' | 'coating' | 'treatment'
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
  const [apiPrescriptionLensTypes, setApiPrescriptionLensTypes] = useState<PrescriptionLensType[]>([])
  const [priceCalculation, setPriceCalculation] = useState<{ total: number; breakdown: Array<{ item: string; price: number }> } | null>(null)
  const [productCustomizationOptions, setProductCustomizationOptions] = useState<ProductCustomizationOptions | null>(null)
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

  useEffect(() => {
    // PRIMARY API: GET /api/products/:id/configuration (from API guide)
    // This returns all lens configuration including variants
    // FALLBACK APIs: Individual endpoints if configuration fails
    fetchProductConfiguration()
    fetchProductOptions()
    fetchProductCustomizationOptions()
    if (isAuthenticated) {
      fetchSavedPrescriptions()
    }
  }, [isAuthenticated, product.id])
  
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
          // Store the actual API types with their real IDs
          const apiTypes: PrescriptionLensType[] = config.prescriptionLensTypes.map(type => ({
            id: type.id,
            name: type.name,
            slug: type.slug,
            description: type.description || '',
            prescription_type: type.prescriptionType === 'progressive' ? 'progressive' : 'single_vision',
            is_active: true,
            variants: type.variants || []
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
          console.log('📋 [API] Actual API types with IDs:', apiTypes.map(t => ({ id: t.id, name: t.name, prescription_type: t.prescription_type })))
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
            const mappedOptions = activeVariants.map((v: any) => ({
              id: v.slug || v.id.toString(),
              name: v.name,
              price: v.price || 0,
              description: v.description || v.useCases || v.viewingRange || '',
              recommended: v.isRecommended || v.is_recommended || false,
              viewingRange: v.viewingRange || v.viewing_range,
              useCases: v.useCases || v.use_cases,
              variantId: v.id
            }))
            
            // Sort by sortOrder if available, then by recommended, then by name
            mappedOptions.sort((a, b) => {
              const variantA = activeVariants.find((v: any) => (v.slug || v.id.toString()) === a.id)
              const variantB = activeVariants.find((v: any) => (v.slug || v.id.toString()) === b.id)
              const sortOrderA = variantA?.sortOrder || variantA?.sort_order || 0
              const sortOrderB = variantB?.sortOrder || variantB?.sort_order || 0
              if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB
              if (a.recommended && !b.recommended) return -1
              if (!a.recommended && b.recommended) return 1
              return a.name.localeCompare(b.name)
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
      let types = apiPrescriptionLensTypes
      
      if (!types || types.length === 0) {
        console.log('📥 [API] No stored types, fetching from API...')
        // First try to get active types
        types = await getPrescriptionLensTypes({ isActive: true })
        
        // If no active types found, try fetching all types (including inactive)
        if (!types || types.length === 0) {
          console.log('📥 [API] No active types found, fetching all types (including inactive)...')
          types = await getPrescriptionLensTypes({}) // No filter - get all types
        }
        
        if (types && types.length > 0) {
          setApiPrescriptionLensTypes(types)
          console.log(`✅ [API] Fetched ${types.length} prescription lens types (including inactive)`)
        }
      } else {
        console.log('✅ [API] Using stored API types:', types.length)
      }
      
      if (!types || types.length === 0) {
        console.warn('⚠️ [API] No prescription lens types found in database.')
        console.warn('   → Please add prescription lens types in admin panel')
        console.warn('   → Make sure at least one type has prescription_type="progressive"')
        console.warn('   → Using default fallback options as last resort')
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
        console.warn('   → Please ensure a lens type with prescription_type="progressive" exists')
        console.warn('   → Using default fallback options as last resort')
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
          activeCount: variants?.filter(v => v.is_active === true || v.is_active === 1 || v.is_active === '1').length || 0
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
        
        console.info('   → No variants found (active or inactive). Using default fallback options.')
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
        const isActive = v.is_active === true || v.is_active === 1 || v.is_active === '1'
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
          return a.name.localeCompare(b.name)
        })
        
        // Map variants to progressive options format according to API guide
        // Handle both camelCase (from API) and snake_case (from database) formats
        const mappedOptions = sortedVariants.map((variant: PrescriptionLensVariant) => ({
          id: variant.slug || variant.id.toString(),
          name: variant.name,
          price: variant.price || 0,
          description: variant.description || (variant as any).useCases || (variant as any).use_cases || (variant as any).viewingRange || (variant as any).viewing_range || '',
          recommended: (variant as any).isRecommended || variant.is_recommended || false,
          viewingRange: (variant as any).viewingRange || (variant as any).viewing_range,
          useCases: (variant as any).useCases || (variant as any).use_cases,
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
          console.warn('   → No variants found at all. Using default fallback options.')
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
      console.error('❌ [API] Error in fallback method:', error?.message || error)
      console.info('   → Using default fallback options')
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
          thicknessValue: o.thicknessValue,
          price: o.price
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



  // Helper function for default progressive options
  const getDefaultProgressiveOptions = () => [
          {
            id: 'premium',
            name: 'Premium',
            price: 52.95,
            description: 'Up to 40% wider viewing areas than Standard. Maximum comfort & balanced vision.',
            recommended: true,
            icon: 'premium'
          },
          {
            id: 'standard',
            name: 'Standard',
            price: 37.95,
            description: 'Perfect for everyday tasks, offering a comfortable and well-balanced view.',
            icon: 'standard'
          },
          {
            id: 'mid-range',
            name: 'Mid-Range',
            price: 37.95,
            description: 'Clear vision within 14 ft, ideal for work, dining out or watching TV. Not for driving.',
            icon: 'mid-range'
          },
          {
            id: 'near-range',
            name: 'Near-Range',
            price: 37.95,
            description: 'Clear vision within 3 ft, ideal for reading and heavy screen use. Not for driving.',
            icon: 'near-range'
          }
  ]

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
      } catch (error) {
        console.error('Error calculating price:', error)
        // Fallback to manual calculation
        setPriceCalculation(null)
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
        if (isNaN(pd) || pd < 50 || pd > 80) {
          newErrors.pd_mm = 'PD must be between 50 and 80mm'
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
    setLensSelection(prev => ({ 
      ...prev, 
      lensThickness: thickness,
      lensThicknessMaterialId: materialId
    }))
  }

  const handleLensThicknessOptionChange = (option: string) => {
    setLensSelection(prev => ({ ...prev, lensThicknessOption: option }))
  }

  const handleLensIndexChange = (index: number) => {
    setLensSelection(prev => ({ ...prev, lensIndex: index, progressiveOption: undefined, progressiveVariantId: undefined }))
  }

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

  const handleCoatingToggle = (coatingSlug: string) => {
    setLensSelection(prev => ({
      ...prev,
      coatings: prev.coatings.includes(coatingSlug)
        ? prev.coatings.filter(c => c !== coatingSlug)
        : [...prev.coatings, coatingSlug]
    }))
  }

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

  // Update order summary whenever selections change
  const updateOrderSummary = useCallback(() => {
    const summary: Array<{ name: string; price: number; type: 'product' | 'lens_type' | 'coating' | 'treatment' | 'lens_thickness'; id?: string | number; removable?: boolean }> = []
    
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
          name: `${selectedLensType.name}${lensSelection.selectedColor ? ` (${lensSelection.selectedColor.name})` : ''}`,
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

    // Add selected treatments
    lensSelection.treatments.forEach(treatmentId => {
      const treatment = apiTreatments.find(t => t.id === treatmentId)
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

    setOrderSummary(summary)
  }, [lensSelection, apiLensTypes, apiTreatments, coatingOptions, product, progressiveOptions, lensThicknessMaterials])

  const handleTreatmentToggle = (treatmentId: string) => {
    setLensSelection(prev => ({
      ...prev,
      treatments: prev.treatments.includes(treatmentId)
        ? prev.treatments.filter(t => t !== treatmentId)
        : [...prev.treatments, treatmentId]
    }))
  }

  const handleLensTypeSelect = (lensTypeId: string, colorId: string, color: { id: string; name: string; color: string; gradient?: boolean }) => {
    setLensSelection(prev => ({
      ...prev,
      selectedLensTypeId: lensTypeId,
      selectedColorId: colorId,
      selectedColor: color
    }))
  }

  // Update order summary when selections change
  useEffect(() => {
    updateOrderSummary()
  }, [updateOrderSummary])

  const handlePrescriptionChange = (field: keyof PrescriptionFormData, value: string) => {
    setPrescriptionData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
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
      setCurrentStep('summary')
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
      const basePriceRaw = product.sale_price && Number(product.sale_price) < Number(product.price)
        ? product.sale_price 
        : product.price
      
      const basePrice = typeof basePriceRaw === 'string'
        ? parseFloat(basePriceRaw.replace(/[^0-9.]/g, '')) || 0
        : Number(basePriceRaw) || 0

      let finalPrice: number = basePrice
      
      // Add lens type price adjustment
      // For progressive lenses, use the progressive option price
      if (lensSelection.progressiveOption) {
        const progressiveOption = progressiveOptions.find(opt => opt.id === lensSelection.progressiveOption)
        const progressivePrice = typeof progressiveOption?.price === 'string'
          ? parseFloat(progressiveOption.price.replace(/[^0-9.]/g, '')) || 0
          : Number(progressiveOption?.price) || 0
        finalPrice += progressivePrice
      } else if (lensSelection.lensIndex) {
        // For regular lens index selection
        const selectedLensType = lensOptions.find(lt => lt.index === lensSelection.lensIndex)
        if (selectedLensType) {
          const lensPrice = typeof selectedLensType.price_adjustment === 'string'
            ? parseFloat(selectedLensType.price_adjustment.replace(/[^0-9.]/g, '')) || 0
            : Number(selectedLensType.price_adjustment) || 0
          finalPrice += lensPrice
          // Store the lens type ID for API
          lensSelection.lensTypeId = selectedLensType.id
        }
      }

      // Add coating price adjustments
      lensSelection.coatings.forEach(coatingSlug => {
        const coating = coatingOptions.find(c => c.slug === coatingSlug)
        if (coating) {
          const coatingPrice = typeof coating.price_adjustment === 'string'
            ? parseFloat(coating.price_adjustment.replace(/[^0-9.]/g, '')) || 0
            : Number(coating.price_adjustment) || 0
          finalPrice += coatingPrice
        }
      })

      // Add lens thickness price from API
      if (lensSelection.lensThicknessMaterialId) {
        const selectedMaterial = lensThicknessMaterials.find(m => m.id === lensSelection.lensThicknessMaterialId)
        if (selectedMaterial) {
          const materialPrice = typeof selectedMaterial.price === 'string'
            ? parseFloat(selectedMaterial.price.replace(/[^0-9.]/g, '')) || 0
            : Number(selectedMaterial.price) || 0
          finalPrice += materialPrice
        }
      } else if (lensSelection.lensThickness) {
        // Fallback to slug-based lookup if material ID not available
        const materialSlug = lensSelection.lensThickness === 'plastic' ? 'plastic' : 'glass'
        const selectedMaterial = lensThicknessMaterials.find(m => m.slug === materialSlug)
        if (selectedMaterial) {
          const materialPrice = typeof selectedMaterial.price === 'string'
            ? parseFloat(selectedMaterial.price.replace(/[^0-9.]/g, '')) || 0
            : Number(selectedMaterial.price) || 0
          finalPrice += materialPrice
        }
      }

      // Add treatment price adjustments from API
      lensSelection.treatments.forEach(treatmentId => {
        const treatment = apiTreatments.find(t => t.id === treatmentId)
        if (treatment) {
          const treatmentPrice = typeof treatment.price === 'string'
            ? parseFloat(treatment.price.replace(/[^0-9.]/g, '')) || 0
            : Number(treatment.price) || 0
          finalPrice += treatmentPrice
        }
      })

      // If authenticated, add to cart via API
      if (isAuthenticated) {
        // Build prescription data for cart
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
          od: {
            sph: parseFloat(prescriptionData.od_sphere),
            cyl: prescriptionData.od_cylinder ? parseFloat(prescriptionData.od_cylinder) : undefined,
            axis: prescriptionData.od_axis ? parseInt(prescriptionData.od_axis) : undefined
          },
          os: {
            sph: parseFloat(prescriptionData.os_sphere),
            cyl: prescriptionData.os_cylinder ? parseFloat(prescriptionData.os_cylinder) : undefined,
            axis: prescriptionData.os_axis ? parseInt(prescriptionData.os_axis) : undefined
          }
        }

        // Get lens thickness material ID
        let lensThicknessMaterialId: number | undefined
        if (lensSelection.lensThickness === 'plastic') {
          const material = lensThicknessMaterials.find(m => m.slug === 'unbreakable-plastic' || m.name.toLowerCase().includes('plastic'))
          lensThicknessMaterialId = material?.id
        } else if (lensSelection.lensThickness === 'glass') {
          const material = lensThicknessMaterials.find(m => m.slug === 'minerals-glass' || m.name.toLowerCase().includes('glass'))
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

        // Get color IDs
        const photochromicColorId = lensSelection.photochromicColor 
          ? (productConfig?.photochromicColors?.find(c => c.hexCode === lensSelection.photochromicColor?.color)?.id || null)
          : null
        const prescriptionSunColorId = lensSelection.prescriptionSunColor
          ? (productConfig?.prescriptionSunColors?.find(c => c.hexCode === lensSelection.prescriptionSunColor?.color)?.id || null)
          : null

        const cartResult = await addItemToCart({
          product_id: product.id || 0,
          quantity: 1,
          lens_type: lensSelection.type,
          prescription_data: cartPrescriptionData,
          progressive_variant_id: lensSelection.progressiveVariantId,
          lens_thickness_material_id: lensThicknessMaterialId,
          lens_thickness_option_id: lensThicknessOptionId,
          treatment_ids: treatmentIds.length > 0 ? treatmentIds : undefined,
          photochromic_color_id: photochromicColorId,
          prescription_sun_color_id: prescriptionSunColorId
        })

        if (!cartResult.success) {
          throw new Error(cartResult.message || 'Failed to add item to cart')
        }
      }

      // Also add to local cart for immediate UI update (for both authenticated and guest users)
      // Ensure finalPrice is a proper number (not string concatenation)
      const finalPriceNumber = typeof finalPrice === 'string' 
        ? parseFloat(finalPrice.replace(/[^0-9.]/g, '')) || 0
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
          prescriptionId: finalPrescriptionId
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

  // Get product images
  const productImages: string[] = (() => {
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          return JSON.parse(product.images)
        } catch {
          return [product.images]
        }
      }
      if (Array.isArray(product.images)) {
        return product.images
      }
    }
    return [product.image || product.image_url || '/assets/images/frame1.png']
  })()

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
              <div className="pt-4 border-t-2 border-gray-300 mt-4">
                <div className="text-sm text-gray-500 mb-1">Estimate Total</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(() => {
                    // Always calculate total from order summary (source of truth)
                    const total = orderSummary.reduce((sum, item) => {
                      return sum + (Number(item.price) || 0)
                    }, 0)
                    return total.toFixed(2)
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Product Image */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex-1 flex items-center justify-center relative" style={{ minHeight: '500px' }}>
              <img
                src={getProductImageUrl(product, selectedImageIndex)}
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
                onLensThicknessChange={handleLensThicknessChange}
                onLensThicknessOptionChange={handleLensThicknessOptionChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 'treatment' && (
              <TreatmentStep
                lensSelection={lensSelection}
                treatments={apiTreatments}
                onTreatmentToggle={handleTreatmentToggle}
                onColorSelect={(colorType, color) => {
                  if (colorType === 'photochromic') {
                    setLensSelection(prev => ({ ...prev, photochromicColor: color, prescriptionSunColor: undefined }))
                  } else if (colorType === 'prescription_sun') {
                    setLensSelection(prev => ({ ...prev, prescriptionSunColor: color, photochromicColor: undefined }))
                  }
                }}
                onNext={handleNext}
                onBack={handleBack}
                loading={customizationLoading}
                error={customizationError}
                onRetry={refetchCustomization}
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
                loading={loading}
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
  const lensTypeOptions = prescriptionLensTypes.length > 0
    ? prescriptionLensTypes
        .map(type => ({
          id: type.type || type.id || 'unknown',
          name: type.name || 'Unknown',
          description: type.description || ''
        }))
        .filter(option => option.id && option.id !== 'unknown') // Filter out invalid options
    : [
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
    
    // Immediately navigate based on selection
    if (type === 'progressive') {
      if (onNavigateToProgressive) {
        onNavigateToProgressive()
      } else {
        onNext() // Fallback to onNext which handles progressive navigation
      }
    } else {
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
          progressiveOptions.map((option) => {
          const isSelected = lensSelection.progressiveOption === option.id || 
                            (option.id === 'premium' && !lensSelection.progressiveOption && progressiveOptions.length > 0)
          
          return (
            <button
              key={option.id}
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
                      <span className="font-semibold text-gray-900 text-base">{option.name}</span>
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
                  {option.useCases && (
                      <div className="text-xs text-gray-500 italic">{option.useCases}</div>
                  )}
                  {option.viewingRange && (
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
  onLensThicknessChange: (thickness: 'plastic' | 'glass', materialId?: number) => void
  onLensThicknessOptionChange: (option: string) => void
  onNext: () => void
  onBack: () => void
}

const LensThicknessStep: React.FC<LensThicknessStepProps> = ({
  lensSelection,
  lensThicknessMaterials = [],
  lensThicknessOptions = [],
  lensIndexOptions = [1.50, 1.60, 1.67, 1.74],
  onLensThicknessChange,
  onLensThicknessOptionChange,
  onNext,
  onBack
}) => {
  // Helper function to format lens index option label
  const getLensIndexLabel = (index: number): string => {
    if (index === 1.50) return 'Standard (1.50)'
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
              const isPlastic = material.slug === 'unbreakable-plastic' || material.name.toLowerCase().includes('plastic')
              const isGlass = material.slug === 'minerals-glass' || material.name.toLowerCase().includes('glass')
              const isSelected = (isPlastic && lensSelection.lensThickness === 'plastic') ||
                                (isGlass && lensSelection.lensThickness === 'glass')
              
              return (
                <label
                  key={material.id}
                  className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="lensThickness"
                    checked={isSelected}
                    onChange={() => onLensThicknessChange(isPlastic ? 'plastic' : 'glass', material.id)}
                    className="w-5 h-5 text-blue-950 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">{material.name}</span>
                  <span className="text-sm font-semibold text-gray-700">${material.price.toFixed(2)}</span>
                </label>
              )
            })
          ) : (
            // Fallback to default options if API data not available
            <>
          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="lensThickness"
              checked={lensSelection.lensThickness === 'plastic'}
              onChange={() => onLensThicknessChange('plastic')}
              className="w-5 h-5 text-blue-950 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="flex-1 text-sm font-medium text-gray-900">Unbreakable (Plastic)</span>
            <span className="text-sm font-semibold text-gray-700">$30.00</span>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="lensThickness"
              checked={lensSelection.lensThickness === 'glass'}
              onChange={() => onLensThicknessChange('glass')}
              className="w-5 h-5 text-blue-950 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="flex-1 text-sm font-medium text-gray-900">Minerals (Glass)</span>
            <span className="text-sm font-semibold text-gray-700">$60.00</span>
          </label>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Lens Thickness</label>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Select additional thickness option"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <select
            value={lensSelection.lensThicknessOption || ''}
            onChange={(e) => onLensThicknessOptionChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Please select</option>
            {lensThicknessOptions.length > 0 ? (
              lensThicknessOptions.map((option) => (
                <option key={option.id} value={`option_${option.id}`}>
                  {option.name} {option.thicknessValue ? `(${option.thicknessValue})` : ''}
                </option>
              ))
            ) : (
              lensIndexOptions.map((index) => (
              <option key={index} value={`index_${index}`}>
                {getLensIndexLabel(index)}
              </option>
              ))
            )}
          </select>
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
  treatments: Array<{ id: string; name: string; price: number; description?: string }>
  productConfig?: ProductConfig | null
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
  productConfig,
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
  const [selectedPhotochromicType, setSelectedPhotochromicType] = useState<string | null>(null)
  const [selectedPrescriptionSunType, setSelectedPrescriptionSunType] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<{ type: string; colorId: string } | null>(null)

  // Standard treatments
  const standardTreatments = [
    { id: 'scratch_proof', name: 'Scratch Proof', price: 30.00, icon: 'scratch' },
    { id: 'anti_glare', name: 'Anti Glare', price: 30.00, icon: 'glare' },
    { id: 'blue_lens_anti_glare', name: 'Blue Lens Anti Glare', price: 30.00, icon: 'blue', selected: lensSelection.treatments.includes('blue_lens_anti_glare') }
  ]

  // Use API colors if available, otherwise fallback to defaults
  const photochromicColors = productConfig?.photochromicColors || []
  const prescriptionSunColors = productConfig?.prescriptionSunColors || []
  
  // Photochromic options (with API colors if available)
  const photochromicOptions = [
    {
      id: 'eyeqlenz_zenni',
      name: 'EyeQLenz™ with Zenni ID Guard™',
      description: '4-in-1 lens that reflects infrared light to disrupt unwanted tracking technology, filters blue light & blocks 100% UV. Stays clear indoors and darkens outdoors, with a subtle pink sheen.',
      colors: [
        { id: '1', name: 'Grey-Pink', color: 'linear-gradient(135deg, #4a5568, #ec4899)', gradient: true },
        { id: '2', name: 'Brown-Pink', color: 'linear-gradient(135deg, #92400e, #ec4899)', gradient: true },
        { id: '3', name: 'Teal-Pink', color: 'linear-gradient(135deg, #0d9488, #ec4899)', gradient: true },
        { id: '4', name: 'Purple-Pink', color: 'linear-gradient(135deg, #7c3aed, #ec4899)', gradient: true },
        { id: '5', name: 'Red-Pink', color: 'linear-gradient(135deg, #991b1b, #ec4899)', gradient: true },
        { id: '6', name: 'Pink-Pink', color: 'linear-gradient(135deg, #ec4899, #f9a8d4)', gradient: true },
        { id: '7', name: 'Green-Pink', color: 'linear-gradient(135deg, #166534, #ec4899)', gradient: true }
      ]
    },
    {
      id: 'eyeqlenz',
      name: 'EyeQLenz™',
      description: 'Block infrared, UV, and blue light with lenses that stay clear indoors and darken outdoors, featuring a subtle pink sheen.',
      colors: [
        { id: '1', name: 'Grey', color: '#4a5568', gradient: false },
        { id: '2', name: 'Brown', color: '#92400e', gradient: false },
        { id: '3', name: 'Teal', color: '#0d9488', gradient: false },
        { id: '4', name: 'Purple', color: '#7c3aed', gradient: false },
        { id: '5', name: 'Red', color: '#991b1b', gradient: false },
        { id: '6', name: 'Pink', color: '#ec4899', gradient: false },
        { id: '7', name: 'Green', color: '#166534', gradient: false }
      ]
    },
    {
      id: 'transitions_gen_s',
      name: 'Transitions® GEN S™',
      description: 'Darken outdoors in seconds and come in 8 vibrant colors. The perfect everyday lens.',
      colors: [
        { id: '1', name: 'Grey', color: '#6b7280', gradient: false },
        { id: '2', name: 'Slate', color: '#475569', gradient: false },
        { id: '3', name: 'Brown', color: '#92400e', gradient: false },
        { id: '4', name: 'Plum', color: '#581c87', gradient: false },
        { id: '5', name: 'Blue', color: '#1e40af', gradient: false },
        { id: '6', name: 'Teal', color: '#0f766e', gradient: false },
        { id: '7', name: 'Olive', color: '#365314', gradient: false },
        { id: '8', name: 'Magenta', color: '#831843', gradient: false }
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'Lenses that are clear indoors, darken outdoors, and block 100% UV rays.',
      colors: [
        { id: '1', name: 'Grey', color: '#6b7280', gradient: false },
        { id: '2', name: 'Brown', color: '#92400e', gradient: false }
      ]
    },
    {
      id: 'blokz_photochromic',
      name: 'Blokz Photochromic',
      description: 'Virtually clear indoors, automatically darkens outdoors for blue light and UV protection.',
      colors: [
        { id: '1', name: 'Grey', color: '#4a5568', gradient: false }
      ]
    }
  ]

  // Prescription Lenses Sun options
  const prescriptionSunOptions = [
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
            { id: '1', name: 'Charcoal', color: '#1f2937', gradient: false },
            { id: '2', name: 'Brown', color: '#78350f', gradient: false },
            { id: '3', name: 'Green', color: '#14532d', gradient: false }
          ]
        },
        {
          id: 'polarized_mirror',
          name: 'Mirror',
          price: 27.95,
          colors: [
            { id: '1', name: 'Green-Yellow', color: 'linear-gradient(135deg, #84cc16, #eab308)', gradient: true },
            { id: '2', name: 'Blue', color: '#3b82f6', gradient: false },
            { id: '3', name: 'Silver', color: '#9ca3af', gradient: false },
            { id: '4', name: 'Purple', color: '#a855f7', gradient: false },
            { id: '5', name: 'Orange', color: '#f97316', gradient: false },
            { id: '6', name: 'Turquoise', color: '#06b6d4', gradient: false },
            { id: '7', name: 'Yellow', color: '#eab308', gradient: false },
            { id: '8', name: 'Pink-Purple', color: 'linear-gradient(135deg, #ec4899, #a855f7)', gradient: true }
          ]
        }
      ]
    },
    {
      id: 'classic',
      name: 'Classic',
      price: 60.90,
      description: 'Subtle color and basic UV protection for a timeless look.',
      subOptions: [
        {
          id: 'classic_fashion',
          name: 'Fashion',
          price: 0,
          colors: [
            { id: '1', name: 'Lavender', color: '#c084fc', gradient: false },
            { id: '2', name: 'Cream', color: '#fef3c7', gradient: false },
            { id: '3', name: 'Blue', color: '#bfdbfe', gradient: false },
            { id: '4', name: 'Pink', color: '#fbcfe8', gradient: false },
            { id: '5', name: 'Hot Pink', color: '#f472b6', gradient: false }
          ]
        },
        {
          id: 'classic_mirror',
          name: 'Mirror',
          price: 20.00,
          colors: [
            { id: '1', name: 'Yellow', color: '#eab308', gradient: false },
            { id: '2', name: 'Purple', color: '#a855f7', gradient: false },
            { id: '3', name: 'Turquoise', color: '#06b6d4', gradient: false },
            { id: '4', name: 'Pink-Purple', color: 'linear-gradient(135deg, #ec4899, #a855f7)', gradient: true },
            { id: '5', name: 'Lime', color: '#84cc16', gradient: false },
            { id: '6', name: 'Orange', color: '#f97316', gradient: false },
            { id: '7', name: 'Blue', color: '#3b82f6', gradient: false },
            { id: '8', name: 'Silver', color: '#9ca3af', gradient: false }
          ]
        },
        {
          id: 'classic_gradient',
          name: 'Gradient',
          price: 4.00,
          colors: []
        },
        {
          id: 'classic_classic',
          name: 'Classic',
          price: 0,
          colors: []
        }
      ]
    },
    {
      id: 'blokz_sunglasses',
      name: 'Blokz® Sunglasses',
      price: 95.90,
      description: 'Protects your eyes from harmful blue light and UV rays.',
      subOptions: [
        {
          id: 'blokz_mirror',
          name: 'Mirror',
          price: 20.00,
          colors: []
        },
        {
          id: 'blokz_classic',
          name: 'Classic',
          price: 0,
          colors: []
        }
      ]
    }
  ]

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
    onTreatmentToggle(treatmentId)
    
    // Determine if this is photochromic or prescription sun
    if (type.startsWith('eyeqlenz') || type.startsWith('transitions') || type.startsWith('standard') || type.startsWith('blokz_photochromic')) {
      // Photochromic color
      if (onColorSelect) {
        onColorSelect('photochromic', color)
      }
    } else if (type.startsWith('polarized') || type.startsWith('classic') || type.startsWith('blokz_sunglasses')) {
      // Prescription sun color
      if (onColorSelect) {
        onColorSelect('prescription_sun', color)
      }
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
          <span className="ml-3 text-gray-600">Loading treatments...</span>
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
            {/* Standard Treatments */}
            {standardTreatments.map((treatment) => {
              const isSelected = lensSelection.treatments.includes(treatment.id)
              
              return (
                <label
                  key={treatment.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => onTreatmentToggle(treatment.id)}
                    className="w-5 h-5 text-blue-950 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{treatment.name}</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">${treatment.price.toFixed(2)}</span>
                </label>
              )
            })}

            {/* Photochromic */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                onClick={handlePhotochromicClick}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                      <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Photochromic</div>
                      </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPhotochromic ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
              
              {showPhotochromic && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                  {photochromicOptions.map((option) => (
                    <div key={option.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{option.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      {option.colors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {option.colors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => handleColorSelect(option.id, color.id, option.id, color)}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                (selectedColor?.type === option.id && selectedColor?.colorId === color.id) ||
                                (lensSelection.photochromicColor?.id === color.id)
                                  ? 'border-blue-600 ring-2 ring-blue-200'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                background: color.gradient ? color.color : color.color
                              }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        )}
                      </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription Lenses Sun */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={handlePrescriptionSunClick}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Prescription Lenses Sun</div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPrescriptionSun ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {showPrescriptionSun && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                  {prescriptionSunOptions.map((option) => (
                    <div key={option.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {option.name}
                          {option.price > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              (+${option.price.toFixed(2)})
                            </span>
                          )}
                        </h4>
                </div>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      {option.subOptions && option.subOptions.map((subOption) => (
                        <div key={subOption.id} className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {subOption.name}
                            {subOption.price > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                (+${subOption.price.toFixed(2)})
                              </span>
                            )}
                            {subOption.price === 0 && subOption.name !== 'Classic' && (
                              <span className="ml-2 text-xs text-green-600">Free</span>
                            )}
                          </div>
                          {subOption.colors && subOption.colors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {subOption.colors.map((color) => (
                                <button
                                  key={color.id}
                                  onClick={() => handleColorSelect(`${option.id}_${subOption.id}`, color.id, `${option.id}_${subOption.id}`, color)}
                                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                                    (selectedColor?.type === `${option.id}_${subOption.id}` && selectedColor?.colorId === color.id) ||
                                    (lensSelection.prescriptionSunColor?.id === color.id)
                                      ? 'border-blue-600 ring-2 ring-blue-200'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  style={{
                                    background: color.gradient ? color.color : color.color
                                  }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
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

// Lens Selection Step Component
interface LensSelectionStepProps {
  lensSelection: LensSelection
  lensOptions: LensType[]
  coatingOptions: LensCoating[]
  treatments: Array<{ id: string; name: string; price: number; description?: string }>
  apiLensTypes: Array<{ id: string; name: string; description: string; price?: number; priceLabel?: string; colors: Array<{ id: string; name: string; color: string; gradient?: boolean }> }>
  progressiveOptions: Array<{ id: string; name: string; price: number; description: string; recommended?: boolean; icon?: string; variantId?: number }>
  loading?: boolean
  error?: string | null
  onLensTypeChange: (type: LensSelection['type']) => void
  onLensIndexChange: (index: number) => void
  onCoatingToggle: (coatingSlug: string) => void
  onTreatmentToggle: (treatmentId: string) => void
  onLensTypeSelect: (lensTypeId: string, colorId: string, color: { id: string; name: string; color: string; gradient?: boolean }) => void
  onProgressiveOptionChange?: (optionId: string) => void
  onNext: () => void
  onRetry?: () => void
}

const LensSelectionStep: React.FC<LensSelectionStepProps> = ({
  lensSelection,
  lensOptions,
  coatingOptions,
  treatments,
  apiLensTypes,
  progressiveOptions,
  loading = false,
  error = null,
  onLensTypeChange,
  onLensIndexChange,
  onCoatingToggle,
  onTreatmentToggle,
  onLensTypeSelect,
  onProgressiveOptionChange,
  onNext,
  onRetry
}) => {
  // Combine all selectable options into a single list
  const allOptions: Array<{
    id: string
    name: string
    price: number
    type: 'progressive' | 'lens_index' | 'coating' | 'treatment'
    checked: boolean
    onToggle: () => void
  }> = []

  // Add progressive options if progressive type is selected
  if (lensSelection.type === 'progressive') {
    progressiveOptions.forEach(option => {
      allOptions.push({
        id: `progressive-${option.id}`,
        name: option.name,
        price: option.price,
        type: 'progressive',
        checked: lensSelection.progressiveOption === option.id || (option.id === 'premium' && !lensSelection.progressiveOption),
        onToggle: () => {
          onLensTypeChange('progressive')
          if (onProgressiveOptionChange) {
            onProgressiveOptionChange(option.id)
          }
        }
      })
    })
  }

  // Add lens index options
  lensOptions.forEach(lens => {
    allOptions.push({
      id: `lens-${lens.id}`,
      name: lens.name,
      price: Number(lens.price_adjustment) || 0,
      type: 'lens_index',
      checked: lensSelection.lensIndex === lens.index,
      onToggle: () => {
        onLensIndexChange(lens.index)
      }
    })
  })

  // Add coating options
  coatingOptions.forEach(coating => {
    allOptions.push({
      id: `coating-${coating.id}`,
      name: coating.name,
      price: Number(coating.price_adjustment) || 0,
      type: 'coating',
      checked: lensSelection.coatings.includes(coating.slug),
      onToggle: () => {
        onCoatingToggle(coating.slug)
      }
    })
  })

  // Add treatment options from API
  treatments.forEach(treatment => {
    allOptions.push({
      id: `treatment-${treatment.id}`,
      name: treatment.name,
      price: treatment.price || 0,
      type: 'treatment',
      checked: lensSelection.treatments.includes(treatment.id),
      onToggle: () => {
        onTreatmentToggle(treatment.id)
      }
    })
  })

  return (
    <div className="flex flex-col h-full">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
          <span className="ml-3 text-gray-600">Loading options...</span>
        </div>
      )}

      {/* Error State */}
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

      {/* Scrollable options list */}
      {!loading && (
        <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
          {/* Lens Types from API with Color Swatches */}
          {apiLensTypes.length > 0 && (
            <div className="space-y-4">
              {apiLensTypes.map((lensType) => {
                const isSelected = lensSelection.selectedLensTypeId === lensType.id
                
                return (
                  <div
                    key={lensType.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Lens Type Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {lensType.name}
                        {lensType.priceLabel && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({lensType.priceLabel})
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    {/* Description */}
                    {lensType.description && (
                      <p className="text-sm text-gray-600 mb-3">{lensType.description}</p>
                    )}
                    
                    {/* Color Swatches */}
                    {lensType.colors.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          {lensType.colors[0]?.name || 'Select Color'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lensType.colors.map((color) => {
                            const isColorSelected = isSelected && lensSelection.selectedColorId === color.id
                            
                            return (
                              <button
                                key={color.id}
                                onClick={() => {
                                  onLensTypeSelect(lensType.id, color.id, {
                                    id: color.id,
                                    name: color.name,
                                    color: color.color,
                                    gradient: color.gradient
                                  })
                                }}
                                className={`
                                  relative w-10 h-10 rounded-full border-2 transition-all
                                  ${isColorSelected
                                    ? 'border-blue-600 ring-2 ring-blue-200 scale-110'
                                    : 'border-gray-300 hover:border-gray-400'
                                  }
                                `}
                                style={{
                                  background: color.gradient 
                                    ? `linear-gradient(135deg, ${color.color})`
                                    : color.color
                                }}
                                title={color.name}
                              >
                                {isColorSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
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
                  </div>
                )
              })}
            </div>
          )}

          {/* Other Options (Coatings, Treatments) */}
          {allOptions.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              {allOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={option.onToggle}
                    className="w-5 h-5 text-blue-950 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {option.name}
                  </span>
                  {option.price > 0 && (
                    <span className="text-sm font-semibold text-gray-700">
                      +${option.price.toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {apiLensTypes.length === 0 && allOptions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No options available</p>
          )}
        </div>
      )}

      {/* Add to Cart button at bottom */}
      <button
        onClick={onNext}
        disabled={loading}
        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('shop.addToCart')}
      </button>
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
  savedPrescriptions = [],
  selectedSavedPrescription,
  onLoadSavedPrescription,
  isAuthenticated = false
}) => {
  const isProgressive = lensType === 'progressive'
  const isDistanceVision = lensType === 'distance_vision'
  const isNearVision = lensType === 'near_vision'

  // Generate PD options (1-30)
  const pdOptions = Array.from({ length: 30 }, (_, i) => i + 1)
  
  // Generate SPH, CYL, AXIS options based on lens type
  const getSphereOptions = () => {
    if (isProgressive) {
      return ['+2.00', '+1.50', '+1.00', '0.00', '-1.00', '-2.00']
    } else if (isDistanceVision) {
      return ['+2.00', '+1.50', '+1.00', '0.00', '-1.00', '-2.00']
    } else if (isNearVision) {
      return ['+1.00', '+0.50', '0.00', '-0.50', '-1.00']
    }
    return []
  }

  const getCylinderOptions = () => {
    if (isProgressive) {
      return ['0.00', '-0.25', '-0.50', '-1.00']
    } else if (isDistanceVision) {
      return ['0.00', '-0.25', '-0.50', '-1.00']
    } else if (isNearVision) {
      return ['0.00', '-0.25', '-0.50', '-0.75', '-1.00']
    }
    return []
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
    if (isProgressive) {
      return ['+2.25', '+1.75', '+1.25', '0.00', '-1.25', '-2.25']
    } else if (isDistanceVision) {
      return ['+2.25', '+1.75', '+1.25', '0.00', '-1.25', '-2.25']
    } else if (isNearVision) {
      return ['+1.25', '+0.75', '0.00', '-0.75', '-1.25']
    }
    return []
  }

  const getOSCylinderOptions = () => {
    if (isProgressive) {
      return ['0.00', '-0.25', '-0.75', '-1.25']
    } else if (isDistanceVision) {
      return ['0.00', '-0.25', '-0.75', '-1.25']
    } else if (isNearVision) {
      return ['0.00', '-0.25', '-0.50', '-0.75', '-1.25']
    }
    return []
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
  loading: boolean
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
  loading
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

      <button
        onClick={onAddToCart}
        disabled={loading}
        className="w-full bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('shop.addingToCart') : t('shop.addToCart')}
      </button>
    </div>
  )
}

export default ProductCheckout

