import React, { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/OpticalInstruments/HeroSection'
import PDMeasurementSection from '../../components/products/OpticalInstruments/PDMeasurementSection'
import LensSimulatorSection from '../../components/products/OpticalInstruments/LensSimulatorSection'
import ExpertiseSection from '../../components/products/OpticalInstruments/ExpertiseSection'
import KidsLensRecommendation from '../../components/simulations/KidsLensRecommendation'
import LifestyleRecommendation from '../../components/simulations/LifestyleRecommendation'

const OpticalInstruments: React.FC = () => {
    const [showKidsRecommendation, setShowKidsRecommendation] = useState(false)
    const [showLifestyleRecommendation, setShowLifestyleRecommendation] = useState(false)

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-6 md:py-8 px-4 md:px-6 border-b-4 border-teal-500">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
                        <div className="flex items-center gap-2 text-teal-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </div>
                        <span className="text-teal-500">/</span>
                        <span className="text-teal-500">OPTICAL INSTRUMENTS</span>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                        <a href="#" className="text-teal-500 hover:text-teal-400 transition-colors font-medium text-sm md:text-base">
                            PD MEASURE
                        </a>
                        <a href="#" className="text-teal-500 hover:text-teal-400 transition-colors font-medium text-sm md:text-base">
                            LENS SIMULATOR
                        </a>
                    </div>
                </div>
            </div>

            {/* PD Measurement Section */}
            <PDMeasurementSection />

            {/* Lens Simulator Section */}
            <LensSimulatorSection />

            {/* Lens Recommendations Section */}
            <section className="bg-slate-50 py-16 md:py-24">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">
                        Lens Recommendations
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Kids Lens Recommendation</h3>
                            <p className="text-slate-600 mb-4">
                                Get personalized lens recommendations for children based on age and prescription needs.
                            </p>
                            <button
                                onClick={() => setShowKidsRecommendation(true)}
                                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                            >
                                Get Kids Recommendation
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Lifestyle Recommendation</h3>
                            <p className="text-slate-600 mb-4">
                                Find the perfect lenses for your lifestyle and daily activities.
                            </p>
                            <button
                                onClick={() => setShowLifestyleRecommendation(true)}
                                className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                            >
                                Get Lifestyle Recommendation
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our other areas of expertise Section */}
            <ExpertiseSection />

            <Footer />

            {/* Kids Lens Recommendation Modal */}
            {showKidsRecommendation && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <KidsLensRecommendation onClose={() => setShowKidsRecommendation(false)} />
                    </div>
                </div>
            )}

            {/* Lifestyle Recommendation Modal */}
            {showLifestyleRecommendation && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <LifestyleRecommendation onClose={() => setShowLifestyleRecommendation(false)} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default OpticalInstruments

