import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/DigitalFrames/HeroSection'
import DigitizationSection from '../../components/products/DigitalFrames/DigitizationSection'
import DatabaseSection from '../../components/products/DigitalFrames/DatabaseSection'
import Viewer3DSection from '../../components/products/DigitalFrames/Viewer3DSection'
import PhotoPackshotsSection from '../../components/products/DigitalFrames/PhotoPackshotsSection'
import DemoSection from '../../components/products/DigitalFrames/DemoSection'
import FAQSection from '../../components/products/DigitalFrames/FAQSection'
import ExpertiseSection from '../../components/products/DigitalFrames/ExpertiseSection'

const DigitalFrames: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-6 md:py-8 px-4 md:px-6 border-b-4 border-orange-500">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
                        <div className="flex items-center gap-2 text-orange-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home')}</span>
                        </div>
                        <span className="text-orange-500">/</span>
                        <span className="text-orange-500">{t('products.digitalizedFrames')}</span>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            {t('pages.digitalFrames.3dDigitization')}
                        </a>
                        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            {t('pages.digitalFrames.database')}
                        </a>
                        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            {t('pages.digitalFrames.3dViewer')}
                        </a>
                        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            {t('pages.digitalFrames.photoPackshots')}
                        </a>
                    </div>
                </div>
            </div>

            {/* 3D Digitization Section */}
            <DigitizationSection />

            {/* 3D Glasses Database Section */}
            <DatabaseSection />

            {/* 3D Viewer Section */}
            <Viewer3DSection />

            {/* Photo Packshots Section */}
            <PhotoPackshotsSection />

            {/* Demo Request Section */}
            <DemoSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* Our other areas of expertise Section */}
            <ExpertiseSection />

            <Footer />
        </div>
    )
}

export default DigitalFrames

