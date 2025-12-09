import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TestDriveSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLearnMore = () => {
        navigate('/virtual-test')
    }

    const handleRequestDemo = () => {
        if (location.pathname === '/') {
            // Already on home page, just scroll
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
            }, 50)
        } else {
            // Navigate to home page with hash - Home component's useEffect will handle scrolling
            navigate('/#live-demo')
        }
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-600 mb-4">
                        Virtual Fittingbox Test Drive
                    </h2>
                    <p className="text-lg md:text-xl text-blue-950">
                        The &quot;try before you buy&quot; experience that glasses wearers expect.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left Side - Image */}
                    <div className="relative order-2 lg:order-1">
                        <img
                            src="/assets/images/image6.png"
                            alt="Virtual Fittingbox Test Drive - Laptop and smartphone showing virtual try-on"
                            className="w-full h-auto max-h-[500px] md:max-h-[600px] lg:max-h-[400px] object-contain rounded-lg"
                        />
                    </div>

                    {/* Right Side - Text Content */}
                    <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
                                A fully responsive <span className="underline">solution</span>
                            </h3>
                        </div>

                        <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                            <p>
                                Let your customers try on your glasses anywhere, on any device, anytime.
                            </p>
                            <p>
                                They will be able to browse your frame catalog from the comfort of their sofa, during public transport or on their lunch break, whether they are using a phone, tablet or laptop.
                            </p>
                            <p className="font-semibold text-blue-950">
                                It&apos;s that simple!
                            </p>
                        </div>

                        {/* Call to Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                onClick={handleLearnMore}
                                className="px-8 py-3 bg-blue-950 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors duration-300 shadow-md cursor-pointer"
                            >
                                Learn more
                            </button>
                            <button 
                                onClick={handleRequestDemo}
                                className="px-8 py-3 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300 cursor-pointer"
                            >
                                Request a demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TestDriveSection

