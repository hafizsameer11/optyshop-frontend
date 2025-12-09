import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

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

    return (
        <section
            className="relative min-h-[400px] sm:min-h-[450px] md:min-h-[500px] flex items-center pt-20 md:pt-0 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: 'url(/assets/images/_DSC2195_L_confirmed.webp)',
            }}
        >
            <div className="w-full">
                <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left - Content */}
                    <div className="relative text-white px-4 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16 flex flex-col justify-center">
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
                        <div className="relative z-10 w-full sm:w-[95%] mx-auto max-w-4xl space-y-6 sm:space-y-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:pt-15 lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight text-white">
                                    Virtual try-on in the optical shop
                                </h1>
                                <h2 className="text-lg sm:text-xl md:text-2xl font-normal mb-3 text-white">
                                    Standard Fittingbox for the point of sale
                                </h2>
                                <div className="w-20 sm:w-24 h-0.5 sm:h-1 bg-white mt-2"></div>
                            </div>

                            <div className="text-base sm:text-lg md:text-xl text-white leading-relaxed">
                                <p>
                                    Encourage patients to try on your collections and lens simulator.<br />
                                    This solution allows them to <strong className="text-white font-bold">compare multiple renderings</strong><br />
                                    <strong className="text-white font-bold">simultaneously</strong> and keep clients occupied while you assist other patients.
                                </p>
                            </div>

                            <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/pricing-request"
                                    className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg text-center"
                                >
                                    Request prices
                                </Link>
                                <button 
                                    onClick={handleRequestDemo}
                                    className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-300 shadow-lg cursor-pointer"
                                >
                                    Request a demo
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

