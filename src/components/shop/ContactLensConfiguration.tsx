import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { addItemToCart, type AddToCartRequest } from '../../services/cartService'
import { getProductImageUrl } from '../../utils/productImage'
import { type Product } from '../../services/productsService'
import {
    getContactLensOptionsBySubSubcategoryId,
    type ContactLensOptions
} from '../../services/categoriesService'
import {
    getContactLensConfigsBySubCategory,
    type ContactLensConfiguration as ConfigType
} from '../../services/contactLensConfigService'

interface ContactLensConfigurationProps {
  product: Product
  onClose?: () => void
}

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
}

const ContactLensConfiguration: React.FC<ContactLensConfigurationProps> = ({ product, onClose }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [subSubcategoryOptions, setSubSubcategoryOptions] = useState<ContactLensOptions | null>(null)
  const [contactLensConfigs, setContactLensConfigs] = useState<ConfigType[]>([])
  
  // Fetch contact lens configurations from admin panel (primary source)
  // These configurations contain the actual options set in the admin panel
  useEffect(() => {
    const fetchConfigurations = async () => {
      const p = product as any
      const productSubcategory = p.subcategory
      
      // Check if product has a subcategory with parent_id (sub-subcategory)
      if (productSubcategory && productSubcategory.parent_id) {
        // This is a sub-subcategory, fetch configurations from admin panel
        try {
          const configs = await getContactLensConfigsBySubCategory(productSubcategory.id)
          if (configs && configs.length > 0) {
            setContactLensConfigs(configs)
            if (import.meta.env.DEV) {
              console.log('✅ Fetched contact lens configurations from admin panel:', {
                subSubcategoryId: productSubcategory.id,
                subSubcategoryName: productSubcategory.name,
                configCount: configs.length,
                configs: configs.map(c => ({
                  id: c.id,
                  name: c.name,
                  type: c.configuration_type,
                  right_power: c.right_power,
                  right_base_curve: c.right_base_curve,
                  right_diameter: c.right_diameter
                }))
              })
            }
          }
        } catch (error) {
          console.error('Error fetching contact lens configurations:', error)
        }
      }
    }
    
    fetchConfigurations()
  }, [product])
  
  // Also fetch aggregated options from sub-subcategory as fallback
  useEffect(() => {
    const fetchSubSubcategoryOptions = async () => {
      const p = product as any
      const productSubcategory = p.subcategory
      
      // Check if product has a subcategory with parent_id (sub-subcategory)
      if (productSubcategory && productSubcategory.parent_id) {
        // This is a sub-subcategory, fetch aggregated options as fallback
        try {
          const options = await getContactLensOptionsBySubSubcategoryId(productSubcategory.id)
          if (options) {
            setSubSubcategoryOptions(options)
            if (import.meta.env.DEV) {
              console.log('✅ Fetched contact lens options from sub-subcategory (fallback):', {
                subSubcategoryId: productSubcategory.id,
                subSubcategoryName: productSubcategory.name,
                type: options.type,
                productCount: options.productCount
              })
            }
          }
        } catch (error) {
          console.error('Error fetching contact lens options from sub-subcategory:', error)
        }
      } else {
        setSubSubcategoryOptions(null)
      }
    }
    
    fetchSubSubcategoryOptions()
  }, [product])
  
  // Extract options from contact lens configurations (admin panel)
  // Priority: Configurations from admin panel > Sub-subcategory aggregated options > Product defaults
  const extractOptionsFromConfigs = (field: 'right_base_curve' | 'right_diameter' | 'right_power' | 'right_cylinder' | 'right_axis' | 'left_base_curve' | 'left_diameter' | 'left_power' | 'left_cylinder' | 'left_axis'): (number | string)[] => {
    const allValues: Set<number | string> = new Set()
    
    contactLensConfigs.forEach(config => {
      const value = config[field]
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== null && v !== undefined && v !== '') {
            allValues.add(v)
          }
        })
      } else if (value !== null && value !== undefined && value !== '') {
        allValues.add(value)
      }
    })
    
    // Convert to array and sort
    const sorted = Array.from(allValues).sort((a, b) => {
      const numA = typeof a === 'number' ? a : parseFloat(String(a))
      const numB = typeof b === 'number' ? b : parseFloat(String(b))
      if (isNaN(numA) || isNaN(numB)) return 0
      return numA - numB
    })
    
    return sorted
  }
  
  // Get contact lens options with priority: Configurations > Sub-subcategory > Product defaults
  const p = product as any
  
  // Base Curve Options
  const configBaseCurves = extractOptionsFromConfigs('right_base_curve')
  const baseCurveOptions = configBaseCurves.length > 0
    ? configBaseCurves.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(v => !isNaN(v))
    : (subSubcategoryOptions?.baseCurveOptions && subSubcategoryOptions.baseCurveOptions.length > 0
      ? subSubcategoryOptions.baseCurveOptions
      : (p.base_curve_options || [8.70, 8.80, 8.90]))
  
  // Diameter Options
  const configDiameters = extractOptionsFromConfigs('right_diameter')
  const diameterOptions = configDiameters.length > 0
    ? configDiameters.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(v => !isNaN(v))
    : (subSubcategoryOptions?.diameterOptions && subSubcategoryOptions.diameterOptions.length > 0
      ? subSubcategoryOptions.diameterOptions
      : (p.diameter_options || [14.00, 14.20]))
  
  // Check if product belongs to spherical sub-subcategory
  // Priority: Configuration type > Sub-subcategory type > subcategory name/slug > product field
  const isSphericalSubSubcategory = (() => {
    // First, check configurations from admin panel (most reliable)
    if (contactLensConfigs.length > 0) {
      const hasSpherical = contactLensConfigs.some(c => c.configuration_type === 'spherical')
      if (hasSpherical) return true
    }
    
    // Check sub-subcategory options with type field
    if (subSubcategoryOptions && subSubcategoryOptions.type === 'spherical') {
      return true
    }
    
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
  })()
  
  // Check if product belongs to astigmatism sub-subcategory
  // Priority: Configuration type > Sub-subcategory type > subcategory name/slug > product field
  const isAstigmatismSubSubcategory = (() => {
    // First, check configurations from admin panel (most reliable)
    if (contactLensConfigs.length > 0) {
      const hasAstigmatism = contactLensConfigs.some(c => c.configuration_type === 'astigmatism')
      if (hasAstigmatism) return true
    }
    
    // Check sub-subcategory options with type field
    if (subSubcategoryOptions && subSubcategoryOptions.type === 'astigmatism') {
      return true
    }
    
    // Check contact_lens_type field
    const lensType = (p.contact_lens_type || '').toLowerCase()
    if (lensType.includes('astigmatism') || lensType.includes('astigmatismo') || lensType.includes('toric')) {
      return true
    }
    
    // Check subcategory slug/name if available
    const subcategorySlug = (p.subcategory?.slug || '').toLowerCase()
    const subcategoryName = (p.subcategory?.name || '').toLowerCase()
    // Check for astigmatism variations: "astigmatism", "astigmatismo", "astighmatism" (typo in admin panel), "toric"
    if (subcategorySlug.includes('astigmatism') || subcategorySlug.includes('astigmatismo') || 
        subcategorySlug.includes('astighmatism') || // Handle typo variant from admin panel
        subcategoryName.includes('astigmatism') || subcategoryName.includes('astigmatismo') ||
        subcategorySlug.includes('toric') || subcategoryName.includes('toric')) {
      return true
    }
    
    return false
  })()
  
  // Generate cylinder options
  // Priority: Configurations from admin panel > Sub-subcategory options > Default range
  const cylinderOptions = (() => {
    // Extract from configurations first
    const configCylinders = extractOptionsFromConfigs('right_cylinder')
    if (configCylinders.length > 0) {
      return configCylinders.map(cyl => {
        const num = typeof cyl === 'number' ? cyl : parseFloat(String(cyl))
        if (isNaN(num)) return ''
        const value = Math.abs(num).toFixed(2)
        return num > 0 ? `+${value}` : `-${value}`
      }).filter(v => v !== '')
    }
    
    // Fallback to sub-subcategory options
    if (subSubcategoryOptions?.cylinderOptions && subSubcategoryOptions.cylinderOptions.length > 0) {
      return subSubcategoryOptions.cylinderOptions.map(cyl => {
        const value = Math.abs(cyl).toFixed(2)
        return cyl > 0 ? `+${value}` : `-${value}`
      })
    }
    
    // Default range
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
  })()
  
  // Generate axis options
  // Priority: Configurations from admin panel > Sub-subcategory options > Default range
  const axisOptions = (() => {
    // Extract from configurations first
    const configAxes = extractOptionsFromConfigs('right_axis')
    if (configAxes.length > 0) {
      return configAxes.map(axis => {
        const num = typeof axis === 'number' ? axis : parseFloat(String(axis))
        return isNaN(num) ? '' : num.toString()
      }).filter(v => v !== '').sort((a, b) => parseInt(a) - parseInt(b))
    }
    
    // Fallback to sub-subcategory options
    if (subSubcategoryOptions?.axisOptions && subSubcategoryOptions.axisOptions.length > 0) {
      return subSubcategoryOptions.axisOptions.map(axis => axis.toString())
    }
    
    // Default range
    const options: string[] = []
    for (let i = 0; i <= 180; i++) {
      options.push(i.toString())
    }
    return options
  })()
  
  // Parse power range to generate options
  const generatePowerOptions = (range: string): string[] => {
    try {
      // Try to parse range like "-0.50 to -6.00 in 0.25 steps"
      const match = range.match(/(-?\d+\.?\d*)\s+to\s+(-?\d+\.?\d*)\s+in\s+(\d+\.?\d*)\s+steps?/i)
      if (match) {
        const start = parseFloat(match[1])
        const end = parseFloat(match[2])
        const step = parseFloat(match[3])
        const options: string[] = []
        
        if (start < end) {
          // Positive range (e.g., +0.50 to +6.00)
          for (let val = start; val <= end; val += step) {
            options.push(val.toFixed(2))
          }
        } else {
          // Negative range (e.g., -0.50 to -6.00)
          for (let val = start; val >= end; val -= step) {
            options.push(val.toFixed(2))
          }
        }
        
        return options.length > 0 ? options : ['-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00']
      }
    } catch (error) {
      console.error('Error parsing power range:', error)
    }
    
    // Default power options if parsing fails
    return ['-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00']
  }
  
  // For power options
  // Priority: Configurations from admin panel > Sub-subcategory options > Generated range
  const powerOptions = (() => {
    // Extract from configurations first (from admin panel)
    const configPowers = extractOptionsFromConfigs('right_power')
    if (configPowers.length > 0) {
      return configPowers.map(power => {
        const num = typeof power === 'number' ? power : parseFloat(String(power))
        if (isNaN(num)) return ''
        const value = Math.abs(num).toFixed(2)
        return num > 0 ? `+${value}` : `-${value}`
      }).filter(v => v !== '').sort((a, b) => {
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        return numA - numB
      })
    }
    
    // Fallback to sub-subcategory options
    if (subSubcategoryOptions?.powerOptions && subSubcategoryOptions.powerOptions.length > 0) {
      return subSubcategoryOptions.powerOptions
    }
    
    // Otherwise, generate from power range
    const powersRange = isSphericalSubSubcategory 
      ? '-0.50 to -6.00 in 0.25 steps'  // Standardized power range for all spherical lenses
      : (p.powers_range || '-0.50 to -6.00 in 0.25 steps')
    
    return generatePowerOptions(powersRange)
  })()
  
  // Initialize form data with default values
  // Will be updated when API data loads
  const [formData, setFormData] = useState<ContactLensFormData>({
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
    left_axis: ''
  })
  
  // Update form data when configurations or API options are loaded
  useEffect(() => {
    // Priority: Configurations from admin panel > Sub-subcategory options > Product defaults
    if (contactLensConfigs.length > 0) {
      // Extract first available values from configurations
      const extractValues = (field: 'right_base_curve' | 'right_diameter'): (number | string)[] => {
        const allValues: Set<number | string> = new Set()
        contactLensConfigs.forEach(config => {
          const value = config[field]
          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v !== null && v !== undefined && v !== '') {
                allValues.add(v)
              }
            })
          } else if (value !== null && value !== undefined && value !== '') {
            allValues.add(value)
          }
        })
        return Array.from(allValues).sort((a, b) => {
          const numA = typeof a === 'number' ? a : parseFloat(String(a))
          const numB = typeof b === 'number' ? b : parseFloat(String(b))
          if (isNaN(numA) || isNaN(numB)) return 0
          return numA - numB
        })
      }
      
      const configBaseCurves = extractValues('right_base_curve')
      const configDiameters = extractValues('right_diameter')
      
      if (configBaseCurves.length > 0) {
        const firstBaseCurve = typeof configBaseCurves[0] === 'number' 
          ? configBaseCurves[0].toString() 
          : String(configBaseCurves[0])
        setFormData(prev => ({
          ...prev,
          right_base_curve: prev.right_base_curve || firstBaseCurve,
          left_base_curve: prev.left_base_curve || firstBaseCurve
        }))
      }
      
      if (configDiameters.length > 0) {
        const firstDiameter = typeof configDiameters[0] === 'number'
          ? configDiameters[0].toString()
          : String(configDiameters[0])
        setFormData(prev => ({
          ...prev,
          right_diameter: prev.right_diameter || firstDiameter,
          left_diameter: prev.left_diameter || firstDiameter
        }))
      }
    } else if (subSubcategoryOptions) {
      // Fallback to sub-subcategory options
      if (subSubcategoryOptions.baseCurveOptions && subSubcategoryOptions.baseCurveOptions.length > 0) {
        setFormData(prev => ({
          ...prev,
          right_base_curve: prev.right_base_curve || subSubcategoryOptions.baseCurveOptions[0].toString(),
          left_base_curve: prev.left_base_curve || subSubcategoryOptions.baseCurveOptions[0].toString()
        }))
      }
      if (subSubcategoryOptions.diameterOptions && subSubcategoryOptions.diameterOptions.length > 0) {
        setFormData(prev => ({
          ...prev,
          right_diameter: prev.right_diameter || subSubcategoryOptions.diameterOptions[0].toString(),
          left_diameter: prev.left_diameter || subSubcategoryOptions.diameterOptions[0].toString()
        }))
      }
    } else {
      // Fallback to product defaults
      const p = product as any
      const defaultBaseCurve = (p.base_curve_options && p.base_curve_options.length > 0) 
        ? p.base_curve_options[0].toString() 
        : '8.70'
      const defaultDiameter = (p.diameter_options && p.diameter_options.length > 0)
        ? p.diameter_options[0].toString()
        : '14.00'
      
      setFormData(prev => ({
        ...prev,
        right_base_curve: prev.right_base_curve || defaultBaseCurve,
        left_base_curve: prev.left_base_curve || defaultBaseCurve,
        right_diameter: prev.right_diameter || defaultDiameter,
        left_diameter: prev.left_diameter || defaultDiameter
      }))
    }
  }, [contactLensConfigs, subSubcategoryOptions, product])
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.right_power) {
      newErrors.right_power = 'Power is required for right eye'
    }
    
    if (!formData.left_power) {
      newErrors.left_power = 'Power is required for left eye'
    }
    
    // For astigmatism lenses, cylinder and axis are required
    if (isAstigmatismSubSubcategory) {
      if (!formData.right_cylinder) {
        newErrors.right_cylinder = 'Cylinder is required for right eye'
      }
      if (!formData.right_axis) {
        newErrors.right_axis = 'Axis is required for right eye'
      }
      if (!formData.left_cylinder) {
        newErrors.left_cylinder = 'Cylinder is required for left eye'
      }
      if (!formData.left_axis) {
        newErrors.left_axis = 'Axis is required for left eye'
      }
    }
    
    if (formData.right_qty < 1) {
      newErrors.right_qty = 'Quantity must be at least 1'
    }
    
    if (formData.left_qty < 1) {
      newErrors.left_qty = 'Quantity must be at least 1'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleFieldChange = (field: keyof ContactLensFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  const calculateTotal = (): number => {
    // Only calculate if both powers are selected
    if (!formData.right_power || !formData.left_power) {
      return 0
    }
    
    const basePrice = product.sale_price && product.sale_price < product.price 
      ? product.sale_price 
      : product.price
    
    const rightTotal = Number(basePrice) * formData.right_qty
    const leftTotal = Number(basePrice) * formData.left_qty
    
    return rightTotal + leftTotal
  }
  
  const handleAddToCart = async () => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      if (isAuthenticated) {
        // Add to cart via API
        const cartRequest: AddToCartRequest = {
          product_id: product.id,
          quantity: 1,
          contact_lens_right_qty: formData.right_qty,
          contact_lens_right_base_curve: parseFloat(formData.right_base_curve),
          contact_lens_right_diameter: parseFloat(formData.right_diameter),
          contact_lens_right_power: parseFloat(formData.right_power),
          contact_lens_left_qty: formData.left_qty,
          contact_lens_left_base_curve: parseFloat(formData.left_base_curve),
          contact_lens_left_diameter: parseFloat(formData.left_diameter),
          contact_lens_left_power: parseFloat(formData.left_power),
          ...(isAstigmatismSubSubcategory && {
            contact_lens_right_cylinder: formData.right_cylinder ? parseFloat(formData.right_cylinder) : undefined,
            contact_lens_right_axis: formData.right_axis ? parseInt(formData.right_axis) : undefined,
            contact_lens_left_cylinder: formData.left_cylinder ? parseFloat(formData.left_cylinder) : undefined,
            contact_lens_left_axis: formData.left_axis ? parseInt(formData.left_axis) : undefined
          })
        }
        
        const result = await addItemToCart(cartRequest)
        
        if (result.success) {
          // Also add to local cart for immediate UI update
          const cartProduct = {
            id: product.id || 0,
            name: product.name || '',
            brand: product.brand || '',
            category: product.category?.slug || 'contact-lenses',
            price: calculateTotal(),
            image: getProductImageUrl(product),
            description: product.description || '',
            inStock: product.in_stock || false
          }
          addToCart(cartProduct)
          
          if (onClose) {
            onClose()
          } else {
            navigate('/cart')
          }
        } else {
          alert(result.message || 'Failed to add to cart')
        }
      } else {
        // For guest users, add to local cart
        const cartProduct = {
          id: product.id || 0,
          name: product.name || '',
          brand: product.brand || '',
          category: product.category?.slug || 'contact-lenses',
          price: calculateTotal(),
          image: getProductImageUrl(product),
          description: product.description || '',
          inStock: product.in_stock || false,
          // Store contact lens data in customization
          customization: {
            contactLens: {
              right: {
                qty: formData.right_qty,
                baseCurve: parseFloat(formData.right_base_curve),
                diameter: parseFloat(formData.right_diameter),
                power: parseFloat(formData.right_power),
                ...(isAstigmatismSubSubcategory && {
                  cylinder: formData.right_cylinder ? parseFloat(formData.right_cylinder) : undefined,
                  axis: formData.right_axis ? parseInt(formData.right_axis) : undefined
                })
              },
              left: {
                qty: formData.left_qty,
                baseCurve: parseFloat(formData.left_base_curve),
                diameter: parseFloat(formData.left_diameter),
                power: parseFloat(formData.left_power),
                ...(isAstigmatismSubSubcategory && {
                  cylinder: formData.left_cylinder ? parseFloat(formData.left_cylinder) : undefined,
                  axis: formData.left_axis ? parseInt(formData.left_axis) : undefined
                })
              }
            }
          }
        }
        addToCart(cartProduct)
        
        if (onClose) {
          onClose()
        } else {
          navigate('/cart')
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
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
        
        {/* Content */}
        <div className="p-6">
          {/* Unit Selector */}
          <div className="mb-4">
            <button className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg">
              unit
            </button>
          </div>
          
          {/* Price Display */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900">
              ${calculateTotal().toFixed(2)}
            </div>
          </div>
          
          {/* Configuration Form */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Select the parameters</h3>
            
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
                      value={formData.right_qty}
                      onChange={(e) => handleFieldChange('right_qty', parseInt(e.target.value) || 1)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.right_qty ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.right_qty && (
                      <p className="text-sm text-red-500 mt-1">{errors.right_qty}</p>
                    )}
                  </div>
                  
                  {/* Radius (B.C) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Radius (B.C)</label>
                    <select
                      value={formData.right_base_curve}
                      onChange={(e) => handleFieldChange('right_base_curve', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {baseCurveOptions.map((option) => (
                        <option key={option} value={option.toString()}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Diameter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">(Diameter)</label>
                    <select
                      value={formData.right_diameter}
                      onChange={(e) => handleFieldChange('right_diameter', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {diameterOptions.map((option) => (
                        <option key={option} value={option.toString()}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Power (PWR) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Power (PWR) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.right_power}
                      onChange={(e) => handleFieldChange('right_power', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.right_power ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select power</option>
                      {powerOptions.map((power) => (
                        <option key={power} value={power}>
                          {power}
                        </option>
                      ))}
                    </select>
                    {errors.right_power && (
                      <p className="text-sm text-red-500 mt-1">{errors.right_power}</p>
                    )}
                  </div>
                  
                  {/* Cylinder (CYL) - Only for Astigmatism */}
                  {isAstigmatismSubSubcategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cilindro (CYL) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.right_cylinder || ''}
                        onChange={(e) => handleFieldChange('right_cylinder', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.right_cylinder ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-</option>
                        {cylinderOptions.map((cyl) => (
                          <option key={cyl} value={cyl}>
                            {cyl}
                          </option>
                        ))}
                      </select>
                      {errors.right_cylinder && (
                        <p className="text-sm text-red-500 mt-1">{errors.right_cylinder}</p>
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
                        value={formData.right_axis || ''}
                        onChange={(e) => handleFieldChange('right_axis', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.right_axis ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-</option>
                        {axisOptions.map((axis) => (
                          <option key={axis} value={axis}>
                            {axis}
                          </option>
                        ))}
                      </select>
                      {errors.right_axis && (
                        <p className="text-sm text-red-500 mt-1">{errors.right_axis}</p>
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
                      value={formData.left_qty}
                      onChange={(e) => handleFieldChange('left_qty', parseInt(e.target.value) || 1)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.left_qty ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.left_qty && (
                      <p className="text-sm text-red-500 mt-1">{errors.left_qty}</p>
                    )}
                  </div>
                  
                  {/* Radius (B.C) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Radius (B.C)</label>
                    <select
                      value={formData.left_base_curve}
                      onChange={(e) => handleFieldChange('left_base_curve', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {baseCurveOptions.map((option) => (
                        <option key={option} value={option.toString()}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Diameter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">(Diameter)</label>
                    <select
                      value={formData.left_diameter}
                      onChange={(e) => handleFieldChange('left_diameter', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {diameterOptions.map((option) => (
                        <option key={option} value={option.toString()}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Power (PWR) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Power (PWR) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.left_power}
                      onChange={(e) => handleFieldChange('left_power', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.left_power ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select power</option>
                      {powerOptions.map((power) => (
                        <option key={power} value={power}>
                          {power}
                        </option>
                      ))}
                    </select>
                    {errors.left_power && (
                      <p className="text-sm text-red-500 mt-1">{errors.left_power}</p>
                    )}
                  </div>
                  
                  {/* Cylinder (CYL) - Only for Astigmatism */}
                  {isAstigmatismSubSubcategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cilindro (CYL) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.left_cylinder || ''}
                        onChange={(e) => handleFieldChange('left_cylinder', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.left_cylinder ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-</option>
                        {cylinderOptions.map((cyl) => (
                          <option key={cyl} value={cyl}>
                            {cyl}
                          </option>
                        ))}
                      </select>
                      {errors.left_cylinder && (
                        <p className="text-sm text-red-500 mt-1">{errors.left_cylinder}</p>
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
                        value={formData.left_axis || ''}
                        onChange={(e) => handleFieldChange('left_axis', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.left_axis ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-</option>
                        {axisOptions.map((axis) => (
                          <option key={axis} value={axis}>
                            {axis}
                          </option>
                        ))}
                      </select>
                      {errors.left_axis && (
                        <p className="text-sm text-red-500 mt-1">{errors.left_axis}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactLensConfiguration

