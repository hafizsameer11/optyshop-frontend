import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getCart, addItemToCart as addToCartApi, updateCartItem, removeCartItem as removeCartItemApi, clearCart as clearCartApi } from '../services/cartService'
import { useAuth } from './AuthContext'

// Cart-compatible product interface (works with both old and new product formats)
export interface CartProduct {
    id: number
    name: string
    brand: string
    category: string
    price: number | string
    image: string
    description: string
    inStock: boolean
    rating?: number
    unit?: string // Unit for contact lenses (unit, box, pack)
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
    }
    isContactLens?: boolean // Flag to identify contact lens products
    isGift?: boolean // Flag to identify free gift items
    gift_product?: any // Original gift product data
}

export interface CartItem extends CartProduct {
    quantity: number
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
                const transformedItems: CartItem[] = backendCart.items.map(item => ({
                    id: item.id,
                    name: item.is_gift ? `FREE GIFT: ${item.gift_product?.name || item.product?.name}` : (item.product?.name || 'Unknown Product'),
                    brand: (item.product as any)?.brand || 'Unknown',
                    category: (item.product as any)?.category || 'general',
                    price: item.unit_price,
                    image: item.display_image || item.product?.image || '',
                    description: (item.product as any)?.description || '',
                    inStock: true,
                    quantity: item.quantity,
                    isGift: item.is_gift,
                    gift_product: item.gift_product,
                    // Store additional data for API operations
                    ...(item as any)
                }))
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
                const result = await addToCartApi({
                    product_id: product.id,
                    quantity: 1,
                    // Add other customization data if available
                    ...(product.customization && { customization: product.customization })
                })
                
                if (result.success) {
                    // Sync cart to get updated items
                    await syncCart()
                } else {
                    throw new Error(result.message || 'Failed to add item to cart')
                }
            } catch (error) {
                console.error('Error adding item to backend cart:', error)
                // Fallback to local storage
                setCartItems(prevItems => {
                    const existingItem = prevItems.find(item => item.id === product.id)
                    if (existingItem) {
                        return prevItems.map(item =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    }
                    return [...prevItems, { ...product, quantity: 1 }]
                })
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id)
                if (existingItem) {
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                }
                return [...prevItems, { ...product, quantity: 1 }]
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
                // Update in backend cart
                const result = await updateCartItem(productId, quantity)
                
                if (result.success) {
                    // Sync cart to get updated items
                    await syncCart()
                } else {
                    throw new Error(result.message || 'Failed to update cart item')
                }
            } catch (error) {
                console.error('Error updating cart item in backend:', error)
                // Fallback to local storage
                setCartItems(prevItems =>
                    prevItems.map(item =>
                        item.id === productId ? { ...item, quantity } : item
                    )
                )
            } finally {
                setIsLoading(false)
            }
        } else {
            // Use local storage for non-authenticated users
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
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

