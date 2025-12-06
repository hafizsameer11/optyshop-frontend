import React from 'react'
import { Link } from 'react-router-dom'

const GetQuoteSection: React.FC = () => {
    return (
        <section className="bg-white py-8 md:py-10 lg:py-12">
            <div className="w-[90%] mx-auto max-w-5xl">
                <div className="bg-gradient-to-r from-blue-950 via-blue-950 to-green-700 rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                        {/* Text Content */}
                        <div className="flex-1 text-white">
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-5 leading-tight text-left">
                                Interested in getting an<br />
                                accurate online PD<br />
                                Measurement tool?
                            </h2>

                            <Link
                                to="/pricing-request"
                                className="inline-block mt-3"
                            >
                                <button className="bg-white border border-gray-300 text-blue-950 px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-50 hover:border-gray-400 transition-colors duration-300">
                                    Get a custom quote
                                </button>
                            </Link>
                        </div>

                        {/* Smartphone Image */}
                        <div className="flex-1 flex justify-center lg:justify-end">
                            <div className="w-full max-w-[200px] md:max-w-[250px] lg:max-w-[280px]">
                                <img
                                    src="/assets/images/MicrosoftTeams-image14.webp"
                                    alt="PD Measurement on smartphone"
                                    className="w-full h-auto object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GetQuoteSection

