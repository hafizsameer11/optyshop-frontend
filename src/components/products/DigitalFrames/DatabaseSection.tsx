import React from 'react'
import { useNavigate } from 'react-router-dom'

const DatabaseSection: React.FC = () => {
    const navigate = useNavigate()

    const handleConsultDatabase = () => {
        navigate('/3d-viewer')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6 order-2 lg:order-1">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-700 mb-2">
                                3D Glasses Database
                            </h2>
                            <div className="w-24 h-0.5 bg-amber-700"></div>
                        </div>

                        <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
                            <p>
                                Fittingbox's database of digital photos and frames is the largest in the world: more than <strong className="text-amber-700 font-bold">195,000 digital frames</strong> and over <strong className="text-amber-700 font-bold">1,200 brands</strong> available.
                            </p>
                            <p>
                                Fittingbox offers its database to meet all your digital needs and purposes: from virtual try-ons to 3D Viewers.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleConsultDatabase}
                                className="px-8 py-3 rounded-full border-2 border-amber-700 text-amber-700 bg-white font-semibold hover:bg-amber-50 transition-colors duration-300 cursor-pointer"
                            >
                                Consult the Fittingbox database
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                        <div className="w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/database-text_fr-en.webp"
                                alt="3D Glasses Database - Laptop Interface"
                                className="w-full h-auto object-contain shadow-2xl rounded-2xl"
                                onError={(e) => {
                                    // Fallback if image doesn't load
                                    const target = e.target as HTMLImageElement
                                    target.src = '/assets/images/image.png'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default DatabaseSection

