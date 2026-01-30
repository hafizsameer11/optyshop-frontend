import React from 'react'
import { Link } from 'react-router-dom'

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
        <section className="bg-gradient-to-r from-blue-900 to-blue-950 text-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        {title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {showRelatedPages && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        <span className="text-sm font-medium text-blue-200 uppercase tracking-wide">
                            Related Pages
                        </span>
                        <div className="flex gap-4">
                            <Link
                                to="/shop?gender=men"
                                className="px-6 py-3 bg-white text-blue-950 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                            >
                                Men Glasses
                            </Link>
                            <Link
                                to="/shop?gender=women"
                                className="px-6 py-3 bg-white text-blue-950 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                            >
                                Women Glasses
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default HeroSection
