import React from 'react';
import type { ProductGift } from '../../services/productGiftsService';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';

interface ProductGiftCardProps {
  gift: ProductGift;
  className?: string;
}

const ProductGiftCard: React.FC<ProductGiftCardProps> = ({ gift, className = '' }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!gift.is_active) {
    return null;
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (gift.gift_product) {
      toggleWishlist(gift.gift_product)
    }
  }

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group ${className}`}>
      {/* Product Image */}
      <div className="relative aspect-[3/4] bg-white overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        </div>

        {/* Heart Icon */}
        {gift.gift_product && (
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-md z-10"
            title={isInWishlist(gift.gift_product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist(gift.gift_product.id) ? (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}

        {/* Free Gift Badge */}
        <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
          Free Gift
        </div>

        {/* Quantity Badge */}
        {gift.min_quantity > 1 && (
          <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
            Buy {gift.min_quantity}+
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Product Name */}
        <div className="flex-1 mb-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            Free Gift Available!
          </h3>
          {gift.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{gift.description}</p>
          )}
        </div>

        {/* Gift Product Info */}
        {gift.gift_product && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">You'll receive:</div>
            <Link
              to={`/products/${gift.gift_product.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {gift.gift_product.name}
            </Link>
            {gift.gift_product.price && (
              <div className="text-xs text-gray-400 mt-1">
                Value: €{Number(gift.gift_product.price).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Limit Info */}
        {gift.max_quantity && gift.max_quantity > 1 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500">
              Limit: {gift.max_quantity} gift{gift.max_quantity > 1 ? 's' : ''} per order
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="text-xs text-green-600 font-medium">
            {gift.min_quantity > 1 
              ? `Buy ${gift.min_quantity}+ products to claim`
              : 'Available with your purchase'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGiftCard;
