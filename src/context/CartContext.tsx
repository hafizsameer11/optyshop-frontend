import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Cart-compatible product interface (works with both old and new product formats)
export interface CartProduct {
    id: number
    name: string
    brand: string
    category: string
    price: number
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
    }
    isContactLens?: boolean // Flag to identify contact lens products
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

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart))
            } catch (error) {
                console.error('Error loading cart from localStorage:', error)
            }
        }
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems))
    }, [cartItems])

    const addToCart = (product: CartProduct) => {
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

    const removeFromCart = (productId: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => {
        setCartItems([])
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
            
            // For contact lenses, price is already the total (right + left eye totals)
            // So we don't multiply by quantity - quantity is just for display
            if (item.category === 'contact-lenses' || item.isContactLens || item.customization?.contactLens) {
                return total + price
            }
            
            // For products with lens customizations (progressive, coatings, etc.), 
            // price is already the total (base + all lens options)
            // So we don't multiply by quantity - quantity is just for display
            if ((item as any).hasLensCustomization || item.customization?.lensType || item.customization?.progressiveOption) {
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
                getTotalItems
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

