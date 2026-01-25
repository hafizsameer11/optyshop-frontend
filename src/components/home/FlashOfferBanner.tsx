import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveFlashOffer, FlashOffer } from '../../services/flashOffersService';
import CountdownTimer from './CountdownTimer';

const FlashOfferBanner: React.FC = () => {
  const [offer, setOffer] = useState<FlashOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const activeOffer = await getActiveFlashOffer();
        setOffer(activeOffer);
      } catch (error) {
        console.error('Error fetching flash offer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, []);

  if (loading || !offer || offer.is_expired) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-8 md:py-12 px-4 mb-12 rounded-2xl shadow-2xl border border-emerald-400/30">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-300 opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-300 opacity-30 rounded-full blur-3xl"></div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block bg-yellow-300 text-emerald-900 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider shadow-lg">
              ⚡ Limited Time Offer
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-yellow-200 drop-shadow-lg">
              {offer.title}
            </h2>
            <p className="text-white text-lg mb-6 max-w-2xl drop-shadow">
              {offer.description}
            </p>
            
            {offer.link_url && (
              <Link
                to={offer.link_url}
                className="inline-block bg-yellow-300 text-emerald-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-200 transition-all transform hover:scale-105 shadow-lg border-2 border-yellow-200"
              >
                Shop Now
              </Link>
            )}
          </div>

          <div className="flex flex-col items-center bg-white/25 backdrop-blur-md p-6 md:p-8 rounded-3xl border-2 border-yellow-300/50 shadow-2xl">
            <p className="text-sm font-semibold mb-4 uppercase tracking-widest text-yellow-200 drop-shadow">Ending In</p>
            <CountdownTimer 
              endsAt={offer.ends_at} 
              initialCountdown={offer.countdown}
              onExpire={() => setOffer(null)}
            />
          </div>
        </div>
      </div>

      {offer.image_url && (
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none hidden lg:block">
          <img 
            src={offer.image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default FlashOfferBanner;
