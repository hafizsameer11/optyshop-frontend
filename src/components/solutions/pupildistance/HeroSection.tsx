import React from 'react'
import { Link } from 'react-router-dom'

const HeroSection: React.FC = () => {
    return (
        <section
            className="relative min-h-screen flex flex-col pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url(/assets/images/benedetta--slider-user-experience4.webp)',
            }}
        >
            <div className="flex-1 grid lg:grid-cols-2 gap-0">
                {/* Left - Content with Dark Blue Overlay */}
                <div className=" text-white px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-16 flex flex-col justify-center">
                    <div className="w-full sm:w-[95%] mx-auto max-w-4xl space-y-4 sm:space-y-5 md:space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight">
                                Online PD measurement
                            </h1>
                            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3">
                                Getting the{' '}
                                <span className="relative inline-block">
                                    pupillary distance
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white"></span>
                                </span>{' '}
                                for e-commerce
                            </h2>
                        </div>

                        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                            <p>
                                Pupillary distance is <strong className="text-white font-bold">essential</strong> for positioning the optical center of lenses. When purchasing online, end users often find themselves required to provide precise measurements if their PD is not listed in their prescription.
                            </p>
                            <p>
                                Get an <strong className="text-white font-bold">easy-to-use and accurate online tool</strong>, so 100% of shoppers can order eyeglasses on your website.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right - Empty space to show background image */}
                <div className="relative">
                </div>
            </div>

            {/* Bottom Turquoise Strip with Breadcrumbs */}
            <div className="text-orange-500 bg-white py-3 px-4 sm:px-6">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-text-orange-500">
                        <Link to="/" className="flex items-center gap-2 hover:underline">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </Link>
                        <span>/</span>
                        <Link to="/optical-instruments" className="hover:underline">
                            OPTICAL INSTRUMENTS
                        </Link>
                        <span>/</span>
                        <span>SOLUTIONS</span>
                        <span>/</span>
                        <span className="font-semibold">PD MEASURE</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

