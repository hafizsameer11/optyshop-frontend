import React from 'react'

const BenefitsSection: React.FC = () => {
    return (
        <section className="bg-stone-50 py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Heading */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-blue-950 text-center mb-10 md:mb-12 lg:mb-16">
                    Easy and accurate online PD measurements for eyeglasses
                </h2>

                {/* Three Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
                    {/* Card 1 - Ensure a proper fit */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="mb-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center">
                                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {/* Left Eye */}
                                    <circle cx="8" cy="12" r="2" strokeWidth={2} fill="white" />
                                    <circle cx="8" cy="12" r="3.5" strokeWidth={1.5} />
                                    {/* Right Eye */}
                                    <circle cx="16" cy="12" r="2" strokeWidth={2} fill="white" />
                                    <circle cx="16" cy="12" r="3.5" strokeWidth={1.5} />
                                    {/* Double-headed arrow */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 12h4M11 10l-1 2 1 2M13 10l1 2-1 2" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4">
                            Ensure a proper fit
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                            Accurate PD measurement ensures a proper fit, <strong className="text-gray-800">optimal visual clarity</strong>, and the convenience of getting the best possible vision correction.
                        </p>
                    </div>

                    {/* Card 2 - Give confidence in ordering online */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="mb-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center relative">
                                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {/* Shopping Cart */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    {/* Mouse Cursor */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l2 2a5 5 0 01-7 0l2-2m-2-2V9a2 2 0 012-2h2a2 2 0 012 2v4m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4">
                            Give confidence in ordering online
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                            Get <strong className="text-gray-800">accurate results</strong>, so shoppers can confidently order their glasses from the comfort of their home.
                        </p>
                    </div>

                    {/* Card 3 - Offering a seamless shopping experience */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="mb-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {/* Speech Bubble */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    {/* Heart inside */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} fill="white" d="M12 9.5c-1.5-2-4.5-2-6 0-1.5 2 0 4.5 6 7.5 6-3 7.5-5.5 6-7.5-1.5-2-4.5-2-6 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4">
                            Offering a seamless shopping experience
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                            Reduce cart abandonment and ill-fitting glasses by providing an appropriate solution when PD is unknown.
                        </p>
                    </div>
                </div>

                {/* Call-to-Action Button */}
                <div className="text-center">
                    <button className="bg-white border-2 border-blue-950 text-blue-950 px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300">
                        Discover our PD measurement tool
                    </button>
                </div>
            </div>
        </section>
    )
}

export default BenefitsSection

