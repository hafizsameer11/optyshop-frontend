import React from 'react'
import { useNavigate } from 'react-router-dom'

const ReliableToolSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/pd-measurement')
    }

    return (
        <section className="bg-blue-950 py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Main Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-bold text-white text-center mb-6 md:mb-8">
                    PD Fittingbox Measurement: The Reliable and Precise PD Tool
                </h2>

                {/* Descriptive Text */}
                <p className="text-white/90 text-lg md:text-xl text-center mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed">
                    PD Measurement by Fittingbox is an easy-to-use, mobile solution for getting accurate results online. Easy-to-use interface, with step-by-step instructions and clear images, making the measurement process intuitive and straightforward.
                </p>

                {/* Two Smartphone Screens */}
                <div className="flex justify-center items-center gap-6 md:gap-8 lg:gap-12 mb-10 md:mb-12">
                    <div className="w-full max-w-xs md:max-w-sm">
                        <img
                            src="/assets/images/2-mock-ups-PD-Measurement-on-Mobile.webp"
                            alt="PD Measurement on Mobile - Two smartphone mockups"
                            className="w-full h-auto object-cover rounded-lg"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Patents Text */}
                <p className="text-white/90 text-base md:text-lg text-center mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed">
                    With five worldwide patents on the technology and method of determining ocular measurements, Fittingbox's PD Measurement is the ideal choice for obtaining precise and convenient optical measurements.
                </p>

                {/* Learn More Button */}
                <div className="text-center">
                    <button 
                        onClick={handleLearnMore}
                        className="bg-white border-2 border-blue-950 text-blue-950 px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white hover:border-white transition-colors duration-300 cursor-pointer"
                    >
                        Learn more about Fittingbox PD Measurement
                    </button>
                </div>
            </div>
        </section>
    )
}

export default ReliableToolSection

