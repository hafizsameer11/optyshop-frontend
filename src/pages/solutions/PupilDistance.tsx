import React from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/solutions/pupildistance/HeroSection'
import BenefitsSection from '../../components/solutions/pupildistance/BenefitsSection'
import WhyPDSection from '../../components/solutions/pupildistance/WhyPDSection'
import AccurateMeasurementsSection from '../../components/solutions/pupildistance/AccurateMeasurementsSection'
import CartConversionSection from '../../components/solutions/pupildistance/CartConversionSection'
import ReliableToolSection from '../../components/solutions/pupildistance/ReliableToolSection'
import GetQuoteSection from '../../components/solutions/pupildistance/GetQuoteSection'

const PupilDistance: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <HeroSection />

            <BenefitsSection />

            <WhyPDSection />

            <AccurateMeasurementsSection />

            <CartConversionSection />

            <ReliableToolSection />

            <GetQuoteSection />

            <Footer />
        </div>
    )
}

export default PupilDistance

