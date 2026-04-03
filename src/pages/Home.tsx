import React from 'react'
import Navbar from '../components/Navbar'
import Banner, { HOME_HERO_BANNER_HEIGHT } from '../components/home/Banner'
import SmallSlidingBanners from '../components/home/SmallSlidingBanners'
import FlashOffersProductHighlight from '../components/home/FlashOffersProductHighlight'
import ShopCategories from '../components/home/ShopCategories'
import LatestArrivals from '../components/home/LatestArrivals'
import CompatibilitySection from '../components/home/CompatibilitySection'
import HomeShoppingInfoSection from '../components/home/HomeShoppingInfoSection'
import ContactFormSection from '../components/contact/ContactFormSection'
import Footer from '../components/Footer'

const Home: React.FC = () => {
    return (
        <div className="bg-slate-950 text-white w-full min-h-screen">
            {/* Navbar - Always shown (navbar itself is fixed positioned) */}
            <Navbar />
            
            {/* Banner Section - Only shows if there are banners */}
            <Banner 
                pageType="home"
                showNavbar={false}
                autoSlideInterval={5000}
                height={HOME_HERO_BANNER_HEIGHT}
            />
            
            <div className="w-full">
                <SmallSlidingBanners />
                <FlashOffersProductHighlight />
                <ShopCategories />
                <LatestArrivals />
                <CompatibilitySection />
                <HomeShoppingInfoSection />
                <ContactFormSection variant="compact" />
            </div>
            
            <Footer />
        </div>
    )
}

export default Home


