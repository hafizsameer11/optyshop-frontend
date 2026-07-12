import React from 'react'
import Navbar from '../components/Navbar'
import Banner from '../components/home/Banner'
import SmallSlidingBanners from '../components/home/SmallSlidingBanners'
import FlashOffersProductHighlight from '../components/home/FlashOffersProductHighlight'
import ShopCategories from '../components/home/ShopCategories'
import LatestArrivals from '../components/home/LatestArrivals'
import HomeShoppingInfoSection from '../components/home/HomeShoppingInfoSection'
import ContactFormSection from '../components/contact/ContactFormSection'
import Footer from '../components/Footer'

const Home: React.FC = () => {
    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-white text-slate-900">
            <Navbar />

            <Banner pageType="home" showNavbar={false} autoSlideInterval={5000} />

            <div className="w-full max-w-[100vw] overflow-x-hidden bg-white">
                <SmallSlidingBanners />
                <FlashOffersProductHighlight />
                <ShopCategories />
                <LatestArrivals />
                <HomeShoppingInfoSection />
                <ContactFormSection variant="compact" />
            </div>
            
            <Footer />
        </div>
    )
}

export default Home


