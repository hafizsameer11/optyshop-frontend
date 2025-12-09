import React from 'react'
import { useNavigate } from 'react-router-dom'

const HeroSection: React.FC = () => {
    const navigate = useNavigate()

    const handleGetPrices = () => {
        navigate('/pricing-request')
    }

    return (
        <section
            className="relative min-h-[450px] md:min-h-[500px] overflow-hidden bg-cover bg-center bg-no-repeat pt-20 md:pt-0"
            style={{
                backgroundImage: 'url(/assets/images/[FBx]-slider-banner-template-3d-viewer-ok.webp)',
            }}
        >
            {/* Dark overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>

            <div className="relative w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-24 z-10">
                <div className="max-w-2xl">
                    {/* Left Content */}
                    <div className="text-white space-y-3 md:space-y-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                            3D Visualization Glasses
                        </h1>

                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 md:mb-2 leading-tight">
                                Fittingbox 3D Viewer
                            </h2>
                            <div className="w-24 h-0.5 md:h-1 bg-white"></div>
                        </div>

                        <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                            <p>
                                Offer an <strong className="text-white font-bold">interactive and engaging experience</strong>, allowing users to manage, zoom and view frames in detail.
                            </p>
                            <p>
                                Directly from the virtual try-on experience, users can easily switch from viewing the glasses on the face to <strong className="text-white font-bold">manipulating them from any angle</strong>.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                            <button
                                onClick={handleGetPrices}
                                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-[#0f172a] font-semibold hover:bg-gray-100 transition-colors duration-300 text-sm sm:text-base cursor-pointer"
                            >
                                Get prices
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

