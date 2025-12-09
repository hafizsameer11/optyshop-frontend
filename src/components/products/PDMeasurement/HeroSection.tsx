import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const HeroSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

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

    const handleGetPrices = () => {
        navigate('/pricing-request')
    }

    return (
        <section
            className="relative min-h-[400px] sm:min-h-[450px] md:min-h-[500px] flex items-center pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url(/assets/images/pd-measurement-tool-metrix.webp)',
            }}
        >
            <div className="w-full">
                <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left - Content */}
                    <div className="relative text-white px-4 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16 flex flex-col justify-center">
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 "></div>
                        <div className="relative z-10 w-full sm:w-[95%] mx-auto max-w-4xl space-y-4 sm:space-y-6 md:space-y-8">
                            <div>
                                <h1 className="text-base lg:pt-15 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 leading-tight">
                                    Online Pupillary Distance Measurement
                                </h1>
                                <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold mb-2 sm:mb-3">
                                    Fittingbox PD measuring tool
                                </h2>
                                <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-white"></div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                                <p>
                                    Fittingbox provides an{' '}
                                    <strong className="text-white font-semibold">online PD measurement tool</strong> that helps you ensure that the frames of those who shop online,{' '}
                                    <strong className="text-white font-semibold">fit their face perfectly</strong>.
                                </p>
                                <p>
                                    Supported by a{' '}
                                    <strong className="text-white font-semibold">step-by-step protocol</strong>, this online solution is{' '}
                                    <strong className="text-white font-semibold">easy to use</strong> and provides{' '}
                                    <strong className="text-white font-semibold">accurate pupillary distance</strong>, directly on your e-commerce website.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                                <button
                                    onClick={handleRequestDemo}
                                    className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-slate-800 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                                >
                                    Request a demo
                                </button>
                                <button
                                    onClick={handleGetPrices}
                                    className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-800 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                                >
                                    Get prices
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right - Empty space to show background image */}
                    <div className="relative min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-full">
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection

