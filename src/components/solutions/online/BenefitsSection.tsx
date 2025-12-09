import React from 'react'
import { useNavigate } from 'react-router-dom'

const BenefitsSection: React.FC = () => {
    const navigate = useNavigate()

    const handleDiscoverVirtualTrial = () => {
        navigate('/virtual-test')
    }

    const stats = [
        {
            icon: '🖱️',
            gradient: 'from-orange-500 to-red-500',
            title: 'Engagement rate',
            value: '40%',
            description: 'Virtual try-on feature usage rate by total visitors',
        },
        {
            icon: '🛒',
            gradient: 'from-orange-500 to-yellow-500',
            title: 'Other product pages viewed',
            value: '4x',
            description: '*Based on an A/B test on Fielmann\'s online store with 5 million page views. See the case study.',
        },
        {
            icon: '⏱️',
            gradient: 'from-blue-400 to-green-500',
            title: 'More time spent per session',
            value: '2x',
            description: '*Based on an A/B test on Fielmann\'s online store with 5 million page views. See the case study.',
        },
    ]

    return (
        <section className="bg-blue-950 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-6xl">
                {/* Question Heading */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12 md:mb-16">
                    Why is virtual try-on a key feature for your eyewear website?
                </h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6`}>
                                <span>{stat.icon}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg md:text-xl font-semibold text-blue-950 mb-3 md:mb-4">
                                {stat.title}
                            </h3>

                            {/* Value */}
                            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-950 mb-3 md:mb-4">
                                {stat.value}
                            </div>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Call to Action Button */}
                <div className="text-center">
                    <button 
                        onClick={handleDiscoverVirtualTrial}
                        className="px-8 md:px-12 py-3 md:py-4 bg-white border-2 border-blue-950 text-blue-950 font-semibold rounded-full hover:bg-blue-50 transition-colors duration-300 text-base md:text-lg shadow-md cursor-pointer"
                    >
                        Discover the Advanced Virtual Trial for your website
                    </button>
                </div>
            </div>
        </section>
    )
}

export default BenefitsSection

