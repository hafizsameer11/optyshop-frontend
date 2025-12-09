import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const StatsBannerSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleTryTechnology = () => {
        if (location.pathname === '/') {
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
        } else {
            navigate('/#live-demo')
        }
    }

    const stats = [
        {
            title: 'Over 215M virtual',
            subtitle: 'practice sessions',
            description: 'powered in 2024'
        },
        {
            title: 'More than 4,000',
            subtitle: 'customers',
            description: 'in the world'
        },
        {
            title: 'More than',
            subtitle: '265,000 frames',
            description: 'try it at least once in 2024'
        },
        {
            title: '59 patents',
            subtitle: 'in the United States',
            description: 'and Europe'
        }
    ]

    return (
        <section className="bg-blue-950 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Main Heading */}
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                            The world's first leader in<br />
                            Virtual Try-On & Digital Frames
                        </h2>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`text-center text-white ${index < stats.length - 1
                                    ? 'border-r-0 lg:border-r border-white/30 pr-0 lg:pr-4'
                                    : ''
                                    }`}
                            >
                                <div className="space-y-1 md:space-y-2">
                                    <p className="text-base md:text-lg lg:text-xl font-semibold leading-tight">
                                        {stat.title}
                                    </p>
                                    <p className="text-sm md:text-base font-medium leading-tight">
                                        {stat.subtitle}
                                    </p>
                                    <p className="text-xs md:text-sm text-white/80 leading-tight">
                                        {stat.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Button */}
                    <div className="text-center pt-4">
                        <button
                            onClick={handleTryTechnology}
                            className="inline-block px-8 md:px-10 py-3 md:py-4 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-950 transition-colors duration-300 text-sm md:text-base cursor-pointer"
                        >
                            Try our technology
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StatsBannerSection

