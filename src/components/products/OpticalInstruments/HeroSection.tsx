import React from 'react'
import { useNavigate } from 'react-router-dom'

const HeroSection: React.FC = () => {
    const navigate = useNavigate()

    const handleRequestPrices = () => {
        navigate('/pricing-request')
    }

    return (
        <section
            className="relative min-h-[450px] md:min-h-[500px] overflow-hidden bg-cover bg-center bg-no-repeat pt-20 md:pt-0"
            style={{
                backgroundImage: 'url(/assets/images/Technology-into-store_confirmed.webp)',
            }}
        >
            {/* Dark overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>

            <div className="relative w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-24 z-10">
                <div className="max-w-2xl">
                    {/* Left Content */}
                    <div className="text-white space-y-3 md:space-y-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                            Instruments for opticians
                        </h1>

                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                            Digital solutions for ophthalmology
                        </h2>

                        <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                            <p>
                                Bring your <strong className="text-white font-bold">optical expertise</strong> to the <strong className="text-white font-bold">digital world</strong> and provide <strong className="text-white font-bold">high-quality service</strong> to your customers while they shop. We provide all the right tools to <strong className="text-white font-bold">digitalize your optical expertise</strong>.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                            <button
                                onClick={handleRequestPrices}
                                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-[#0f172a] font-semibold hover:bg-gray-100 transition-colors duration-300 text-sm sm:text-base cursor-pointer"
                            >
                                Request prices
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

