import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/solutions/ecommerce/HeroSection'
import ConversionRateSection from '../../components/solutions/ecommerce/ConversionRateSection'
import TestDriveSection from '../../components/solutions/ecommerce/TestDriveSection'
import VirtualTryOn3DViewerSection from '../../components/solutions/ecommerce/VirtualTryOn3DViewerSection'
import SizeGuaranteeSection from '../../components/solutions/ecommerce/SizeGuaranteeSection'
import VideoSection from '../../components/solutions/ecommerce/VideoSection'
import FAQSection from '../../components/solutions/ecommerce/FAQSection'
import WebinarSection from '../../components/solutions/ecommerce/WebinarSection'
import ContactDemoSection from '../../components/solutions/ecommerce/ContactDemoSection'
import AdvancedVirtualTryOnSection from '../../components/solutions/ecommerce/AdvancedVirtualTryOnSection'
import PricingPlansSection from '../../components/solutions/ecommerce/PricingPlansSection'

const Ecommerce: React.FC = () => {
    const { t } = useTranslation()
    
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 md:py-6 px-4 md:px-6 border-b-4 border-orange-500">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                        <div className="flex items-center gap-2 text-orange-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home')}</span>
                        </div>
                        <span className="text-orange-500">/</span>
                        <span className="text-orange-500">{t('products.virtualTest')}</span>
                        <span className="text-orange-500">/</span>
                        <span className="text-orange-500">{t('common.solutions')}</span>
                        <span className="text-orange-500">/</span>
                        <span className="text-orange-600 font-bold">{t('solutions.ecommerce')}</span>
                    </div>
                </div>
            </div>

            {/* Conversion Rate Section */}
            <ConversionRateSection />

            {/* Test Drive Section */}
            <TestDriveSection />

            {/* Virtual Try-On and 3D Viewer Section */}
            <VirtualTryOn3DViewerSection />

            {/* Size Guarantee Section */}
            <SizeGuaranteeSection />

            {/* Video Section */}
            <VideoSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* Webinar Section */}
            <WebinarSection />



            {/* Contact Demo Section */}
            <div id="contact-demo-section">
                <ContactDemoSection />
            </div>

            {/* Advanced Virtual Try-On Section */}
            <AdvancedVirtualTryOnSection />

            {/* Pricing Plans Section */}
            <PricingPlansSection />

            <Footer />
        </div>
    )
}

export default Ecommerce

