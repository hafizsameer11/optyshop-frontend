import React from 'react';
import type { ProductGift } from '../../services/productGiftsService';
import { Link } from 'react-router-dom';

interface ProductGiftCardProps {
  gift: ProductGift;
  className?: string;
}

const ProductGiftCard: React.FC<ProductGiftCardProps> = ({ gift, className = '' }) => {
  if (!gift.is_active) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-green-800">Free Gift Available!</h4>
            {gift.min_quantity > 1 && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                Buy {gift.min_quantity}+ to get
              </span>
            )}
          </div>
          
          {gift.description && (
            <p className="text-green-700 text-sm mb-2">{gift.description}</p>
          )}
          
          {gift.gift_product && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">You'll receive:</span>
              <Link
                to={`/products/${gift.gift_product.id}`}
                className="text-sm font-medium text-green-800 hover:text-green-900 underline"
              >
                {gift.gift_product.name}
              </Link>
            </div>
          )}
          
          {gift.max_quantity && gift.max_quantity > 1 && (
            <p className="text-xs text-green-600 mt-1">
              Limit: {gift.max_quantity} gift{gift.max_quantity > 1 ? 's' : ''} per order
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGiftCard;
