import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/whoWeAre/OurTechnology/HeroSection'
import RDSection from '../../components/whoWeAre/OurTechnology/RDSection'
import IndustryRecognitionSection from '../../components/whoWeAre/OurTechnology/IndustryRecognitionSection'
import AIMLSection from '../../components/whoWeAre/OurTechnology/AIMLSection'
import ComputerVisionSection from '../../components/whoWeAre/OurTechnology/ComputerVisionSection'
import OpenInnovationSection from '../../components/whoWeAre/OurTechnology/OpenInnovationSection'
import InterviewsSection from '../../components/whoWeAre/OurTechnology/InterviewsSection'

const OurTechnology: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className=" py-4 px-4 sm:px-6 border-t border-orange-500">
                <div className="w-[90%] mx-auto max-w-6xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-900">
                        <Link to="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>{t('common.home').toUpperCase()}</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <Link to="/our-history" className="hover:text-gray-700 transition-colors">
                            {t('common.whoWeAre').toUpperCase()}
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">{t('whoWeAre.ourTechnology').toUpperCase()}</span>
                    </nav>
                </div>
            </div>

            {/* R&D Section */}
            <RDSection />

            {/* Industry Recognition Section */}
            <IndustryRecognitionSection />

            {/* AI & ML Section */}
            <AIMLSection />

            {/* Computer Vision Section */}
            <ComputerVisionSection />

            {/* Open Innovation Section */}
            <OpenInnovationSection />

            {/* Interviews Section */}
            <InterviewsSection />

            <Footer />
        </div>
    )
}

export default OurTechnology

