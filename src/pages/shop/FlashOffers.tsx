import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FlashOffersList from '../../components/flashOffers/FlashOffersList';
import { getFlashOffers } from '../../services/flashOffersService';
import type { FlashOffer } from '../../services/flashOffersService';

const FlashOffers: React.FC = () => {
  const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    const fetchFlashOffers = async () => {
      try {
        const offers = await getFlashOffers(!showExpired);
        setFlashOffers(offers);
      } catch (error) {
        console.error('Error fetching flash offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashOffers();
  }, [showExpired]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ⚡ Flash Sale Offers
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Don't miss out on these limited-time deals! Grab your favorite products at amazing prices before they're gone.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-gray-700">Show expired offers</span>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <p className="mt-4 text-gray-600">Loading flash offers...</p>
          </div>
        ) : (
          <>
            {flashOffers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {showExpired ? 'No Flash Offers Found' : 'No Active Flash Sales'}
                </h2>
                <p className="text-gray-600">
                  {showExpired 
                    ? 'There are no flash offers available at the moment.'
                    : 'Check back later for new flash sale offers!'
                  }
                </p>
                <button
                  onClick={() => window.location.href = '/shop'}
                  className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <p className="text-gray-600">
                    {showExpired 
                      ? `Showing all ${flashOffers.length} flash offers`
                      : `${flashOffers.length} active flash offer${flashOffers.length === 1 ? '' : 's'} available`
                    }
                  </p>
                </div>
                
                <FlashOffersList showExpired={showExpired} />
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default FlashOffers;
