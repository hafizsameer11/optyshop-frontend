import React from 'react'
import { useNavigate } from 'react-router-dom'

const PhotoPackshotsSection: React.FC = () => {
    const navigate = useNavigate()

    const handleDiscoverServices = () => {
        navigate('/3d-viewer')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6 order-2 lg:order-1">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                                <span className="text-amber-600">Photo</span>{' '}
                                <span className="text-amber-700">Packshots</span>
                            </h2>
                            <div className="w-24 h-0.5 bg-amber-600"></div>
                        </div>

                        <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
                            <p>
                                Our photography services provide a full range of high-definition images, ready to use on your website or catalog. Get thousands of images quickly and easily.
                            </p>
                            <p>
                                Optimize your catalog with a fully scalable service, obtaining professional <strong className="text-amber-700 underline">product photos up to 360° views</strong>, paying attention to the details of your frames.
                            </p>
                            <p>
                                Plus, you'll benefit from <strong className="text-amber-700 underline">contextual photo production</strong>, allowing you to fit virtually any frame on any model's face, in any position.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleDiscoverServices}
                                className="px-8 py-3 border-2 border-amber-700 rounded-full text-amber-700 bg-white font-semibold hover:bg-amber-50 transition-colors duration-300 cursor-pointer"
                            >
                                Discover our photography services
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                        <div className="w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/IMG_36601m.webp"
                                alt="Photo Packshots - Professional Product Photography"
                                className="w-full h-auto rounded-2xl shadow-2xl object-contain"
                                onError={(e) => {
                                    // Fallback if image doesn't load
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

export default PhotoPackshotsSection

