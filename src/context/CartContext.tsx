import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getCart, addItemToCart as addToCartApi, updateCartItem, removeCartItem as removeCartItemApi, clearCart as clearCartApi } from '../services/cartService'
import { useAuth } from './AuthContext'

// Cart-compatible product interface (works with both old and new product formats)
export interface CartProduct {
    id: number
    product_id?: number
    name: string
    brand: string
    category: string
    price: number | string
    image: string
    description: string
    inStock: boolean
    quantity?: number
    rating?: number
    unit?: string // Unit for contact lenses (unit, box, pack)
    caliber?: string | number // Selected MM caliber for frames
    caliberImageUrl?: string // Image URL for selected caliber
    type?: 'main_product' | 'eye_hygiene_variant' | 'contact_lens' | 'accessory'
    product_type?: string // Product type for handling different displays
    customization?: {
        contactLens?: {
            unit?: string
            formType?: 'spherical' | 'astigmatism' // Form type for contact lens
            right?: {
                qty: number
                baseCurve: number
                diameter: number
                power: number
                cylinder?: number // For astigmatism only
                axis?: number // For astigmatism only
            }
            left?: {
                qty: number
                baseCurve: number
                diameter: number
                power: number
                cylinder?: number // For astigmatism only
                axis?: number // For astigmatism only
            }
        }
        selected_color?: string // Selected color for glasses
        color_name?: string // Display name of selected color
        variant_images?: string[] // Images for selected variant
        // Store caliber selection in customization
        selected_mm_caliber?: string | number
        caliber_image_url?: string
        // Eye hygiene variant specific properties
        variant_id?: number
        size_volume?: string
        pack_type?: string
    }
    isContactLens?: boolean // Flag to identify contact lens products
    isGift?: boolean // Flag to identify free gift items
    gift_product?: any // Original gift product data
}

export interface CartItem extends CartProduct {
    quantity: number
}

function normColorKey(v: unknown): string {
    const s = String(v ?? '').trim().toLowerCase()
    return s.startsWith('#') ? s.slice(1) : s
}

