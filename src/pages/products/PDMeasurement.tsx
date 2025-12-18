import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/PDMeasurement/HeroSection'
import FeaturesSection from '../../components/products/PDMeasurement/FeaturesSection'
import AccuracySection from '../../components/products/PDMeasurement/AccuracySection'
import EasyToUseSection from '../../components/products/PDMeasurement/EasyToUseSection'
import IntegrationSection from '../../components/products/PDMeasurement/IntegrationSection'
import FeaturesMainSection from '../../components/products/PDMeasurement/FeaturesMainSection'

const PDMeasurement: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 md:py-6 px-4 md:px-6 border-b-4 border-teal-500">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
                        <div className="flex items-center gap-2 text-teal-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home')}</span>
                        </div>
                        <span className="text-teal-500">/</span>
                        <span className="text-teal-500">{t('products.opticiansInstruments')}</span>
                        <span className="text-teal-500">/</span>
                        <span className="text-teal-500">{t('pages.pdMeasurement.onlinePdMeasurementTool')}</span>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <FeaturesSection />

            {/* Accuracy Section */}
            <AccuracySection />

            {/* Easy to Use Section */}
            <EasyToUseSection />

            {/* Integration Section */}
            <IntegrationSection />

            {/* Main Features Section */}
            <FeaturesMainSection />

            <Footer />
        </div>
    )
}

export default PDMeasurement

