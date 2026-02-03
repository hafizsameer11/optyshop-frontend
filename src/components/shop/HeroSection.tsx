import React from 'react'

interface HeroSectionProps {
    title?: string
    subtitle?: string
    showRelatedPages?: boolean
}

const HeroSection: React.FC<HeroSectionProps> = ({
    title = "SOL OPTICS",
    subtitle = "ULTIMATE EYEWEAR CO. SEE THE WORLD IN A NEW LIGHT",
    showRelatedPages = true
}) => {
    return (
        <section className="bg-gradient-to-r from-blue-900 to-blue-950 text-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="text-center mb-4">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                        {title}
                    </h1>
                    <p className="text-sm md:text-base lg:text-lg text-blue-100 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {showRelatedPages && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                        <span className="text-xs font-medium text-blue-200 uppercase tracking-wide">
                            Related Pages
                        </span>
                    </div>
                )}
            </div>
        </section>
    )
}

export default HeroSection
