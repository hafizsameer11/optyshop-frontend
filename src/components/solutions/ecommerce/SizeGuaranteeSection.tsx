import React from 'react'

const SizeGuaranteeSection: React.FC = () => {
    return (
        <section className="bg-white py-6 md:py-8 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-4 md:gap-6 items-center">
                    {/* Left Side - Smartphone Image */}
                    <div className="flex justify-center lg:justify-start order-1 lg:order-1">
                        <div className="relative w-[320px] sm:w-[380px] md:w-[420px] lg:w-[580px]">
                            <img
                                src="/assets/images/Size-Guarantee_M_ok.webp"
                                alt="Virtual test with actual frame dimensions on smartphone"
                                className="w-full h-auto object-contain  rounded-2xl"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Side - Text Content */}
                    <div className="order-2 lg:order-2 space-y-3 md:space-y-4">
                        {/* Main Headline */}
                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-950 leading-tight">
                                Virtual test with{' '}
                                <span className="underline decoration-2 underline-offset-2 font-bold">
                                    actual frame dimensions
                                </span>
                            </h2>
                        </div>

                        {/* Content Paragraphs */}
                        <div className="space-y-2 text-sm md:text-base text-gray-700 leading-snug">
                            <p>
                                The size assurance feature allows users to try on glasses with confidence that{' '}
                                <strong className="text-blue-950">the frame size is an accurate fit</strong> on their face.
                            </p>
                            <p>
                                Customers can try on glasses with a super realistic fit!
                            </p>
                        </div>

                        {/* Call to Action Button */}
                        <div className="pt-1">
                            <button className="px-5 md:px-6 py-2 md:py-2.5 border border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-xs md:text-sm bg-white">
                                Learn more about the size guarantee
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SizeGuaranteeSection

