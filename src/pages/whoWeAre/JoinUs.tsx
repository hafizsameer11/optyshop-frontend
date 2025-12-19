import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/whoWeAre/JoinUs/HeroSection'
import StorySection from '../../components/whoWeAre/JoinUs/StorySection'
import KeyNumbersSection from '../../components/whoWeAre/JoinUs/KeyNumbersSection'
import TeamPhotoSection from '../../components/whoWeAre/JoinUs/TeamPhotoSection'
import CultureSection from '../../components/whoWeAre/JoinUs/CultureSection'
import BenefitsSection from '../../components/whoWeAre/JoinUs/BenefitsSection'
import JoinAdventureSection from '../../components/whoWeAre/JoinUs/JoinAdventureSection'
import WorkEnvironmentSection from '../../components/whoWeAre/JoinUs/WorkEnvironmentSection'
import RemoteWorkingSection from '../../components/whoWeAre/JoinUs/RemoteWorkingSection'
import CustomerSupportSection from '../../components/whoWeAre/JoinUs/CustomerSupportSection'

const JoinUs: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <HeroSection />

            {/* Breadcrumbs Section */}
            <div className="bg-white py-4 px-4 sm:px-6">
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
                        <span className="text-gray-900">{t('whoWeAre.joinUs').toUpperCase()}</span>
                    </nav>
                </div>
            </div>

            {/* Story Section */}
            <StorySection />

            {/* Key Numbers Section */}
            <KeyNumbersSection />

            {/* Team Photo Section */}
            <TeamPhotoSection />

            {/* Culture Section */}
            <CultureSection />

            {/* Benefits Section */}
            <BenefitsSection />

            {/* Join Adventure Section */}
            <JoinAdventureSection />

            {/* Work Environment Section */}
            <WorkEnvironmentSection />

            {/* Remote Working Section */}
            <RemoteWorkingSection />

            {/* Customer Support Section */}
            <CustomerSupportSection />

            <Footer />
        </div>
    )
}

export default JoinUs

