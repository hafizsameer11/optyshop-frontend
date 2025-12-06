import React from 'react'

const HeroSection: React.FC = () => {
    return (
        <section
            className="relative h-[40vh] flex flex-col bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url(/assets/images/virtual-try.jpg)'
            }}
        >
            {/* Dark overlay on left side for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/80 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center">
                <div className="w-[90%] mx-auto max-w-7xl">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                            Contact us
                        </h1>
                        <div className="w-20 h-1 bg-white"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Gradient Strip */}
            <div className="relative z-10 h-1 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500"></div>
        </section>
    )
}

export default HeroSection

