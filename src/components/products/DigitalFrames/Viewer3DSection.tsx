import React from 'react'
import { useNavigate } from 'react-router-dom'

const Viewer3DSection: React.FC = () => {
    const navigate = useNavigate()

    const handleDiscoverViewer = () => {
        navigate('/3d-viewer')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Image */}
                    <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                        <div className="w-full max-w-xl lg:max-w-2xl  rounded-3xl p-6 md:p-8">
                            <img
                                src="/assets/images/3D-Viewer-ok-1.webp"
                                alt="3D Viewer - Interactive Glasses"
                                className="w-full h-auto rounded-2xl shadow-2xl object-contain"
                                onError={(e) => {
                                    // Fallback if image doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/frame1.png'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="space-y-6 order-1 lg:order-2">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-700 mb-2">
                                3D Viewer
                            </h2>
                            <div className="w-24 h-0.5 bg-amber-700"></div>
                        </div>

                        <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
                            <p>
                                Offer an <strong className="text-slate-900 font-bold">interactive and engaging experience</strong>, allowing users to manage, zoom and view mounts in detail.
                            </p>
                            <p>
                                Users can easily switch between <strong className="text-slate-900 font-bold">360° glasses manipulation</strong> and <strong className="text-slate-900 font-bold">virtual try-on</strong> in just one click.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleDiscoverViewer}
                                className="px-8 py-3 border-2 border-amber-700 rounded-full text-amber-700 bg-white font-semibold hover:bg-amber-50 transition-colors duration-300 cursor-pointer"
                            >
                                Discover the 3D Viewer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Viewer3DSection

