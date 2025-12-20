import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleRequestPrices = () => {
        navigate('/pricing-request');
    };

    const handleRequestDemo = () => {
        if (location.pathname === '/') {
            // Already on home page, just scroll
            setTimeout(() => {
                const element = document.getElementById('live-demo');
                if (element) {
                    const offset = 100; // Account for fixed navbar
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        } else {
            // Navigate to home page with hash - Home component's useEffect will handle scrolling
            navigate('/#live-demo');
        }
    };

    return (
        <section className="relative text-white overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/assets/images/slider-banner-lens-simulator.webp)' }}>
            {/* No overlay - background image is clear */}

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center">

                {/* Left Content */}
                <div className="w-full lg:w-1/2 z-10 space-y-8 text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                        Virtual glasses try-on
                    </h1>

                    <p className="text-xl md:text-2xl text-blue-200 font-medium">
                        The best solution for the optical sector
                    </p>

                    <div className="space-y-4 text-gray-300 max-w-2xl">
                        <p>
                            Fittingbox provides <strong className="text-white">real-time virtual eyewear trying on</strong>, offering an immersive and interactive <strong className="text-white">eyewear shopping experience</strong>.
                        </p>
                        <p>
                            Customers can "try before they buy" any pair of glasses or sunglasses, both <strong className="text-white">online and in-store</strong>, and see which ones suit them best.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-start pt-4">
                        <button
                            onClick={handleRequestPrices}
                            className="px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                        >
                            Request prices
                        </button>
                        <button
                            onClick={handleRequestDemo}
                            className="px-8 py-3 rounded-full bg-white text-[#1e3a8a] font-semibold hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                        >
                            Request a demo
                        </button>
                    </div>
                </div>



            </div>

        </section>
    );
};

export default HeroSection;
