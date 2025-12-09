import React from 'react'
import { useNavigate } from 'react-router-dom'

const AvantPremieresSection: React.FC = () => {
    const navigate = useNavigate()

    const handleContactUs = () => {
        navigate('/contact')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-first lg:order-first">
                        <div className="relative w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/566475__Graziella01_DSC1237_STUDIOLAB.webp"
                                alt="Avant-premières - Woman with sunglasses"
                                className="w-full h-auto object-contain rounded-2xl shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/frame1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-purple-900 mb-4">
                                <span className="underline decoration-purple-900 decoration-2 underline-offset-4">
                                    Avant-premières
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-slate-700 leading-relaxed">
                            <p>
                                We want to empower the eyewear industry with innovative and useful products.
                            </p>
                            <p>
                                That's why we created the Avant-première concept, which aims to combine technological expertise and optical knowledge to create cutting-edge products and features.
                            </p>
                            <p>
                                By working closely with you as partners, we can perfectly meet your needs and advance the eyewear industry.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleContactUs}
                                className="px-8 py-3 border-2 border-purple-900 bg-white text-purple-900 font-semibold rounded-full hover:bg-purple-50 transition-colors duration-300 cursor-pointer"
                            >
                                Contact us
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AvantPremieresSection

