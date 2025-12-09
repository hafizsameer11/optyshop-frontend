import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const FoundersSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleFindOutMore = () => {
        // Scroll to timeline section if on the same page, otherwise navigate
        if (location.pathname === '/our-history') {
            const timelineSection = document.getElementById('timeline-section')
            if (timelineSection) {
                const offset = 100
                const elementPosition = timelineSection.getBoundingClientRect().top
                const offsetPosition = elementPosition + window.pageYOffset - offset
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                })
            }
        } else {
            navigate('/our-history#timeline-section')
        }
    }
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                    {/* Left - Image */}
                    <div className="order-2 md:order-1">
                        <img
                            src="/assets/images/Benjamin_HAKOUN_Ariel_CHOUKROUN.webp"
                            alt="Benjamin Hakoun and Ariel Choukroun, co-founders of Fittingbox"
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                    </div>

                    {/* Right - Text Content */}
                    <div className="order-1 md:order-2 space-y-6 md:space-y-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-4 md:mb-6">
                                A unique vision{' '}
                                <span className="text-gray-500">since 2006</span>
                            </h2>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                <strong className="text-blue-900 font-semibold">Benjamin Hakoun</strong> and{' '}
                                <strong className="text-blue-900 font-semibold">Ariel Choukroun</strong>, co-founders of Fittingbox, pioneered the "virtual mirror," which allows you to try on glasses in real time via a desktop or mobile device.
                            </p>

                            <blockquote className="border-l-4 border-blue-500 pl-4 md:pl-6 italic text-base md:text-lg text-gray-700 leading-relaxed">
                                "Through augmented reality, we want to change the way people choose and purchase glasses, making things easier. Innovation has always been part of Fittingbox's DNA."
                            </blockquote>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleFindOutMore}
                                className="px-6 md:px-8 py-3 md:py-4 rounded-lg bg-blue-950 text-white font-semibold hover:bg-blue-900 transition-colors duration-300 text-sm md:text-base cursor-pointer"
                            >
                                Find out where it all began
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FoundersSection

