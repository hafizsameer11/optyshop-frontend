import React from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/solutions/drivetostore/HeroSection'
import WhyVirtualTryOnSection from '../../components/solutions/drivetostore/WhyVirtualTryOnSection'
import VirtualTryOnExperienceSection from '../../components/solutions/drivetostore/VirtualTryOnExperienceSection'
import ChooseFrameSection from '../../components/solutions/drivetostore/ChooseFrameSection'
import EffectiveToolSection from '../../components/solutions/drivetostore/EffectiveToolSection'
import AdvancedVirtualTryOnSection from '../../components/solutions/drivetostore/AdvancedVirtualTryOnSection'
import PricingPlansSection from '../../components/solutions/drivetostore/PricingPlansSection'
import TestimonialsSection from '../../components/solutions/drivetostore/TestimonialsSection'
import DemoRequestSection from '../../components/solutions/drivetostore/DemoRequestSection'

const DriveToStore: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            <WhyVirtualTryOnSection />

            <VirtualTryOnExperienceSection />

            <ChooseFrameSection />

            <EffectiveToolSection />

            

            <DemoRequestSection />
            <TestimonialsSection />

            <AdvancedVirtualTryOnSection />

<PricingPlansSection />


            <Footer />
        </div>
    )
}

export default DriveToStore

