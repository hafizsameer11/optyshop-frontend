import React from 'react'
import { useNavigate } from 'react-router-dom'

const ComputerVisionSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                        <div className="relative w-full max-w-lg lg:max-w-xl">
                            <img
                                src="/assets/images/graziella-mesh22.webp"
                                alt="Computer vision and face detection technology"
                                className="w-full h-auto rounded-lg object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-2">
                                <span className="font-bold text-blue-950">Computer Vision</span>{' '}
                                <span className="font-normal text-blue-500">and Face </span>
                                <span className="font-bold text-blue-950 underline">Detection</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-blue-950 leading-relaxed">
                            <p>
                                Fittingbox's Computer Vision team masters advanced technologies such as texture compression and face measurement.
                            </p>
                            <p>
                                Our 10+ specialists have filed numerous patents in these specific fields, which aim to reconstruct a 3D scene from its 2D images, captured by a camera.
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
                </div>
            </div>
        </section>
    )
}

export default ComputerVisionSection

