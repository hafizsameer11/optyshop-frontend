import React from 'react'

const CartConversionSection: React.FC = () => {
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                    {/* Left - Image */}
                    <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                        <div className="rounded-2xl shadow-lg overflow-hidden w-full max-w-md">
                            <img
                                src="/assets/images/PD-Measurement-Image-Text-Your-PD-Final-Result.webp"
                                alt="PD Measurement result on smartphone"
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="order-1 lg:order-2">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 mb-4 md:mb-6">
                            A key step in converting your cart into{' '}
                            <span className="relative inline-block">
                                an order
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>
                        </h2>

                        <div className="space-y-5 md:space-y-6 text-blue-950 text-base md:text-lg leading-relaxed">
                            <p>
                                Accurate PD measurement is especially important when purchasing glasses online. PD should be included in the prescription. Otherwise, <strong className="font-bold">online shoppers may be stuck at the crucial stage of lens selection</strong>.
                            </p>

                            <p>
                                Fittingbox PD Measurement Solution is a <strong className="font-bold">mobile-friendly tool</strong>, available without downloading any app and <strong className="font-bold">compatible with any device, mobile, desktop or tablet</strong>.
                            </p>

                            <p>
                                Users who don't know their PD <strong className="font-bold">can easily finalize the purchase online with an accurate measurement</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CartConversionSection

