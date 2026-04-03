import React, { useState, useEffect } from 'react';
import type { FlashOffer } from '../../services/flashOffersService';
import { getActiveFlashOffer } from '../../services/flashOffersService';
import { Link } from 'react-router-dom';
import { resolveFlashOfferCtaPath } from '../../utils/flashOfferDisplay';

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
  const ctaHref = resolveFlashOfferCtaPath(flashOffer);
  const ctaExternal = /^https?:\/\//i.test(ctaHref);

  return (
    <div className={`bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              ⚡ Flash Sale
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
              <span className="text-xs sm:text-sm font-semibold text-white/90">Ends in:</span>
              <div className="flex gap-1">
                <div className="bg-white/25 backdrop-blur-sm border border-white/30 px-3 py-2 rounded-lg text-center shadow-lg">
                  <div className="text-sm sm:text-base font-bold text-white">{formatTime(timeLeft.hours)}</div>
                  <div className="text-xs text-white/80 uppercase">HRS</div>
                </div>
                <div className="bg-white/25 backdrop-blur-sm border border-white/30 px-3 py-2 rounded-lg text-center shadow-lg">
                  <div className="text-sm sm:text-base font-bold text-white">{formatTime(timeLeft.minutes)}</div>
                  <div className="text-xs text-white/80 uppercase">MIN</div>
                </div>
                <div className="bg-white/25 backdrop-blur-sm border border-white/30 px-3 py-2 rounded-lg text-center shadow-lg">
                  <div className="text-sm sm:text-base font-bold text-white">{formatTime(timeLeft.seconds)}</div>
                  <div className="text-xs text-white/80 uppercase">SEC</div>
                </div>
              </div>
            </div>
            
            {ctaExternal ? (
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-emerald-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-lg border-2 border-white/30"
              >
                Shop Now →
              </a>
            ) : (
              <Link
                to={ctaHref}
                className="bg-white text-emerald-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-lg border-2 border-white/30"
              >
                Shop Now →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOfferBanner;
