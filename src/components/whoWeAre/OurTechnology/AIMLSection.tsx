import React from 'react'
import { useNavigate } from 'react-router-dom'

const AIMLSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-2">
                                Artificial Intelligence{' '}
                                <span className="text-2xl md:text-3xl lg:text-4xl">
                                    and Machine <span className="underline">Learning</span>
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                            <p>
                                Fittingbox's technology uses Artificial Intelligence in its multiple facets, namely Machine Learning and Deep Learning.
                            </p>
                            <p>
                                A dedicated ML team develops the most advanced algorithms, which can generate any virtual pair of glasses on a real face in just a few milliseconds and remove real glasses from an image, also in just a few milliseconds.
                            </p>
                        </div>

                        {/* Learn More Button */}
                        <div className="pt-4">
                            <button 
                                onClick={handleLearnMore}
                                className="px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition-colors duration-300 text-sm md:text-base cursor-pointer"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-first lg:order-last">
                        <div className="relative w-full max-w-lg lg:max-w-xl">
                            <img
                                src="/assets/images/image9.png"
                                alt="Woman with virtual glasses try-on"
                                className="w-full h-auto rounded-lg  object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AIMLSection

