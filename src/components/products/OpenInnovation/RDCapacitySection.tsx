import React from 'react'
import { useNavigate } from 'react-router-dom'

const RDCapacitySection: React.FC = () => {
    const navigate = useNavigate()

    const handleContactUs = () => {
        navigate('/contact')
    }

    const handleLearnMore = () => {
        navigate('/our-technology')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                <span className="text-purple-900 underline decoration-purple-900 decoration-2 underline-offset-4">
                                    R&D
                                </span>{' '}
                                <span className="text-gray-600">Capacity</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-slate-700 leading-relaxed">
                            <p>
                                Machine Learning, Computer Vision, Artificial Intelligence: our team of researchers uses skills and knowledge to take these technologies to the next level. They develop innovative products with one question in mind:{' '}
                                <strong className="text-slate-900">how can we improve the lives of those who wear glasses through technology?</strong>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleContactUs}
                                className="px-8 py-3 border-2 border-purple-900 bg-white text-purple-900 font-semibold rounded-full hover:bg-purple-50 transition-colors duration-300 cursor-pointer"
                            >
                                Contact us
                            </button>
                            <button
                                onClick={handleLearnMore}
                                className="px-8 py-3 bg-purple-900 text-white font-semibold rounded-full hover:bg-purple-800 transition-colors duration-300 cursor-pointer"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-first lg:order-last">
                        <div className="relative w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/closeup-1100x734-2.webp"
                                alt="R&D Capacity - Innovative eyeglasses"
                                className="w-full h-auto object-contain rounded-2xl shadow-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/frame1.png'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default RDCapacitySection

