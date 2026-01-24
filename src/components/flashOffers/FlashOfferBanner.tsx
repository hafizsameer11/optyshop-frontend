import React, { useState, useEffect } from 'react';
import type { FlashOffer } from '../../services/flashOffersService';
import { getActiveFlashOffer } from '../../services/flashOffersService';
import { Link } from 'react-router-dom';

interface FlashOfferBannerProps {
  className?: string;
}

const FlashOfferBanner: React.FC<FlashOfferBannerProps> = ({ className = '' }) => {
  const [flashOffer, setFlashOffer] = useState<FlashOffer | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlashOffer = async () => {
      try {
        const offer = await getActiveFlashOffer();
        setFlashOffer(offer);
      } catch (error) {
        console.error('Error fetching flash offer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashOffer();
  }, []);

  useEffect(() => {
    if (!flashOffer || !flashOffer.ends_at) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashOffer.ends_at).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [flashOffer]);

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!flashOffer || !flashOffer.is_active || (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
    return null;
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className={`bg-gradient-to-r from-red-500 to-orange-500 text-white ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide bg-white/20 px-2 py-1 rounded">
              Flash Sale
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold">{flashOffer.title}</h3>
              {flashOffer.description && (
                <p className="text-xs sm:text-sm opacity-90">{flashOffer.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm">Ends in:</span>
              <div className="flex gap-1">
                <div className="bg-white/20 px-2 py-1 rounded text-center">
                  <div className="text-sm sm:text-base font-bold">{formatTime(timeLeft.hours)}</div>
                  <div className="text-xs">H</div>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded text-center">
                  <div className="text-sm sm:text-base font-bold">{formatTime(timeLeft.minutes)}</div>
                  <div className="text-xs">M</div>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded text-center">
                  <div className="text-sm sm:text-base font-bold">{formatTime(timeLeft.seconds)}</div>
                  <div className="text-xs">S</div>
                </div>
              </div>
            </div>
            
            {flashOffer.link_url && (
              <Link
                to={flashOffer.link_url}
                className="bg-white text-red-500 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
