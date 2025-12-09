import React from 'react'
import { useNavigate } from 'react-router-dom'

const VirtualTryOnExperienceSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left - Laptop Image */}
                    <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
                            <img
                                src="/assets/images/Laptop-ecommerce.webp"
                                alt="Laptop showing e-commerce page with virtual try-on"
                                className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="order-1 lg:order-2">
                        <div className="text-orange-500 font-semibold text-sm md:text-base mb-3 md:mb-4">
                            Fittingbox's Virtual Try-On
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-blue-950 mb-4 md:mb-6 leading-tight">
                            The ultimate{' '}
                            <span className="relative inline-block">
                                Experience
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>{' '}
                            to{' '}
                            <span className="relative inline-block">
                                Search Online and Purchase Offline
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>
                        </h2>

                        <div className="space-y-4 md:space-y-5 text-blue-950 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                            <p>
                                Offer an immersive online experience from frame selection to search for a store.
                            </p>
                            <p>
                                After browsing a same page, visitors who tried on frames with the virtual try-on feature were 2,5 times more likely to use a store locator tool and book an appointment to go to a store in person.
                            </p>
                        </div>

                        <button 
                            onClick={handleLearnMore}
                            className="bg-transparent border-2 border-blue-950 text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300 cursor-pointer"
                        >
                            Learn more
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default VirtualTryOnExperienceSection

