import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { 
    getProductBySlug, 
    getRelatedProducts,
    type Product
} from '../../services/productsService'
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
    left_qty: number
    left_base_curve: string
    left_diameter: string
    left_power: string
    unit: string // Unit selection: 'unit', 'box', 'pack'
}

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
    const [quantity, setQuantity] = useState(1)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showTryOn, setShowTryOn] = useState(false)
    
    // Contact lens form state
    const [contactLensFormData, setContactLensFormData] = useState<ContactLensFormData>({
        right_qty: 1,
        right_base_curve: '8.70',
        right_diameter: '14.00',
        right_power: '',
        left_qty: 1,
        left_base_curve: '8.70',
        left_diameter: '14.00',
        left_power: '',
        unit: 'unit' // Default unit
    })
    
    // Unit options for contact lenses
    const unitOptions = [
        { value: 'unit', label: 'Unit', description: 'Single lens' },
        { value: 'box', label: 'Box', description: 'Box of lenses (typically 6-30 lenses)' },
        { value: 'pack', label: 'Pack', description: 'Pack of lenses' }
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
            const productData = await getProductBySlug(slug)
            
            if (isCancelled) return
            
            if (productData) {
                // Reset selected image index when loading a new product
                setSelectedImageIndex(0)
                
                // Debug log product data and image info
                if (import.meta.env.DEV) {
                    const imageUrl = getProductImageUrl(productData, 0)
                    const p = productData as any
                    const isContactLensProduct = productData.category?.slug === 'contact-lenses' || 
                                                p.product_type === 'contact_lens' ||
                                                Array.isArray(p.base_curve_options)
                    
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
                        category: productData.category?.slug,
                        isContactLens: isContactLensProduct,
                        // Contact Lens specific fields
                        ...(isContactLensProduct && {
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

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // This ensures hooks run in the same order on every render
    
    // Check if product is a contact lens (memoized to prevent infinite loops)
    const isContactLens = useMemo(() => {
        if (!product) return false
        const p = product as any
        const categorySlug = product.category?.slug
        return categorySlug === 'contact-lenses' || 
               p.product_type === 'contact_lens' ||
               Array.isArray(p.base_curve_options)
    }, [product])
    
    // Get contact lens options from product (memoized)
    const baseCurveOptions = useMemo(() => {
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
    }, [product, isContactLens])
    
    const diameterOptions = useMemo(() => {
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
    }, [product, isContactLens])
    
    // Parse power range to generate options (memoized)
    // Handles multiple ranges like "-0.50 to -6.00 in 0.25 steps" and "-6.50 to -15.00 in 0.50 steps"
    const powerOptions = useMemo(() => {
        if (!product) return []
        const p = product as any
        const range = p.powers_range || '-0.50 to -6.00 in 0.25 steps'
        
        // Debug: Log power range in development
        if (import.meta.env.DEV && isContactLens) {
            console.log('🔍 Contact Lens API Data - Power Range:', {
                powers_range: p.powers_range,
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
    }, [product])
    
    // Initialize contact lens form when product loads
    useEffect(() => {
        if (!product?.id) return
        
        const currentProductId = product.id
        
        // Only initialize once per product ID
        if (formInitializedRef.current === currentProductId) return
        
        // Check if it's a contact lens
        const p = product as any
        const isContactLensProduct = product.category?.slug === 'contact-lenses' || 
                                    p.product_type === 'contact_lens' ||
                                    Array.isArray(p.base_curve_options)
        
        if (isContactLensProduct) {
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
    
    // Memoize total calculation to prevent recalculation on every render
    const calculateContactLensTotal = useMemo(() => {
        if (!contactLensFormData.right_power || !contactLensFormData.left_power || productBasePrice === 0) {
            return 0
        }
        
        const rightTotal = productBasePrice * contactLensFormData.right_qty
        const leftTotal = productBasePrice * contactLensFormData.left_qty
        
        return rightTotal + leftTotal
    }, [productBasePrice, contactLensFormData.right_power, contactLensFormData.left_power, contactLensFormData.right_qty, contactLensFormData.left_qty])

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
                rating: product.rating ? Number(product.rating) : undefined
            }
            
            // Add quantity copies
            for (let i = 0; i < quantity; i++) {
                addToCart(cartProduct)
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
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
                    contact_lens_left_power: parseFloat(contactLensFormData.left_power)
                }
                
                const result = await addItemToCart(cartRequest)
                
                if (result.success) {
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
                                power: parseFloat(contactLensFormData.right_power)
                            },
                            left: {
                                qty: contactLensFormData.left_qty,
                                baseCurve: parseFloat(contactLensFormData.left_base_curve),
                                diameter: parseFloat(contactLensFormData.left_diameter),
                                power: parseFloat(contactLensFormData.left_power)
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
                                        <img
                                            key={`product-${product.id}-img-${selectedImageIndex}`}
                                            src={getProductImageUrl(product, selectedImageIndex)}
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
                                    
                                    {/* Thumbnail Images */}
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
                                            <span className="text-gray-600">{product.category.name}</span>
                                        </div>
                                    )}
                                    {product.sku && (
                                        <div className="flex">
                                            <span className="font-semibold text-gray-700 w-32">SKU:</span>
                                            <span className="text-gray-600">{product.sku}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Lens Configuration */}
                                {isContactLens ? (
                                    <div className="mb-6">
                                        {/* Unit Selector */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {unitOptions.map((unitOption) => (
                                                    <button
                                                        key={unitOption.value}
                                                        type="button"
                                                        onClick={() => handleContactLensFieldChange('unit', unitOption.value)}
                                                        disabled={isProductOutOfStock}
                                                        className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                                                            isProductOutOfStock
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : contactLensFormData.unit === unitOption.value
                                                                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                        title={unitOption.description}
                                                    >
                                                        {unitOption.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {import.meta.env.DEV && (
                                                <p className="text-xs text-gray-500 mt-1">Selected: {contactLensFormData.unit}</p>
                                            )}
                                        </div>
                                        
                                        {/* Price Display */}
                                        <div className="mb-6">
                                            <div className="text-3xl font-bold text-gray-900">
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
                                        <label className="font-semibold text-gray-700">Quantity:</label>
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                                disabled={(() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    return stockStatus === 'out_of_stock' ||
                                                           (stockStatus !== 'in_stock' && stockQty !== undefined && stockQty <= 0) ||
                                                           (stockStatus === undefined && product.in_stock === false) ||
                                                           (stockStatus === undefined && stockQty !== undefined && stockQty <= 0)
                                                })()}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
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
                                            className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-colors ${
                                                (() => {
                                                    const p = product as any
                                                    const stockStatus = p.stock_status
                                                    const stockQty = product.stock_quantity
                                                    
                                                    const isInStock = stockStatus === 'in_stock' ||
                                                                      (stockStatus !== 'out_of_stock' && stockQty !== undefined && stockQty > 0) ||
                                                                      (stockStatus === undefined && product.in_stock === true) ||
                                                                      (stockStatus === undefined && stockQty !== undefined && stockQty > 0)
                                                    
                                                    return isInStock
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                })()
                                            }`}
                                        >
                                            Select Lenses
                                        </button>
                                        
                                        <div className="flex gap-3">
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
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Try on
                                            </button>
                                            
                                            <a
                                                href="https://wa.me/1234567890"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-base transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
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
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Product Specifications</h2>
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {p.contact_lens_brand && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Producer:</span>
                                        <span className="text-gray-600">{p.contact_lens_brand}</span>
                                    </div>
                                )}
                                {p.brand && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Brand:</span>
                                        <span className="text-gray-600">{p.brand}</span>
                                    </div>
                                )}
                                {p.contact_lens_material && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Material:</span>
                                        <span className="text-gray-600">{p.contact_lens_material}</span>
                                    </div>
                                )}
                                {p.contact_lens_color && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Lens Color:</span>
                                        <span className="text-gray-600">{p.contact_lens_color}</span>
                                    </div>
                                )}
                                {p.contact_lens_type && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Product Type:</span>
                                        <span className="text-gray-600">{p.contact_lens_type}</span>
                                    </div>
                                )}
                                {p.replacement_frequency && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Replacement Frequency:</span>
                                        <span className="text-gray-600">{p.replacement_frequency}</span>
                                    </div>
                                )}
                                {p.water_content !== undefined && p.water_content !== null && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Water Content:</span>
                                        <span className="text-gray-600">{p.water_content}%</span>
                                    </div>
                                )}
                                {p.powers_range && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Powers:</span>
                                        <span className="text-gray-600">{typeof p.powers_range === 'string' ? p.powers_range : JSON.stringify(p.powers_range)}</span>
                                    </div>
                                )}
                                {p.can_sleep_with !== undefined && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Sleeping with Lenses:</span>
                                        <span className="text-gray-600">{p.can_sleep_with ? 'YES' : 'NO'}</span>
                                    </div>
                                )}
                                {p.is_medical_device !== undefined && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">Medical Device:</span>
                                        <span className="text-gray-600">{p.is_medical_device ? 'YES' : 'NO'}</span>
                                    </div>
                                )}
                                {p.has_uv_filter !== undefined && (
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-48">UV Filter:</span>
                                        <span className="text-gray-600">{p.has_uv_filter ? 'YES' : 'NO'}</span>
                                    </div>
                                )}
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

