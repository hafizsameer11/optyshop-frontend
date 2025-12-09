import React from 'react'

const CartHeroSection: React.FC = () => {
    return (
        <section
            className="relative overflow-hidden pt-20 md:pt-0 bg-cover bg-center bg-no-repeat h-[60vh] sm:h-[70vh]"
            style={{
                backgroundImage: 'url(/assets/images/virtual-try.jpg)',
            }}
        >
            <div className="grid lg:grid-cols-3 gap-0 h-full">
                {/* Left - Content with Dark Overlay (2/3 width) */}
                <div className="lg:col-span-2 relative text-white px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-16 flex flex-col justify-center">
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/70 to-transparent"></div>

                    <div className="relative z-10 w-full sm:w-[95%] mx-auto max-w-4xl space-y-4 sm:space-y-5 md:space-y-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
                                Shopping Cart
                            </h1>
                            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3">
                                Review your selected{' '}
                                <span className="relative inline-block">
                                    eyewear
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white"></span>
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                            <p>
                                Complete your purchase by reviewing your selected items and proceed to checkout for a seamless shopping experience.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right - Image visible area (1/3 width) */}
                <div className="lg:col-span-1 relative">
                    {/* Minimal overlay to show image clearly on right side */}
                    <div className="absolute inset-0 bg-gradient-to-l from-blue-950/20 to-transparent"></div>
                </div>
            </div>
        </section>
    )
}

export default CartHeroSection

