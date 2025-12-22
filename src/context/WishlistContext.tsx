import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Product } from '../services/productsService'

interface WishlistContextType {
    wishlistItems: Product[]
    addToWishlist: (product: Product) => void
    removeFromWishlist: (productId: number) => void
    isInWishlist: (productId: number) => boolean
    toggleWishlist: (product: Product) => void
    clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

interface WishlistProviderProps {
    children: ReactNode
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<Product[]>([])

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist')
        if (savedWishlist) {
            try {
                setWishlistItems(JSON.parse(savedWishlist))
            } catch (error) {
                console.error('Error loading wishlist from localStorage:', error)
            }
        }
    }, [])

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems))
    }, [wishlistItems])

    const addToWishlist = (product: Product) => {
        setWishlistItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id)
            if (existingItem) {
                return prevItems // Already in wishlist
            }
            return [...prevItems, product]
        })
    }

    const removeFromWishlist = (productId: number) => {
        setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId))
    }

    const isInWishlist = (productId: number): boolean => {
        return wishlistItems.some(item => item.id === productId)
    }

    const toggleWishlist = (product: Product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id)
        } else {
            addToWishlist(product)
        }
    }

    const clearWishlist = () => {
        setWishlistItems([])
    }

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                toggleWishlist,
                clearWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    )
}

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext)
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider')
    }
    return context
}

