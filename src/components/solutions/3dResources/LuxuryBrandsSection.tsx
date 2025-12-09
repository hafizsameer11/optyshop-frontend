import React from 'react'
import { useNavigate } from 'react-router-dom'

const LuxuryBrandsSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/digital-frames')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left Side - Text Content */}
                    <div className="space-y-6 md:space-y-8">
                        {/* Section Title */}
                        <div>
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6">
                                <span className="text-amber-600">Luxury brands and exclusive</span>
                                <br />
                                <span className="text-amber-600 underline">collections</span>
                            </h3>
                        </div>

                        {/* Paragraphs */}
                        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                            <p>
                                Fittingbox is the only player that digitizes the eyewear collections of well-known luxury brands such as Dior and LVMH.
                            </p>
                            <p>
                                Thanks to our 3D digitization and modeling experts and dedicated in-house software, we can <strong className="font-semibold">transform the most specific frames into digital objects</strong> that <strong className="font-semibold">imitate the appearance of the frame in the real world as closely as possible</strong>.
                            </p>
                            <p>
                                With customizable control over lighting, volume, and reflection effects, Fittingbox technology enables incredibly realistic representation.
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Image */}
                    <div className="relative flex justify-center lg:justify-end">
                        <img
                            src="/assets/images/LV-glasses-with-jewel.webp"
                            alt="Louis Vuitton luxury sunglasses"
                            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl h-auto rounded-lg shadow-lg"
                        />
                    </div>
                </div>

                {/* Call to Action Button */}
                <div className="text-center mt-12 md:mt-16">
                    <button 
                        onClick={handleLearnMore}
                        className="px-8 md:px-12 py-3 md:py-4 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300 shadow-md text-base md:text-lg cursor-pointer"
                    >
                        Learn more about digitizing frames
                    </button>
                </div>
            </div>
        </section>
    )
}

export default LuxuryBrandsSection

