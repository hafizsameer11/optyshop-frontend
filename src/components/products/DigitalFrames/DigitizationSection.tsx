import React from 'react'
import { useNavigate } from 'react-router-dom'

const DigitizationSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/3d-viewer')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                        <div className="w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/AA-Glasses_digitization_Closeup.webp"
                                alt="Digitalization and Production Service - Professional photographer working on 3D digitization"
                                className="w-full h-auto object-contain rounded-tl-3xl rounded-bl-3xl"
                                onError={(e) => {
                                    // Fallback if image doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/frame1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6 order-1 lg:order-2 px-4 md:px-0">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-2">
                                A reliable <span className="underline">digitalization</span> and <span className="underline">production service</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-blue-950 text-base md:text-lg leading-relaxed">
                            <p>
                                Two dedicated teams of over <strong className="font-bold">20 highly qualified photographers and designers</strong> take care of your frame collections and create exact 2D and 3D copies of them.
                            </p>
                            <p>
                                With an average of 4,000 frames scanned per month, the Fittingbox database is the largest 3D frame library in the world. We have over <strong className="font-bold">195,000 references</strong>.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleLearnMore}
                                className="px-6 md:px-8 py-3 md:py-4 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 text-sm md:text-base cursor-pointer"
                            >
                                Learn more about our digitalization process
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default DigitizationSection

