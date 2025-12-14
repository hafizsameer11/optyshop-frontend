import React, { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/solutions/pupildistance/HeroSection'
import BenefitsSection from '../../components/solutions/pupildistance/BenefitsSection'
import WhyPDSection from '../../components/solutions/pupildistance/WhyPDSection'
import AccurateMeasurementsSection from '../../components/solutions/pupildistance/AccurateMeasurementsSection'
import CartConversionSection from '../../components/solutions/pupildistance/CartConversionSection'
import ReliableToolSection from '../../components/solutions/pupildistance/ReliableToolSection'
import GetQuoteSection from '../../components/solutions/pupildistance/GetQuoteSection'
import PDCalculator from '../../components/simulations/PDCalculator'
import PupillaryHeightCalculator from '../../components/simulations/PupillaryHeightCalculator'

const PupilDistance: React.FC = () => {
    const [showPDCalculator, setShowPDCalculator] = useState(false)
    const [showPupillaryHeightCalculator, setShowPupillaryHeightCalculator] = useState(false)

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            <BenefitsSection />

            <WhyPDSection />

            <AccurateMeasurementsSection />

            {/* Calculators Section */}
            <section className="bg-slate-50 py-16 md:py-24">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">
                        Measurement Calculators
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">PD Calculator</h3>
                            <p className="text-slate-600 mb-4">
                                Calculate your pupillary distance measurements for accurate lens positioning.
                            </p>
                            <button
                                onClick={() => setShowPDCalculator(true)}
                                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                                Open PD Calculator
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Pupillary Height Calculator</h3>
                            <p className="text-slate-600 mb-4">
                                Calculate pupillary height to ensure proper vertical lens positioning.
                            </p>
                            <button
                                onClick={() => setShowPupillaryHeightCalculator(true)}
                                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                                Open Height Calculator
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <CartConversionSection />

            <ReliableToolSection />

            <GetQuoteSection />

            <Footer />

            {/* PD Calculator Modal */}
            {showPDCalculator && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <PDCalculator onClose={() => setShowPDCalculator(false)} />
                    </div>
                </div>
            )}

            {/* Pupillary Height Calculator Modal */}
            {showPupillaryHeightCalculator && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <PupillaryHeightCalculator onClose={() => setShowPupillaryHeightCalculator(false)} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default PupilDistance

