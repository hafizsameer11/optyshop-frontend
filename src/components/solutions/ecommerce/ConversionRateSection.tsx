import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ConversionRateSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleSeeCaseStudy = () => {
        navigate('/case-studies')
    }

    const handleDiscoverAdvanced = () => {
        navigate('/virtual-test')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-6xl">
                {/* Question Heading */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 text-center mb-12 md:mb-16">
                    Why is virtual trying on an incentive for online eyewear sales?
                </h2>

                {/* Main Content Box */}
                <div className="bg-blue-950 rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
                    <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
                        {/* Left - Content */}
                        <div className="text-white space-y-6">
                            {/* Large Headline */}
                            <div>
                                <h3 className="text-5xl sm:text-6xl md:text-7xl lg:text-4xl font-bold mb-4 md:mb-6">
                                    3X conversion rate
                                </h3>
                            </div>

                            {/* Supporting Text */}
                            <p className="text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed">
                                Increase in sunglasses purchases observed at 5M page views.
                            </p>

                            {/* Call to Action Button */}
                            <div className="pt-4 md:pt-6">
                                <button 
                                    onClick={handleSeeCaseStudy}
                                    className="px-8 md:px-12 py-3 md:py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-300 text-base md:text-lg cursor-pointer"
                                >
                                    See the case study
                                </button>
                            </div>
                        </div>

                        {/* Right - Icon */}
                        <div className="flex justify-center md:justify-end">
                            <div className="relative">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl">
                                    {/* Browser Window Icon */}
                                    <div className="w-3/4 h-3/4 relative">
                                        {/* Browser Frame */}
                                        <div className="absolute inset-0 border-2 border-white/30 rounded-lg">
                                            {/* Browser Top Bar */}
                                            <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 rounded-t-lg flex items-center gap-1 px-2">
                                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                            </div>
                                            {/* Shopping Cart Icon */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                                <svg
                                                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                            </div>
                                            {/* Mouse Cursor */}
                                            <div className="absolute bottom-6 right-4">
                                                <svg
                                                    className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action Button */}
                <div className="text-center mt-12 md:mt-16">
                    <button 
                        onClick={handleDiscoverAdvanced}
                        className="px-8 md:px-12 py-3 md:py-4 border border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-base md:text-lg bg-white cursor-pointer"
                    >
                        Discover the Advanced Virtual Trial for the website
                    </button>
                </div>
            </div>
        </section>
    )
}

export default ConversionRateSection

