import React from 'react'
import { useNavigate } from 'react-router-dom'

const WhyVirtualTryOnSection: React.FC = () => {
    const navigate = useNavigate()

    const handleSeeCaseStudy = () => {
        navigate('/case-studies')
    }

    const handleDiscoverAdvanced = () => {
        navigate('/virtual-test')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Question */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-blue-950 text-center mb-10 md:mb-12">
                    Why is <strong className="font-bold">Virtual Try-On</strong> a killer feature to <strong className="font-bold">drive</strong> online <strong className="font-bold">traffic to your stores</strong>?
                </h2>

                {/* Statistics Box */}
                <div className="bg-blue-950 rounded-2xl p-6 md:p-8 lg:p-10 mb-8 md:mb-10 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
                        {/* Left - Text Content */}
                        <div className="text-white">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                                Drive-to-Store
                            </h3>
                            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4">
                                2.5x
                            </div>
                            <p className="text-sm md:text-base text-white/90 mb-4 md:mb-5 leading-relaxed">
                                Visitors who tried on frames with the virtual try-on feature are 2.5 times more likely to book an appointment to go to a store. Observed on 5M page views.
                            </p>
                            <button 
                                onClick={handleSeeCaseStudy}
                                className="bg-transparent border-2 border-white text-white px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-white hover:text-blue-950 transition-colors duration-300 cursor-pointer"
                            >
                                See the case study
                            </button>
                        </div>

                        {/* Right - Glasses Icon with Gradient */}
                        <div className="flex justify-center lg:justify-end">
                            <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-xl bg-gradient-to-b from-orange-300 to-orange-600 border-2 border-blue-950 flex items-center justify-center shadow-xl">
                                <svg className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    {/* Glasses in box */}
                                    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" />
                                    <path d="M8 10h8M8 14h8" stroke="currentColor" strokeLinecap="round" />
                                    <circle cx="10" cy="12" r="2" stroke="currentColor" />
                                    <circle cx="14" cy="12" r="2" stroke="currentColor" />
                                    <path d="M10 12h4" stroke="currentColor" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="text-center">
                    <button 
                        onClick={handleDiscoverAdvanced}
                        className="bg-transparent border-2 border-blue-950 text-blue-950 px-8 md:px-12 py-3 md:py-4 rounded-lg font-semibold lg:rounded-full sm:rounded-full text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300 cursor-pointer"
                    >
                        Discover Virtual Try-On Advanced for website
                    </button>
                </div>
            </div>
        </section>
    )
}

export default WhyVirtualTryOnSection

