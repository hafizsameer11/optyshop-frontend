import React, { useState, useEffect } from 'react';
import type { ProductGift } from '../../services/productGiftsService';
import { getProductGifts } from '../../services/productGiftsService';
import ProductGiftCard from './ProductGiftCard';

interface ProductGiftsListProps {
  productId?: number | string;
  className?: string;
}

const ProductGiftsList: React.FC<ProductGiftsListProps> = ({ 
  productId,
  className = '' 
}) => {
  const [gifts, setGifts] = useState<ProductGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const giftList = await getProductGifts(productId);
        setGifts(giftList);
      } catch (error) {
        console.error('Error fetching product gifts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifts();
  }, [productId]);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-green-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-green-100 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const activeGifts = gifts.filter(gift => gift.is_active);

  if (activeGifts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-green-800 mb-3">
        🎁 Available Gifts
      </h3>
      {activeGifts.map((gift) => (
        <ProductGiftCard key={gift.id} gift={gift} />
      ))}
    </div>
  );
};

export default ProductGiftsList;
