import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CartIcon: React.FC = () => {
    const { getTotalItems } = useCart()
    const totalItems = getTotalItems()

    return (
        <Link
            to="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-cyan-400 bg-blue-950/60 hover:bg-blue-900/70 hover:border-cyan-300 transition-all duration-200 group cursor-pointer flex-shrink-0 z-10"
            aria-label={`Shopping cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
            title={`Shopping cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
        >
            <svg 
                className="w-5 h-5 text-white group-hover:text-cyan-200 transition-colors flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
                <span 
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg px-1.5 z-10 pointer-events-none"
                    aria-label={`${totalItems} items in cart`}
                >
                    {totalItems > 9 ? '9+' : totalItems}
                </span>
            )}
        </Link>
    )
}

export default CartIcon

