import React from 'react'
import { useNavigate } from 'react-router-dom'

const VirtualTryOn3DViewerSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    const handleDiscoverViewer = () => {
        navigate('/3d-viewer')
    }

    return (
        <section className="bg-white py-6 md:py-8 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-4 md:gap-6 items-center">
                    {/* Left Side - Text Content */}
                    <div className="order-2 lg:order-1 space-y-3 md:space-y-4">
                        {/* Main Headline */}
                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-950 leading-tight">
                                Virtual Try-On and 3D Viewer: A Great Help in Choosing the Right{' '}
                                <span className="underline decoration-2 underline-offset-2">Frame</span>
                            </h2>
                        </div>

                        {/* Statistics and Benefits */}
                        <div className="space-y-2 text-sm md:text-base text-gray-700 leading-snug">
                            <p>
                                <strong className="text-blue-950">81%</strong> of online eyeglass users found the virtual try-on combined with the 3D Viewer useful for choosing the right frame.
                            </p>
                            <p>
                                The impact is even more pronounced among those who are ready to buy online, with <strong className="text-blue-950">88%</strong> finding it useful, rising to <strong className="text-blue-950">92%</strong> in the United States.
                            </p>
                            <p>
                                These data reinforce the idea that the combination of 3D Viewer and Virtual Try-On is a powerful tool for eyewear retailers.
                            </p>
                        </div>

                        {/* Call to Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button 
                                onClick={handleLearnMore}
                                className="px-5 md:px-6 py-2 md:py-2.5 border border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-xs md:text-sm bg-white cursor-pointer"
                            >
                                Learn more
                            </button>
                            <button 
                                onClick={handleDiscoverViewer}
                                className="px-5 md:px-6 py-2 md:py-2.5 bg-blue-950 text-white font-semibold rounded-full hover:bg-blue-900 transition-colors duration-300 text-xs md:text-sm cursor-pointer"
                            >
                                Discover the 3D Viewer
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Smartphone Image */}
                    <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                        <div className="relative w-[240px] sm:w-[280px] md:w-[300px]">
                            <img
                                src="/assets/images/mobile1.png"
                                alt="Virtual Try-On and 3D Viewer on smartphone"
                                className="w-full h-auto object-contain rounded-2xl "
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/image3.png'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default VirtualTryOn3DViewerSection

