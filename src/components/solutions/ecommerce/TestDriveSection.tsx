import React from 'react'
import { useNavigate } from 'react-router-dom'

const TestDriveSection: React.FC = () => {
    const navigate = useNavigate()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-500 mb-4">
                        Virtual Fittingbox Test Drive
                    </h2>
                    <p className="text-lg md:text-xl text-blue-950">
                        Multiply by 3 the chance of purchasing a frame from an online store.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left Side - Laptop Image */}
                    <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
                        <img
                            src="/assets/images/Laptop-ecommerce.webp"
                            alt="Virtual Fittingbox Test Drive - Laptop showing e-commerce website with virtual try-on"
                            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl h-auto max-h-[500px] md:max-h-[600px] lg:max-h-[650px] object-contain rounded-lg"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                    </div>

                    {/* Right Side - Text Content */}
                    <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
                        <div>
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-950 mb-4 leading-tight">
                                The ultimate{' '}
                                <span className="underline decoration-2 underline-offset-4 font-bold">
                                    Try before you buy
                                </span>{' '}
                                experience.
                            </h3>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                            <p>
                                We offer a complete end-to-end experience, from frame selection to adding to cart.
                            </p>
                            <p>
                                Users can virtually try on glasses and sunglasses from the comfort of their home or anywhere, anytime, on any device.
                            </p>
                        </div>

                        {/* Call to Action Button */}
                        <div className="pt-4">
                            <button 
                                onClick={handleLearnMore}
                                className="px-8 md:px-12 py-3 md:py-4 border border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-base md:text-lg bg-white cursor-pointer"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TestDriveSection

