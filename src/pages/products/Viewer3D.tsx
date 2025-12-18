import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/Viewer3D/HeroSection'
import StatsSection from '../../components/products/Viewer3D/StatsSection'
import FeaturesSection from '../../components/products/Viewer3D/FeaturesSection'
import SwitchSection from '../../components/products/Viewer3D/SwitchSection'
import ImmersiveSection from '../../components/products/Viewer3D/ImmersiveSection'
import InteractiveSection from '../../components/products/Viewer3D/InteractiveSection'
import Viewer3DModal from '../../components/products/Viewer3D/Viewer3DModal'

const Viewer3D: React.FC = () => {
    const { t } = useTranslation()
    const [isViewerOpen, setIsViewerOpen] = useState(false)

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-6 md:py-8 px-4 md:px-6 border-b-4 border-amber-500">
                <div className="w-[90%] mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
                        <div className="flex items-center gap-2 text-amber-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home')}</span>
                        </div>
                        <span className="text-amber-500">/</span>
                        <span className="text-amber-500">{t('products.digitalizedFrames')}</span>
                        <span className="text-amber-500">/</span>
                        <span className="text-amber-500">{t('products.3dViewer')}</span>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <StatsSection onOpenViewer={() => setIsViewerOpen(true)} />

            {/* Features Section */}
            <FeaturesSection />



            {/* Interactive Section */}
            <InteractiveSection onOpenViewer={() => setIsViewerOpen(true)} />

            {/* 3D Viewer Modal */}
            <Viewer3DModal open={isViewerOpen} onClose={() => setIsViewerOpen(false)} />

            {/* Switch Section */}
            <SwitchSection />

            {/* Immersive Section */}
            <ImmersiveSection />

            <Footer />
        </div>
    )
}

export default Viewer3D

