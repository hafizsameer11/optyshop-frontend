import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const HeroSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleRequestPrices = () => {
        navigate('/pricing-request')
    }

    const handleRequestDemo = () => {
        if (location.pathname === '/') {
            // Already on home page, just scroll
            setTimeout(() => {
                const element = document.getElementById('live-demo')
                if (element) {
                    const offset = 100 // Account for fixed navbar
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 50)
        } else {
            // Navigate to home page with hash - Home component's useEffect will handle scrolling
            navigate('/#live-demo')
        }
    }

    return (
        <section
            className="relative min-h-[450px] md:min-h-[400px] overflow-hidden bg-cover bg-center bg-no-repeat pt-20 md:pt-0"
            style={{
                backgroundImage: 'url(/assets/images/digital-hero.webp)',
            }}
        >
            {/* Dark overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>

            <div className="relative w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-24 z-10">
                <div className="max-w-2xl">
                    {/* Left Content */}
                    <div className="text-white space-y-3 md:space-y-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                            Digital frames
                        </h1>

                        <div>
                            <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold mb-1.5 md:mb-2">
                                3D Resources and Packshots for Glasses
                            </h2>
                            <div className="w-16 sm:w-20 h-0.5 md:h-1 bg-white"></div>
                        </div>

                        <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                            <p>
                                Thanks to more than <strong className="text-white font-bold">15 years of experience</strong> in eyeglass photography and digitization, our <strong className="text-white font-bold">patented technology</strong> has ensured the creation of <strong className="text-white font-bold">195,000</strong> realistic digital frames, making up the <strong className="text-white font-bold">largest database of 3D frames in the world.</strong>
                            </p>
                            <p>
                                Get <strong className="text-white font-bold">high-quality 3D modeling</strong> and images of your products that meet your needs and budget.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                            <button
                                onClick={handleRequestPrices}
                                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors duration-300 text-sm sm:text-base cursor-pointer"
                            >
                                Request prices
                            </button>
                            <button
                                onClick={handleRequestDemo}
                                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-[#0f172a] font-semibold hover:bg-gray-100 transition-colors duration-300 text-sm sm:text-base cursor-pointer"
                            >
                                Request a demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

