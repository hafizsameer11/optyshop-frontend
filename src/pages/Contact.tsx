import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeroSection from '../components/contact/HeroSection'
import ContactFormSection from '../components/contact/ContactFormSection'

const Contact: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <HeroSection />
            <ContactFormSection />
            <Footer />
        </div>
    )
}

export default Contact

