import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HeroSection from '../../components/products/VirtualTest/HeroSection'
import WebsiteSection from '../../components/products/VirtualTest/WebsiteSection'
import ToolsSection from '../../components/products/VirtualTest/ToolsSection'
import UltraRealisticSection from '../../components/products/VirtualTest/UltraRealisticSection'
import InstoreSection from '../../components/products/VirtualTest/InstoreSection'
import DemoSection from '../../components/products/VirtualTest/DemoSection'
import FAQSection from '../../components/products/VirtualTest/FAQSection'
import ExpertiseSection from '../../components/products/VirtualTest/ExpertiseSection'

const VirtualTest: React.FC = () => {
    return (
        <div className="bg-slate-950 text-white min-h-screen">
            <Navbar />

            <HeroSection />

            {/* Website Section (For the website) */}

            {/* Breadcrumbs Section */}
            <div className="bg-white py-6 md:py-8 px-4 md:px-6 border-b-4 border-orange-500">
                <div className="w-full md:w-[90%] max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
                        <div className="flex items-center gap-2 text-orange-500">
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>HOME</span>
                        </div>
                        <span className="text-orange-500">/</span>
                        <span className="text-orange-500">VIRTUAL TEST</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-16">
                        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            FOR THE WEBSITE
                        </a>
                        <Link to="/shop" className="text-orange-500 hover:text-orange-400 transition-colors font-medium text-sm md:text-base">
                            FOR SHOP
                        </Link>
                    </div>
                </div>
            </div>

            {/* websites  */}

            <WebsiteSection />

            {/* Tools / Cards section */}
            <ToolsSection />

            {/* Ultra Realistic Section */}
            <UltraRealisticSection />

            {/* Instore Section */}
            <InstoreSection />

            {/* Demo / Book a live demo Section */}
            <DemoSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* Expertise / Other areas of expertise Section */}
            <ExpertiseSection />

            {/* Frames Section removed */}

            <Footer />
        </div>
    )
}

export default VirtualTest

