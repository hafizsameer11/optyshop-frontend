import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const PricingSection: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const handleDiscoverFeatures = () => {
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

    const plans = [
        {
            name: 'Start-up',
            bgColor: 'bg-white',
            features: 'Main features',
            badge: null,
        },
        {
            name: 'Essential',
            bgColor: 'bg-cyan-50',
            features: 'Main features',
            additional: '+ 3 modules',
            badge: 'BEST VALUE',
        },
        {
            name: 'All Stars',
            bgColor: 'bg-amber-50',
            features: 'Main features',
            additional: '+ 5 modules',
            badge: 'BEST SERVICE',
        },
    ]

    return (
        <section className="bg-gray-100 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-6xl">
                {/* Heading */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-gray-800">
                    Choose the formula that <span className="text-blue-950">meets your needs</span> and your budget
                </h2>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${plan.bgColor} rounded-lg shadow-md p-6 md:p-8 flex flex-col relative`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute top-4 right-4">
                                    <span className="bg-blue-950 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan Name */}
                            <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4">
                                {plan.name}
                            </h3>

                            {/* Features */}
                            <div className="space-y-2 text-gray-700 mb-6">
                                <p className="text-sm md:text-base">{plan.features}</p>
                                {plan.additional && (
                                    <p className="text-sm md:text-base font-medium">{plan.additional}</p>
                                )}
                            </div>

                            {/* Spacer to push content up if no badge */}
                            {!plan.badge && <div className="mt-auto"></div>}
                        </div>
                    ))}
                </div>

                {/* Discover Button */}
                <div className="text-center">
                    <button 
                        onClick={handleDiscoverFeatures}
                        className="px-8 md:px-12 py-3 md:py-4 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300 shadow-md text-base md:text-lg cursor-pointer"
                    >
                        Discover all the main features and additional modules
                    </button>
                </div>
            </div>
        </section>
    )
}

export default PricingSection

