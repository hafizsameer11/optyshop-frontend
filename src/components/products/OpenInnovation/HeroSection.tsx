import React from 'react'
import { useNavigate } from 'react-router-dom'

const HeroSection: React.FC = () => {
    const navigate = useNavigate()

    const handleDiscoverTechnology = () => {
        navigate('/our-technology')
    }

    return (
        <section
            className="relative  min-h-[400px] sm:min-h-[450px] md:min-h-[500px] flex items-center pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url(/assets/images/graz-mesh-2800.webp)',
            }}
        >
            <div className="w-full">
                <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left - Content */}
                    <div className="relative text-white px-4 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16 flex flex-col justify-center">
                        <div className="w-full sm:w-[98%] mx-auto max-w-6xl space-y-4 sm:space-y-6 md:space-y-8">
                            <div>
                                <h1 className="text-base lg:pt-15 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
                                    Open Innovation
                                </h1>
                                <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold mb-2 sm:mb-3">
                                    Collaborative solutions for the future
                                </h2>
                                <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-white"></div>
                            </div>

                            <div className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                                <p>
                                    Join us in building innovative solutions that shape the future of optical technology and digital experiences. We collaborate with partners, developers, and innovators to create cutting-edge solutions that benefit the entire industry.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                                <button
                                    onClick={handleDiscoverTechnology}
                                    className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-slate-800 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                                >
                                    Discover our technology
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right - Empty space to show background image */}
                    <div className="relative min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-full">
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

