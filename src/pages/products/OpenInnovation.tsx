import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/OpenInnovation/HeroSection'
import RDCapacitySection from '../../components/products/OpenInnovation/RDCapacitySection'
import AvantPremieresSection from '../../components/products/OpenInnovation/AvantPremieresSection'
import WhatsNextSection from '../../components/products/OpenInnovation/WhatsNextSection'
import ExpertiseSection from '../../components/products/OpenInnovation/ExpertiseSection'

const OpenInnovation: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Dark Purple Header */}
            <div className="bg-purple-900 h-2"></div>

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 md:py-6 px-4 md:px-6">
                <div className="w-[90%] mx-auto">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-6 md:mb-8">
                        <div className="flex items-center gap-2 text-purple-900">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home')}</span>
                        </div>
                        <span className="text-gray-400">/</span>
                        <span className="text-purple-900">{t('products.openInnovation')}</span>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-4">
                        <a href="#" className="text-purple-900 hover:text-purple-700 transition-colors font-medium text-sm md:text-base uppercase">
                            {t('pages.openInnovation.rdCapabilities')}
                        </a>
                        <a href="#" className="text-purple-900 hover:text-purple-700 transition-colors font-medium text-sm md:text-base uppercase">
                            {t('pages.openInnovation.avantPremieres')}
                        </a>
                        <a href="#" className="text-purple-900 hover:text-purple-700 transition-colors font-medium text-sm md:text-base uppercase">
                            {t('pages.openInnovation.whatsNext')}
                        </a>
                    </div>

                    {/* Separator Line */}
                    <div className="w-full h-px bg-gray-300"></div>
                </div>
            </div>

            {/* R&D Capacity Section */}
            <RDCapacitySection />

            {/* Avant-premières Section */}
            <AvantPremieresSection />

            {/* What's Next Section */}
            <WhatsNextSection />

            {/* Our other areas of expertise Section */}
            <ExpertiseSection />

            <Footer />
        </div>
    )
}

export default OpenInnovation

