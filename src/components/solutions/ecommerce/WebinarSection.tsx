import React from 'react'
import { Link } from 'react-router-dom'

const WebinarSection: React.FC = () => {
    return (
        <section className="bg-white py-6 md:py-8 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                <div className="bg-blue-950 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid md:grid-cols-[40%_auto_60%] gap-0">
                        {/* Left Section - Speaker Information */}
                        <div className="relative bg-blue-950 p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center">
                            {/* Polka dot pattern background - light blue dots */}
                            <div className="absolute inset-0 opacity-20" style={{
                                backgroundImage: 'radial-gradient(circle, #60a5fa 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}></div>

                            <div className="relative z-10 w-full flex flex-col items-center space-y-4 md:space-y-6">
                                {/* WEBINAR Label */}
                                <div className="self-start mb-4">
                                    <span className="text-amber-200 text-sm md:text-base font-semibold uppercase tracking-wide border-b-2 border-amber-200 pb-1">
                                        WEBINAR
                                    </span>
                                </div>

                                {/* Speaker Photo */}
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-gray-300">
                                    <img
                                        src="/assets/images/Webinar-cta-image-v2.webp"
                                        alt="Matthieu MONTPELLIER - Head of Customer Success at Fittingbox"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                        }}
                                    />
                                </div>

                                {/* Speaker Name */}
                                <h3 className="text-white text-lg md:text-xl lg:text-2xl font-bold text-center">
                                    Matthieu MONTPELLIER
                                </h3>

                                {/* Speaker Title */}
                                <p className="text-white text-sm md:text-base text-center">
                                    Head of Customer Success at Fittingbox
                                </p>
                            </div>
                        </div>

                        {/* Vertical Gradient Divider - purple → teal → yellow → orange/red */}
                        <div className="w-1 bg-gradient-to-b from-purple-600 via-cyan-400 via-yellow-400 to-orange-500"></div>

                        {/* Right Section - Webinar Details */}
                        <div className="bg-blue-950 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
                            <div className="space-y-4 md:space-y-6">
                                {/* Main Headline */}
                                <div>
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                        5 things to keep in mind
                                    </h2>
                                    <h3 className="text-xl sm:text-2xl md:text-3xl text-white border-b-2 border-white pb-2 mt-2">
                                        before taking a virtual test
                                    </h3>
                                </div>

                                {/* Description */}
                                <p className="text-base md:text-lg text-white/90 leading-relaxed">
                                    Get the 5 key success factors and answers to your questions
                                </p>

                                {/* CTA Button */}
                                <div className="pt-2">
                                    <Link
                                        to="/webinar"
                                        className="inline-block px-6 md:px-8 py-3 md:py-4 bg-amber-200 text-blue-950 font-semibold rounded-lg hover:bg-amber-300 transition-colors duration-300 text-base md:text-lg shadow-lg"
                                    >
                                        Watch the webinar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WebinarSection