function resolveColorStockFromProduct(product: any, selectedColor: unknown): number | null {
    if (!product || selectedColor == null || String(selectedColor).trim() === '') return null
    let colorImages = product.color_images
    if (typeof colorImages === 'string') {
        try { colorImages = JSON.parse(colorImages) } catch { colorImages = [] }
    }
    if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : []
    const selectedKey = normColorKey(selectedColor)
    const match = colorImages.find((c: any) => {
        const hex = c.hexCode || c.hex_code || null
        return (hex && normColorKey(hex) === selectedKey) ||
            (c.color && normColorKey(c.color) === selectedKey) ||
            (c.name && normColorKey(c.name) === selectedKey) ||
            (c.value && normColorKey(c.value) === selectedKey) ||
            (c.display_name && normColorKey(c.display_name) === selectedKey)
    })
    if (!match) return null
    if (match.stock_status === 'out_of_stock') return 0
    if (match.stock_quantity != null && match.stock_quantity !== '') {
        const n = Number(match.stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    return null
}

/** Max qty allowed for a cart line (color stock wins over product stock). */
function getCartItemMaxQuantity(item: CartItem | CartProduct | any): number | null {
    const custom = item?.customization || null
    if (custom?.color_stock_quantity != null && custom.color_stock_quantity !== '') {
        const n = Number(custom.color_stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    const fromColor = resolveColorStockFromProduct(
        (item as any)?.product,
        custom?.selected_color || custom?.hex_code || custom?.color_name
    )
    if (fromColor != null) return fromColor
    if (custom?.stock_quantity != null && custom.stock_quantity !== '') {
        const n = Number(custom.stock_quantity)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    const productStock = (item as any)?.product?.stock_quantity ?? (item as any)?.stock_quantity
    if (productStock != null && productStock !== '') {
        const n = Number(productStock)
        if (!Number.isNaN(n)) return Math.max(0, Math.floor(n))
    }
    return null
}


interface CartContextType {
    cartItems: CartItem[]
    addToCart: (product: CartProduct) => void
    removeFromCart: (productId: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    clearCart: () => void
    getTotalPrice: () => number
    getTotalItems: () => number
    syncCart: () => Promise<void>
    isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export { getCartItemMaxQuantity }

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}

interface CartProviderProps {
    children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { isAuthenticated } = useAuth()

    // Load cart from API or localStorage on mount and when auth state changes
    useEffect(() => {
        if (isAuthenticated) {
            // Sync with backend cart when authenticated
            syncCart()
        } else {
            // Load from localStorage when not authenticated
            const savedCart = localStorage.getItem('cart')
            if (savedCart) {
                try {
                    setCartItems(JSON.parse(savedCart))
                } catch (error) {
                    console.error('Error loading cart from localStorage:', error)
                }
            }
        }
    }, [isAuthenticated])

    // Save cart to localStorage whenever it changes (only for non-authenticated users)
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('cart', JSON.stringify(cartItems))
        }
    }, [cartItems, isAuthenticated])

    // Sync cart with backend API
    const syncCart = async () => {
        if (!isAuthenticated) return
        
        try {
            setIsLoading(true)
            const backendCart = await getCart()
            if (backendCart) {
                // Transform backend cart items to CartItem format
                const transformedItems: CartItem[] = backendCart.items.map(item => {
                    const customization = typeof item.customization === 'string'
                        ? (() => { try { return JSON.parse(item.customization) } catch { return null } })()
                        : item.customization
                    const variantSubtitle = customization?.variant_display_name
                        || customization?.eye_hygiene_variant_name
                        || (customization?.size_volume
                            ? [customization.size_volume, customization.pack_type].filter(Boolean).join(' ')
                            : null)
                    const productCategory = (item.product as any)?.category
                    const categorySlug = typeof productCategory === 'object'
                        ? (productCategory?.slug || productCategory?.name || 'eye-hygiene')
                        : (productCategory || (variantSubtitle ? 'eye-hygiene' : 'general'))
                    const productType = String((item.product as any)?.product_type || '').toLowerCase()

                    const enrichedCustomization = customization
                        ? { ...customization }
                        : null
                    if (enrichedCustomization && enrichedCustomization.color_stock_quantity == null) {
                        const resolved = resolveColorStockFromProduct(
                            item.product,
                            enrichedCustomization.selected_color || enrichedCustomization.hex_code || enrichedCustomization.color_name
                        )
                        if (resolved != null) enrichedCustomization.color_stock_quantity = resolved
                    }
                    const maxStock = getCartItemMaxQuantity({
                        customization: enrichedCustomization,
                        product: item.product,
                        stock_quantity: (item.product as any)?.stock_quantity,
                    } as any)
                    const safeQty = maxStock != null ? Math.min(Number(item.quantity) || 1, maxStock) : item.quantity

                    return {
                    id: item.id,
                    name: item.is_gift ? `FREE GIFT: ${item.gift_product?.name || item.product?.name}` : (item.product?.name || 'Unknown Product'),
                    brand: variantSubtitle || (item.product as any)?.brand || '',
                    category: categorySlug,
                    product_type: productType || undefined,
                    price: item.unit_price,
                    image: item.display_image || item.product?.image || '',
                    description: (item.product as any)?.description || '',
                    inStock: true,
                    quantity: safeQty,
                    isGift: !!(item.is_gift || (enrichedCustomization as any)?.is_gift),
                    gift_product: item.gift_product,
                    customization: enrichedCustomization,
                    // Store additional data for API operations
                    ...(item as any),
                    // Prefer real product id after spread (cart line id must stay on `id` for update/remove)
                    product_id: item.product_id || item.product?.id || item.id,
                }
                })
                setCartItems(transformedItems)
            }
        } catch (error) {
            console.error('Error syncing cart with backend:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const addToCart = async (product: CartProduct) => {
        if (isAuthenticated) {
            try {
                setIsLoading(true)
                // Add to backend cart
                const qty = Math.max(1, Math.floor(Number(product.quantity) || 1))
                const result = await addToCartApi({
                    product_id: product.id,
                    quantity: qty,
                    // Add other customization data if available
                    ...(product.customization && { customization: product.customization })
                })
                
                if (result.success) {
                    // Sync cart to get updated items
                    await syncCart()
                } else {
                    throw new Error(result.message || 'Failed to add item to cart')
                }
            } catch (error: any) {
                console.error('Error adding item to backend cart:', error)
                const msg = error?.message || 'Impossibile aggiungere al carrello'
                alert(msg)
                // Do not locally bump qty on API stock/auth failures
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    const max = getCartItemMaxQuantity(existingItem)
                    if (max != null && existingItem.quantity >= max) {
                        alert(`Disponibili solo ${max} pezzi.`)
                        return prevItems
                    }
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                }
                const max = getCartItemMaxQuantity(product)
                const startQty = Math.max(1, Math.floor(Number(product.quantity) || 1))
                const qty = max != null ? Math.min(startQty, max) : startQty
                return [...prevItems, { ...product, quantity: qty }]
            })
        }
    }

    const removeFromCart = async (productId: number) => {
        if (isAuthenticated) {
            try {
                setIsLoading(true)
                // Remove from backend cart
                const result = await removeCartItemApi(productId)
                
                if (result.success) {
                    // Sync cart to get updated items
                    await syncCart()
                } else {
                    throw new Error(result.message || 'Failed to remove item from cart')
                }
            } catch (error) {
                console.error('Error removing item from backend cart:', error)
                // Fallback to local storage
                setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
        }
    }

    const updateQuantity = async (productId: number, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(productId)
            return
        }
        
        if (isAuthenticated) {
            try {
                setIsLoading(true)
                const current = cartItems.find(item => item.id === productId)
                const max = current ? getCartItemMaxQuantity(current) : null
                let nextQty = quantity
                if (max != null && nextQty > max) {
                    alert(`Disponibili solo ${max} pezzi.`)
                    nextQty = max
                }
                // Update in backend cart
                const result = await updateCartItem(productId, nextQty)
                
                if (result.success) {
                    // Sync cart to get updated items
                    await syncCart()
                } else {
                    throw new Error(result.message || 'Failed to update cart item')
                }
            } catch (error: any) {
                console.error('Error updating cart item in backend:', error)
                const msg = error?.message || 'Impossibile aggiornare la quantità'
                alert(msg)
                await syncCart()
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems =>
                prevItems.map(item => {
                    if (item.id !== productId) return item
                    const max = getCartItemMaxQuantity(item)
                    const next = max != null ? Math.min(quantity, max) : quantity
                    if (max != null && quantity > max) {
                        alert(`Disponibili solo ${max} pezzi.`)
                    }
                    return { ...item, quantity: next }
                })
            )
        }
    }

    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                setIsLoading(true)
                // Clear from backend cart
                const result = await clearCartApi()
                
                if (result.success) {
                    setCartItems([])
                } else {
                    throw new Error(result.message || 'Failed to clear cart')
                }
            } catch (error) {
                console.error('Error clearing backend cart:', error)
                // Fallback to local storage
                setCartItems([])
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems([])
        }
    }

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => {
            // Ensure price is properly converted to number
            let price = 0
            if (typeof item.price === 'string') {
                // Remove any non-numeric characters except decimal point (handles "$78.00" or "78,100" etc)
                const cleaned = item.price.replace(/[^0-9.]/g, '')
                price = parseFloat(cleaned) || 0
            } else {
                price = Number(item.price) || 0
            }
            
            // For contact lenses, price is already the total calculated based on unit/box/pack
            // The price includes: unit_price * (right_qty + left_qty) for the selected unit type
            // So we don't multiply by quantity - quantity is just for display/counting items
            if (item.category === 'contact-lenses' || item.isContactLens || item.customization?.contactLens) {
                // Price is already the total for this contact lens item (accounts for unit/box/pack)
                return total + price
            }
            
            // For products with lens customizations (progressive, coatings, etc.), 
            // price is already the total (base + all lens options)
            // So we don't multiply by quantity - quantity is just for display
            if ((item as any).hasLensCustomization || (item.customization as any)?.lensType || (item.customization as any)?.progressiveOption) {
                return total + price
            }
            
            // For regular products without customizations, multiply price by quantity
            return total + (price * item.quantity)
        }, 0)
    }

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0)
    }

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
                syncCart,
                isLoading
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

