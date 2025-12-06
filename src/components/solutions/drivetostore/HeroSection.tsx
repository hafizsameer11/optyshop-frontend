import React from 'react'
import { Link } from 'react-router-dom'

const HeroSection: React.FC = () => {
    return (
        <section className="relative h-screen flex flex-col pt-20 md:pt-0">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/assets/images/solutions-drive-to-store.webp)',
                }}
            >
                <div className="absolute inset-0 "></div>
            </div>

            <div className="relative w-full z-10 flex-1 flex flex-col">
                <div className="w-[90%] mx-auto flex-1 flex items-center">
                    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 md:gap-12 items-center w-full">
                        {/* Left - Text Content */}
                        <div className="text-white px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 flex flex-col justify-center max-w-2xl">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight">
                                Increase Foot Traffic to Your Store
                            </h1>

                            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 md:mb-4">
                                With virtual try-on solution
                            </h2>

                            <div className="w-20 h-1 bg-white mb-4 md:mb-5"></div>

                            <p className="text-sm md:text-base text-white/90 mb-4 md:mb-5 leading-relaxed">
                                Get more in-store traffic with a realistic <strong className="text-white font-bold">virtual try-on experience</strong> that drives users to the closest store to try the glasses they have selected online.
                            </p>

                            <button className="bg-white border-2 border-gray-300 text-blue-950 px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-50 hover:border-gray-400 transition-colors duration-300 w-full sm:w-auto">
                                Get a Demo
                            </button>
                        </div>

                        {/* Right - Image (will be shown in background) */}
                        <div className="hidden lg:block"></div>
                    </div>
                </div>

                {/* Bottom Red Line Separator */}
                <div className="w-full h-1 bg-red-600 mt-auto"></div>

                {/* Breadcrumbs Section */}
                <div className="bg-white py-3 px-4 sm:px-6">
                    <div className="w-[90%] mx-auto">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <Link to="/" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                <span>HOME</span>
                            </Link>
                            <span className="text-gray-400">/</span>
                            <Link to="/virtual-test" className="text-gray-600 hover:text-gray-800">
                                VIRTUAL TRY-ON
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">SOLUTIONS</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600 font-bold">DRIVE-TO-STORE</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

