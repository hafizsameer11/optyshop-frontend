import React, { useState, useEffect } from 'react';
import type { FlashOffer } from '../../services/flashOffersService';
import { getFlashOffers } from '../../services/flashOffersService';
import { Link } from 'react-router-dom';

interface FlashOffersListProps {
  className?: string;
  limit?: number;
  showExpired?: boolean;
}

const FlashOffersList: React.FC<FlashOffersListProps> = ({ 
  className = '', 
  limit,
  showExpired = false 
}) => {
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlashOffers = async () => {
      try {
        const offers = await getFlashOffers(!showExpired);
        if (limit) {
          setFlashOffers(offers.slice(0, limit));
        } else {
          setFlashOffers(offers);
        }
      } catch (error) {
        console.error('Error fetching flash offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashOffers();
  }, [limit, showExpired]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(limit || 3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md animate-pulse">
            <div className="h-48 bg-gray-300 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (flashOffers.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          {showExpired ? 'No flash offers found.' : 'No active flash offers at the moment.'}
        </div>
      </div>
    );
  }

  const formatTimeLeft = (endsAt: string) => {
    const now = new Date().getTime();
    const endTime = new Date(endsAt).getTime();
    const difference = endTime - now;

    if (difference <= 0) return 'Expired';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }

    return `${hours}h ${minutes}m ${seconds}s left`;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {flashOffers.map((offer) => (
        <div
          key={offer.id}
          className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
            !offer.is_active ? 'opacity-75' : ''
          }`}
        >
          {offer.image_url && (
            <div className="relative h-48 bg-gray-100">
              <img
                src={offer.image_url}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              {!offer.is_active && (
                <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                  Expired
                </div>
              )}
              {offer.is_active && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                  Flash Sale
                </div>
              )}
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
              {offer.discount_type === 'percentage' && offer.discount_value && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                  -{offer.discount_value}%
                </span>
              )}
              {offer.discount_type === 'fixed' && offer.discount_value && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                  -${offer.discount_value}
                </span>
              )}
            </div>
            
            {offer.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{offer.description}</p>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                {formatTimeLeft(offer.ends_at)}
              </div>
              {offer.product_ids && offer.product_ids.length > 0 && (
                <div className="text-sm text-gray-500">
                  {offer.product_ids.length} {offer.product_ids.length === 1 ? 'product' : 'products'}
                </div>
              )}
            </div>
            
            {offer.link_url ? (
              <Link
                to={offer.link_url}
                className="block w-full bg-red-500 text-white text-center py-2 px-4 rounded hover:bg-red-600 transition-colors font-medium"
              >
                {offer.is_active ? 'Shop Now' : 'View Offer'}
              </Link>
            ) : (
              <button
                disabled={!offer.is_active}
                className="block w-full bg-gray-300 text-gray-500 text-center py-2 px-4 rounded font-medium cursor-not-allowed"
              >
                {offer.is_active ? 'Shop Now' : 'Expired'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlashOffersList;
