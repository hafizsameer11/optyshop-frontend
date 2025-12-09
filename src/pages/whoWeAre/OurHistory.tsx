import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/whoWeAre/OurHistory/HeroSection'
import IntroSection from '../../components/whoWeAre/OurHistory/IntroSection'
import FoundersSection from '../../components/whoWeAre/OurHistory/FoundersSection'
import VideoSection from '../../components/whoWeAre/OurHistory/VideoSection'
import StatsBannerSection from '../../components/whoWeAre/OurHistory/StatsBannerSection'
import TeamSection from '../../components/whoWeAre/OurHistory/TeamSection'
import CultureSection from '../../components/whoWeAre/OurHistory/CultureSection'
import JoinUsSection from '../../components/whoWeAre/OurHistory/JoinUsSection'
import TimelineSection from '../../components/whoWeAre/OurHistory/TimelineSection'
import TimelineContinuationSection from '../../components/whoWeAre/OurHistory/TimelineContinuationSection'
import ExpertiseAreasSection from '../../components/whoWeAre/OurHistory/ExpertiseAreasSection'
import WorldwideLocationsSection from '../../components/whoWeAre/OurHistory/WorldwideLocationsSection'

const OurHistory: React.FC = () => {
    const location = useLocation()

    useEffect(() => {
        if (location.hash === '#timeline-section') {
            setTimeout(() => {
                const element = document.getElementById('timeline-section')
                if (element) {
                    const offset = 100
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 100)
        }
    }, [location.hash])
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
                            <span>HOME</span>
                        </Link>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-gray-900">WHO WE ARE</span>
                    </nav>
                </div>
            </div>

            {/* Gradient Line */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-green-500 to-purple-500"></div>

            {/* Intro Section */}
            <IntroSection />

            {/* Founders Section */}
            <FoundersSection />

            {/* Video Section */}
            <VideoSection />

            {/* Stats Banner Section */}
            <StatsBannerSection />

            {/* Team Section */}
            <TeamSection />

            {/* Culture Section */}
            <CultureSection />

            {/* Join Us Section */}
            <JoinUsSection />

            {/* Timeline Section */}
            <TimelineSection />

            {/* Timeline Continuation Section */}
            <TimelineContinuationSection />

            {/* Expertise Areas Section */}
            <ExpertiseAreasSection />

            {/* Worldwide Locations Section */}
            <WorldwideLocationsSection />

            <Footer />
        </div>
    )
}

export default OurHistory

