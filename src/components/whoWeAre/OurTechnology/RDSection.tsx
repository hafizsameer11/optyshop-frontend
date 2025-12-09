import React from 'react'
import { Link } from 'react-router-dom'

interface RDCard {
    value: string
    description: string
    gradient: string
    icon: string
}

const rdCards: RDCard[] = [
    {
        value: '59',
        description: 'international patents (+2 expected each year)',
        gradient: 'from-orange-400 to-yellow-500',
        icon: '📝'
    },
    {
        value: '30%',
        description: 'of our revenues invested annually in R&D, for over 15 years',
        gradient: 'from-teal-400 to-green-500',
        icon: '💼'
    },
    {
        value: '25+',
        description: 'experts in AR, AI, ML, Computer Graphics and Computer Vision',
        gradient: 'from-purple-500 to-pink-500',
        icon: '💡'
    }
]

const RDSection: React.FC = () => {
    return (
        <section className="bg-gray-50 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
            <div className="w-[90%] mx-auto max-w-7xl">
                <div className="space-y-8 md:space-y-12">
                    {/* Header Text */}
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl lg:text-2xl font-semibold text-gray-900 leading-tight max-w-4xl mx-auto">
                            Strong and proven R&D experience, to build the most realistic AR <strong>experience</strong> with <strong>outstanding</strong> 3D assets.
                        </h2>
                    </div>

                    {/* R&D Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {rdCards.map((card, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6`}>
                                    <span>{card.icon}</span>
                                </div>

                                {/* Value */}
                                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
                                    {card.value}
                                </div>

                                {/* Description */}
                                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Discover Button */}
                    <div className="text-center pt-4">
                        <Link
                            to="/our-history"
                            className="inline-block px-8 md:px-10 py-3 md:py-4 rounded-lg border-2 border-gray-800 text-gray-900 font-semibold hover:bg-gray-50 transition-colors duration-300 text-sm md:text-base cursor-pointer"
                        >
                            Discover our story
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default RDSection

