import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const EffectiveToolSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleForAdvertising = () => {
        if (location.pathname === '/') {
            setTimeout(() => {
                const element = document.getElementById('live-demo')
                if (element) {
                    const offset = 100
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 50)
        } else {
            navigate('/#live-demo')
        }
    }

    const handleForWebsite = () => {
        navigate('/virtual-test')
    }

    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left - Smartphone Image */}
                    <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                        <div className="w-full max-w-[280px] md:max-w-[350px] lg:max-w-[420px]">
                            <img
                                src="/assets/images/Advertising.webp"
                                alt="Smartphone showing store location and route feature"
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right - Text Content */}
                    <div className="order-1 lg:order-2">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-950 mb-4 md:mb-6 leading-tight">
                            An <strong className="font-bold">Effective Tool</strong> to Drive{' '}
                            <span className="relative inline-block">
                                Traffic Instore
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-950"></span>
                            </span>
                        </h2>

                        <div className="space-y-4 md:space-y-5 text-blue-950 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                            <p>
                                Finding your store becomes the last action of a shopping journey started online.
                            </p>
                            <p>
                                Consumers can get the route to your shop or even book an appointment after trying on your frame selection. On your website and in a dedicated advertising campaign, virtual try-on engages users with your brand.
                            </p>
                        </div>

                        {/* Two CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={handleForAdvertising}
                                className="bg-transparent border-2 border-blue-950 text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300 flex-1 cursor-pointer"
                            >
                                For Advertising
                            </button>
                            <button 
                                onClick={handleForWebsite}
                                className="bg-transparent border-2 border-blue-950 text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-blue-950 hover:text-white transition-colors duration-300 flex-1 cursor-pointer"
                            >
                                For website
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default EffectiveToolSection

