import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Banner from '../components/home/Banner'
import Campaigns from '../components/home/Campaigns'
import TrustedBrands from '../components/home/TrustedBrands'
import StatsHighlight from '../components/home/StatsHighlight'
import ShopCategories from '../components/home/ShopCategories'
import LatestArrivals from '../components/home/LatestArrivals'
import FeaturedArrivals from '../components/home/FeaturedArrivals'
import LiveDemoSection from '../components/home/LiveDemoSection'
import Testimonials from '../components/home/Testimonials'
import PurchasingJourneySection from '../components/home/PurchasingJourneySection'
import UltraRealisticSection from '../components/home/UltraRealisticSection'
import Viewer3DSection from '../components/home/Viewer3DSection'
import CompatibilitySection from '../components/home/CompatibilitySection'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'

const Home: React.FC = () => {
    const location = useLocation()

    useEffect(() => {
        if (location.hash === '#live-demo') {
            // Small delay to ensure the page has rendered
            setTimeout(() => {
                const element = document.getElementById('live-demo')
                if (element) {
                    const offset = 100 // Account for fixed navbar
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
        <div className="bg-slate-950 text-white">
            <Banner />
            <Campaigns />
            <TrustedBrands />
            <StatsHighlight />
            <ShopCategories />
            <LatestArrivals />
            <LiveDemoSection />
            <ErrorBoundary>
                <Testimonials />
            </ErrorBoundary>
            <PurchasingJourneySection />
            <UltraRealisticSection />
            <Viewer3DSection />
            <CompatibilitySection />
            <Footer />
        </div>
    )
}

export default Home


