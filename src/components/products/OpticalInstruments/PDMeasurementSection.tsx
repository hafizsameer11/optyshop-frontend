import React from 'react'
import { useNavigate } from 'react-router-dom'

const PDMeasurementSection: React.FC = () => {
    const navigate = useNavigate()

    const handleDiscoverPDMeasurement = () => {
        navigate('/pd-measurement')
    }

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="w-[90%] mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left - Text Content */}
                    <div className="space-y-6 order-2 lg:order-1">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                                <span className="text-cyan-500 underline">Pupillary</span>{' '}
                                <span className="text-cyan-500">Distance Measurement</span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
                            <p>
                                Fittingbox provides an accurate, online PD measurement tool with a step-by-step protocol. This product is easy to use and provides precise pupillary distance measurements.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleDiscoverPDMeasurement}
                                className="px-8 py-3 border-2 border-cyan-500 rounded-full text-cyan-500 bg-white font-semibold hover:bg-cyan-50 transition-colors duration-300 cursor-pointer"
                            >
                                Discover our PD Measurement tool
                            </button>
                        </div>
                    </div>

                    {/* Right - Image */}
                    <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                        <div className="w-full max-w-xl lg:max-w-2xl">
                            <img
                                src="/assets/images/Woman-Card-Measurement.webp"
                                alt="Pupillary Distance Measurement - Woman with card"
                                className="w-full h-auto rounded-2xl shadow-2xl object-contain"
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

export default PDMeasurementSection

